import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { subscriptionController } from '../controllers/subscription.controller.js';

const subscriptionRouter = Router();

// Stripe webhook — must be BEFORE express.json() parses the body (raw body needed)
subscriptionRouter.post('/webhook', subscriptionController.webhook);

// Authenticated routes
subscriptionRouter.post('/checkout', authenticate, subscriptionController.checkout);
subscriptionRouter.post('/portal', authenticate, subscriptionController.portal);
subscriptionRouter.get('/status', authenticate, subscriptionController.status);

export default subscriptionRouter;
