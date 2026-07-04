import express from "express";
import { register, login } from "../services/auth.services.js";

export const authentication = {

    async registerUser(req, res) {
        const data = await req.body;

        if (!data.email || !data.password) {
            return res.status(400).json({
                success: false,
                message: "Email and password is required"
            })
        }
        await register(data, res);
    },

    async loginUser(req, res) {
        const data = await req.body;

        if (!data.email || !data.password) {
            return res.status(400).json({
                success: false,
                message: "Email and password is required"
            })
        }

        await login(data, res);
    }
}