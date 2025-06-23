package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services"
)

// AuthMiddleware validates Firebase JWT tokens and sets user context
func AuthMiddleware(serviceManager *services.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set service manager in context for handlers to use
		c.Set("serviceManager", serviceManager)

		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Authorization header required",
			})
			c.Abort()
			return
		}

		// Check Bearer prefix
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		// Extract token
		idToken := strings.TrimPrefix(authHeader, "Bearer ")
		if idToken == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Token not provided",
			})
			c.Abort()
			return
		}

		// Verify Firebase token
		token, err := serviceManager.Auth.VerifyIDToken(context.Background(), idToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Get user from database using Firebase UID
		user, err := serviceManager.Firestore.GetUserByFirebaseUID(token.UID)
		if err != nil {
			// If user doesn't exist in our database but has valid Firebase token,
			// we might want to create them automatically or return an error
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: fmt.Sprintf("User not found in system: %s", token.UID),
			})
			c.Abort()
			return
		}

		// Check if user is active
		if !user.IsActive {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Error: "Account is inactive",
			})
			c.Abort()
			return
		}

		// Set user information in context
		c.Set("userID", user.ID)
		c.Set("user", user)
		c.Set("firebaseUID", token.UID)
		c.Set("familyID", user.FamilyID)
		c.Set("userRole", user.Role)

		c.Next()
	}
}

// BasicAuthMiddleware validates Firebase JWT tokens but doesn't require user existence in database
// This is used for user registration endpoints
func BasicAuthMiddleware(serviceManager *services.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set service manager in context for handlers to use
		c.Set("serviceManager", serviceManager)

		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Authorization header required",
			})
			c.Abort()
			return
		}

		// Check Bearer prefix
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		// Extract token
		idToken := strings.TrimPrefix(authHeader, "Bearer ")
		if idToken == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Token not provided",
			})
			c.Abort()
			return
		}

		// Verify Firebase token
		token, err := serviceManager.Auth.VerifyIDToken(context.Background(), idToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Set Firebase information in context (user might not exist in our DB yet)
		c.Set("firebaseUID", token.UID)
		c.Set("firebaseToken", token)

		// Try to get user from database (optional for these endpoints)
		user, err := serviceManager.Firestore.GetUserByFirebaseUID(token.UID)
		if err == nil {
			// User exists, set additional context
			c.Set("userID", user.ID)
			c.Set("user", user)
			c.Set("familyID", user.FamilyID)
			c.Set("userRole", user.Role)
		}
		// If user doesn't exist, that's fine for registration endpoints

		c.Next()
	}
}

// RequireRole middleware ensures user has required role
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Authentication required",
			})
			c.Abort()
			return
		}

		userRoleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Error: "Invalid user role",
			})
			c.Abort()
			return
		}

		// Check if user has one of the required roles
		for _, role := range roles {
			if userRoleStr == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, models.APIResponse{
			Error: fmt.Sprintf("Access denied: requires one of roles: %v", roles),
		})
		c.Abort()
	}
}

// RequireParentRole ensures only parents can access the endpoint
func RequireParentRole() gin.HandlerFunc {
	return RequireRole("parent", "admin")
}

// RequireFamilyAccess ensures user can only access resources within their family
func RequireFamilyAccess() gin.HandlerFunc {
	return func(c *gin.Context) {
		userFamilyID, exists := c.Get("familyID")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Authentication required",
			})
			c.Abort()
			return
		}

		userFamilyIDStr, ok := userFamilyID.(string)
		if !ok || userFamilyIDStr == "" {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Error: "User is not part of a family",
			})
			c.Abort()
			return
		}

		// Store the validated family ID for use in handlers
		c.Set("validatedFamilyID", userFamilyIDStr)
		c.Next()
	}
}

// RequireChildOwnership ensures parent can only access their own children
func RequireChildOwnership(serviceManager *services.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Authentication required",
			})
			c.Abort()
			return
		}

		userIDStr, ok := userID.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Error: "Invalid user ID",
			})
			c.Abort()
			return
		}

		childID := c.Param("childId")
		if childID == "" {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Error: "childId is required",
			})
			c.Abort()
			return
		}

		// Verify that the user is the parent of this child
		if err := serviceManager.Firestore.VerifyChildOwnership(userIDStr, childID); err != nil {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Error: "Access denied: You can only access your own children",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireWordSetAccess ensures user can only access word sets within their family
func RequireWordSetAccess(serviceManager *services.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userFamilyID, exists := c.Get("validatedFamilyID")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Family access validation required",
			})
			c.Abort()
			return
		}

		userFamilyIDStr, ok := userFamilyID.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Error: "Invalid family ID",
			})
			c.Abort()
			return
		}

		wordSetID := c.Param("id")
		if wordSetID != "" {
			// Verify word set belongs to user's family
			if err := serviceManager.Firestore.VerifyWordSetAccess(userFamilyIDStr, wordSetID); err != nil {
				c.JSON(http.StatusForbidden, models.APIResponse{
					Error: "Access denied: Word set not found or not accessible",
				})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
