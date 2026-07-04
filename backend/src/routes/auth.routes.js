import { Router } from "express";
import { authentication } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post('/register', authentication.registerUser);
authRouter.post('/login', authentication.loginUser);
authRouter.post('/refresh', authentication.refreshToken);
authRouter.post('/logout', authentication.logoutUser);

export default authRouter;
