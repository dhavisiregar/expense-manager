# 💸 DuitFlow — Expense Manager

A full-stack expense manager built with **Next.js 15**, **React 19**, **Tailwind CSS 4**, **Go (Chi)**, and **Supabase (PostgreSQL)**.

---

## 📁 Project Structure

```
expense-manager/
├── backend/          # Go REST API (Clean Architecture)
│   ├── cmd/api/      # Entry point
│   ├── internal/
│   │   ├── domain/       # Models + interfaces
│   │   ├── handler/      # HTTP handlers
│   │   ├── service/      # Business logic
│   │   └── repository/   # DB queries
│   ├── pkg/
│   │   ├── database/     # pgx pool
│   │   └── response/     # JSON helpers
│   └── migrations/   # SQL schema
└── frontend/         # Next.js 15 app
    ├── app/
    │   ├── dashboard/
    │   ├── expenses/
    │   └── categories/
    ├── components/
    │   ├── ui/           # Shared UI components
    │   └── layout/       # Sidebar
    ├── lib/              # API client + utils
    └── types/            # TypeScript interfaces
```

---

## 🚀 Quick Start

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **SQL Editor** and run the migration file:
   ```
   backend/migrations/001_initial_schema.sql
   ```
3. Copy your **Connection String** from: Project Settings → Database → Connection string (URI mode)

---

### 2. Backend (Go)

```bash
cd backend

# Copy and fill in your env
cp .env.example .env
# Edit .env: set DATABASE_URL to your Supabase connection string

# Install dependencies
go mod tidy

# Run the server
go run ./cmd/api/main.go
# → Server running on http://localhost:8080
```

**Requirements:** Go 1.23+

---

### 3. Frontend (Next.js)

```bash
cd frontend

# Copy env
cp .env.local.example .env.local
# Edit if your backend runs on a different port

# Install dependencies
npm install

# Run dev server
npm run dev
# → App running on http://localhost:3000
```

**Requirements:** Node.js 20+

---

## 🌐 API Reference

Base URL: `http://localhost:8080/api/v1`

### Expenses

| Method | Path                  | Description                                                                           |
| ------ | --------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/expenses`           | List expenses (supports `page`, `page_size`, `category_id`, `start_date`, `end_date`) |
| POST   | `/expenses`           | Create expense                                                                        |
| GET    | `/expenses/:id`       | Get expense by ID                                                                     |
| PUT    | `/expenses/:id`       | Update expense                                                                        |
| DELETE | `/expenses/:id`       | Delete expense                                                                        |
| GET    | `/expenses/dashboard` | Dashboard summary                                                                     |

### Categories

| Method | Path              | Description     |
| ------ | ----------------- | --------------- |
| GET    | `/categories`     | List categories |
| POST   | `/categories`     | Create category |
| GET    | `/categories/:id` | Get by ID       |
| PUT    | `/categories/:id` | Update          |
| DELETE | `/categories/:id` | Delete          |

---

## ✨ Features

- 📊 **Dashboard** — monthly trend area chart, category donut chart, stat cards, recent expenses
- 💳 **Expenses** — paginated table, create/edit/delete, filter by category, search by title, tag support
- 🏷️ **Categories** — color + emoji picker, card grid view, full CRUD
- 🌙 **Dark theme** — custom CSS variable design system
- 🔌 **Clean Architecture** — Go backend with domain/handler/service/repository separation

---

## 🛠️ Tech Stack

| Layer    | Tech                                 |
| -------- | ------------------------------------ |
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend  | Go 1.23, Chi router                  |
| Database | Supabase (PostgreSQL via pgx/v5)     |
| Charts   | Recharts                             |
| Icons    | Lucide React                         |
