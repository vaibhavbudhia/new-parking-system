const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { protect } = require('../middleware');

// GET /api/slots — all slots
router.get('/', protect, (req, res) => {
    db.query('SELECT * FROM PARKING_SLOT ORDER BY Floor, Slot_Number', (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results);
    });
});

// GET /api/slots/available?type=four_wheeler
router.get('/available', protect, (req, res) => {
    const { type } = req.query;
    let sql = 'SELECT * FROM PARKING_SLOT WHERE Status = "available"';
    let params = [];
    if (type) { sql += ' AND Slot_Type = ?'; params.push(type); }
    sql += ' ORDER BY Floor, Slot_Number';
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results);
    });
});

// GET /api/slots/occupied
router.get('/occupied', protect, (req, res) => {
    db.query('SELECT * FROM vw_occupied_slots', (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results);
    });
});

module.exports = router;
