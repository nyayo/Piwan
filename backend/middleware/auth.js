import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Invalid or missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    if (typeof token !== 'string') {
        throw new Error('Invalid token');
    }
    

    try {
        const trimmedToken = token.trim();
        const decoded = jwt.verify(trimmedToken, process.env.JWT_SECRET);
        req.user = decoded; // Assuming decoded contains the user ID
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new Error('Token expired'));
        } else if (error.name === 'JsonWebTokenError') {
            return next(new Error('Invalid token'));
        }
        return res.status(403).json({ success: false, message: error.message || 'Access denied' });
    }
};