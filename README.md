# 💸 DuitFlow — Expense Manager

A full-stack personal finance manager built with **Next.js 15**, **React 19**, **Go (Chi)**, **Neon (PostgreSQL)**, and **Firebase Auth**.

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
    ├── lib/                    # API client, Firebase client, utils
    └── types/                  # TypeScript interfaces
```

---

## ✨ Features

- 🔐 **Auth** — Firebase Auth (email/password + Google), RS256 JWT verification in Go
- 📊 **Dashboard** — income vs expenses area chart, category donut chart, 6 stat cards (all-time + monthly balance)
- 💳 **Expenses** — paginated table, create/edit/delete, filter by category, search, tag support
- 💰 **Income** — track earnings by source (Salary, Freelance, Business, etc.)
- 🏷️ **Categories** — emoji + color picker, per-user with seeded defaults on first register
- 🌙 **Dark theme** — custom CSS variable design system
- 🏗️ **Clean Architecture** — Go backend with domain/handler/service/repository layers

---

## 🛠️ Tech Stack

| Layer    | Tech                                     |
| -------- | ---------------------------------------- |
| Frontend | Next.js 15, React 19, Tailwind CSS 4     |
| Backend  | Go 1.23, Chi router, golang-jwt          |
| Database | Neon (PostgreSQL via pgx/v5)             |
| Auth     | Firebase Auth (RS256 JWT)                |
| Charts   | Recharts                                 |
| Icons    | Lucide React                             |

---

## 🚀 Quick Start (Local)

### 1. Neon Setup

1. Create a project at [neon.tech](https://neon.tech)
2. Go to **SQL Editor** and run migrations **in order**:
   ```
   migrations/001_initial_schema.sql
   migrations/007_neon_user_id.sql
   ```
3. Copy the **Connection string** (pooler) → `DATABASE_URL`

---

### 2. Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Go to **Authentication → Sign-in method** and enable:
   - **Email/Password**
   - **Google**
3. Go to **Project Settings → General → Your apps** → Add a **Web app**
4. Copy the config values:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID` / `FIREBASE_PROJECT_ID`
5. Go to **Authentication → Settings → Authorized domains** and add your Vercel domain

---

### 3. Backend (Go)

```bash
cd backend
cp .env.example .env
# Fill in your values

go mod tidy
go run ./cmd/api/main.go
# → 🚀 Server running on http://localhost:8080
```

**`backend/.env`**

```env
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require&channel_binding=require
FIREBASE_PROJECT_ID=your-firebase-project-id
PORT=8080
FRONTEND_URL=http://localhost:3000
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
MIDTRANS_ENV=sandbox
```

**Requirements:** Go 1.23+

---

### 4. Frontend (Next.js)

```bash
cd frontend
cp .env.example .env
# Fill in your values

npm install
npm run dev
# → App running on http://localhost:3000
```

**`frontend/.env`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=...
NEXT_PUBLIC_MIDTRANS_ENV=sandbox
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
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   ```
5. Deploy → copy your Vercel URL
6. Add the Vercel URL to **Firebase → Authentication → Settings → Authorized domains**

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
   FIREBASE_PROJECT_ID=your-project-id
   PORT=8080
   FRONTEND_URL=https://your-app.vercel.app
   MIDTRANS_SERVER_KEY=...
   MIDTRANS_CLIENT_KEY=...
   MIDTRANS_ENV=sandbox
   ```
4. Deploy → copy your Render URL
5. Update `NEXT_PUBLIC_API_URL` in Vercel to your Render URL → Redeploy

---

## 🌐 API Reference

Base URL: `http://localhost:8080/api/v1`

> All endpoints require `Authorization: Bearer <firebase-id-token>` header.

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

| Method | Path               | Description                                    |
| ------ | ------------------ | ---------------------------------------------- |
| GET    | `/categories`      | List (current user only)                       |
| POST   | `/categories`      | Create                                         |
| POST   | `/categories/seed` | Seed 10 defaults (skips if user already has any) |
| GET    | `/categories/:id`  | Get by ID                                      |
| PUT    | `/categories/:id`  | Update                                         |
| DELETE | `/categories/:id`  | Delete                                         |

### Subscription

| Method | Path                          | Description                        |
| ------ | ----------------------------- | ---------------------------------- |
| GET    | `/subscription/status`        | Get current user's plan            |
| POST   | `/subscription/create-payment`| Create Midtrans Snap transaction   |
| POST   | `/subscription/verify`        | Verify payment after redirect      |
| POST   | `/subscription/webhook`       | Midtrans webhook (no auth required)|
