-- ============================================================
--  File : seed.sql
--  Run AFTER procedures.sql
-- ============================================================

USE parking_system;

-- ADMIN accounts
INSERT INTO ADMIN (Name, Username, Password, Phone, Role) VALUES
('Lovish Bansal',  'admin',  'admin123',  '9872011111', 'admin'),
('Vaibhav Budhia', 'vaibhav', 'vaibhav123', '9872022222', 'user'),
('Aayushi Uniyal', 'aayushi', 'aayushi123', '9872033333', 'user');

-- Owners
INSERT INTO OWNER (Owner_Name, Phone, Email) VALUES
('Rajesh Kumar',   '9870011111', 'rajesh@gmail.com'),
('Priya Sharma',   '9870022222', 'priya@gmail.com'),
('Amit Singh',     '9870033333', 'amit@gmail.com'),
('Sunita Verma',   '9870044444', 'sunita@gmail.com'),
('Harpreet Kaur',  '9870055555', 'harpreet@gmail.com');

-- Vehicles
INSERT INTO VEHICLE (Vehicle_Number, Vehicle_Type, Owner_ID) VALUES
('PB08AB1234', 'four_wheeler', 1),
('PB08CD5678', 'two_wheeler',  2),
('PB10EF9012', 'four_wheeler', 3),
('CH01GH3456', 'two_wheeler',  4),
('PB65IJ7890', 'heavy',        5);

-- Parking slots
INSERT INTO PARKING_SLOT (Slot_Number, Slot_Type, Floor) VALUES
('G1', 'four_wheeler', 'Ground'),
('G2', 'four_wheeler', 'Ground'),
('G3', 'four_wheeler', 'Ground'),
('G4', 'four_wheeler', 'Ground'),
('G5', 'two_wheeler',  'Ground'),
('G6', 'two_wheeler',  'Ground'),
('G7', 'two_wheeler',  'Ground'),
('G8', 'heavy',        'Ground'),
('F1', 'four_wheeler', 'First'),
('F2', 'four_wheeler', 'First'),
('F3', 'two_wheeler',  'First'),
('F4', 'two_wheeler',  'First');

-- Past completed sessions (2 days ago)
INSERT INTO PARKING_RECORD (Vehicle_ID, Slot_ID, Entry_Time, Booking_End, Exit_Time, Amount)
VALUES
(1, 1, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 3 HOUR, NOW() - INTERVAL 2 DAY + INTERVAL 3 HOUR, 60.00),
(2, 5, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 2 HOUR, NOW() - INTERVAL 2 DAY + INTERVAL 2 HOUR, 20.00),
(5, 8, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 4 HOUR, NOW() - INTERVAL 2 DAY + INTERVAL 4 HOUR, 160.00);

INSERT INTO PAYMENT (Record_ID, Amount, Payment_Mode, Payment_For) VALUES
(1, 60.00,  'upi',  'booking'),
(2, 20.00,  'upi',  'booking'),
(3, 160.00, 'cash', 'booking');

-- Yesterday
INSERT INTO PARKING_RECORD (Vehicle_ID, Slot_ID, Entry_Time, Booking_End, Exit_Time, Amount)
VALUES
(3, 2, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 2 HOUR, NOW() - INTERVAL 1 DAY + INTERVAL 2 HOUR, 40.00),
(4, 6, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 3 HOUR, NOW() - INTERVAL 1 DAY + INTERVAL 3 HOUR, 30.00);

INSERT INTO PAYMENT (Record_ID, Amount, Payment_Mode, Payment_For) VALUES
(4, 40.00, 'card', 'booking'),
(5, 30.00, 'upi',  'booking');

-- Today: 2 active bookings via procedure (triggers fire naturally)
CALL sp_book_slot(1, 2, 'four_wheeler', 3, 'upi');
CALL sp_book_slot(2, 1, 'two_wheeler',  5, 'cash');

-- Verify
SELECT 'ADMIN'          AS T, COUNT(*) AS Rows FROM ADMIN          UNION ALL
SELECT 'OWNER',              COUNT(*)           FROM OWNER          UNION ALL
SELECT 'VEHICLE',            COUNT(*)           FROM VEHICLE        UNION ALL
SELECT 'PARKING_SLOT',       COUNT(*)           FROM PARKING_SLOT   UNION ALL
SELECT 'PARKING_RECORD',     COUNT(*)           FROM PARKING_RECORD UNION ALL
SELECT 'PAYMENT',            COUNT(*)           FROM PAYMENT;

SELECT * FROM vw_available_slots;
SELECT * FROM vw_occupied_slots;

-- ============================================================
--  END OF seed.sql
-- ============================================================
