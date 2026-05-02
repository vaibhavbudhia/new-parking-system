const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { protect, adminOnly } = require('../middleware');

// GET /api/admin/users — all registered users with vehicle info
router.get('/users', protect, adminOnly, (req, res) => {
    const sql = `
        SELECT
            a.Admin_ID, a.Name, a.Username, a.Phone, a.Role,
            v.Vehicle_Number, v.Vehicle_Type,
            COUNT(pr.Record_ID) AS Total_Bookings
        FROM   ADMIN a
        LEFT JOIN OWNER   o  ON o.Phone      = a.Phone
        LEFT JOIN VEHICLE v  ON v.Owner_ID   = o.Owner_ID
        LEFT JOIN PARKING_RECORD pr ON pr.Vehicle_ID = v.Vehicle_ID
        GROUP BY a.Admin_ID, v.Vehicle_Number, v.Vehicle_Type
        ORDER BY a.Role, a.Name
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results);
    });
});

// GET /api/admin/all-bookings — full history
router.get('/all-bookings', protect, adminOnly, (req, res) => {
    const sql = `
        SELECT
            pr.Record_ID, v.Vehicle_Number, v.Vehicle_Type,
            o.Owner_Name, o.Phone, ps.Slot_Number, ps.Floor,
            pr.Entry_Time, pr.Booking_End, pr.Exit_Time,
            pr.Amount, p.Payment_Mode, p.Payment_For
        FROM   PARKING_RECORD pr
        JOIN   VEHICLE        v  ON pr.Vehicle_ID = v.Vehicle_ID
        JOIN   OWNER          o  ON v.Owner_ID    = o.Owner_ID
        JOIN   PARKING_SLOT   ps ON pr.Slot_ID    = ps.Slot_ID
        LEFT JOIN PAYMENT     p  ON pr.Record_ID  = p.Record_ID
        ORDER  BY pr.Entry_Time DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results);
    });
});

// GET /api/admin/summary
router.get('/summary', protect, adminOnly, (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM PARKING_SLOT WHERE Status = 'available') AS available_slots,
            (SELECT COUNT(*) FROM PARKING_SLOT WHERE Status = 'occupied')  AS occupied_slots,
            (SELECT COUNT(*) FROM PARKING_RECORD WHERE Exit_Time IS NULL AND Booking_End > NOW()) AS active_bookings,
            (SELECT COUNT(*) FROM ADMIN WHERE Role = 'user')               AS total_users,
            (SELECT COALESCE(SUM(Amount),0) FROM PAYMENT WHERE DATE(Payment_Time) = CURDATE()) AS today_revenue
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json(results[0]);
    });
});

module.exports = router;
