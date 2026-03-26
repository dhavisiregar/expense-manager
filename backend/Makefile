.PHONY: run build tidy migrate lint

run:
	go run ./cmd/api/main.go

build:
	go build -o bin/api ./cmd/api/main.go

tidy:
	go mod tidy

lint:
	golangci-lint run ./...

migrate:
	@echo "Run migrations/001_initial_schema.sql in your Supabase SQL Editor"
	@echo "or use psql:"
	@echo "  psql \$$DATABASE_URL -f migrations/001_initial_schema.sql"

test:
	go test ./... -v