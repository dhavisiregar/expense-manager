package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dhavisiregar/expense-manager/internal/handler"
	"github.com/dhavisiregar/expense-manager/internal/repository"
	"github.com/dhavisiregar/expense-manager/internal/service"
	"github.com/dhavisiregar/expense-manager/pkg/database"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	ctx := context.Background()
	db, err := database.NewPool(ctx)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	log.Println("✅ Connected to Supabase PostgreSQL")

	// Repos
	expenseRepo := repository.NewExpenseRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	incomeRepo := repository.NewIncomeRepository(db)

	// Services
	expenseSvc := service.NewExpenseService(expenseRepo)
	categorySvc := service.NewCategoryService(categoryRepo)
	incomeSvc := service.NewIncomeService(incomeRepo)

	// Handlers
	expenseHandler := handler.NewExpenseHandler(expenseSvc)
	categoryHandler := handler.NewCategoryHandler(categorySvc)
	incomeHandler := handler.NewIncomeHandler(incomeSvc)

	// Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{os.Getenv("FRONTEND_URL"), "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/expenses", expenseHandler.Routes())
		r.Route("/categories", categoryHandler.Routes())
		r.Route("/incomes", incomeHandler.Routes())
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, `{"status":"ok"}`)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server running on http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}