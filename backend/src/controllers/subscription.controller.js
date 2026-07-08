import {
    createCheckoutSession,
    createPortalSession,
    getSubscription,
    handleWebhook,
} from '../services/subscription.services.js';

export const subscriptionController = {

    async checkout(req, res) {
        const { plan } = req.body;
        if (!['PRO', 'BUSINESS'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Invalid plan' });
        }
        try {
            const url = await createCheckoutSession(req.user.id, plan);
            return res.json({ success: true, url });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    },

    async portal(req, res) {
        try {
            const url = await createPortalSession(req.user.id);
            return res.json({ success: true, url });
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
    },

    async status(req, res) {
        try {
            const sub = await getSubscription(req.user.id);
            return res.json({ success: true, subscription: sub });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    },

    async webhook(req, res) {
        const signature = req.headers['stripe-signature'];
        if (!signature) return res.status(400).json({ error: 'Missing stripe-signature header' });
        try {
            // req.rawBody is set by the raw-body middleware in app.js
            await handleWebhook(req.rawBody, signature);
            return res.json({ received: true });
        } catch (err) {
            const status = err.status ?? 500;
            return res.status(status).json({ error: err.message });
        }
    },
};
