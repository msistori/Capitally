
-- ======================================
-- CAPITALLY DATABASE SCHEMA - FINAL VERSION
-- ======================================

-- Currencies
CREATE TABLE t_currency (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Users
CREATE TABLE t_user (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts
CREATE TABLE t_account (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    initial_balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) REFERENCES currencies(code),
    account_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Account relation
CREATE TABLE t_user_account (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, account_id)
);

-- Categories
CREATE TABLE t_category (
    id SERIAL PRIMARY KEY,
    category_type VARCHAR(20) CHECK (category_type IN ('INCOME', 'EXPENSE')) NOT NULL,
    macrocategory VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE t_transaction (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) REFERENCES currencies(code),
    date DATE NOT NULL,
    description VARCHAR(255),
    category_id INTEGER REFERENCES categories(id),
    is_recurring BOOLEAN,
    recurrence_period VARCHAR(20),
    recurrence_interval INTEGER,
    recurrence_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets
CREATE TABLE t_budget (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    monthly_amount DECIMAL(12,2) NOT NULL,
    month INTEGER CHECK (month BETWEEN 1 AND 12) NOT NULL,
    year INTEGER CHECK (year >= 2000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investment Instruments
CREATE TABLE t_investment_instrument (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50),
    exchange VARCHAR(50),
    symbol VARCHAR(50)
);

-- Investments
CREATE TABLE t_investment (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    instrument_id INTEGER REFERENCES investment_instruments(id),
    operation_type VARCHAR(20) CHECK (operation_type IN ('Buy', 'Sell')),
    quantity DECIMAL(12,4),
    unit_price DECIMAL(15,4),
    fees DECIMAL(12,2),
    currency VARCHAR(3) REFERENCES currencies(code),
    operation_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investment Values
CREATE TABLE t_investment_value (
    id SERIAL PRIMARY KEY,
    instrument_id INTEGER REFERENCES investment_instruments(id) ON DELETE CASCADE,
    value DECIMAL(15,4) NOT NULL,
    valuation_date DATE NOT NULL
);

-- Assets
CREATE TABLE t_asset (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    type VARCHAR(50),
    purchase_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    currency VARCHAR(3) REFERENCES currencies(code),
    purchase_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange Rates
CREATE TABLE t_exchange_rate (
    from_currency VARCHAR(3) REFERENCES currencies(code),
    to_currency VARCHAR(3) REFERENCES currencies(code),
    rate DECIMAL(18,8),
    rate_date DATE,
    PRIMARY KEY (from_currency, to_currency, rate_date)
);
