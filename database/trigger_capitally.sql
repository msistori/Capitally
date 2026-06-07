-- updated_at trigger support for mutable Capitally tables.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    table_name text;
    trigger_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY['t_user', 't_account', 't_category', 't_transaction']
    LOOP
        IF to_regclass(table_name) IS NOT NULL THEN
            trigger_name := 'trg_' || substring(table_name from 3) || '_updated_at';
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, table_name);
            EXECUTE format(
                'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
                trigger_name,
                table_name
            );
        END IF;
    END LOOP;
END $$;
