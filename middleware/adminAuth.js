// middleware/adminAuth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.authToken; // Get the token from cookies

    if (!token) {
        return res.status(403).json({ message: 'No token provided, access denied!' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized!' });
        }

        req.user = decoded.id;
        req.tenant = decoded.tenant_id;
        req.isAdmin = decoded.isAdmin;
        next();
    });
};

module.exports = verifyToken;
