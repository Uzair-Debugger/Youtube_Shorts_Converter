import express from "express";
import jobRouter from "./Job.routes.js";
import authRouter from "./auth.routes.js";
import subscriptionRouter from "./subscription.routes.js";

const router = express.Router()

router.use('/job', jobRouter);
router.use('/auth', authRouter);
router.use('/subscription', subscriptionRouter);

export default router;