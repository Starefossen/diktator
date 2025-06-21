package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/handlers"
)

func main() {
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
