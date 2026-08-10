-- =====================================================
-- Velora Auth Service: Fix Legacy Columns Migration
-- Migration: V3__fix_legacy_password.sql
-- =====================================================

-- Make legacy 'password' column nullable if present
SET @exist_pwd := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password');
SET @sql_pwd := IF(@exist_pwd > 0, 'ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt1 FROM @sql_pwd;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Make legacy 'mobile_number' column nullable if present
SET @exist_mob := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'mobile_number');
SET @sql_mob := IF(@exist_mob > 0, 'ALTER TABLE users MODIFY COLUMN mobile_number VARCHAR(20) NULL', 'SELECT 1');
PREPARE stmt2 FROM @sql_mob;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
