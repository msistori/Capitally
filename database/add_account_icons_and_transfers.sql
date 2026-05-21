ALTER TABLE t_account
    ADD COLUMN IF NOT EXISTS icon_name VARCHAR(80) DEFAULT 'account_balance_wallet';

ALTER TABLE t_account
    ADD COLUMN IF NOT EXISTS include_in_total_balance BOOLEAN DEFAULT TRUE;

UPDATE t_account
SET icon_name = 'account_balance_wallet'
WHERE icon_name IS NULL OR icon_name = '';

UPDATE t_account
SET include_in_total_balance = TRUE
WHERE include_in_total_balance IS NULL;

ALTER TABLE t_transaction
    ADD COLUMN IF NOT EXISTS transfer_group_id VARCHAR(36);

ALTER TABLE t_transaction
    ADD COLUMN IF NOT EXISTS transfer_counterparty_account_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_transaction_transfer_counterparty_account'
    ) THEN
        ALTER TABLE t_transaction
            ADD CONSTRAINT fk_transaction_transfer_counterparty_account
            FOREIGN KEY (transfer_counterparty_account_id)
            REFERENCES t_account(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transaction_transfer_group
    ON t_transaction (transfer_group_id);
