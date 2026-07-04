import express from "express";
import jobRouter from "./Job.routes.js";
import authRouter from "./auth.routes.js";
const router = express.Router()

router.use('/job', jobRouter);
router.use('/auth', authRouter);

export default router;