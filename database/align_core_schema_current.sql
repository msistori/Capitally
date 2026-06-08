-- Idempotent migration helper for databases created from older Capitally scripts.
-- Run after taking a backup and before loading current demo data.

CREATE SEQUENCE IF NOT EXISTS user_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS account_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS categories_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS transaction_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS password_reset_email_log_seq START WITH 1 INCREMENT BY 1;

DROP VIEW IF EXISTS v_transaction_monthly_report;

ALTER TABLE IF EXISTS t_user
    ADD COLUMN IF NOT EXISTS username VARCHAR(100),
    ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS roles VARCHAR(255);

UPDATE t_user
SET username = COALESCE(username, email)
WHERE username IS NULL;

UPDATE t_user
SET password_change_required = FALSE
WHERE password_change_required IS NULL;

ALTER TABLE IF EXISTS t_user
    ALTER COLUMN username SET NOT NULL,
    ALTER COLUMN enabled SET NOT NULL,
    ALTER COLUMN password_change_required SET NOT NULL;

DO $$
BEGIN
    IF to_regclass('t_user') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_user_username'
    ) THEN
        ALTER TABLE t_user ADD CONSTRAINT uk_user_username UNIQUE (username);
    END IF;

    IF to_regclass('t_user') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_user_email'
    ) THEN
        ALTER TABLE t_user ADD CONSTRAINT uk_user_email UNIQUE (email);
    END IF;
END $$;

ALTER TABLE IF EXISTS t_account
    ADD COLUMN IF NOT EXISTS user_id BIGINT,
    ADD COLUMN IF NOT EXISTS currency_initial_balance VARCHAR(3),
    ADD COLUMN IF NOT EXISTS icon_name VARCHAR(80) DEFAULT 'account_balance_wallet',
    ADD COLUMN IF NOT EXISTS include_in_total_balance BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS t_category
    ADD COLUMN IF NOT EXISTS user_id BIGINT,
    ADD COLUMN IF NOT EXISTS icon_name VARCHAR(80);

ALTER TABLE IF EXISTS t_transaction
    ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS transfer_group_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS transfer_counterparty_account_id BIGINT;

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conrelid::regclass AS table_name, conname
        FROM pg_constraint
        WHERE contype = 'f'
          AND conrelid = ANY (ARRAY[
              to_regclass('t_account'),
              to_regclass('t_category'),
              to_regclass('t_transaction'),
              to_regclass('t_password_reset_email_log')
          ]::oid[])
    LOOP
        EXECUTE format(
            'ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I',
            constraint_record.table_name,
            constraint_record.conname
        );
    END LOOP;
END $$;

ALTER TABLE IF EXISTS t_user
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN id SET DEFAULT nextval('user_seq');

ALTER TABLE IF EXISTS t_account
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN id SET DEFAULT nextval('account_seq'),
    ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;

ALTER TABLE IF EXISTS t_category
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN id SET DEFAULT nextval('categories_id_seq'),
    ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;

ALTER TABLE IF EXISTS t_transaction
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN id SET DEFAULT nextval('transaction_seq'),
    ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT,
    ALTER COLUMN account_id TYPE BIGINT USING account_id::BIGINT,
    ALTER COLUMN category_id TYPE BIGINT USING category_id::BIGINT,
    ALTER COLUMN transfer_counterparty_account_id TYPE BIGINT USING transfer_counterparty_account_id::BIGINT;

CREATE TABLE IF NOT EXISTS t_password_reset_email_log (
    id BIGINT PRIMARY KEY DEFAULT nextval('password_reset_email_log_seq'),
    user_id BIGINT NOT NULL REFERENCES t_user(id) ON DELETE CASCADE,
    recipient_email VARCHAR(320) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

ALTER TABLE IF EXISTS t_password_reset_email_log
    ADD COLUMN IF NOT EXISTS user_id BIGINT,
    ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(320),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

ALTER TABLE IF EXISTS t_password_reset_email_log
    ALTER COLUMN id TYPE BIGINT USING id::BIGINT,
    ALTER COLUMN id SET DEFAULT nextval('password_reset_email_log_seq'),
    ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT,
    ALTER COLUMN recipient_email SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

DO $$
BEGIN
    IF to_regclass('t_account') IS NOT NULL AND to_regclass('t_user') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_account_user'
    ) THEN
        ALTER TABLE t_account
            ADD CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE;
    END IF;

    IF to_regclass('t_category') IS NOT NULL AND to_regclass('t_user') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_category_user'
    ) THEN
        ALTER TABLE t_category
            ADD CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE;
    END IF;

    IF to_regclass('t_transaction') IS NOT NULL AND to_regclass('t_account') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_account'
    ) THEN
        ALTER TABLE t_transaction
            ADD CONSTRAINT fk_transaction_account FOREIGN KEY (account_id) REFERENCES t_account(id) ON DELETE CASCADE;
    END IF;

    IF to_regclass('t_transaction') IS NOT NULL AND to_regclass('t_user') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_user'
    ) THEN
        ALTER TABLE t_transaction
            ADD CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE;
    END IF;

    IF to_regclass('t_transaction') IS NOT NULL AND to_regclass('t_category') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_category'
    ) THEN
        ALTER TABLE t_transaction
            ADD CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES t_category(id) ON DELETE SET NULL;
    END IF;

    IF to_regclass('t_transaction') IS NOT NULL AND to_regclass('t_account') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_transfer_counterparty_account'
    ) THEN
        ALTER TABLE t_transaction
            ADD CONSTRAINT fk_transaction_transfer_counterparty_account
            FOREIGN KEY (transfer_counterparty_account_id) REFERENCES t_account(id) ON DELETE SET NULL;
    END IF;

    IF to_regclass('t_password_reset_email_log') IS NOT NULL AND to_regclass('t_user') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_password_reset_email_log_user'
    ) THEN
        ALTER TABLE t_password_reset_email_log
            ADD CONSTRAINT fk_password_reset_email_log_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_account_user ON t_account(user_id);
CREATE INDEX IF NOT EXISTS idx_category_user ON t_category(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_user_date ON t_transaction(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transaction_account ON t_transaction(account_id);
CREATE INDEX IF NOT EXISTS idx_transaction_category ON t_transaction(category_id);
CREATE INDEX IF NOT EXISTS idx_transaction_transfer_group ON t_transaction(transfer_group_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_email_log_created_at ON t_password_reset_email_log(created_at);

CREATE OR REPLACE VIEW v_transaction_monthly_report AS
SELECT
  t.user_id,
  to_char(t.date, 'YYYY-MM') AS month,
  t.transaction_type,
  SUM(t.amount) AS total
FROM t_transaction t
WHERE t.transfer_group_id IS NULL
GROUP BY
  t.user_id,
  to_char(t.date, 'YYYY-MM'),
  t.transaction_type;
