import { prisma } from '../config/prismaConfig.js';
import { stripe, PLAN_PRICE_IDS } from '../config/stripe.config.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Resolve or create a Stripe Customer for a user, persisting the ID. */
async function getOrCreateStripeCustomer(user) {
    if (user.subscription?.stripeCustomerId) {
        return user.subscription.stripeCustomerId;
    }
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
    });
    await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, stripeCustomerId: customer.id },
        update: { stripeCustomerId: customer.id },
    });
    return customer.id;
}

/** Map a Stripe subscription status to our SubscriptionStatus enum. */
function mapStripeStatus(stripeStatus) {
    const map = {
        active: 'ACTIVE',
        trialing: 'TRIALING',
        canceled: 'CANCELED',
        incomplete: 'EXPIRED',
        incomplete_expired: 'EXPIRED',
        past_due: 'ACTIVE',   // keep access during grace period
        unpaid: 'EXPIRED',
        paused: 'EXPIRED',
    };
    return map[stripeStatus] ?? 'EXPIRED';
}

/** Map a Stripe Price ID back to our Plan enum. */
function mapPriceIdToPlan(priceId) {
    if (priceId === PLAN_PRICE_IDS.BUSINESS) return 'BUSINESS';
    if (priceId === PLAN_PRICE_IDS.PRO) return 'PRO';
    return 'FREE';
}

// ─── Public service functions ────────────────────────────────────────────────

/**
 * Create a Stripe Checkout Session for a given plan.
 * Returns the session URL to redirect the user to.
 */
export async function createCheckoutSession(userId, plan) {
    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) throw new Error(`No Stripe Price ID configured for plan: ${plan}`);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
    });
    if (!user) throw new Error('User not found');

    const customerId = await getOrCreateStripeCustomer(user);

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/pricing`,
        metadata: { userId, plan },
        subscription_data: {
            metadata: { userId, plan },
        },
    });

    return session.url;
}

/**
 * Create a Stripe Billing Portal session so the user can manage their subscription.
 */
export async function createPortalSession(userId) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub?.stripeCustomerId) throw new Error('No billing account found');

    const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${FRONTEND_URL}/billing`,
    });

    return session.url;
}

/**
 * Retrieve the current subscription details for a user.
 */
export async function getSubscription(userId) {
    return prisma.subscription.findUnique({ where: { userId } });
}

// ─── Webhook event handlers ──────────────────────────────────────────────────

/**
 * Sync local DB from a Stripe Subscription object.
 * Called by multiple webhook events to keep state consistent.
 */
async function syncSubscription(stripeSub) {
    const userId = stripeSub.metadata?.userId;
    if (!userId) return;

    const priceId = stripeSub.items.data[0]?.price?.id ?? null;
    const plan = mapPriceIdToPlan(priceId);
    const status = mapStripeStatus(stripeSub.status);
    const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

    await prisma.subscription.upsert({
        where: { userId },
        create: {
            userId,
            plan,
            status,
            stripeSubscriptionId: stripeSub.id,
            stripeCustomerId: typeof stripeSub.customer === 'string'
                ? stripeSub.customer
                : stripeSub.customer.id,
            stripePriceId: priceId,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            startDate: new Date(stripeSub.start_date * 1000),
            endDate: stripeSub.ended_at ? new Date(stripeSub.ended_at * 1000) : null,
        },
        update: {
            plan,
            status,
            stripeSubscriptionId: stripeSub.id,
            stripePriceId: priceId,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            endDate: stripeSub.ended_at ? new Date(stripeSub.ended_at * 1000) : null,
        },
    });
}

/**
 * Handle a successful invoice payment — renew the subscription period.
 */
async function handleInvoicePaid(invoice) {
    if (!invoice.subscription) return;
    const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription, {
        expand: ['items.data.price'],
    });
    await syncSubscription(stripeSub);
}

/**
 * Handle a failed invoice payment — mark as expired after grace period exhausted.
 */
async function handleInvoicePaymentFailed(invoice) {
    if (!invoice.subscription) return;
    const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription);
    // Stripe will retry; we only downgrade when status becomes past_due/unpaid
    await syncSubscription(stripeSub);
}

/**
 * Central webhook dispatcher. Verifies signature and routes events.
 */
export async function handleWebhook(rawBody, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');

    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        throw Object.assign(new Error(`Webhook signature verification failed: ${err.message}`), { status: 400 });
    }

    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            await syncSubscription(event.data.object);
            break;

        case 'invoice.paid':
            await handleInvoicePaid(event.data.object);
            break;

        case 'invoice.payment_failed':
            await handleInvoicePaymentFailed(event.data.object);
            break;

        // Ignore all other events
        default:
            break;
    }
}
