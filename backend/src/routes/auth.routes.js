import { Router } from "express";
import { register } from "../services/auth.services.js";
import { authentication } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post('/register', authentication.registerUser)
authRouter.post('/login', authentication.loginUser)

export default authRouter;