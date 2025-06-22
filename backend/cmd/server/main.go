package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/handlers"
)

func main() {
	// Initialize services
	if err := handlers.InitializeServices(); err != nil {
		log.Fatalf("Failed to initialize services: %v", err)
	}

	// Set up graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		log.Println("Shutting down gracefully...")
		if err := handlers.CloseServices(); err != nil {
			log.Printf("Error closing services: %v", err)
		}
		os.Exit(0)
	}()

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // In production, specify your frontend domain
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check endpoint
	r.GET("/health", handlers.HealthCheck)

	// API routes
	api := r.Group("/api")
	{
		api.GET("/wordsets", handlers.GetWordSets)
		api.POST("/wordsets", handlers.CreateWordSet)
		api.DELETE("/wordsets/:id", handlers.DeleteWordSet)
		api.POST("/wordsets/:id/audio", handlers.GenerateAudio)
		api.POST("/results", handlers.SaveResult)
		api.GET("/results", handlers.GetResults)
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
