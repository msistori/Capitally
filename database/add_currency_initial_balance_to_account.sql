ALTER TABLE t_account
    ADD COLUMN IF NOT EXISTS currency_initial_balance VARCHAR(3);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_account_currency_initial_balance'
    ) THEN
        ALTER TABLE t_account
            ADD CONSTRAINT fk_account_currency_initial_balance
            FOREIGN KEY (currency_initial_balance)
            REFERENCES t_currency(code);
    END IF;
END $$;

UPDATE t_account
SET currency_initial_balance = NULL
WHERE initial_balance IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_account_currency_initial_balance_requires_balance'
    ) THEN
        ALTER TABLE t_account
            ADD CONSTRAINT chk_account_currency_initial_balance_requires_balance
            CHECK (initial_balance IS NOT NULL OR currency_initial_balance IS NULL);
    END IF;
END $$;
