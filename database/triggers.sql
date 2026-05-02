-- ============================================================
--  File : triggers.sql
--  Run AFTER schema.sql
-- ============================================================

USE parking_system;

DELIMITER $$

-- ============================================================
--  TRIGGER 1: trg_after_entry
--  Fires after a new PARKING_RECORD is inserted.
--  Marks the slot as occupied.
-- ============================================================
CREATE TRIGGER trg_after_entry
AFTER INSERT ON PARKING_RECORD
FOR EACH ROW
BEGIN
    UPDATE PARKING_SLOT
    SET    Status = 'occupied'
    WHERE  Slot_ID = NEW.Slot_ID;
END$$


-- ============================================================
--  TRIGGER 2: trg_before_exit
--  Fires before PARKING_RECORD is updated.
--  When Exit_Time is set — calculates final amount,
--  frees the slot.
-- ============================================================
CREATE TRIGGER trg_before_exit
BEFORE UPDATE ON PARKING_RECORD
FOR EACH ROW
BEGIN
    DECLARE v_hours INT;
    DECLARE v_rate  INT;
    DECLARE v_type  VARCHAR(20);

    IF OLD.Exit_Time IS NULL AND NEW.Exit_Time IS NOT NULL THEN

        SET v_hours = TIMESTAMPDIFF(HOUR, OLD.Entry_Time, NEW.Exit_Time);
        IF v_hours < 1 THEN SET v_hours = 1; END IF;

        SELECT Vehicle_Type INTO v_type
        FROM   VEHICLE WHERE Vehicle_ID = OLD.Vehicle_ID;

        IF v_type = 'two_wheeler' THEN
            SET v_rate = 10;
        ELSEIF v_type = 'heavy' THEN
            SET v_rate = 40;
        ELSE
            SET v_rate = 20;
        END IF;

        SET NEW.Amount = v_hours * v_rate;

        UPDATE PARKING_SLOT
        SET    Status = 'available'
        WHERE  Slot_ID = OLD.Slot_ID;

    END IF;
END$$


DELIMITER ;


-- ============================================================
--  EVENT: evt_auto_vacate
--  Runs every minute. Finds slots whose Booking_End has
--  passed but vehicle hasn't checked out yet — auto-vacates
--  the slot so others can book it.
--  (This is the PL/SQL event / scheduled job component)
-- ============================================================

SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS evt_auto_vacate;

CREATE EVENT evt_auto_vacate
ON SCHEDULE EVERY 1 MINUTE
DO
    UPDATE PARKING_SLOT ps
    JOIN   PARKING_RECORD pr ON ps.Slot_ID = pr.Slot_ID
    SET    ps.Status = 'available'
    WHERE  pr.Booking_End < NOW()
    AND    pr.Exit_Time   IS NULL
    AND    ps.Status      = 'occupied';


-- Verify
SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING, EVENT_OBJECT_TABLE
FROM   information_schema.TRIGGERS
WHERE  TRIGGER_SCHEMA = 'parking_system';

-- ============================================================
--  END OF triggers.sql
--  Next: procedures.sql
-- ============================================================
