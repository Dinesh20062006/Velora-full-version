-- =====================================================
-- Velora Safety Service: Initial Schema
-- Migration: V1__create_safety_tables.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS incidents (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_user_id    BIGINT NOT NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    incident_type       VARCHAR(50) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    severity            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    latitude            DOUBLE,
    longitude           DOUBLE,
    address             VARCHAR(500),
    city                VARCHAR(100),
    state               VARCHAR(100),
    incident_date       DATETIME,
    is_anonymous        BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_officer_id BIGINT,
    police_notes        TEXT,
    resolved_at         DATETIME,
    created_date        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_date  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    last_modified_by    VARCHAR(100),
    version             BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS incident_images (
    incident_id BIGINT NOT NULL,
    image_url   VARCHAR(500),
    CONSTRAINT fk_images_incident FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS safe_zones (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    zone_type           VARCHAR(50) NOT NULL,
    latitude            DOUBLE NOT NULL,
    longitude           DOUBLE NOT NULL,
    radius_meters       DOUBLE DEFAULT 200.0,
    address             VARCHAR(500),
    city                VARCHAR(100),
    state               VARCHAR(100),
    phone_number        VARCHAR(20),
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    safety_score        INT DEFAULT 80,
    created_date        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_date  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    last_modified_by    VARCHAR(100),
    version             BIGINT DEFAULT 0
);

CREATE INDEX idx_incidents_reporter ON incidents(reporter_user_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_location ON incidents(latitude, longitude);
CREATE INDEX idx_safe_zones_type ON safe_zones(zone_type);
CREATE INDEX idx_safe_zones_location ON safe_zones(latitude, longitude);
CREATE INDEX idx_safe_zones_city ON safe_zones(city);

-- Seed safe zones for demo
INSERT INTO safe_zones (name, zone_type, latitude, longitude, address, city, state, is_verified, safety_score, created_by) VALUES
  ('Central Police Station', 'POLICE_STATION', 13.0827, 80.2707, '1 Commissioner Rd', 'Chennai', 'Tamil Nadu', TRUE, 95, 'SYSTEM'),
  ('Government General Hospital', 'HOSPITAL', 13.0569, 80.2426, 'Park Town', 'Chennai', 'Tamil Nadu', TRUE, 90, 'SYSTEM'),
  ('Women Welfare Center', 'WOMEN_CENTER', 13.0643, 80.2343, 'T Nagar', 'Chennai', 'Tamil Nadu', TRUE, 88, 'SYSTEM');
