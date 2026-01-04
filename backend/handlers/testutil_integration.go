package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/starefossen/diktator/backend/internal/migrate"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services"
	"github.com/starefossen/diktator/backend/internal/services/db"
	"github.com/stretchr/testify/require"
)

// IntegrationTestEnv holds the environment for integration tests
type IntegrationTestEnv struct {
	T              *testing.T
	DB             *db.Postgres
	Pool           *pgxpool.Pool
	Router         *gin.Engine
	ServiceManager *services.Manager
	Cleanup        func()
}

// SetupIntegrationTest creates a real database connection and test environment
func SetupIntegrationTest(t *testing.T) *IntegrationTestEnv {
	// Skip if not running integration tests
	if os.Getenv("INTEGRATION_TESTS") != "true" && testing.Short() {
		t.Skip("Skipping integration test (use -short=false or INTEGRATION_TESTS=true)")
	}

	// Get database URL from environment or use default
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/diktator_test?sslmode=disable"
	}

	// Create database connection pool
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	require.NoError(t, err, "Failed to connect to test database")

	// Verify connection
	err = pool.Ping(ctx)
	require.NoError(t, err, "Failed to ping test database")

	// Create a unique database for this test to isolate it
	testDBName := fmt.Sprintf("diktator_test_%s", uuid.New().String()[:8])

	// Create test database
	_, err = pool.Exec(ctx, fmt.Sprintf("CREATE DATABASE %s", testDBName))
	require.NoError(t, err, "Failed to create test database")

	// Close the initial pool and connect to the test database
	pool.Close()

	testDBURL := fmt.Sprintf("%s/%s?sslmode=disable", dbURL[:len(dbURL)-len("/diktator_test?sslmode=disable")], testDBName)
	pool, err = pgxpool.New(ctx, testDBURL)
	require.NoError(t, err, "Failed to connect to test database")

	// Run migrations using the existing migrate package
	err = migrate.Run(testDBURL)
	require.NoError(t, err, "Failed to run migrations")

	// Create DB service with context and minimal config
	dbConfig := &db.Config{
		DSN:             testDBURL,
		MaxOpenConns:    10,
		MaxIdleConns:    5,
		ConnMaxLifetime: 0,
		ConnMaxIdleTime: 0,
	}
	dbService, err := db.NewPostgres(ctx, dbConfig)
	require.NoError(t, err, "Failed to create DB service")

	// Create service manager with real DB
	serviceManager := &services.Manager{
		DB: dbService,
		// TTS and other services can be mocked if needed
	}

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()

	env := &IntegrationTestEnv{
		T:              t,
		DB:             dbService,
		Pool:           pool,
		Router:         router,
		ServiceManager: serviceManager,
	}

	// Store test DB name for cleanup
	testDB := testDBName

	// Cleanup function
	env.Cleanup = func() {
		pool.Close()

		// Reconnect to postgres database to drop the test database
		mainPool, err := pgxpool.New(context.Background(), dbURL)
		if err == nil {
			_, _ = mainPool.Exec(context.Background(), fmt.Sprintf("DROP DATABASE IF EXISTS %s", testDB))
			mainPool.Close()
		}
	}

	return env
}

// CreateTestUser creates a test user and returns it
func (env *IntegrationTestEnv) CreateTestUser(familyID, role string) *models.User {
	user := &models.User{
		ID:          uuid.New().String(),
		AuthID:      "oidc-" + uuid.New().String(),
		Email:       fmt.Sprintf("test-%s@example.com", uuid.New().String()[:8]),
		DisplayName: fmt.Sprintf("Test %s", role),
		FamilyID:    familyID,
		Role:        role,
		IsActive:    true,
	}

	err := env.DB.CreateUser(user)
	require.NoError(env.T, err, "Failed to create test user")

	return user
}

// CreateTestFamily creates a test family and returns the family ID
func (env *IntegrationTestEnv) CreateTestFamily(createdBy string) string {
	familyID := uuid.New().String()

	query := `INSERT INTO families (id, name, created_by) VALUES ($1, $2, $3)`
	_, err := env.Pool.Exec(context.Background(), query, familyID, "Test Family", createdBy)
	require.NoError(env.T, err, "Failed to create test family")

	return familyID
}

// CreateTestWordSet creates a test word set
func (env *IntegrationTestEnv) CreateTestWordSet(familyID, createdBy string) *models.WordSet {
	wordSet := &models.WordSet{
		ID:        uuid.New().String(),
		Name:      "Test Word Set",
		Language:  "en",
		FamilyID:  familyID,
		CreatedBy: createdBy,
	}

	err := env.DB.CreateWordSet(wordSet)
	require.NoError(env.T, err, "Failed to create test word set")

	return wordSet
}

// SetupAuthMiddleware adds authentication middleware that uses the provided user
func (env *IntegrationTestEnv) SetupAuthMiddleware(user *models.User) {
	env.Router.Use(func(c *gin.Context) {
		c.Set("serviceManager", env.ServiceManager)
		c.Set("userID", user.ID)
		c.Set("authID", user.AuthID)
		c.Set("userRole", user.Role)
		c.Set("familyID", user.FamilyID)
		c.Set("validatedFamilyID", user.FamilyID)
		c.Next()
	})
}

// makeRequest is a helper to make HTTP requests during tests
func makeRequest(router *gin.Engine, method, path string, body interface{}, headers map[string]string) *httptest.ResponseRecorder {
	var bodyReader *bytes.Reader
	if body != nil {
		bodyBytes, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(bodyBytes)
	}

	var req *http.Request
	if bodyReader != nil {
		req = httptest.NewRequest(method, path, bodyReader)
		req.Header.Set("Content-Type", "application/json")
	} else {
		req = httptest.NewRequest(method, path, nil)
	}

	// Add custom headers if provided
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// AssertNoRowsInTable verifies a table is empty
func (env *IntegrationTestEnv) AssertNoRowsInTable(tableName string) {
	var count int
	err := env.Pool.QueryRow(context.Background(),
		fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)).Scan(&count)
	require.NoError(env.T, err)
	require.Equal(env.T, 0, count, "Expected table %s to be empty", tableName)
}

// AssertRowCount verifies row count in a table
func (env *IntegrationTestEnv) AssertRowCount(tableName string, expected int) {
	var count int
	err := env.Pool.QueryRow(context.Background(),
		fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)).Scan(&count)
	require.NoError(env.T, err)
	require.Equal(env.T, expected, count, "Row count mismatch for table %s", tableName)
}

// GetUserByID retrieves a user from the database
func (env *IntegrationTestEnv) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	query := `SELECT id, auth_id, email, display_name, family_id, role, is_active
			  FROM users WHERE id = $1`

	err := env.Pool.QueryRow(context.Background(), query, userID).Scan(
		&user.ID, &user.AuthID, &user.Email, &user.DisplayName,
		&user.FamilyID, &user.Role, &user.IsActive,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}
