const express = require('express');
const router  = express.Router();
const db      = require('../db');
const jwt     = require('jsonwebtoken');
const JWT_SECRET = 'parkinglot2025secret';

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: 'Username and password required' });

    db.query('SELECT * FROM ADMIN WHERE Username = ? AND Password = ?',
        [username, password], (err, results) => {
        if (err)             return res.status(500).json({ message: 'Server error' });
        if (!results.length) return res.status(401).json({ message: 'Invalid credentials' });

        const user  = results[0];
        const token = jwt.sign(
            { id: user.Admin_ID, role: user.Role, name: user.Name },
            JWT_SECRET, { expiresIn: '8h' }
        );
        res.json({ token, name: user.Name, role: user.Role, id: user.Admin_ID });
    });
});

// POST /api/auth/register — user self-registers with their vehicle
router.post('/register', (req, res) => {
    const { name, username, password, phone, vehicle_number, vehicle_type } = req.body;
    if (!name || !username || !password || !phone || !vehicle_number || !vehicle_type)
        return res.status(400).json({ message: 'All fields required' });

    // create admin (user role) account
    db.query('INSERT INTO ADMIN (Name, Username, Password, Phone, Role) VALUES (?,?,?,?,?)',
        [name, username, password, phone, 'user'], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY')
                return res.status(400).json({ message: 'Username already taken' });
            return res.status(500).json({ message: 'Server error' });
        }

        // create owner record
        db.query('INSERT INTO OWNER (Owner_Name, Phone) VALUES (?,?)',
            [name, phone], (err2, ownerResult) => {
            if (err2) return res.status(500).json({ message: 'Server error' });

            const owner_id = ownerResult.insertId;

            // register vehicle
            db.query('INSERT INTO VEHICLE (Vehicle_Number, Vehicle_Type, Owner_ID) VALUES (?,?,?)',
                [vehicle_number, vehicle_type, owner_id], (err3) => {
                if (err3) {
                    if (err3.code === 'ER_DUP_ENTRY')
                        return res.status(400).json({ message: 'Vehicle already registered' });
                    return res.status(500).json({ message: 'Server error' });
                }
                res.json({ message: 'Account created. Please login.' });
            });
        });
    });
});

module.exports = router;
