-- =====================================================
-- Velora User Service: Initial Schema
-- Migration: V1__create_user_tables.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                  BIGINT NOT NULL UNIQUE,
    full_name                VARCHAR(150) NOT NULL,
    email                    VARCHAR(150) NOT NULL UNIQUE,
    phone_number             VARCHAR(20),
    profile_image_url        VARCHAR(500),
    date_of_birth            VARCHAR(20),
    gender                   VARCHAR(20),
    address                  VARCHAR(500),
    city                     VARCHAR(100),
    state                    VARCHAR(100),
    country                  VARCHAR(100),
    home_latitude            DOUBLE,
    home_longitude           DOUBLE,
    work_latitude            DOUBLE,
    work_longitude           DOUBLE,
    role                     VARCHAR(50),
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    notification_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    location_sharing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    privacy_mode_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    created_date             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_date       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by               VARCHAR(100),
    last_modified_by         VARCHAR(100),
    version                  BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                  BIGINT NOT NULL,
    name                     VARCHAR(100) NOT NULL,
    phone_number             VARCHAR(20) NOT NULL,
    email                    VARCHAR(150),
    relationship             VARCHAR(50),
    is_primary               BOOLEAN NOT NULL DEFAULT FALSE,
    notify_on_sos            BOOLEAN NOT NULL DEFAULT TRUE,
    notify_on_route_deviation BOOLEAN NOT NULL DEFAULT FALSE,
    created_date             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_date       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by               VARCHAR(100),
    last_modified_by         VARCHAR(100),
    version                  BIGINT DEFAULT 0,
    CONSTRAINT fk_ec_user FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
