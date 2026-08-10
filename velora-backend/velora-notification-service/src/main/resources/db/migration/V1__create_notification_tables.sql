-- Velora Notification Service V1 Schema
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(50) NOT NULL DEFAULT 'INFO',
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    action_url      VARCHAR(500),
    reference_id    BIGINT,
    reference_type  VARCHAR(50),
    created_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    last_modified_by VARCHAR(100),
    version         BIGINT DEFAULT 0
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
