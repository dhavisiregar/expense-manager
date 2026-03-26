.PHONY: dev dev-backend dev-frontend build docker-up docker-down migrate

## Run both services in parallel (requires GNU make 4+)
dev:
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	cd backend && go run ./cmd/api/main.go

dev-frontend:
	cd frontend && npm run dev

## Build
build-backend:
	cd backend && go build -o bin/api ./cmd/api/main.go

build-frontend:
	cd frontend && npm run build

## Docker
docker-up:
	docker compose up --build

docker-down:
	docker compose down

## DB
migrate:
	@echo "Running migrations against Supabase..."
	@psql "$(DATABASE_URL)" -f backend/migrations/001_initial_schema.sql
	@psql "$(DATABASE_URL)" -f backend/migrations/002_views_and_functions.sql
	@echo "Migrations complete."

## Setup
setup:
	cd backend && go mod tidy
	cd frontend && npm install
	@echo ""
	@echo "✅ Setup complete!"
	@echo "   1. Copy backend/.env.example → backend/.env and fill in DATABASE_URL"
	@echo "   2. Copy frontend/.env.local.example → frontend/.env.local"
	@echo "   3. Run: make dev"