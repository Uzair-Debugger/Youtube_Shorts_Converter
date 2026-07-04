import { verifyAccessToken } from '../utils/jwt.utils.js';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        req.user = verifyAccessToken(token);
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
