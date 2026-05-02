const jwt = require('jsonwebtoken');
const JWT_SECRET = 'parkinglot2025secret';

function protect(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'No token' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Admin only' });
    next();
}

module.exports = { protect, adminOnly };
