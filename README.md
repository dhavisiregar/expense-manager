# 💸 DuitFlow — Expense Manager

A full-stack personal finance manager built with **Next.js 15**, **React 19**, **Tailwind CSS 4**, **Go (Chi)**, and **Supabase (PostgreSQL)**.

---

## 📁 Project Structure

```
expense-manager/
├── backend/                    # Go REST API (Clean Architecture)
│   ├── cmd/api/                # Entry point
│   ├── internal/
│   │   ├── domain/             # Models + repository interfaces
│   │   ├── handler/            # HTTP handlers (expense, income, category)
│   │   ├── middleware/         # JWT auth, logger, recover
│   │   ├── service/            # Business logic + validation
│   │   └── repository/        # PostgreSQL queries (pgx)
│   ├── pkg/
│   │   ├── database/           # pgx connection pool
│   │   └── response/           # JSON response helpers
│   └── migrations/             # SQL schema (run in order)
└── frontend/                   # Next.js 15 app
    ├── app/
    │   ├── auth/               # Login + Register page
    │   ├── dashboard/          # Overview with charts
    │   ├── expenses/           # Expense CRUD
    │   ├── income/             # Income CRUD
    │   └── categories/         # Category CRUD
    ├── components/
    │   ├── ui/                 # Shared UI (Button, Modal, Toast, etc.)
    │   └── layout/             # Sidebar, AppShell
    ├── hooks/                  # useExpenses, useCategories
    ├── lib/                    # API client, Supabase client, utils
    └── types/                  # TypeScript interfaces
```

---

## ✨ Features

- 🔐 **Auth** — Supabase Auth (email/password), JWT verification in Go, per-user Row Level Security
- 📊 **Dashboard** — income vs expenses area chart, category donut chart, 6 stat cards (all-time + monthly balance)
- 💳 **Expenses** — paginated table, create/edit/delete, filter by category, search, tag support
- 💰 **Income** — track earnings by source (Salary, Freelance, Business, etc.)
- 🏷️ **Categories** — emoji + color picker, per-user with seeded defaults on first login
- 🌙 **Dark theme** — custom CSS variable design system
- 🏗️ **Clean Architecture** — Go backend with domain/handler/service/repository layers

---

## 🛠️ Tech Stack

| Layer    | Tech                                  |
| -------- | ------------------------------------- |
| Frontend | Next.js 15, React 19, Tailwind CSS 4  |
| Backend  | Go 1.23, Chi router, golang-jwt       |
| Database | Supabase (PostgreSQL via pgx/v5), RLS |
| Auth     | Supabase Auth (ES256 / HS256 JWT)     |
| Charts   | Recharts                              |
| Icons    | Lucide React                          |

---

## 🚀 Quick Start (Local)

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run migrations **in order**:
   ```
   migrations/001_initial_schema.sql
   migrations/002_views_and_functions.sql
   migrations/003_fix_icon_emojis.sql
   migrations/004_income.sql
   migrations/005_multi_user_rls.sql
   ```
3. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Go to **Settings → JWT Keys** and copy the **JWT Secret** (Legacy tab) → `SUPABASE_JWT_SECRET`

---

### 2. Backend (Go)

```bash
cd backend
cp .env.example .env
# Fill in your values (see .env.example)

go mod tidy
go run ./cmd/api/main.go
# → 🚀 Server running on http://localhost:8080
```

**`backend/.env`**

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_JWT_SECRET=your-legacy-jwt-secret   # only needed for HS256
PORT=8080
FRONTEND_URL=http://localhost:3000
```

**Requirements:** Go 1.23+

---

### 3. Frontend (Next.js)

```bash
cd frontend
cp .env.local.example .env.local
# Fill in your values

npm install
npm run dev
# → App running on http://localhost:3000
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://[REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Requirements:** Node.js 20+

---

## 🌍 Deployment

### Frontend → Vercel

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com/api/v1
   NEXT_PUBLIC_SUPABASE_URL=https://[REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Deploy → get your Vercel URL

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service → Connect repo
2. Configure:
   | Field | Value |
   |---|---|
   | Root Directory | `backend` |
   | Runtime | `Go` |
   | Build Command | `go build -o bin/api ./cmd/api/main.go` |
   | Start Command | `./bin/api` |
3. Add environment variables:
   ```
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://[REF].supabase.co
   SUPABASE_JWT_SECRET=...
   PORT=8080
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Deploy → get your Render URL
5. Go back to Vercel and update `NEXT_PUBLIC_API_URL` to your Render URL → Redeploy

### Supabase Auth (important)

Go to **Authentication → URL Configuration** and add your Vercel URL to **Redirect URLs**:

```
https://your-app.vercel.app
```

---

## 🌐 API Reference

Base URL: `http://localhost:8080/api/v1`

> All endpoints require `Authorization: Bearer <token>` header.

### Expenses

| Method | Path                  | Description                                                                  |
| ------ | --------------------- | ---------------------------------------------------------------------------- |
| GET    | `/expenses`           | List (supports `page`, `page_size`, `category_id`, `start_date`, `end_date`) |
| POST   | `/expenses`           | Create                                                                       |
| GET    | `/expenses/:id`       | Get by ID                                                                    |
| PUT    | `/expenses/:id`       | Update                                                                       |
| DELETE | `/expenses/:id`       | Delete                                                                       |
| GET    | `/expenses/dashboard` | Dashboard summary                                                            |

### Income

| Method | Path           | Description                                                   |
| ------ | -------------- | ------------------------------------------------------------- |
| GET    | `/incomes`     | List (supports `page`, `page_size`, `start_date`, `end_date`) |
| POST   | `/incomes`     | Create                                                        |
| GET    | `/incomes/:id` | Get by ID                                                     |
| PUT    | `/incomes/:id` | Update                                                        |
| DELETE | `/incomes/:id` | Delete                                                        |

### Categories

| Method | Path               | Description                               |
| ------ | ------------------ | ----------------------------------------- |
| GET    | `/categories`      | List (current user only)                  |
| POST   | `/categories`      | Create                                    |
| POST   | `/categories/seed` | Seed 10 defaults (skips if already exist) |
| GET    | `/categories/:id`  | Get by ID                                 |
| PUT    | `/categories/:id`  | Update                                    |
| DELETE | `/categories/:id`  | Delete                                    |
