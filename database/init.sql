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

-- 2. BẢNG WALLETS


CREATE TABLE wallets (
    id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),

    user_id VARCHAR(36) NOT NULL,

    name VARCHAR(100) NOT NULL,

    type ENUM(
        'CASH',
        'BANK',
        'SAVING',
        'OTHER'
    ) NOT NULL DEFAULT 'CASH',

    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency CHAR(3) NOT NULL DEFAULT 'VND',

-- Chỉ dùng cho loại SAVING


interest_rate_percent DECIMAL(5, 2) NULL,

    note VARCHAR(200) NULL,

    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    active_key TINYINT GENERATED ALWAYS AS (
        CASE 
            WHEN deleted_at IS NULL THEN 1 
            ELSE NULL 
        END
    ) VIRTUAL,

    UNIQUE KEY uidx_wallet_user_name_active (
        user_id,
        name,
        active_key
    ),

    INDEX idx_wallets_user_id (
        user_id,
        deleted_at
    ),

    INDEX idx_wallets_user_type (
        user_id,
        type,
        deleted_at
    ),

    CONSTRAINT fk_wallets_users 
        FOREIGN KEY (user_id) REFERENCES users (id) 
        ON DELETE CASCADE,

    CONSTRAINT chk_wallet_balance_non_negative 
        CHECK (balance >= 0),

    CONSTRAINT chk_wallet_interest_rate 
        CHECK (
            interest_rate_percent IS NULL 
            OR interest_rate_percent >= 0
        )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 5. BẢNG BUDGETS


CREATE TABLE budgets (
    id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),

    user_id VARCHAR(36) NOT NULL,

-- NULL = ngân sách tổng của tháng
-- Có giá trị = ngân sách riêng cho một danh mục
category_id VARCHAR(36) NULL,
name VARCHAR(100) NULL,
amount DECIMAL(15, 2) NOT NULL,
currency CHAR(3) NOT NULL DEFAULT 'VND',
amount_in_default_currency DECIMAL(15, 2) NOT NULL,

-- Lưu ngày đầu tiên của tháng, ví dụ: 2026-07-01
budget_month DATE NOT NULL,

-- Phần trăm cảnh báo, ví dụ 80 nghĩa là cảnh báo khi đã dùng 80% ngân sách
alert_threshold_percent TINYINT NOT NULL DEFAULT 80,
is_active BOOLEAN NOT NULL DEFAULT TRUE,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
deleted_at TIMESTAMP NULL,

-- Dùng để unique được cả trường hợp category_id NULL
scope_category_id VARCHAR(36) GENERATED ALWAYS AS (COALESCE(category_id, 'ALL')) VIRTUAL,

-- Chỉ enforce unique với budget chưa bị soft-delete


active_key TINYINT GENERATED ALWAYS AS (
        CASE 
            WHEN deleted_at IS NULL THEN 1 
            ELSE NULL 
        END
    ) VIRTUAL,

    UNIQUE KEY uidx_budget_user_month_category_active (
        user_id,
        budget_month,
        scope_category_id,
        active_key
    ),

    INDEX idx_budgets_user_month (
        user_id,
        budget_month,
        deleted_at
    ),

    INDEX idx_budgets_user_category (
        user_id,
        category_id,
        deleted_at
    ),

    INDEX idx_budgets_category_id (category_id),

    CONSTRAINT fk_budgets_users 
        FOREIGN KEY (user_id) REFERENCES users (id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_budgets_categories 
        FOREIGN KEY (category_id) REFERENCES categories (id) 
        ON DELETE SET NULL,

    CONSTRAINT chk_budget_amount_positive 
        CHECK (amount > 0),

    CONSTRAINT chk_budget_alert_threshold 
        CHECK (alert_threshold_percent BETWEEN 1 AND 100)
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


CREATE TABLE recurring_transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT(UUID()),
    user_id VARCHAR(36) NOT NULL,
    wallet_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NULL,
    
    name VARCHAR(100) NOT NULL, -- Ví dụ: "Tiền nhà", "Netflix"
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('EXPENSE', 'INCOME') NOT NULL,
    description TEXT NULL,

-- Tần suất lặp: Hàng ngày, hàng tuần, hàng tháng, hàng năm
frequency ENUM( 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY' ) NOT NULL,

-- Ngày thực hiện lặp (ví dụ: ngày 5 hàng tháng, hoặc thứ 2 hàng tuần)
day_of_period INT NOT NULL, 

    start_date DATE NOT NULL, -- Ngày bắt đầu lịch trình
    end_date DATE NULL,       -- Ngày kết thúc (NULL nếu lặp vô hạn)
    
    last_executed_at DATE NULL,       -- Lần gần nhất hệ thống tự động chèn giao dịch
    next_execution_date DATE NOT NULL, -- Ngày tiếp theo cần chèn giao dịch
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_recurring_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_wallets FOREIGN KEY (wallet_id) REFERENCES wallets (id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_categories FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;