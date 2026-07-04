import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const signAccessToken = (payload) =>
    jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });

export const signRefreshToken = (payload) =>
    jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

export const verifyAccessToken = (token) =>
    jwt.verify(token, ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
    jwt.verify(token, REFRESH_SECRET);

export const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');
