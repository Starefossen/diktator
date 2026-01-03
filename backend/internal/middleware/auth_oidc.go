package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/auth"
	"github.com/starefossen/diktator/backend/internal/services/db"
)

// OIDCAuthMiddleware validates JWT tokens via OIDC (or mock) and sets user context
func OIDCAuthMiddleware(validator auth.SessionValidator, repo db.Repository) gin.HandlerFunc {
	return func(c *gin.Context) {
		identity, err := extractAndValidateToken(c, validator)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: err.Error(),
			})
			c.Abort()
			return
		}

		// Get user from database using identity ID (subject from JWT)
		user, err := repo.GetUserByAuthID(identity.ID)
		if err != nil {
			if err == db.ErrUserNotFound {
				c.JSON(http.StatusNotFound, models.APIResponse{
					Error: "User not found in system. Please complete registration.",
					Data: map[string]any{
						"needsRegistration": true,
					},
				})
				c.Abort()
				return
			}

			log.Printf("[AUTH] Failed to lookup user authID=%s method=%s path=%s: %v", identity.ID, c.Request.Method, c.Request.URL.Path, err)
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Error: "Failed to lookup user",
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
		c.Set("authIdentityID", identity.ID)
		c.Set("familyID", user.FamilyID)
		c.Set("userRole", user.Role)
		c.Set("identity", identity)

		c.Next()
	}
}

// OIDCBasicAuthMiddleware validates tokens but doesn't require user existence in database
// This is used for user registration endpoints
func OIDCBasicAuthMiddleware(validator auth.SessionValidator) gin.HandlerFunc {
	return func(c *gin.Context) {
		identity, err := extractAndValidateToken(c, validator)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: err.Error(),
			})
			c.Abort()
			return
		}

		// Set identity information in context (user might not exist in our DB yet)
		c.Set("authIdentityID", identity.ID)
		c.Set("identity", identity)

		c.Next()
	}
}

// extractAndValidateToken extracts token from request and validates it
func extractAndValidateToken(c *gin.Context, validator auth.SessionValidator) (*auth.Identity, error) {
	ctx := context.Background()
	var lastErr error

	// Try Authorization header first (Bearer token) - most common for APIs
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		if !strings.HasPrefix(authHeader, "Bearer ") {
			return nil, fmt.Errorf("invalid authorization header format")
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token != "" {
			identity, err := validator.ValidateSession(ctx, token)
			if err == nil {
				return identity, nil
			}
			lastErr = err
		}
	}

	// Try session cookie (for browser-based auth)
	// Cookie name can be customized per OIDC provider
	for _, cookieName := range []string{"session", "id_token", "access_token", "auth_token"} {
		cookie, err := c.Cookie(cookieName)
		if err == nil && cookie != "" {
			identity, err := validator.ValidateSessionFromCookie(ctx, cookie)
			if err == nil {
				return identity, nil
			}
		}
	}

	// Try X-Auth-Token header (alternative for API clients)
	authToken := c.GetHeader("X-Auth-Token")
	if authToken != "" {
		identity, err := validator.ValidateSession(ctx, authToken)
		if err == nil {
			return identity, nil
		}
		lastErr = err
	}

	if lastErr != nil {
		log.Printf("[AUTH] Token validation failed for %s %s: %v", c.Request.Method, c.Request.URL.Path, lastErr)
	}
	return nil, fmt.Errorf("no valid authentication token found")
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
func RequireChildOwnership(repo db.Repository) gin.HandlerFunc {
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
		if err := repo.VerifyChildOwnership(userIDStr, childID); err != nil {
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
func RequireWordSetAccess(repo db.Repository) gin.HandlerFunc {
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
			if err := repo.VerifyWordSetAccess(userFamilyIDStr, wordSetID); err != nil {
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
