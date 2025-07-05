import jwt from 'jsonwebtoken';

// Middleware for authenticating access tokens
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
        req.user = decoded; // Contains user info
        console.log('user info: ', req.user)
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Instead of next(error), return 401 so frontend can trigger refresh
            return res.status(401).json({ success: false, message: 'Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        return res.status(403).json({ success: false, message: error.message || 'Access denied' });
    }
};

// Controller for refreshing tokens
export const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token required' });
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        // Optionally: check if refreshToken is in DB and valid
        const newAccessToken = jwt.sign(
            { id: decoded.id, email: decoded.email, role: decoded.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};