-- Capitally database schema aligned with the current Spring Boot entities.
-- Target database: PostgreSQL.

CREATE SEQUENCE IF NOT EXISTS user_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS account_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS categories_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS transaction_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS password_reset_email_log_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS t_currency (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS t_user (
    id BIGINT PRIMARY KEY DEFAULT nextval('user_seq'),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(320) NOT NULL,
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    password_change_required BOOLEAN NOT NULL DEFAULT FALSE,
    roles VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_username UNIQUE (username),
    CONSTRAINT uk_user_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS t_account (
    id BIGINT PRIMARY KEY DEFAULT nextval('account_seq'),
    name VARCHAR(100) NOT NULL,
    initial_balance NUMERIC(15, 2) DEFAULT 0.00,
    currency_initial_balance VARCHAR(3),
    icon_name VARCHAR(80) DEFAULT 'account_balance_wallet',
    include_in_total_balance BOOLEAN DEFAULT TRUE,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_account_currency_initial_balance FOREIGN KEY (currency_initial_balance) REFERENCES t_currency(code),
    CONSTRAINT chk_account_currency_initial_balance_requires_balance
        CHECK (initial_balance IS NOT NULL OR currency_initial_balance IS NULL)
);

CREATE TABLE IF NOT EXISTS t_category (
    id BIGINT PRIMARY KEY DEFAULT nextval('categories_id_seq'),
    macro_category VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    icon_name VARCHAR(80),
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS t_transaction (
    id BIGINT PRIMARY KEY DEFAULT nextval('transaction_seq'),
    user_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3),
    date DATE NOT NULL,
    description VARCHAR(255),
    category_id BIGINT,
    transaction_type VARCHAR(20) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_period VARCHAR(20),
    recurrence_end_date DATE,
    transfer_group_id VARCHAR(36),
    transfer_counterparty_account_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_account FOREIGN KEY (account_id) REFERENCES t_account(id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_currency FOREIGN KEY (currency) REFERENCES t_currency(code),
    CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES t_category(id) ON DELETE SET NULL,
    CONSTRAINT fk_transaction_transfer_counterparty_account
        FOREIGN KEY (transfer_counterparty_account_id) REFERENCES t_account(id) ON DELETE SET NULL,
    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT chk_transaction_recurrence_period
        CHECK (recurrence_period IS NULL OR recurrence_period IN (
            'DAILY',
            'WEEKLY',
            'MONTHLY',
            'YEARLY',
            'TWO_DAYS',
            'TEN_DAYS',
            'TWELVE_DAYS',
            'FIFTEEN_DAYS',
            'THIRTY_DAYS',
            'THIRTY_ONE_DAYS',
            'TWO_WEEKS',
            'FOUR_WEEKS',
            'TWO_MONTHS',
            'THREE_MONTHS',
            'FOUR_MONTHS',
            'SIX_MONTHS',
            'TWO_YEARS'
        ))
);

CREATE TABLE IF NOT EXISTS t_password_reset_email_log (
    id BIGINT PRIMARY KEY DEFAULT nextval('password_reset_email_log_seq'),
    user_id BIGINT NOT NULL,
    recipient_email VARCHAR(320) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_password_reset_email_log_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_account_user ON t_account(user_id);
CREATE INDEX IF NOT EXISTS idx_category_user ON t_category(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_user_date ON t_transaction(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transaction_account ON t_transaction(account_id);
CREATE INDEX IF NOT EXISTS idx_transaction_category ON t_transaction(category_id);
CREATE INDEX IF NOT EXISTS idx_transaction_transfer_group ON t_transaction(transfer_group_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_email_log_created_at ON t_password_reset_email_log(created_at);
