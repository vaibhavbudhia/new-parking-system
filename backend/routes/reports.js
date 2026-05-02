const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { protect, adminOnly } = require('../middleware');

router.get('/revenue', protect, adminOnly, (req, res) => {
    db.query('SELECT * FROM vw_daily_revenue', (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results);
    });
});

router.get('/by-type', protect, adminOnly, (req, res) => {
    db.query('CALL sp_revenue_report()', (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results[0][0]);
    });
});

module.exports = router;
