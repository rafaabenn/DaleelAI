-- =====================================================================
-- DaleelAI Migration: Add tool_submissions table
-- Run this script once in phpMyAdmin or MySQL CLI.
-- After admin approval, data is copied into ai_tools.
-- =====================================================================

CREATE TABLE IF NOT EXISTS tool_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    long_description TEXT NOT NULL,
    website_url VARCHAR(500) NOT NULL,
    trial_url VARCHAR(500) DEFAULT NULL,
    logo_url VARCHAR(500) DEFAULT NULL,
    gdpr_compliant TINYINT(1) DEFAULT 0,
    has_api TINYINT(1) DEFAULT 0,
    has_mobile_app TINYINT(1) DEFAULT 0,
    categories_ids TEXT DEFAULT NULL COMMENT 'JSON array of category IDs',
    pricings_ids TEXT DEFAULT NULL COMMENT 'JSON array of pricing IDs',
    languages_ids TEXT DEFAULT NULL COMMENT 'JSON array of language IDs',
    ai_summary TEXT DEFAULT NULL COMMENT 'Summary returned by AI validation',
    status ENUM('pending', 'processing', 'rejected', 'approved') DEFAULT 'pending',
    admin_comment TEXT DEFAULT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Rate limiting table for AI validation endpoint (3 attempts / 1 hour)
-- =====================================================================

CREATE TABLE IF NOT EXISTS ai_validation_rate_limits (
    user_id INT PRIMARY KEY,
    attempt_count INT NOT NULL DEFAULT 0,
    blocked_until DATETIME DEFAULT NULL,
    last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
