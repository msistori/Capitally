
# 📦 Capitally - Database Schema (English Version)

---

## 🔵 Main Tables

### 👤 users
- `id` (PK)
- `name`
- `email` (UNIQUE)
- `password`
- `created_at`
- `updated_at`

---

### 🏦 accounts
- `id` (PK)
- `name`
- `initial_balance`
- `currency` (FK)
- `account_type` (e.g., checking, savings, investment)
- `created_at`
- `updated_at`

---

### 🔗 user_accounts
- `user_id` (FK)
- `account_id` (FK)
- PK: (`user_id`, `account_id`)

---

### 🗂️ categories
- `id` (PK)
- `category_type` (Income/Expense)
- `macrocategory`
- `category`
- `created_at`
- `updated_at`

---

### 💸 transactions
- `id` (PK)
- `user_id` (FK)
- `account_id` (FK)
- `amount`
- `currency` (FK)
- `date`
- `description`
- `category_id` (FK)
- `is_recurring` (BOOLEAN, nullable)
- `recurrence_period` (VARCHAR, nullable)
- `recurrence_interval` (INTEGER, nullable)
- `recurrence_end_date` (DATE, nullable)
- `created_at`
- `updated_at`

---

### 📊 budgets
- `id` (PK)
- `user_id` (FK)
- `category_id` (nullable FK)
- `monthly_amount`
- `month`
- `year`
- `created_at`
- `updated_at`

---

### 📈 investment_instruments
- `id` (PK)
- `name`
- `type` (ETF, Stock, Crypto, etc.)
- `exchange`
- `symbol`

---

### 💼 investments
- `id` (PK)
- `user_id` (FK)
- `instrument_id` (FK)
- `operation_type` (Buy/Sell)
- `quantity`
- `unit_price`
- `fees`
- `currency` (FK)
- `operation_date`
- `created_at`
- `updated_at`

---

### 📉 investment_values
- `id` (PK)
- `instrument_id` (FK)
- `value`
- `valuation_date`

---

### 🏠 assets
- `id` (PK)
- `user_id` (FK)
- `name`
- `type` (Home, Car, Object, etc.)
- `purchase_value`
- `current_value`
- `currency` (FK)
- `purchase_date`
- `description`
- `created_at`
- `updated_at`

---

### 🌍 currencies
- `code` (PK, e.g., EUR, USD)
- `name`

---

### 💱 exchange_rates
- `from_currency` (FK)
- `to_currency` (FK)
- `rate`
- `rate_date`
- PK: (`from_currency`, `to_currency`, `rate_date`)

---

## 🧭 Key Relationships

- `users` 1:N `transactions`, `budgets`, `investments`, `assets`
- `users` N:M `accounts` via `user_accounts`
- `categories` 1:N `transactions`, `budgets`
- `accounts` 1:N `transactions`
- `investment_instruments` 1:N `investments`, `investment_values`
- `currencies` 1:N in `accounts`, `transactions`, `investments`, `assets`
- `currencies` 1:N `exchange_rates`