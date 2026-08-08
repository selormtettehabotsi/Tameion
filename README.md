# Tameion — Automated Library Management System

A full-stack library management system built for KNUST. Session-based Express + PostgreSQL backend, React + TypeScript + Tailwind frontend, fully Dockerized with CI/CD.

## Features

**Patron facing**
- Book search with filters (genre, branch, availability) and pagination
- Reservation system with 7-day expiry
- Loan history and due-date tracking
- Fine balance and payment history
- Email verification and password reset
- Dark mode and mobile-responsive UI

**Staff / Admin**
- Dashboard with aggregate stats (loans, fines, overdue counts)
- Book CRUD with shelf location and branch assignment
- Member management (view, edit, suspend)
- Loan checkout and return with automatic fine calculation
- Reservation management (fulfill, expire)
- Staff account management (librarian / admin roles)
- Bulk operations (CSV import/export for books and members)
- Audit log of all staff actions
- Reports and analytics

**Security**
- CSRF protection on all state-changing routes
- Rate limiting (global + auth-specific)
- Input validation with Zod schemas
- SQL injection prevention (parameterized queries, ILIKE wildcard escaping)
- Session-based auth with secure cookie settings
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)

**Infrastructure**
- Production Docker setup with nginx reverse proxy
- GitHub Actions CI (lint → typecheck → test → docker build)
- Structured logging with pino
- Database migrations (node-pg-migrate)
- Scheduled jobs (overdue detection, reservation expiry)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Express, PostgreSQL, express-session, Zod, pino |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Infrastructure | Docker, nginx, GitHub Actions |
| Testing | Jest, supertest |

## Quick Start (Docker — Development)

```bash
docker compose up --build
```

- Client: **http://localhost:5173**
- Server API: **http://localhost:5000**
- PostgreSQL: **localhost:5432** (user: `postgres`, password: `postgres`, db: `alms`)

```bash
docker compose down      # stop
docker compose down -v   # stop + wipe database
```

## Production Deployment

```bash
cp server/.env.example server/.env
# Edit server/.env — set DATABASE_URL, SESSION_SECRET, SMTP credentials

docker compose -f docker-compose.prod.yml up --build -d
```

The production stack serves the client via nginx on port 80 (configurable with `APP_PORT`), proxies `/api/` to the Express server, and runs PostgreSQL with a persistent volume.

Required environment variables for production:
- `POSTGRES_PASSWORD` — database password (must be set in `.env`)
- `SESSION_SECRET` — random 64+ character hex string
- Optional: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` for email delivery

## Manual Setup (without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 14+

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE alms;"
psql -U postgres -d alms -f server/src/db/schema.sql
psql -U postgres -d alms -f server/src/db/seed.sql
```

### 2. Configure and start the server

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL and SESSION_SECRET
npm install
npm run dev
```

### 3. Start the client

```bash
cd client
npm install
npm run dev
```

The client runs at **http://localhost:5173** and proxies API calls to the server on port 5000.

## Testing

```bash
cd server

# Run all tests (unit tests run; integration tests skip without DATABASE_URL)
npm test

# Unit tests only (no database needed)
npm run test:unit

# Integration tests (requires PostgreSQL)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/alms_test npm run test:integration
```

Unit tests cover middleware (auth guards, Zod validation). Integration tests cover full HTTP request cycles against a real database (auth flows, book CRUD, reservations).

## CI/CD

GitHub Actions runs on every push and PR to `main`:

1. **Lint & typecheck** — ESLint (client + server) and TypeScript compiler
2. **Test** — Jest against a PostgreSQL service container
3. **Docker build** — validates both images build successfully

## Project Structure

```
├── client/                 React + TypeScript frontend
│   ├── src/
│   │   ├── components/     Shared UI (Button, Input, Select, Modal, Navbar)
│   │   ├── pages/          Route pages (admin/, patron/)
│   │   ├── context/        AuthContext (global auth state)
│   │   └── App.tsx         Router setup
│   ├── Dockerfile          Multi-stage build → nginx
│   └── nginx.conf          SPA fallback + API proxy
├── server/                 Express API
│   ├── src/
│   │   ├── routes/         auth, patron, books, admin
│   │   ├── middleware/     auth, csrf, rateLimit, validate
│   │   ├── services/       email (nodemailer)
│   │   ├── lib/            logger (pino), audit
│   │   └── db/             pool, schema.sql, seed.sql
│   ├── tests/              Jest test suite
│   │   ├── unit/           Middleware unit tests
│   │   ├── integration/    API integration tests
│   │   └── helpers/        Test DB seeds and app factory
│   └── Dockerfile          Production image
├── docker-compose.yml      Development stack
├── docker-compose.prod.yml Production stack
└── .github/workflows/ci.yml
```

## Test Accounts (seeded)

| ID | Role | Password |
|---|---|---|
| `STU-2024001` | Student | `password123` |
| `FAC-2024010` | Faculty | `password123` |
| `LIB-001` | Librarian | `password123` |

The student account has active loans, an overdue book, a pending reservation, and a small fine balance so the dashboard shows real data immediately.
