import { register, login, refresh, logout } from "../services/auth.services.js";

export const authentication = {

    async registerUser(req, res) {
        const data = req.body;
        if (!data.email || !data.password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }
        await register(data, res);
    },

    async loginUser(req, res) {
        const data = req.body;
        if (!data.email || !data.password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }
        await login(data, res);
    },

    async refreshToken(req, res) {
        await refresh(req.body, res);
    },

    async logoutUser(req, res) {
        await logout(req.body, res);
    },
};
