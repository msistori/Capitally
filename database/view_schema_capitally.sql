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
