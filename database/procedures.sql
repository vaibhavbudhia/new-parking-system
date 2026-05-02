-- ============================================================
--  File : procedures.sql
--  Run AFTER triggers.sql
-- ============================================================

USE parking_system;

DELIMITER $$


-- ============================================================
--  PROCEDURE 1: sp_book_slot
--  User selects a slot and pays for N hours upfront.
--  Creates PARKING_RECORD with Booking_End set.
--  Creates PAYMENT row immediately.
--
--  CALL sp_book_slot(1, 3, 'four_wheeler', 2, 'upi');
--  (vehicle_id, hours, slot_type, slot_id_chosen, payment_mode)
-- ============================================================
CREATE PROCEDURE sp_book_slot(
    IN p_vehicle_id   INT,
    IN p_hours        INT,
    IN p_slot_type    VARCHAR(20),
    IN p_slot_id      INT,
    IN p_payment_mode VARCHAR(10)
)
BEGIN
    DECLARE v_rate      INT;
    DECLARE v_amount    DECIMAL(8,2);
    DECLARE v_type      VARCHAR(20);
    DECLARE v_record_id INT;
    DECLARE v_check     INT;

    -- check slot is still available
    SELECT COUNT(*) INTO v_check
    FROM   PARKING_SLOT
    WHERE  Slot_ID = p_slot_id AND Status = 'available';

    IF v_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Slot is no longer available.';
    END IF;

    -- check vehicle not already parked
    SELECT COUNT(*) INTO v_check
    FROM   PARKING_RECORD
    WHERE  Vehicle_ID = p_vehicle_id
    AND    Exit_Time  IS NULL
    AND    Booking_End > NOW();

    IF v_check > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This vehicle already has an active booking.';
    END IF;

    -- get vehicle type for rate
    SELECT Vehicle_Type INTO v_type
    FROM   VEHICLE WHERE Vehicle_ID = p_vehicle_id;

    IF p_hours < 1 THEN SET p_hours = 1; END IF;

    IF v_type = 'two_wheeler' THEN
        SET v_rate = 10;
    ELSEIF v_type = 'heavy' THEN
        SET v_rate = 40;
    ELSE
        SET v_rate = 20;
    END IF;

    SET v_amount = p_hours * v_rate;

    -- create parking record (trigger fires and marks slot occupied)
    INSERT INTO PARKING_RECORD (Vehicle_ID, Slot_ID, Entry_Time, Booking_End, Amount)
    VALUES (p_vehicle_id, p_slot_id, NOW(), DATE_ADD(NOW(), INTERVAL p_hours HOUR), v_amount);

    SET v_record_id = LAST_INSERT_ID();

    -- create payment
    INSERT INTO PAYMENT (Record_ID, Amount, Payment_Mode, Payment_For)
    VALUES (v_record_id, v_amount, p_payment_mode, 'booking');

    SELECT
        'Booking confirmed'  AS Status,
        v_record_id          AS Record_ID,
        p_slot_id            AS Slot_ID,
        v_amount             AS Amount_Paid,
        NOW()                AS Entry_Time,
        DATE_ADD(NOW(), INTERVAL p_hours HOUR) AS Booking_End;

END$$


-- ============================================================
--  PROCEDURE 2: sp_extend_booking
--  User adds more hours to their active booking.
--  Charges for the extra hours only.
--
--  CALL sp_extend_booking(1, 2, 'upi');
--  (record_id, extra_hours, payment_mode)
-- ============================================================
CREATE PROCEDURE sp_extend_booking(
    IN p_record_id    INT,
    IN p_extra_hours  INT,
    IN p_payment_mode VARCHAR(10)
)
BEGIN
    DECLARE v_rate       INT;
    DECLARE v_extra_amt  DECIMAL(8,2);
    DECLARE v_type       VARCHAR(20);
    DECLARE v_booking_end DATETIME;
    DECLARE v_check      INT;

    -- check record exists and is active
    SELECT COUNT(*) INTO v_check
    FROM   PARKING_RECORD
    WHERE  Record_ID = p_record_id AND Exit_Time IS NULL;

    IF v_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No active booking found.';
    END IF;

    -- get vehicle type
    SELECT v.Vehicle_Type, pr.Booking_End
    INTO   v_type, v_booking_end
    FROM   PARKING_RECORD pr
    JOIN   VEHICLE v ON pr.Vehicle_ID = v.Vehicle_ID
    WHERE  pr.Record_ID = p_record_id;

    IF p_extra_hours < 1 THEN SET p_extra_hours = 1; END IF;

    IF v_type = 'two_wheeler' THEN
        SET v_rate = 10;
    ELSEIF v_type = 'heavy' THEN
        SET v_rate = 40;
    ELSE
        SET v_rate = 20;
    END IF;

    SET v_extra_amt = p_extra_hours * v_rate;

    -- extend booking end time and add to total amount
    UPDATE PARKING_RECORD
    SET    Booking_End = DATE_ADD(Booking_End, INTERVAL p_extra_hours HOUR),
           Amount      = Amount + v_extra_amt
    WHERE  Record_ID   = p_record_id;

    -- also make sure slot is occupied again (in case event vacated it)
    UPDATE PARKING_SLOT ps
    JOIN   PARKING_RECORD pr ON ps.Slot_ID = pr.Slot_ID
    SET    ps.Status = 'occupied'
    WHERE  pr.Record_ID = p_record_id;

    -- payment for extension
    INSERT INTO PAYMENT (Record_ID, Amount, Payment_Mode, Payment_For)
    VALUES (p_record_id, v_extra_amt, p_payment_mode, 'extension');

    SELECT
        'Booking extended'  AS Status,
        p_record_id         AS Record_ID,
        v_extra_amt         AS Extra_Amount_Paid,
        DATE_ADD(v_booking_end, INTERVAL p_extra_hours HOUR) AS New_Booking_End;

END$$


-- ============================================================
--  PROCEDURE 3: sp_checkout
--  User checks out their vehicle manually.
--  Sets Exit_Time (trigger calculates final amount).
--
--  CALL sp_checkout(1);
-- ============================================================
CREATE PROCEDURE sp_checkout(
    IN p_record_id INT
)
BEGIN
    DECLARE v_check INT;

    SELECT COUNT(*) INTO v_check
    FROM   PARKING_RECORD
    WHERE  Record_ID = p_record_id AND Exit_Time IS NULL;

    IF v_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No active booking found.';
    END IF;

    -- trigger fires here and frees the slot
    UPDATE PARKING_RECORD
    SET    Exit_Time = NOW()
    WHERE  Record_ID = p_record_id;

    SELECT 'Checked out successfully' AS Status, p_record_id AS Record_ID;
END$$


-- ============================================================
--  FUNCTION: fn_calculate_fee
-- ============================================================
CREATE FUNCTION fn_calculate_fee(
    p_hours        INT,
    p_vehicle_type VARCHAR(20)
)
RETURNS DECIMAL(8,2)
DETERMINISTIC
BEGIN
    DECLARE v_rate INT;
    IF p_hours < 1 THEN SET p_hours = 1; END IF;

    IF p_vehicle_type = 'two_wheeler' THEN SET v_rate = 10;
    ELSEIF p_vehicle_type = 'heavy'   THEN SET v_rate = 40;
    ELSE                                    SET v_rate = 20;
    END IF;

    RETURN p_hours * v_rate;
END$$


-- ============================================================
--  PROCEDURE WITH CURSOR: sp_revenue_report
-- ============================================================
CREATE PROCEDURE sp_revenue_report()
BEGIN
    DECLARE v_type         VARCHAR(20);
    DECLARE v_amount       DECIMAL(8,2);
    DECLARE v_done         INT DEFAULT 0;
    DECLARE v_two_total    DECIMAL(10,2) DEFAULT 0;
    DECLARE v_four_total   DECIMAL(10,2) DEFAULT 0;
    DECLARE v_heavy_total  DECIMAL(10,2) DEFAULT 0;
    DECLARE v_grand_total  DECIMAL(10,2) DEFAULT 0;

    DECLARE rev_cursor CURSOR FOR
        SELECT v.Vehicle_Type, p.Amount
        FROM   PAYMENT p
        JOIN   PARKING_RECORD pr ON p.Record_ID  = pr.Record_ID
        JOIN   VEHICLE        v  ON pr.Vehicle_ID = v.Vehicle_ID;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    OPEN rev_cursor;
    read_loop: LOOP
        FETCH rev_cursor INTO v_type, v_amount;
        IF v_done = 1 THEN LEAVE read_loop; END IF;

        IF v_type = 'two_wheeler' THEN
            SET v_two_total   = v_two_total   + v_amount;
        ELSEIF v_type = 'heavy' THEN
            SET v_heavy_total = v_heavy_total + v_amount;
        ELSE
            SET v_four_total  = v_four_total  + v_amount;
        END IF;
        SET v_grand_total = v_grand_total + v_amount;
    END LOOP;
    CLOSE rev_cursor;

    SELECT v_two_total   AS Two_Wheeler_Revenue,
           v_four_total  AS Four_Wheeler_Revenue,
           v_heavy_total AS Heavy_Vehicle_Revenue,
           v_grand_total AS Grand_Total;
END$$


DELIMITER ;


-- ============================================================
--  VIEWS
-- ============================================================

CREATE OR REPLACE VIEW vw_available_slots AS
SELECT Slot_ID, Slot_Number, Slot_Type, Floor, Status
FROM   PARKING_SLOT
WHERE  Status = 'available'
ORDER  BY Floor, Slot_Number;


CREATE OR REPLACE VIEW vw_occupied_slots AS
SELECT
    ps.Slot_ID, ps.Slot_Number, ps.Slot_Type, ps.Floor,
    v.Vehicle_Number, o.Owner_Name, o.Phone,
    pr.Record_ID, pr.Entry_Time, pr.Booking_End,
    TIMESTAMPDIFF(MINUTE, NOW(), pr.Booking_End) AS Minutes_Remaining
FROM   PARKING_SLOT   ps
JOIN   PARKING_RECORD pr ON ps.Slot_ID    = pr.Slot_ID AND pr.Exit_Time IS NULL
JOIN   VEHICLE        v  ON pr.Vehicle_ID = v.Vehicle_ID
JOIN   OWNER          o  ON v.Owner_ID    = o.Owner_ID;


CREATE OR REPLACE VIEW vw_daily_revenue AS
SELECT
    DATE(Payment_Time)  AS Payment_Date,
    COUNT(*)            AS Total_Transactions,
    SUM(Amount)         AS Total_Revenue
FROM   PAYMENT
GROUP  BY DATE(Payment_Time)
ORDER  BY Payment_Date DESC;


-- Verify
SELECT ROUTINE_NAME, ROUTINE_TYPE
FROM   information_schema.ROUTINES
WHERE  ROUTINE_SCHEMA = 'parking_system';

SELECT TABLE_NAME FROM information_schema.VIEWS
WHERE  TABLE_SCHEMA = 'parking_system';

-- ============================================================
--  END OF procedures.sql
--  Next: seed.sql
-- ============================================================
