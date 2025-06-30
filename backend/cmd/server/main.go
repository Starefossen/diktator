// Package main provides the Diktator API server
//
//	@title			Diktator API
//	@version		1.0
//	@description	A family-friendly spelling test application API
//	@termsOfService	http://swagger.io/terms/
//
//	@contact.name	Diktator Support
//	@contact.url	https://github.com/starefossen/diktator
//	@contact.email	support@diktator.app
//
//	@license.name	MIT
//	@license.url	https://github.com/starefossen/diktator/blob/main/LICENSE
//
//	@host		localhost:8080
//	@BasePath	/api
//
//	@securityDefinitions.apikey	BearerAuth
//	@in							header
//	@name						Authorization
//	@description				Firebase JWT token. Format: "Bearer {token}"
//
//	@tag.name		health
//	@tag.description	Health check endpoints
//
//	@tag.name		users
//	@tag.description	User management operations
//
//	@tag.name		families
//	@tag.description	Family management operations
//
//	@tag.name		children
//	@tag.description	Child account management (parent only)
//
//	@tag.name		wordsets
//	@tag.description	Word set management operations
//
//	@tag.name		results
//	@tag.description	Test result operations
//
//	@schemes	http https
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
	"github.com/starefossen/diktator/backend/internal/middleware"
	"github.com/starefossen/diktator/backend/internal/services"

	_ "github.com/starefossen/diktator/backend/docs" // Import generated docs
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Initialize services
	serviceManager, err := services.NewManager()
	if err != nil {
		log.Fatalf("Failed to initialize services: %v", err)
	}

	// Initialize handlers with the service manager
	err = handlers.InitializeServices(serviceManager)
	if err != nil {
		log.Fatalf("Failed to initialize handlers: %v", err)
	}

	// Set up graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		log.Println("Shutting down gracefully...")
		if err := serviceManager.Close(); err != nil {
			log.Printf("Error closing services: %v", err)
		}
		os.Exit(0)
	}()

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Set GIN mode based on environment
	if os.Getenv("GIN_MODE") == "release" || os.Getenv("TEST_MODE") == "1" {
		gin.SetMode(gin.ReleaseMode)
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

	// Health check endpoint (public)
	r.GET("/health", handlers.HealthCheck)

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Truly public audio streaming (no auth required for browser playback)
	r.GET("/api/wordsets/:id/audio/:audioId", handlers.StreamAudioByID)

	// API routes
	api := r.Group("/api")
	{
		// Public routes - use BasicAuthMiddleware for Firebase token validation
		public := api.Group("")
		public.Use(middleware.BasicAuthMiddleware(serviceManager))
		{
			public.POST("/users", handlers.CreateUser)
			public.GET("/users/profile", handlers.GetUserProfile)
		}

		// Protected routes - require authentication
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(serviceManager))
		protected.Use(middleware.RequireFamilyAccess())
		{
			// Word sets
			wordsets := protected.Group("/wordsets")
			wordsets.Use(middleware.RequireWordSetAccess(serviceManager))
			{
				wordsets.GET("", handlers.GetWordSets)
				wordsets.POST("", handlers.CreateWordSet)
				wordsets.PUT("/:id", handlers.UpdateWordSet)
				wordsets.DELETE("/:id", handlers.DeleteWordSet)
				wordsets.POST("/:id/generate-audio", handlers.GenerateAudio)
				wordsets.GET("/voices", handlers.ListVoices)
			}

			// User-specific test results
			users := protected.Group("/users")
			{
				users.POST("/results", handlers.SaveResult)
				users.GET("/results", handlers.GetResults)
			}

			// Family management - RESTRICTED: Parent access only for most endpoints
			families := protected.Group("/families")
			families.Use(middleware.RequireParentRole())
			{
				families.GET("", handlers.GetFamily)
				families.GET("/stats", handlers.GetFamilyStats)
				families.GET("/results", handlers.GetFamilyResults)

				// Parent-only routes
				parentOnly := families.Group("")
				parentOnly.Use(middleware.RequireParentRole())
				{
					parentOnly.GET("/children", handlers.GetFamilyChildren)
					parentOnly.GET("/progress", handlers.GetFamilyProgress)
					parentOnly.POST("/children", handlers.CreateChildAccount)

					// Child-specific routes (with ownership verification)
					childRoutes := parentOnly.Group("/children/:childId")
					childRoutes.Use(middleware.RequireChildOwnership(serviceManager))
					{
						childRoutes.PUT("", handlers.UpdateChildAccount)
						childRoutes.DELETE("", handlers.DeleteChildAccount)
						childRoutes.GET("/progress", handlers.GetChildProgress)
						childRoutes.GET("/results", handlers.GetChildResults)
					}
				}
			}
		}
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
