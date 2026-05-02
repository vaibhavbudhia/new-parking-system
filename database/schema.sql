-- ============================================================
--  PARKING LOT MANAGEMENT SYSTEM v2
--  File        : schema.sql
--  Run this FIRST. Drops and recreates everything.
-- ============================================================

DROP DATABASE IF EXISTS parking_system;
CREATE DATABASE parking_system;
USE parking_system;

-- ------------------------------------------------------------
-- TABLE 1: ADMIN
-- Role can be 'admin' or 'user'
-- ------------------------------------------------------------
CREATE TABLE ADMIN (
    Admin_ID   INT          NOT NULL AUTO_INCREMENT,
    Name       VARCHAR(100) NOT NULL,
    Username   VARCHAR(50)  NOT NULL,
    Password   VARCHAR(100) NOT NULL,
    Phone      VARCHAR(15)  DEFAULT NULL,
    Role       VARCHAR(10)  NOT NULL DEFAULT 'user',

    PRIMARY KEY (Admin_ID),
    UNIQUE (Username),
    CHECK (Role IN ('admin', 'user'))
);

-- ------------------------------------------------------------
-- TABLE 2: OWNER
-- ------------------------------------------------------------
CREATE TABLE OWNER (
    Owner_ID   INT          NOT NULL AUTO_INCREMENT,
    Owner_Name VARCHAR(100) NOT NULL,
    Phone      VARCHAR(15)  NOT NULL,
    Email      VARCHAR(100),

    PRIMARY KEY (Owner_ID),
    UNIQUE (Phone)
);

-- ------------------------------------------------------------
-- TABLE 3: VEHICLE
-- ------------------------------------------------------------
CREATE TABLE VEHICLE (
    Vehicle_ID     INT         NOT NULL AUTO_INCREMENT,
    Vehicle_Number VARCHAR(20) NOT NULL,
    Vehicle_Type   VARCHAR(20) NOT NULL DEFAULT 'four_wheeler',
    Owner_ID       INT         NOT NULL,

    PRIMARY KEY (Vehicle_ID),
    UNIQUE (Vehicle_Number),
    FOREIGN KEY (Owner_ID) REFERENCES OWNER(Owner_ID),
    CHECK (Vehicle_Type IN ('two_wheeler', 'four_wheeler', 'heavy'))
);

-- ------------------------------------------------------------
-- TABLE 4: PARKING_SLOT
-- ------------------------------------------------------------
CREATE TABLE PARKING_SLOT (
    Slot_ID     INT         NOT NULL AUTO_INCREMENT,
    Slot_Number VARCHAR(10) NOT NULL,
    Slot_Type   VARCHAR(20) NOT NULL,
    Floor       VARCHAR(10) NOT NULL DEFAULT 'Ground',
    Status      VARCHAR(15) NOT NULL DEFAULT 'available',

    PRIMARY KEY (Slot_ID),
    UNIQUE (Slot_Number),
    CHECK (Status    IN ('available', 'occupied')),
    CHECK (Slot_Type IN ('two_wheeler', 'four_wheeler', 'heavy'))
);

-- ------------------------------------------------------------
-- TABLE 5: PARKING_RECORD
-- Booking_End = when the paid time expires
-- Exit_Time   = when vehicle physically leaves
-- ------------------------------------------------------------
CREATE TABLE PARKING_RECORD (
    Record_ID   INT           NOT NULL AUTO_INCREMENT,
    Vehicle_ID  INT           NOT NULL,
    Slot_ID     INT           NOT NULL,
    Entry_Time  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Booking_End DATETIME      DEFAULT NULL,
    Exit_Time   DATETIME      DEFAULT NULL,
    Amount      DECIMAL(8,2)  DEFAULT NULL,

    PRIMARY KEY (Record_ID),
    FOREIGN KEY (Vehicle_ID) REFERENCES VEHICLE(Vehicle_ID),
    FOREIGN KEY (Slot_ID)    REFERENCES PARKING_SLOT(Slot_ID)
);

-- ------------------------------------------------------------
-- TABLE 6: PAYMENT
-- ------------------------------------------------------------
CREATE TABLE PAYMENT (
    Payment_ID   INT           NOT NULL AUTO_INCREMENT,
    Record_ID    INT           NOT NULL,
    Amount       DECIMAL(8,2)  NOT NULL,
    Payment_Mode VARCHAR(10)   NOT NULL DEFAULT 'upi',
    Payment_Time DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Payment_For  VARCHAR(20)   NOT NULL DEFAULT 'booking',

    PRIMARY KEY (Payment_ID),
    FOREIGN KEY (Record_ID) REFERENCES PARKING_RECORD(Record_ID),
    CHECK (Payment_Mode IN ('cash', 'card', 'upi')),
    CHECK (Payment_For  IN ('booking', 'extension'))
);

SHOW TABLES;

-- ============================================================
--  END OF schema.sql
--  Next: triggers.sql
-- ============================================================
