const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) return res.status(403).json({ error: 'No token provided' });

    const tokenParts = token.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    try {
        // Verify the token synchronously
        const decoded = jwt.verify(tokenParts[1], JWT_SECRET);
        req.user = decoded.id;
        req.tenant = decoded.tenant_id;
        req.isadmin = decoded.isadmin
        next();
    } catch (err) {
        // Handle specific JWT errors
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token has expired" });
        }
        return res.status(401).json({ error: `Unauthorized: ${err.message}` });
    }
};

module.exports = verifyToken;
