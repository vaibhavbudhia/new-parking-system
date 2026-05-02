const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { protect } = require('../middleware');

// GET /api/booking/my — get current user's active booking
router.get('/my', protect, (req, res) => {
    const sql = `
        SELECT pr.*, ps.Slot_Number, ps.Floor, v.Vehicle_Number, v.Vehicle_Type,
               TIMESTAMPDIFF(MINUTE, NOW(), pr.Booking_End) AS Minutes_Remaining
        FROM   PARKING_RECORD pr
        JOIN   PARKING_SLOT   ps ON pr.Slot_ID    = ps.Slot_ID
        JOIN   VEHICLE        v  ON pr.Vehicle_ID = v.Vehicle_ID
        JOIN   OWNER          o  ON v.Owner_ID    = o.Owner_ID
        JOIN   ADMIN          a  ON a.Phone       = o.Phone
        WHERE  a.Admin_ID = ? AND pr.Exit_Time IS NULL AND pr.Booking_End > NOW()
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results[0] || null);
    });
});

// GET /api/booking/history — user's past bookings
router.get('/history', protect, (req, res) => {
    const sql = `
        SELECT pr.*, ps.Slot_Number, v.Vehicle_Number, v.Vehicle_Type
        FROM   PARKING_RECORD pr
        JOIN   PARKING_SLOT   ps ON pr.Slot_ID    = ps.Slot_ID
        JOIN   VEHICLE        v  ON pr.Vehicle_ID = v.Vehicle_ID
        JOIN   OWNER          o  ON v.Owner_ID    = o.Owner_ID
        JOIN   ADMIN          a  ON a.Phone       = o.Phone
        WHERE  a.Admin_ID = ?
        ORDER  BY pr.Entry_Time DESC
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results);
    });
});

// GET /api/booking/my-vehicle — get user's registered vehicle
router.get('/my-vehicle', protect, (req, res) => {
    const sql = `
        SELECT v.*
        FROM   VEHICLE v
        JOIN   OWNER   o ON v.Owner_ID = o.Owner_ID
        JOIN   ADMIN   a ON a.Phone    = o.Phone
        WHERE  a.Admin_ID = ?
        LIMIT  1
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results[0] || null);
    });
});

// POST /api/booking/book
// Body: { slot_id, hours, payment_mode }
router.post('/book', protect, (req, res) => {
    const { slot_id, hours, payment_mode } = req.body;
    if (!slot_id || !hours || !payment_mode)
        return res.status(400).json({ message: 'slot_id, hours and payment_mode required' });

    // get user's vehicle
    const vehicleSql = `
        SELECT v.Vehicle_ID, v.Vehicle_Type
        FROM   VEHICLE v
        JOIN   OWNER   o ON v.Owner_ID = o.Owner_ID
        JOIN   ADMIN   a ON a.Phone    = o.Phone
        WHERE  a.Admin_ID = ? LIMIT 1
    `;
    db.query(vehicleSql, [req.user.id], (err, vehicles) => {
        if (err || !vehicles.length)
            return res.status(400).json({ message: 'No vehicle found for your account' });

        const vehicle_id = vehicles[0].Vehicle_ID;

        db.query('CALL sp_book_slot(?,?,?,?,?)',
            [vehicle_id, hours, vehicles[0].Vehicle_Type, slot_id, payment_mode],
            (err2, results) => {
            if (err2) return res.status(400).json({ message: err2.sqlMessage || 'Booking failed' });
            res.json({ message: 'Booking confirmed', data: results[0][0] });
        });
    });
});

// POST /api/booking/extend
// Body: { record_id, extra_hours, payment_mode }
router.post('/extend', protect, (req, res) => {
    const { record_id, extra_hours, payment_mode } = req.body;
    if (!record_id || !extra_hours || !payment_mode)
        return res.status(400).json({ message: 'record_id, extra_hours and payment_mode required' });

    db.query('CALL sp_extend_booking(?,?,?)', [record_id, extra_hours, payment_mode],
        (err, results) => {
        if (err) return res.status(400).json({ message: err.sqlMessage || 'Extension failed' });
        res.json({ message: 'Booking extended', data: results[0][0] });
    });
});

// POST /api/booking/checkout
// Body: { record_id }
router.post('/checkout', protect, (req, res) => {
    const { record_id } = req.body;
    if (!record_id)
        return res.status(400).json({ message: 'record_id required' });

    db.query('CALL sp_checkout(?)', [record_id], (err, results) => {
        if (err) return res.status(400).json({ message: err.sqlMessage || 'Checkout failed' });
        res.json({ message: 'Checked out successfully', data: results[0][0] });
    });
});

module.exports = router;
