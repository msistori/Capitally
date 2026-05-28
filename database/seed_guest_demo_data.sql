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

SELECT setval('public.accounts_id_seq', (COALESCE((SELECT MAX(id) FROM t_account), 0) + 1)::bigint, false);
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
  ('Lavoro', 'Stipendio', 'coin', 1),
  ('Lavoro', 'Bonus', 'bill', 1),
  ('Casa', 'Spesa', 'shopping', 1),
  ('Casa', 'Affitto', 'home', 1),
  ('Casa', 'Utenze', 'wifi', 1),
  ('Trasporti', 'Benzina', 'fuel', 1),
  ('Trasporti', 'Taxi', 'taxi', 1),
  ('Cibo', 'Ristorante', 'food', 1),
  ('Cibo', 'Bar', 'coffee', 1),
  ('Servizi', 'ChatGPT', 'robot', 1),
  ('Servizi', 'Spotify', 'mic', 1),
  ('Salute', 'Farmacia', 'health', 1),
  ('Salute', 'Palestra', 'barbell', 1),
  ('Svago', 'Cinema', 'popcorn', 1),
  ('Svago', 'Libri', 'book', 1),
  ('Viaggi', 'Aerei', 'plane', 1),
  ('Viaggi', 'Rimborso Viaggi', 'transfer', 1),
  ('Viaggi', 'Hotel', 'hotel', 1),
  ('Shopping', 'Abbigliamento', 'clothes', 1),
  ('Shopping', 'Elettronica', 'pc', 1);

WITH tx(account_name, amount, currency, tx_date, description, macro_category, category, transaction_type, is_recurring, recurrence_period, recurrence_end_date) AS (
  VALUES
    ('ISP Stipendio', 2200.00, 'EUR', DATE '2026-01-27', 'Demo | Stipendio gennaio', 'Lavoro', 'Stipendio', 'INCOME', FALSE, NULL, NULL),
    ('ISP Stipendio', 2200.00, 'EUR', DATE '2026-02-27', 'Demo | Stipendio febbraio', 'Lavoro', 'Stipendio', 'INCOME', FALSE, NULL, NULL),
    ('ISP Stipendio', 2200.00, 'EUR', DATE '2026-03-27', 'Demo | Stipendio marzo', 'Lavoro', 'Stipendio', 'INCOME', FALSE, NULL, NULL),
    ('ISP Stipendio', 2200.00, 'EUR', DATE '2026-04-27', 'Demo | Stipendio aprile', 'Lavoro', 'Stipendio', 'INCOME', FALSE, NULL, NULL),
    ('ISP Stipendio', 2200.00, 'EUR', DATE '2026-05-27', 'Demo | Stipendio maggio', 'Lavoro', 'Stipendio', 'INCOME', TRUE, 'MONTHLY', DATE '2026-12-27'),
    ('ISP Stipendio', 750.00, 'EUR', DATE '2026-03-15', 'Demo | Bonus trimestrale', 'Lavoro', 'Bonus', 'INCOME', FALSE, NULL, NULL),
    ('Revolut Viaggi', 320.00, 'USD', DATE '2026-04-12', 'Demo | Rimborso viaggio cliente', 'Viaggi', 'Rimborso Viaggi', 'INCOME', FALSE, NULL, NULL),
    ('ISP Stipendio', 420.00, 'EUR', DATE '2026-01-18', 'Demo | Consulenza extra', 'Lavoro', 'Bonus', 'INCOME', FALSE, NULL, NULL),
    ('Fineco Everyday', 18.75, 'EUR', DATE '2026-02-06', 'Demo | Cashback carta', 'Lavoro', 'Bonus', 'INCOME', FALSE, NULL, NULL),
    ('Fineco Everyday', 96.30, 'EUR', DATE '2026-03-22', 'Demo | Rimborso spese trasferta', 'Viaggi', 'Rimborso Viaggi', 'INCOME', FALSE, NULL, NULL),
    ('Fineco Everyday', 210.00, 'EUR', DATE '2026-04-16', 'Demo | Vendita smartphone usato', 'Shopping', 'Elettronica', 'INCOME', FALSE, NULL, NULL),
    ('Wise GBP', 48.00, 'GBP', DATE '2026-05-04', 'Demo | Rimborso hotel Londra', 'Viaggi', 'Rimborso Viaggi', 'INCOME', FALSE, NULL, NULL),
    ('Fineco Everyday', 740.00, 'EUR', DATE '2026-01-03', 'Demo | Affitto gennaio', 'Casa', 'Affitto', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 740.00, 'EUR', DATE '2026-02-03', 'Demo | Affitto febbraio', 'Casa', 'Affitto', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 740.00, 'EUR', DATE '2026-03-03', 'Demo | Affitto marzo', 'Casa', 'Affitto', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 740.00, 'EUR', DATE '2026-04-03', 'Demo | Affitto aprile', 'Casa', 'Affitto', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 740.00, 'EUR', DATE '2026-05-03', 'Demo | Affitto maggio', 'Casa', 'Affitto', 'EXPENSE', TRUE, 'MONTHLY', DATE '2026-12-03'),
    ('Fineco Everyday', 96.40, 'EUR', DATE '2026-05-06', 'Demo | Spesa supermercato', 'Casa', 'Spesa', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 54.20, 'EUR', DATE '2026-05-12', 'Demo | Benzina Q8', 'Trasporti', 'Benzina', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 42.00, 'EUR', DATE '2026-05-17', 'Demo | Cena fuori', 'Cibo', 'Ristorante', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 22.99, 'EUR', DATE '2026-05-01', 'Demo | ChatGPT Plus', 'Servizi', 'ChatGPT', 'EXPENSE', TRUE, 'MONTHLY', DATE '2026-12-01'),
    ('Fineco Everyday', 10.99, 'EUR', DATE '2026-05-02', 'Demo | Spotify', 'Servizi', 'Spotify', 'EXPENSE', TRUE, 'MONTHLY', DATE '2026-12-02'),
    ('Contanti', 18.60, 'EUR', DATE '2026-04-20', 'Demo | Farmacia', 'Salute', 'Farmacia', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 24.00, 'EUR', DATE '2026-04-26', 'Demo | Cinema', 'Svago', 'Cinema', 'EXPENSE', FALSE, NULL, NULL),
    ('Revolut Viaggi', 185.00, 'USD', DATE '2026-03-07', 'Demo | Volo Berlino', 'Viaggi', 'Aerei', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 82.35, 'EUR', DATE '2026-01-08', 'Demo | Spesa Esselunga', 'Casa', 'Spesa', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 49.80, 'EUR', DATE '2026-01-11', 'Demo | Benzina gennaio', 'Trasporti', 'Benzina', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 8.40, 'EUR', DATE '2026-01-13', 'Demo | Colazione bar', 'Cibo', 'Bar', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 64.90, 'EUR', DATE '2026-01-16', 'Demo | Maglione saldi', 'Shopping', 'Abbigliamento', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 34.50, 'EUR', DATE '2026-01-19', 'Demo | Fibra casa', 'Casa', 'Utenze', 'EXPENSE', TRUE, 'MONTHLY', DATE '2026-12-19'),
    ('Contanti', 37.60, 'EUR', DATE '2026-01-21', 'Demo | Pranzo trattoria', 'Cibo', 'Ristorante', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 29.90, 'EUR', DATE '2026-01-24', 'Demo | Libro finanza personale', 'Svago', 'Libri', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 101.70, 'EUR', DATE '2026-02-07', 'Demo | Spesa settimanale', 'Casa', 'Spesa', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 45.00, 'EUR', DATE '2026-02-10', 'Demo | Palestra febbraio', 'Salute', 'Palestra', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 12.20, 'EUR', DATE '2026-02-12', 'Demo | Aperitivo', 'Cibo', 'Bar', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 57.30, 'EUR', DATE '2026-02-14', 'Demo | Rifornimento auto', 'Trasporti', 'Benzina', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 79.99, 'EUR', DATE '2026-02-18', 'Demo | Scarpe running', 'Shopping', 'Abbigliamento', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 46.80, 'EUR', DATE '2026-02-21', 'Demo | Cena pizzeria', 'Cibo', 'Ristorante', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 27.40, 'EUR', DATE '2026-02-25', 'Demo | Farmacia febbraio', 'Salute', 'Farmacia', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 93.55, 'EUR', DATE '2026-03-05', 'Demo | Spesa supermercato marzo', 'Casa', 'Spesa', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 129.00, 'EUR', DATE '2026-03-09', 'Demo | Cuffie bluetooth', 'Shopping', 'Elettronica', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 9.60, 'EUR', DATE '2026-03-11', 'Demo | Caffe e brioche', 'Cibo', 'Bar', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 52.10, 'EUR', DATE '2026-03-14', 'Demo | Benzina marzo', 'Trasporti', 'Benzina', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 41.30, 'EUR', DATE '2026-03-18', 'Demo | Ristorante pausa pranzo', 'Cibo', 'Ristorante', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 18.00, 'EUR', DATE '2026-03-20', 'Demo | Taxi stazione', 'Trasporti', 'Taxi', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 45.00, 'EUR', DATE '2026-03-24', 'Demo | Palestra marzo', 'Salute', 'Palestra', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 88.10, 'EUR', DATE '2026-04-05', 'Demo | Spesa supermercato aprile', 'Casa', 'Spesa', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 210.00, 'EUR', DATE '2026-04-08', 'Demo | Hotel weekend Torino', 'Viaggi', 'Hotel', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 11.50, 'EUR', DATE '2026-04-10', 'Demo | Bar coworking', 'Cibo', 'Bar', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 56.40, 'EUR', DATE '2026-04-15', 'Demo | Benzina aprile', 'Trasporti', 'Benzina', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 73.20, 'EUR', DATE '2026-04-18', 'Demo | Camicia nuova', 'Shopping', 'Abbigliamento', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 39.90, 'EUR', DATE '2026-04-22', 'Demo | Cena sushi', 'Cibo', 'Ristorante', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 45.00, 'EUR', DATE '2026-04-24', 'Demo | Palestra aprile', 'Salute', 'Palestra', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 104.85, 'EUR', DATE '2026-05-07', 'Demo | Spesa grande', 'Casa', 'Spesa', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 7.80, 'EUR', DATE '2026-05-09', 'Demo | Cappuccino e cornetto', 'Cibo', 'Bar', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 58.90, 'EUR', DATE '2026-05-11', 'Demo | Rifornimento maggio', 'Trasporti', 'Benzina', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 45.00, 'EUR', DATE '2026-05-14', 'Demo | Palestra maggio', 'Salute', 'Palestra', 'EXPENSE', FALSE, NULL, NULL),
    ('Contanti', 43.70, 'EUR', DATE '2026-05-16', 'Demo | Cena in centro', 'Cibo', 'Ristorante', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 89.99, 'EUR', DATE '2026-05-18', 'Demo | Zaino ufficio', 'Shopping', 'Abbigliamento', 'EXPENSE', FALSE, NULL, NULL),
    ('Fineco Everyday', 25.60, 'EUR', DATE '2026-05-20', 'Demo | Farmacia maggio', 'Salute', 'Farmacia', 'EXPENSE', FALSE, NULL, NULL),
    ('Revolut Viaggi', 142.80, 'USD', DATE '2026-02-28', 'Demo | Hotel New York', 'Viaggi', 'Hotel', 'EXPENSE', FALSE, NULL, NULL),
    ('Revolut Viaggi', 63.50, 'USD', DATE '2026-03-08', 'Demo | Cena Berlino', 'Cibo', 'Ristorante', 'EXPENSE', FALSE, NULL, NULL),
    ('Wise GBP', 116.20, 'GBP', DATE '2026-04-29', 'Demo | Hotel Londra', 'Viaggi', 'Hotel', 'EXPENSE', FALSE, NULL, NULL),
    ('Wise GBP', 32.50, 'GBP', DATE '2026-04-30', 'Demo | Taxi Heathrow', 'Trasporti', 'Taxi', 'EXPENSE', FALSE, NULL, NULL),
    ('Wise GBP', 8.40, 'GBP', DATE '2026-05-01', 'Demo | Coffee shop Londra', 'Cibo', 'Bar', 'EXPENSE', FALSE, NULL, NULL),
    ('Wise GBP', 24.99, 'GBP', DATE '2026-05-02', 'Demo | Libreria Londra', 'Svago', 'Libri', 'EXPENSE', FALSE, NULL, NULL)
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
    DATE '2026-03-10',
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
    DATE '2026-03-10',
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
  AND description = 'Demo | Affitto gennaio';
