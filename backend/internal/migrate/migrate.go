// Package migrate handles database schema migrations using golang-migrate.
package migrate

import (
	"embed"
	"fmt"
	"log"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Run executes database migrations with retry logic
func Run(databaseURL string) error {
	const maxRetries = 30
	const retryDelay = 2 * time.Second

	log.Println("[MIGRATE] Starting database migrations...")

	// Create migration source from embedded files
	source, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to create migration source: %w", err)
	}

	// Create migrator with retry logic for database connectivity
	var m *migrate.Migrate
	for i := 0; i < maxRetries; i++ {
		m, err = migrate.NewWithSourceInstance("iofs", source, databaseURL)
		if err == nil {
			break
		}

		if i < maxRetries-1 {
			log.Printf("[MIGRATE] Database not ready (attempt %d/%d), retrying in %v: %v", i+1, maxRetries, retryDelay, err)
			time.Sleep(retryDelay)
			continue
		}

		return fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
	}
	defer m.Close()

	// Run migrations
	log.Println("[MIGRATE] Applying migrations...")
	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			log.Println("[MIGRATE] Database schema is up to date")
			return nil
		}

		// Check if it's a dirty database error
		if isDirtyError(err) {
			version, dirty, vErr := m.Version()
			if vErr != nil && vErr != migrate.ErrNilVersion {
				return fmt.Errorf("failed to get migration version: %w", vErr)
			}

			if dirty {
				log.Printf("[MIGRATE] ⚠️  DIRTY DATABASE DETECTED - Version %d is marked dirty", version)
				log.Printf("[MIGRATE] This usually means a previous migration failed partway through.")
				log.Printf("[MIGRATE] To fix manually:")
				log.Printf("[MIGRATE]   1. Connect to database: kubectl exec -it -n diktator diktator-db-1 -- psql diktator")
				log.Printf("[MIGRATE]   2. Check state: SELECT * FROM schema_migrations;")
				log.Printf("[MIGRATE]   3. Fix if needed: UPDATE schema_migrations SET dirty = false WHERE version = %d;", version)
				log.Printf("[MIGRATE]   4. Or rollback: DELETE FROM schema_migrations WHERE version = %d;", version)
				return fmt.Errorf("database is in dirty state at version %d - manual intervention required", version)
			}
		}

		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("[MIGRATE] ✅ Database migrations completed successfully")
	return nil
}

// isDirtyError checks if the error is a dirty database error
func isDirtyError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	return len(errStr) > 0 &&
		(len(errStr) >= 5 && errStr[:5] == "Dirty") ||
		(len(errStr) >= 14 && errStr[len(errStr)-14:] == "dirty database")
}
