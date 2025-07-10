CREATE VIEW v_transaction_monthly_report AS
SELECT
    t.user_id,
    TO_CHAR(t.date, 'YYYY-MM') AS month,
    c.category_type,
    SUM(t.amount) AS total
FROM t_transaction t
JOIN t_category c ON c.id = t.category_id
GROUP BY t.user_id, TO_CHAR(t.date, 'YYYY-MM'), c.category_type;