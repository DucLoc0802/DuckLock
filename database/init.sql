USE DuckLock;

DROP TABLE IF EXISTS transactions;

DROP TABLE IF EXISTS proof_images;

DROP TABLE IF EXISTS categories;

DROP TABLE IF EXISTS refresh_tokens;

DROP TABLE IF EXISTS oauth_accounts;

DROP TABLE IF EXISTS users;

-- 1. BẢNG USERS
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT NULL,
    default_currency CHAR(3) NOT NULL DEFAULT 'VND',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 2. BẢNG OAUTH_ACCOUNTS
CREATE TABLE oauth_accounts (
    id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
    user_id VARCHAR(36) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uidx_provider_pid (provider, provider_id),
    INDEX idx_oauth_user_id (user_id),
    CONSTRAINT fk_oauth_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 3. BẢNG REFRESH_TOKENS
CREATE TABLE refresh_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info TEXT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL,
    INDEX idx_rt_user_id (user_id),
    CONSTRAINT fk_rt_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4. BẢNG CATEGORIES
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
    user_id VARCHAR(36) NULL,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    color CHAR(7) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sys_user_id VARCHAR(36) GENERATED ALWAYS AS (COALESCE(user_id, 'SYSTEM')) VIRTUAL,
    UNIQUE KEY uidx_user_category_name (sys_user_id, name),
    INDEX idx_categories_user_id (user_id),
    CONSTRAINT fk_categories_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 5. BẢNG PROOF_IMAGES
CREATE TABLE proof_images (
    id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
    user_id VARCHAR(36) NOT NULL,
    image_url TEXT NULL,
    thumbnail_url TEXT NULL,
    status ENUM(
        'PENDING',
        'PROCESSED',
        'DISCARDED'
    ) NOT NULL DEFAULT 'PENDING',
    file_size INT NULL,
    mime_type VARCHAR(50) DEFAULT 'image/jpeg',
    captured_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pi_user_status_date (
        user_id,
        status,
        captured_at DESC
    ),
    CONSTRAINT fk_pi_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 6. BẢNG TRANSACTIONS
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
    user_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NULL,
    proof_image_id VARCHAR(36) NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'VND',
    amount_in_default_currency DECIMAL(15, 2) NOT NULL,
    type ENUM('EXPENSE', 'INCOME') NOT NULL DEFAULT 'EXPENSE',
    transaction_date DATE NOT NULL,
    description VARCHAR(200) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_tx_user_date (
        user_id,
        deleted_at,
        transaction_date DESC
    ),
    INDEX idx_tx_user_category (
        user_id,
        deleted_at,
        category_id
    ),
    INDEX idx_tx_category_id (category_id),
    INDEX idx_tx_proof_image_id (proof_image_id),
    FULLTEXT INDEX idx_tx_description (description),
    CONSTRAINT fk_tx_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_categories FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
    CONSTRAINT fk_tx_images FOREIGN KEY (proof_image_id) REFERENCES proof_images (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;