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
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("[MIGRATE] ✅ Database migrations completed successfully")
	return nil
}
