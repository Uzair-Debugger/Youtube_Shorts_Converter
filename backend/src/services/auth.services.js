import { prisma } from "../config/prismaConfig.js";
import bcrypt from "bcrypt";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "../utils/jwt.utils.js";

export const register = async (data, res) => {
    if (!data.name) {
        return res.status(400).json({ success: false, message: "Name is required" });
    }

    const existing = await prisma.user.findFirst({ where: { email: data.email } });
    if (existing) {
        return res.status(409).json({ success: false, message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(data.password, 12);
    await prisma.user.create({ data: { name: data.name, email: data.email, password: hashPassword } });

    return res.status(201).json({ success: true, message: "User registered successfully" });
};

export const login = async (data, res) => {
    const user = await prisma.user.findFirst({ where: { email: data.email } });
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const payload = { id: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ipAddress: res.req.ip,
        },
    });

    return res.status(200).json({
        success: true,
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email },
    });
};

export const refresh = async (data, res) => {
    const { refreshToken } = data;
    if (!refreshToken) {
        return res.status(400).json({ success: false, message: "Refresh token required" });
    }

    let payload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
        where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!stored) {
        return res.status(401).json({ success: false, message: "Refresh token revoked or not found" });
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const newAccessToken = signAccessToken({ id: payload.id, email: payload.email });
    const newRefreshToken = signRefreshToken({ id: payload.id, email: payload.email });

    await prisma.refreshToken.create({
        data: {
            userId: payload.id,
            tokenHash: hashToken(newRefreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ipAddress: res.req.ip,
        },
    });

    return res.status(200).json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
};

export const logout = async (data, res) => {
    const { refreshToken } = data;
    if (!refreshToken) {
        return res.status(400).json({ success: false, message: "Refresh token required" });
    }

    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
    });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
};
