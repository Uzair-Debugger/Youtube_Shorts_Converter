import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil',
});

// Map your Plan enum values to Stripe Price IDs (set these in .env)
export const PLAN_PRICE_IDS = {
    PRO: process.env.STRIPE_PRO_PRICE_ID,
    BUSINESS: process.env.STRIPE_BUSINESS_PRICE_ID,
};
