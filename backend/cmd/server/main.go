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
//	@description				OIDC JWT token. Format: "Bearer {token}"
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
	"strings"
	"syscall"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/handlers"
	"github.com/starefossen/diktator/backend/internal/migrate"
	"github.com/starefossen/diktator/backend/internal/middleware"
	"github.com/starefossen/diktator/backend/internal/services"

	_ "github.com/starefossen/diktator/backend/docs" // Import generated docs
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Log startup immediately
	log.Println("=== Diktator API Server Starting ===")
	log.Printf("AUTH_MODE: %s", os.Getenv("AUTH_MODE"))
	log.Printf("DATABASE_URL: %s", maskPassword(os.Getenv("DATABASE_URL")))
	log.Printf("GIN_MODE: %s", os.Getenv("GIN_MODE"))
	log.Printf("OIDC_ISSUER_URL: %s", os.Getenv("OIDC_ISSUER_URL"))
	log.Printf("OIDC_AUDIENCE: %s", os.Getenv("OIDC_AUDIENCE"))

	// Run database migrations before starting services
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	if err := migrate.Run(databaseURL); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	// Initialize services
	log.Println("Initializing services...")
	serviceManager, err := services.NewManager()
	if err != nil {
		log.Fatalf("Failed to initialize services: %v", err)
	}

	// Initialize handlers with the service manager
	log.Println("Initializing handlers...")
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

	// On-demand streaming for word audio (public, cached by browser, no auth required)
	r.GET("/api/wordsets/:id/words/:word/audio", handlers.StreamWordAudio)

	// API routes
	api := r.Group("/api")
	{
		// Public routes - use BasicAuthMiddleware for OIDC token validation
		public := api.Group("")
		public.Use(middleware.OIDCBasicAuthMiddleware(serviceManager.AuthValidator))
		{
			public.POST("/users", handlers.CreateUser)
			public.GET("/users/profile", handlers.GetUserProfile)
		}

		// Protected routes - require authentication
		protected := api.Group("")
		protected.Use(middleware.OIDCAuthMiddleware(serviceManager.AuthValidator, serviceManager.DB))
		protected.Use(middleware.RequireFamilyAccess())
		{
			// Word sets
			wordsets := protected.Group("/wordsets")
			wordsets.Use(middleware.RequireWordSetAccess(serviceManager.DB))
			{
				wordsets.GET("", handlers.GetWordSets)
				wordsets.POST("", handlers.CreateWordSet)
				wordsets.PUT("/:id", handlers.UpdateWordSet)
				wordsets.DELETE("/:id", handlers.DeleteWordSet)
				wordsets.GET("/voices", handlers.ListVoices)
			}

			// User-specific test results
			users := protected.Group("/users")
			{
				users.POST("/results", handlers.SaveResult)
				users.GET("/results", handlers.GetResults)
			}

			// Invitation endpoints (available to any authenticated user)
			invitations := protected.Group("/invitations")
			{
				invitations.GET("/pending", handlers.GetPendingInvitations)
				invitations.POST("/:invitationId/accept", handlers.AcceptInvitation)
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
					parentOnly.POST("/members", handlers.AddFamilyMember)
					parentOnly.GET("/invitations", handlers.GetFamilyInvitations)
				parentOnly.DELETE("/invitations/:invitationId", handlers.DeleteFamilyInvitation)
				parentOnly.DELETE("/members/:userId", handlers.RemoveFamilyMember)

				// Child-specific routes (with ownership verification)
				childRoutes := parentOnly.Group("/children/:childId")
				childRoutes.Use(middleware.RequireChildOwnership(serviceManager.DB))
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

// maskPassword masks the password in a database URL for logging
func maskPassword(dsn string) string {
	if dsn == "" {
		return "<empty>"
	}
	// Simple masking: postgresql://user:PASSWORD@host/db -> postgresql://user:***@host/db
	if idx := strings.Index(dsn, "://"); idx != -1 {
		if idx2 := strings.Index(dsn[idx+3:], ":"); idx2 != -1 {
			if idx3 := strings.Index(dsn[idx+3+idx2:], "@"); idx3 != -1 {
				return dsn[:idx+3+idx2+1] + "***" + dsn[idx+3+idx2+idx3:]
			}
		}
	}
	return dsn
}
