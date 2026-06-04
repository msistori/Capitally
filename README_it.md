# Capitally

Capitally e una web application per gestire finanze personali: conti, transazioni, trasferimenti, movimenti ricorrenti, andamento del saldo e riepiloghi dashboard multi-valuta.

Lingue: [English](README.md) | [Italiano](README_it.md)

## Ambito attuale

- Login, registrazione, profilo utente corrente e gestione password con JWT.
- Gestione conti con saldo iniziale, valuta, icona e inclusione nel saldo totale.
- Categorie di entrata e uscita associate al singolo utente.
- Transazioni con tipo, categoria, ricorrenza e controlli di proprieta del conto.
- Trasferimenti interni rappresentati da transazioni accoppiate tramite transfer group id.
- Dashboard con saldi, trend, riepiloghi mensili, breakdown e prossimi movimenti ricorrenti.
- Import/export CSV per transazioni, trasferimenti e saldi iniziali dei conti.
- Supporto a dati demo/guest per uso locale.
- Analytics opzionali con PostHog solo dopo consenso.
- Recupero password opzionale tramite email Resend.

## Architettura

| Area | Stack |
| --- | --- |
| Frontend | Angular 17, Angular Material, ngx-translate, Chart.js |
| Backend | Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA |
| Database | PostgreSQL |
| Runtime | Docker Compose, frontend Nginx proxy, API Spring Boot |
| Servizi esterni | PostHog, Resend |

A runtime, il frontend e servito da Nginx e inoltra le chiamate API al backend Spring Boot. Il backend salva i dati in PostgreSQL e protegge le rotte non pubbliche con autenticazione JWT stateless.

## Documentazione

- [Panoramica tecnica](docs/technical-overview.md)
- [Backend](docs/backend.md)
- [Frontend](docs/frontend.md)
- [Database](docs/database.md)
- [Servizi esterni](docs/external-services.md)
- [Sicurezza](docs/security.md)

## Prerequisiti

- Docker e Docker Compose per il setup locale consigliato.
- Java 21 e Maven se si avvia il backend fuori da Docker.
- Node.js LTS e npm se si avvia il frontend fuori da Docker.
- PostgreSQL 16 o compatibile.

## Avvio rapido con Docker

1. Copia il file di esempio delle variabili ambiente.

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Aggiorna i segreti in `.env`, in particolare `JWT_SECRET`, `POSTGRES_PASSWORD`, `DEMO_PASSWORD` e `ADMIN_PASSWORD`.

3. Avvia lo stack.

```bash
docker compose up --build
```

URL locali di default:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:8080`
- OpenAPI/Swagger: `http://localhost:8080/index.html`

## Sviluppo locale

Backend:

```bash
cd backend/capitally-backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm start
```

L'ambiente frontend locale usa `apiBase: '/api'` e `proxy.conf.json` per inoltrare le API al backend.

## Script database

Gli script database si trovano in [database](database):

- `schema_capitally.sql`: schema PostgreSQL pulito e corrente.
- `trigger_capitally.sql`: helper per il trigger `updated_at`.
- `view_schema_capitally.sql`: vista per il report mensile transazioni.
- `align_core_schema_current.sql`: helper idempotente per vecchi schemi locali.
- `seed_guest_demo_data.sql`: dataset demo per l'utente con id `1`.

L'applicazione puo anche evolvere lo schema tramite Hibernate quando `SPRING_JPA_HIBERNATE_DDL_AUTO=update` e attivo, ma gli script SQL restano allineati al modello entity corrente.

## Configurazione

Le principali variabili ambiente sono documentate in [.env.example](.env.example). In produzione sono necessari:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`

Integrazioni opzionali:

- `POSTHOG_API_KEY`, `POSTHOG_HOST`, `POSTHOG_FRONTEND_ENABLED`, `POSTHOG_SERVER_ENABLED`, `POSTHOG_SESSION_REPLAY_ENABLED`
- `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_HOST`, `RESEND_FORGOT_PASSWORD_DAILY_LIMIT`, `RESEND_FORGOT_PASSWORD_MONTHLY_LIMIT`

## Validazione

Il repository contiene scaffolding di test, ma le istruzioni di progetto indicano di non lanciare comandi di test perche non sono implementati. Per modifiche al codice, usare build o compile check dove applicabile.
