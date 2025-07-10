
-- ======================================
-- TRIGGERS FOR updated_at
-- ======================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tables
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON t_user
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_accounts_updated_at
BEFORE UPDATE ON t_account
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON t_category
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON t_transaction
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_budgets_updated_at
BEFORE UPDATE ON t_budget
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_investments_updated_at
BEFORE UPDATE ON t_investment
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_assets_updated_at
BEFORE UPDATE ON t_asset
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
