-- Demo data for t_user.id = 1.
-- Plain SQL version for clients such as DbGate: execute the whole file.

BEGIN;

DELETE FROM t_transaction
WHERE user_id = 1;

DELETE FROM t_category
WHERE user_id = 1;

DELETE FROM t_account
WHERE user_id = 1;

INSERT INTO t_currency (code, name)
VALUES
  ('EUR', 'Euro'),
  ('USD', 'US Dollar'),
  ('GBP', 'British Pound')
ON CONFLICT (code) DO NOTHING;

SELECT setval('public.account_seq', (COALESCE((SELECT MAX(id) FROM t_account), 0) + 1)::bigint, false);
SELECT setval('public.categories_id_seq', (COALESCE((SELECT MAX(id) FROM t_category), 0) + 1)::bigint, false);
SELECT setval('public.transaction_seq', (COALESCE((SELECT MAX(id) FROM t_transaction), 0) + 1)::bigint, false);

INSERT INTO t_account (name, initial_balance, currency_initial_balance, icon_name, include_in_total_balance, user_id)
VALUES
  ('Fineco Everyday', 2450.00, 'EUR', 'account_balance', TRUE, 1),
  ('ISP Stipendio', 1350.00, 'EUR', 'work', TRUE, 1),
  ('Revolut Viaggi', 520.00, 'USD', 'credit_card', TRUE, 1),
  ('Contanti', 180.00, 'EUR', 'local_atm', TRUE, 1),
  ('Wise GBP', 310.00, 'GBP', 'credit_card', TRUE, 1),
  ('Investimenti Demo', 7500.00, 'EUR', 'trending_up', FALSE, 1);

INSERT INTO t_category (macro_category, category, icon_name, user_id)
VALUES
  ('Casa', 'Affitto', 'Home', 1),
  ('Casa', 'Mutuo', 'Bank', 1),
  ('Casa', 'Utenze', 'Wifi', 1),
  ('Casa', 'Manutenzione', 'Spanner', 1),
  ('Cibo', 'Bar', 'Coffee', 1),
  ('Cibo', 'Ristorante', 'Food', 1),
  ('Cibo', 'Locale', 'Cocktail', 1),
  ('Cibo', 'Spesa', 'Grater-cutting', 1),
  ('Trasporti', 'Carburante', 'Fuel', 1),
  ('Trasporti', 'Mezzi', 'Metro', 1),
  ('Trasporti', 'Taxi', 'Taxi', 1),
  ('Trasporti', 'Autolavaggio', 'Car-wash', 1),
  ('Abbonamenti', 'Musica', 'Music-note', 1),
  ('Abbonamenti', 'ChatGPT', 'Robot', 1),
  ('Abbonamenti', 'Amazon', 'Amazon', 1),
  ('Abbonamenti', 'Palestra', 'Barbell', 1),
  ('Divertimento', 'Stadio', 'Stadium', 1),
  ('Divertimento', 'Concerto', 'Concert-day', 1),
  ('Divertimento', 'Cinema', 'Popcorn', 1),
  ('Divertimento', 'Videogiochi', 'Games', 1),
  ('Other', 'Other', 'Question-mark', 1);

WITH months AS (
  SELECT
    offset_month,
    (date_trunc('month', CURRENT_DATE)::date - (offset_month || ' months')::interval)::date AS month_start
  FROM generate_series(0, 17) AS month_offsets(offset_month)
),
tx(account_name, amount, currency, tx_date, description, macro_category, category, transaction_type, is_recurring, recurrence_period, recurrence_end_date) AS (
  SELECT 'ISP Stipendio', 2200.00 + (offset_month % 3) * 25, 'EUR', (month_start + INTERVAL '26 days')::date, 'Demo | Stipendio', 'Other', 'Other', 'INCOME', offset_month = 0, CASE WHEN offset_month = 0 THEN 'MONTHLY' END, CASE WHEN offset_month = 0 THEN (month_start + INTERVAL '12 months 26 days')::date END FROM months
  UNION ALL SELECT 'Fineco Everyday', 740.00, 'EUR', (month_start + INTERVAL '2 days')::date, 'Demo | Affitto', 'Casa', 'Affitto', 'EXPENSE', offset_month = 0, CASE WHEN offset_month = 0 THEN 'MONTHLY' END, CASE WHEN offset_month = 0 THEN (month_start + INTERVAL '12 months 2 days')::date END FROM months
  UNION ALL SELECT 'Fineco Everyday', 96.40 + (offset_month % 4) * 8, 'EUR', (month_start + INTERVAL '6 days')::date, 'Demo | Spesa supermercato', 'Cibo', 'Spesa', 'EXPENSE', FALSE, NULL, NULL FROM months
  UNION ALL SELECT 'Contanti', 8.40 + (offset_month % 5), 'EUR', (month_start + INTERVAL '8 days')::date, 'Demo | Colazione bar', 'Cibo', 'Bar', 'EXPENSE', FALSE, NULL, NULL FROM months
  UNION ALL SELECT 'Fineco Everyday', 54.20 + (offset_month % 3) * 4, 'EUR', (month_start + INTERVAL '11 days')::date, 'Demo | Carburante', 'Trasporti', 'Carburante', 'EXPENSE', FALSE, NULL, NULL FROM months
  UNION ALL SELECT 'Contanti', 42.00 + (offset_month % 4) * 3, 'EUR', (month_start + INTERVAL '16 days')::date, 'Demo | Cena fuori', 'Cibo', 'Ristorante', 'EXPENSE', FALSE, NULL, NULL FROM months
  UNION ALL SELECT 'Fineco Everyday', 22.99, 'EUR', (month_start + INTERVAL '1 day')::date, 'Demo | ChatGPT', 'Abbonamenti', 'ChatGPT', 'EXPENSE', offset_month = 0, CASE WHEN offset_month = 0 THEN 'MONTHLY' END, CASE WHEN offset_month = 0 THEN (month_start + INTERVAL '12 months 1 day')::date END FROM months
  UNION ALL SELECT 'Fineco Everyday', 10.99, 'EUR', (month_start + INTERVAL '2 days')::date, 'Demo | Musica streaming', 'Abbonamenti', 'Musica', 'EXPENSE', offset_month = 0, CASE WHEN offset_month = 0 THEN 'MONTHLY' END, CASE WHEN offset_month = 0 THEN (month_start + INTERVAL '12 months 2 days')::date END FROM months
  UNION ALL SELECT 'Fineco Everyday', 45.00, 'EUR', (month_start + INTERVAL '14 days')::date, 'Demo | Palestra', 'Abbonamenti', 'Palestra', 'EXPENSE', offset_month = 0, CASE WHEN offset_month = 0 THEN 'MONTHLY' END, CASE WHEN offset_month = 0 THEN (month_start + INTERVAL '12 months 14 days')::date END FROM months
  UNION ALL SELECT 'Fineco Everyday', 34.50, 'EUR', (month_start + INTERVAL '18 days')::date, 'Demo | Utenze casa', 'Casa', 'Utenze', 'EXPENSE', offset_month = 0, CASE WHEN offset_month = 0 THEN 'MONTHLY' END, CASE WHEN offset_month = 0 THEN (month_start + INTERVAL '12 months 18 days')::date END FROM months
  UNION ALL SELECT 'Fineco Everyday', 24.00, 'EUR', (month_start + INTERVAL '23 days')::date, 'Demo | Cinema', 'Divertimento', 'Cinema', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month % 2 = 0
  UNION ALL SELECT 'Fineco Everyday', 79.99, 'EUR', (month_start + INTERVAL '20 days')::date, 'Demo | Amazon', 'Abbonamenti', 'Amazon', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month % 3 = 0
  UNION ALL SELECT 'Contanti', 18.00, 'EUR', (month_start + INTERVAL '19 days')::date, 'Demo | Taxi', 'Trasporti', 'Taxi', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month % 3 = 1
  UNION ALL SELECT 'Fineco Everyday', 16.00, 'EUR', (month_start + INTERVAL '21 days')::date, 'Demo | Mezzi pubblici', 'Trasporti', 'Mezzi', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month % 3 = 2
  UNION ALL SELECT 'Fineco Everyday', 185.00, 'EUR', (month_start + INTERVAL '7 days')::date, 'Demo | Concerto', 'Divertimento', 'Concerto', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month IN (1, 7, 13)
  UNION ALL SELECT 'Revolut Viaggi', 63.50, 'USD', (month_start + INTERVAL '12 days')::date, 'Demo | Locale viaggio', 'Cibo', 'Locale', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month IN (2, 8, 14)
  UNION ALL SELECT 'Wise GBP', 32.50, 'GBP', (month_start + INTERVAL '24 days')::date, 'Demo | Taxi estero', 'Trasporti', 'Taxi', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month IN (3, 9, 15)
  UNION ALL SELECT 'Fineco Everyday', 210.00, 'EUR', (month_start + INTERVAL '10 days')::date, 'Demo | Manutenzione casa', 'Casa', 'Manutenzione', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month IN (4, 10, 16)
  UNION ALL SELECT 'Fineco Everyday', 49.00, 'EUR', (month_start + INTERVAL '13 days')::date, 'Demo | Videogiochi', 'Divertimento', 'Videogiochi', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month IN (5, 11, 17)
  UNION ALL SELECT 'Contanti', 35.00, 'EUR', (month_start + INTERVAL '15 days')::date, 'Demo | Stadio', 'Divertimento', 'Stadio', 'EXPENSE', FALSE, NULL, NULL FROM months WHERE offset_month IN (0, 6, 12)
)
INSERT INTO t_transaction (
  user_id,
  account_id,
  amount,
  currency,
  date,
  description,
  category_id,
  transaction_type,
  is_recurring,
  recurrence_period,
  recurrence_end_date
)
SELECT
  1,
  a.id,
  tx.amount,
  tx.currency,
  tx.tx_date,
  tx.description,
  c.id,
  tx.transaction_type,
  tx.is_recurring,
  tx.recurrence_period,
  tx.recurrence_end_date
FROM tx
JOIN t_account a
  ON a.user_id = 1
 AND a.name = tx.account_name
JOIN t_category c
  ON c.user_id = 1
 AND c.macro_category = tx.macro_category
 AND c.category = tx.category;

INSERT INTO t_transaction (
  user_id,
  account_id,
  amount,
  currency,
  date,
  description,
  category_id,
  transaction_type,
  is_recurring,
  transfer_group_id,
  transfer_counterparty_account_id
)
VALUES
  (
    1,
    (SELECT id FROM t_account WHERE user_id = 1 AND name = 'Fineco Everyday'),
    600.00,
    'EUR',
    (date_trunc('month', CURRENT_DATE)::date - INTERVAL '3 months' + INTERVAL '9 days')::date,
    'Demo | Giroconto verso investimenti',
    NULL,
    'EXPENSE',
    FALSE,
    'DEMO-TRF-20260310-001',
    (SELECT id FROM t_account WHERE user_id = 1 AND name = 'Investimenti Demo')
  ),
  (
    1,
    (SELECT id FROM t_account WHERE user_id = 1 AND name = 'Investimenti Demo'),
    600.00,
    'EUR',
    (date_trunc('month', CURRENT_DATE)::date - INTERVAL '3 months' + INTERVAL '9 days')::date,
    'Demo | Giroconto da Fineco',
    NULL,
    'INCOME',
    FALSE,
    'DEMO-TRF-20260310-001',
    (SELECT id FROM t_account WHERE user_id = 1 AND name = 'Fineco Everyday')
  );

COMMIT;

SELECT COUNT(*) AS user_1_transactions
FROM t_transaction
WHERE user_id = 1;

SELECT *
FROM t_transaction
WHERE user_id = 1
  AND description = 'Demo | Affitto'
ORDER BY date DESC
LIMIT 5;
