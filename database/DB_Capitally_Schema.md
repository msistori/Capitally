
# 📦 Capitally - Schema Database

---

## 🔵 Tabelle principali

### 🧑‍💼 utenti
- `id` (PK)
- `nome`
- `email` (UNIQUE)
- `password`
- `created_at`
- `updated_at`

---

### 🏦 conti
- `id` (PK)
- `nome`
- `saldo_iniziale`
- `valuta` (FK → valute.codice)
- `categoria_conto` (es. conto corrente, conto deposito)
- `created_at`
- `updated_at`

---

### 🔗 utenti_conti
- `id_utente` (FK → utenti.id)
- `id_conto` (FK → conti.id)
- PK: (`id_utente`, `id_conto`)

---

### 🧩 categorie
- `id` (PK)
- `tipo_categoria` (Entrata/Uscita)
- `macrocategoria`
- `categoria`
- `created_at`
- `updated_at`

---

### 💳 transazioni
- `id` (PK)
- `id_utente` (FK)
- `id_conto` (FK)
- `importo`
- `valuta` (FK → valute.codice)
- `data`
- `descrizione`
- `categoria_id` (FK)
- `is_ricorrente` (BOOLEAN, nullable)
- `periodo_frequenza` (VARCHAR, nullable)
- `numero_periodi` (INTEGER, nullable)
- `data_fine_ricorrenza` (DATE, nullable)
- `created_at`
- `updated_at`

---

### 📊 budget
- `id` (PK)
- `id_utente` (FK)
- `categoria_id` (FK, nullable)
- `importo_mensile`
- `mese`
- `anno`
- `created_at`
- `updated_at`

---

### 📈 strumenti_investimento
- `id` (PK)
- `nome`
- `tipo` (ETF, Azione, Crypto...)
- `borsa`
- `simbolo`

---

### 💼 investimenti
- `id` (PK)
- `id_conto` (FK)
- `id_strumento` (FK)
- `tipo_operazione` (Acquisto/Vendita)
- `quantita`
- `prezzo_unitario`
- `commissioni`
- `valuta` (FK)
- `data_operazione`
- `created_at`
- `updated_at`

---

### 📉 valori_investimenti
- `id` (PK)
- `id_strumento` (FK)
- `valore`
- `data_aggiornamento`

---

### 🏠 beni
- `id` (PK)
- `id_utente` (FK)
- `nome`
- `tipo`
- `valore_acquisto`
- `valore_attuale`
- `valuta` (FK)
- `data_acquisto`
- `descrizione`
- `created_at`
- `updated_at`

---

### 🌍 valute
- `codice` (PK)
- `nome`

---

### 💱 cambi_valuta
- `da_valuta` (FK)
- `a_valuta` (FK)
- `tasso`
- `data`
- PK: (`da_valuta`, `a_valuta`, `data`)

---

## 🧭 Relazioni principali

- `utenti` 1:N `transazioni`, `budget`, `investimenti`, `beni`
- `utenti` N:M `conti` tramite `utenti_conti`
- `categorie` 1:N `transazioni`, `budget`
- `conti` 1:N `transazioni`
- `strumenti_investimento` 1:N `investimenti`, `valori_investimenti`
- `valute` 1:N in `conti`, `transazioni`, `investimenti`, `beni`
- `valute` 1:N `cambi_valuta`