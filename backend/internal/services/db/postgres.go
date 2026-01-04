package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/starefossen/diktator/backend/internal/models"
)

// Postgres implements the Repository interface for PostgreSQL
type Postgres struct {
	pool *pgxpool.Pool
}

// NewPostgres creates a new PostgreSQL repository
func NewPostgres(ctx context.Context, cfg *Config) (*Postgres, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.DSN)
	if err != nil {
		return nil, fmt.Errorf("failed to parse DSN: %w", err)
	}

	poolConfig.MaxConns = int32(cfg.MaxOpenConns)
	poolConfig.MinConns = int32(cfg.MaxIdleConns)
	poolConfig.MaxConnLifetime = cfg.ConnMaxLifetime
	poolConfig.MaxConnIdleTime = cfg.ConnMaxIdleTime

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Postgres{pool: pool}, nil
}

// Close closes the database connection pool
func (db *Postgres) Close() error {
	db.pool.Close()
	return nil
}

// ============================================================================
// User Operations
// ============================================================================

func (db *Postgres) GetUser(userID string) (*models.User, error) {
	ctx := context.Background()
	query := `
		SELECT id, auth_id, email, display_name, family_id, role,
		       parent_id, is_active, created_at, last_active_at
		FROM users WHERE id = $1`

	var user models.User

	err := db.pool.QueryRow(ctx, query, userID).Scan(
		&user.ID, &user.AuthID, &user.Email, &user.DisplayName, &user.FamilyID,
		&user.Role, &user.ParentID, &user.IsActive,
		&user.CreatedAt, &user.LastActiveAt,
	)
	if err == pgx.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Get children IDs if this is a parent
	if user.Role == "parent" {
		childrenQuery := `SELECT id FROM users WHERE parent_id = $1 AND role = 'child'`
		rows, err := db.pool.Query(ctx, childrenQuery, user.ID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var childID string
				if rows.Scan(&childID) == nil {
					user.Children = append(user.Children, childID)
				}
			}
		}
	}

	return &user, nil
}

func (db *Postgres) GetUserByAuthID(authID string) (*models.User, error) {
	ctx := context.Background()
	query := `
		SELECT id, auth_id, email, display_name, family_id, role,
		       parent_id, is_active, created_at, last_active_at
		FROM users WHERE auth_id = $1`

	var user models.User

	err := db.pool.QueryRow(ctx, query, authID).Scan(
		&user.ID, &user.AuthID, &user.Email, &user.DisplayName, &user.FamilyID,
		&user.Role, &user.ParentID, &user.IsActive,
		&user.CreatedAt, &user.LastActiveAt,
	)
	if err == pgx.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by auth ID: %w", err)
	}

	// Get children IDs if this is a parent
	if user.Role == "parent" {
		childrenQuery := `SELECT id FROM users WHERE parent_id = $1 AND role = 'child'`
		rows, err := db.pool.Query(ctx, childrenQuery, user.ID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var childID string
				if rows.Scan(&childID) == nil {
					user.Children = append(user.Children, childID)
				}
			}
		}
	}

	return &user, nil
}

func (db *Postgres) GetUserByEmail(email string) (*models.User, error) {
	ctx := context.Background()
	var user models.User

	query := `
		SELECT id, auth_id, email, display_name, family_id, role,
		       parent_id, is_active, created_at, last_active_at
		FROM users
		WHERE LOWER(email) = LOWER($1)`

	err := db.pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.AuthID, &user.Email, &user.DisplayName, &user.FamilyID,
		&user.Role, &user.ParentID, &user.IsActive,
		&user.CreatedAt, &user.LastActiveAt,
	)

	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &user, nil
}

func (db *Postgres) LinkUserToAuthID(userID, authID string) error {
	ctx := context.Background()

	query := `
		UPDATE users
		SET auth_id = $2, is_active = true, last_active_at = NOW()
		WHERE id = $1`

	result, err := db.pool.Exec(ctx, query, userID, authID)
	if err != nil {
		return fmt.Errorf("failed to link user to auth ID: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (db *Postgres) CreateUser(user *models.User) error {
	ctx := context.Background()

	if user.ID == "" {
		user.ID = uuid.New().String()
	}

	// Convert empty strings to nil for nullable FK columns
	var familyID *string
	if user.FamilyID != "" {
		familyID = &user.FamilyID
	}

	query := `
		INSERT INTO users (id, auth_id, email, display_name, family_id, role,
		                   parent_id, is_active, created_at, last_active_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := db.pool.Exec(ctx, query,
		user.ID, user.AuthID, user.Email, user.DisplayName, familyID,
		user.Role, user.ParentID, user.IsActive,
		user.CreatedAt, user.LastActiveAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

func (db *Postgres) UpdateUser(user *models.User) error {
	ctx := context.Background()

	// Convert empty strings to nil for nullable FK columns
	var familyID *string
	if user.FamilyID != "" {
		familyID = &user.FamilyID
	}

	query := `
		UPDATE users SET
			email = $2, display_name = $3, family_id = $4, role = $5,
			parent_id = $6, is_active = $7, last_active_at = $8
		WHERE id = $1`

	result, err := db.pool.Exec(ctx, query,
		user.ID, user.Email, user.DisplayName, familyID, user.Role,
		user.ParentID, user.IsActive, user.LastActiveAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (db *Postgres) DeleteUser(userID string) error {
	ctx := context.Background()
	query := `DELETE FROM users WHERE id = $1`

	result, err := db.pool.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

// ============================================================================
// Family Operations
// ============================================================================

func (db *Postgres) GetFamily(familyID string) (*models.Family, error) {
	ctx := context.Background()

	// Get family basic info
	query := `SELECT id, name, created_by, created_at, updated_at FROM families WHERE id = $1`

	var family models.Family
	err := db.pool.QueryRow(ctx, query, familyID).Scan(
		&family.ID, &family.Name, &family.CreatedBy, &family.CreatedAt, &family.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, ErrFamilyNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get family: %w", err)
	}

	// Get members
	membersQuery := `SELECT user_id FROM family_members WHERE family_id = $1`
	rows, err := db.pool.Query(ctx, membersQuery, familyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get family members: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var memberID string
		if err := rows.Scan(&memberID); err != nil {
			return nil, fmt.Errorf("failed to scan member: %w", err)
		}
		family.Members = append(family.Members, memberID)
	}

	return &family, nil
}

func (db *Postgres) CreateFamily(family *models.Family) error {
	ctx := context.Background()

	if family.ID == "" {
		family.ID = uuid.New().String()
	}

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Insert family
	query := `INSERT INTO families (id, name, created_by, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5)`
	_, err = tx.Exec(ctx, query, family.ID, family.Name, family.CreatedBy,
		family.CreatedAt, family.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create family: %w", err)
	}

	// Insert members
	for _, memberID := range family.Members {
		memberQuery := `INSERT INTO family_members (family_id, user_id, role, joined_at)
		                VALUES ($1, $2, 'parent', $3)`
		_, err = tx.Exec(ctx, memberQuery, family.ID, memberID, time.Now())
		if err != nil {
			return fmt.Errorf("failed to add family member: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (db *Postgres) AddFamilyMember(familyID, userID, role string) error {
	ctx := context.Background()

	query := `INSERT INTO family_members (family_id, user_id, role, joined_at)
	          VALUES ($1, $2, $3, $4)
	          ON CONFLICT (family_id, user_id) DO NOTHING`

	_, err := db.pool.Exec(ctx, query, familyID, userID, role, time.Now())
	if err != nil {
		return fmt.Errorf("failed to add family member: %w", err)
	}

	return nil
}

func (db *Postgres) UpdateFamily(family *models.Family) error {
	ctx := context.Background()

	query := `UPDATE families SET name = $2, updated_at = $3 WHERE id = $1`
	result, err := db.pool.Exec(ctx, query, family.ID, family.Name, family.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to update family: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrFamilyNotFound
	}

	return nil
}

func (db *Postgres) DeleteFamily(familyID string) error {
	ctx := context.Background()

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Delete family members first
	_, err = tx.Exec(ctx, `DELETE FROM family_members WHERE family_id = $1`, familyID)
	if err != nil {
		return fmt.Errorf("failed to delete family members: %w", err)
	}

	// Delete family
	result, err := tx.Exec(ctx, `DELETE FROM families WHERE id = $1`, familyID)
	if err != nil {
		return fmt.Errorf("failed to delete family: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrFamilyNotFound
	}

	return tx.Commit(ctx)
}

// ============================================================================
// Child Operations
// ============================================================================

func (db *Postgres) GetChild(childID string) (*models.ChildAccount, error) {
	ctx := context.Background()
	query := `
		SELECT id, email, display_name, family_id, parent_id, role,
		       is_active, created_at, last_active_at
		FROM users WHERE id = $1 AND role = 'child'`

	var child models.ChildAccount
	err := db.pool.QueryRow(ctx, query, childID).Scan(
		&child.ID, &child.Email, &child.DisplayName, &child.FamilyID,
		&child.ParentID, &child.Role, &child.IsActive,
		&child.CreatedAt, &child.LastActiveAt,
	)
	if err == pgx.ErrNoRows {
		return nil, ErrChildNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get child: %w", err)
	}

	return &child, nil
}

func (db *Postgres) GetFamilyChildren(familyID string) ([]models.ChildAccount, error) {
	ctx := context.Background()
	query := `
		SELECT id, email, display_name, family_id, parent_id, role,
		       is_active, created_at, last_active_at
		FROM users
		WHERE family_id = $1 AND role = 'child'
		ORDER BY created_at ASC`

	rows, err := db.pool.Query(ctx, query, familyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get family children: %w", err)
	}
	defer rows.Close()

	var children []models.ChildAccount
	for rows.Next() {
		var child models.ChildAccount
		err := rows.Scan(
			&child.ID, &child.Email, &child.DisplayName, &child.FamilyID,
			&child.ParentID, &child.Role, &child.IsActive,
			&child.CreatedAt, &child.LastActiveAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan child: %w", err)
		}
		children = append(children, child)
	}

	return children, nil
}

func (db *Postgres) CreateChild(child *models.ChildAccount) error {
	ctx := context.Background()

	if child.ID == "" {
		child.ID = uuid.New().String()
	}

	// Insert child as a user with role='child'
	query := `
		INSERT INTO users (id, auth_id, email, display_name, family_id, parent_id, role,
		                   is_active, created_at, last_active_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	// Use the child ID as auth_id for now (can be updated when child logs in)
	_, err := db.pool.Exec(ctx, query,
		child.ID, child.ID, child.Email, child.DisplayName, child.FamilyID,
		child.ParentID, "child", child.IsActive,
		child.CreatedAt, child.LastActiveAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create child: %w", err)
	}

	return nil
}

func (db *Postgres) UpdateChild(child *models.ChildAccount) error {
	ctx := context.Background()

	query := `
		UPDATE users SET
			email = $2, display_name = $3, is_active = $4, last_active_at = $5
		WHERE id = $1 AND role = 'child'`

	result, err := db.pool.Exec(ctx, query,
		child.ID, child.Email, child.DisplayName, child.IsActive, child.LastActiveAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update child: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrChildNotFound
	}

	return nil
}

func (db *Postgres) DeleteChild(childID string) error {
	ctx := context.Background()
	query := `DELETE FROM users WHERE id = $1 AND role = 'child'`

	result, err := db.pool.Exec(ctx, query, childID)
	if err != nil {
		return fmt.Errorf("failed to delete child: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrChildNotFound
	}

	return nil
}

// ============================================================================
// WordSet Operations
// ============================================================================

// WordForDB represents a word in a word set for database storage
type WordForDB struct {
	Word       string           `json:"word"`
	Audio      models.WordAudio `json:"audio,omitempty"`
	Definition string           `json:"definition,omitempty"`
}

func (db *Postgres) GetWordSet(id string) (*models.WordSet, error) {
	ctx := context.Background()

	// Get word set basic info
	query := `
		SELECT id, name, family_id, created_by, language, test_configuration, created_at, updated_at
		FROM word_sets WHERE id = $1`

	var ws models.WordSet
	var testConfigJSON []byte
	err := db.pool.QueryRow(ctx, query, id).Scan(
		&ws.ID, &ws.Name, &ws.FamilyID, &ws.CreatedBy, &ws.Language,
		&testConfigJSON, &ws.CreatedAt, &ws.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, ErrWordSetNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get word set: %w", err)
	}

	if testConfigJSON != nil {
		var testConfig map[string]interface{}
		if err := json.Unmarshal(testConfigJSON, &testConfig); err != nil {
			return nil, fmt.Errorf("failed to unmarshal test config: %w", err)
		}
		ws.TestConfiguration = &testConfig
	}

	// Get words
	wordsQuery := `
		SELECT word, audio_url, audio_id, voice_id, audio_created_at, definition, translations
		FROM words WHERE word_set_id = $1 ORDER BY position`
	rows, err := db.pool.Query(ctx, wordsQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get words: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var wordStr, definition string
		var audioURL, audioID, voiceID *string
		var audioCreatedAt *time.Time
		var translationsJSON []byte
		err := rows.Scan(&wordStr, &audioURL, &audioID, &voiceID, &audioCreatedAt, &definition, &translationsJSON)
		if err != nil {
			return nil, fmt.Errorf("failed to scan word: %w", err)
		}

		wordEntry := struct {
			Word         string               `json:"word"`
			Audio        models.WordAudio     `json:"audio,omitempty"`
			Definition   string               `json:"definition,omitempty"`
			Translations []models.Translation `json:"translations,omitempty"`
		}{
			Word:       wordStr,
			Definition: definition,
		}

		// Unmarshal translations if present
		if len(translationsJSON) > 0 {
			var translations []models.Translation
			if err := json.Unmarshal(translationsJSON, &translations); err != nil {
				return nil, fmt.Errorf("failed to unmarshal translations: %w", err)
			}
			wordEntry.Translations = translations
		}

		if audioURL != nil {
			wordEntry.Audio = models.WordAudio{
				Word:     wordStr,
				AudioURL: *audioURL,
			}
			if audioID != nil {
				wordEntry.Audio.AudioID = *audioID
			}
			if voiceID != nil {
				wordEntry.Audio.VoiceID = *voiceID
			}
			if audioCreatedAt != nil {
				wordEntry.Audio.CreatedAt = *audioCreatedAt
			}
		}
		ws.Words = append(ws.Words, wordEntry)
	}

	return &ws, nil
}

func (db *Postgres) GetWordSets(familyID string) ([]models.WordSet, error) {
	ctx := context.Background()
	query := `
		SELECT id, name, family_id, created_by, language, test_configuration, created_at, updated_at
		FROM word_sets WHERE family_id = $1 ORDER BY created_at DESC`

	rows, err := db.pool.Query(ctx, query, familyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get word sets: %w", err)
	}
	defer rows.Close()

	var wordSets []models.WordSet
	for rows.Next() {
		var ws models.WordSet
		var testConfigJSON []byte
		err := rows.Scan(
			&ws.ID, &ws.Name, &ws.FamilyID, &ws.CreatedBy, &ws.Language,
			&testConfigJSON, &ws.CreatedAt, &ws.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan word set: %w", err)
		}

		if testConfigJSON != nil {
			var testConfig map[string]interface{}
			if err := json.Unmarshal(testConfigJSON, &testConfig); err != nil {
				return nil, fmt.Errorf("failed to unmarshal test config: %w", err)
			}
			ws.TestConfiguration = &testConfig
		}

		// Get assigned user IDs for this word set
		assignmentsQuery := `SELECT user_id FROM wordset_assignments WHERE wordset_id = $1 ORDER BY assigned_at`
		assignmentRows, err := db.pool.Query(ctx, assignmentsQuery, ws.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get wordset assignments: %w", err)
		}

		var assignedUserIDs []string
		for assignmentRows.Next() {
			var userID string
			if err := assignmentRows.Scan(&userID); err != nil {
				assignmentRows.Close()
				return nil, fmt.Errorf("failed to scan assignment: %w", err)
			}
			assignedUserIDs = append(assignedUserIDs, userID)
		}
		assignmentRows.Close()
		ws.AssignedUserIDs = assignedUserIDs

		// Get words for this word set
		wordsQuery := `
			SELECT word, audio_url, audio_id, voice_id, audio_created_at, definition, translations
			FROM words WHERE word_set_id = $1 ORDER BY position`
		wordRows, err := db.pool.Query(ctx, wordsQuery, ws.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get words: %w", err)
		}

		for wordRows.Next() {
			var wordStr, definition string
			var audioURL, audioID, voiceID *string
			var audioCreatedAt *time.Time
			var translationsJSON []byte
			err := wordRows.Scan(&wordStr, &audioURL, &audioID, &voiceID, &audioCreatedAt, &definition, &translationsJSON)
			if err != nil {
				wordRows.Close()
				return nil, fmt.Errorf("failed to scan word: %w", err)
			}

			wordEntry := struct {
				Word         string               `json:"word"`
				Audio        models.WordAudio     `json:"audio,omitempty"`
				Definition   string               `json:"definition,omitempty"`
				Translations []models.Translation `json:"translations,omitempty"`
			}{
				Word:       wordStr,
				Definition: definition,
			}

			// Unmarshal translations if present
			if len(translationsJSON) > 0 {
				var translations []models.Translation
				if err := json.Unmarshal(translationsJSON, &translations); err != nil {
					wordRows.Close()
					return nil, fmt.Errorf("failed to unmarshal translations: %w", err)
				}
				wordEntry.Translations = translations
			}

			if audioURL != nil {
				wordEntry.Audio = models.WordAudio{
					Word:     wordStr,
					AudioURL: *audioURL,
				}
				if audioID != nil {
					wordEntry.Audio.AudioID = *audioID
				}
				if voiceID != nil {
					wordEntry.Audio.VoiceID = *voiceID
				}
				if audioCreatedAt != nil {
					wordEntry.Audio.CreatedAt = *audioCreatedAt
				}
			}
			ws.Words = append(ws.Words, wordEntry)
		}
		wordRows.Close()

		wordSets = append(wordSets, ws)
	}

	return wordSets, nil
}

func (db *Postgres) CreateWordSet(ws *models.WordSet) error {
	ctx := context.Background()

	if ws.ID == "" {
		ws.ID = uuid.New().String()
	}

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var testConfigJSON []byte
	if ws.TestConfiguration != nil {
		testConfigJSON, err = json.Marshal(ws.TestConfiguration)
		if err != nil {
			return fmt.Errorf("failed to marshal test config: %w", err)
		}
	}

	query := `
		INSERT INTO word_sets (id, name, family_id, created_by, language, test_configuration,
		                       created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err = tx.Exec(ctx, query,
		ws.ID, ws.Name, ws.FamilyID, ws.CreatedBy, ws.Language,
		testConfigJSON, ws.CreatedAt, ws.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create word set: %w", err)
	}

	// Insert words
	for i, word := range ws.Words {
		var translationsJSON []byte
		if len(word.Translations) > 0 {
			translationsJSON, err = json.Marshal(word.Translations)
			if err != nil {
				return fmt.Errorf("failed to marshal translations: %w", err)
			}
		}

		wordQuery := `
			INSERT INTO words (id, word_set_id, word, position, audio_url, audio_id,
			                   voice_id, audio_created_at, definition, translations)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

		var audioURL, audioID, voiceID *string
		var audioCreatedAt *time.Time
		if word.Audio.AudioURL != "" {
			audioURL = &word.Audio.AudioURL
			audioID = &word.Audio.AudioID
			voiceID = &word.Audio.VoiceID
			audioCreatedAt = &word.Audio.CreatedAt
		}

		_, err = tx.Exec(ctx, wordQuery,
			uuid.New().String(), ws.ID, word.Word, i,
			audioURL, audioID, voiceID, audioCreatedAt, word.Definition, translationsJSON,
		)
		if err != nil {
			return fmt.Errorf("failed to insert word: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (db *Postgres) UpdateWordSet(ws *models.WordSet) error {
	ctx := context.Background()

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var testConfigJSON []byte
	if ws.TestConfiguration != nil {
		testConfigJSON, err = json.Marshal(ws.TestConfiguration)
		if err != nil {
			return fmt.Errorf("failed to marshal test config: %w", err)
		}
	}

	query := `
		UPDATE word_sets SET
			name = $2, language = $3, test_configuration = $4, updated_at = $5
		WHERE id = $1`

	result, err := tx.Exec(ctx, query,
		ws.ID, ws.Name, ws.Language, testConfigJSON, ws.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update word set: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrWordSetNotFound
	}

	// Delete existing words and re-insert
	_, err = tx.Exec(ctx, `DELETE FROM words WHERE word_set_id = $1`, ws.ID)
	if err != nil {
		return fmt.Errorf("failed to delete words: %w", err)
	}

	for i, word := range ws.Words {
		var translationsJSON []byte
		if len(word.Translations) > 0 {
			translationsJSON, err = json.Marshal(word.Translations)
			if err != nil {
				return fmt.Errorf("failed to marshal translations: %w", err)
			}
		}

		wordQuery := `
			INSERT INTO words (id, word_set_id, word, position, audio_url, audio_id,
			                   voice_id, audio_created_at, definition, translations)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

		var audioURL, audioID, voiceID *string
		var audioCreatedAt *time.Time
		if word.Audio.AudioURL != "" {
			audioURL = &word.Audio.AudioURL
			audioID = &word.Audio.AudioID
			voiceID = &word.Audio.VoiceID
			audioCreatedAt = &word.Audio.CreatedAt
		}

		_, err = tx.Exec(ctx, wordQuery,
			uuid.New().String(), ws.ID, word.Word, i,
			audioURL, audioID, voiceID, audioCreatedAt, word.Definition, translationsJSON,
		)
		if err != nil {
			return fmt.Errorf("failed to insert word: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (db *Postgres) DeleteWordSet(id string) error {
	ctx := context.Background()

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Delete words first
	_, err = tx.Exec(ctx, `DELETE FROM words WHERE word_set_id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete words: %w", err)
	}

	// Delete word set
	result, err := tx.Exec(ctx, `DELETE FROM word_sets WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete word set: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrWordSetNotFound
	}

	return tx.Commit(ctx)
}

// ============================================================================
// Test Result Operations
// ============================================================================

func (db *Postgres) GetTestResults(userID string) ([]models.TestResult, error) {
	ctx := context.Background()
	query := `
		SELECT id, word_set_id, user_id, score, total_words, correct_words,
		       time_spent, mode, completed_at, created_at
		FROM test_results WHERE user_id = $1 ORDER BY completed_at DESC`

	rows, err := db.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get test results: %w", err)
	}
	defer rows.Close()

	var results []models.TestResult
	for rows.Next() {
		var result models.TestResult
		err := rows.Scan(
			&result.ID, &result.WordSetID, &result.UserID, &result.Score,
			&result.TotalWords, &result.CorrectWords, &result.TimeSpent, &result.Mode,
			&result.CompletedAt, &result.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan result: %w", err)
		}

		// Get word test results
		wordResults, err := db.getWordTestResults(ctx, result.ID)
		if err != nil {
			return nil, err
		}
		result.Words = wordResults

		results = append(results, result)
	}

	return results, nil
}

func (db *Postgres) GetFamilyResults(familyID string) ([]models.TestResult, error) {
	ctx := context.Background()
	query := `
		SELECT tr.id, tr.word_set_id, tr.user_id, tr.score, tr.total_words,
		       tr.correct_words, tr.time_spent, tr.mode, tr.completed_at, tr.created_at
		FROM test_results tr
		JOIN users u ON tr.user_id = u.id
		WHERE u.family_id = $1
		ORDER BY tr.completed_at DESC`

	rows, err := db.pool.Query(ctx, query, familyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get family results: %w", err)
	}
	defer rows.Close()

	var results []models.TestResult
	for rows.Next() {
		var result models.TestResult
		err := rows.Scan(
			&result.ID, &result.WordSetID, &result.UserID, &result.Score,
			&result.TotalWords, &result.CorrectWords, &result.TimeSpent, &result.Mode,
			&result.CompletedAt, &result.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan result: %w", err)
		}

		wordResults, err := db.getWordTestResults(ctx, result.ID)
		if err != nil {
			return nil, err
		}
		result.Words = wordResults

		results = append(results, result)
	}

	return results, nil
}

func (db *Postgres) getWordTestResults(ctx context.Context, testResultID string) ([]models.WordTestResult, error) {
	query := `
		SELECT word, user_answers, attempts, correct, time_spent,
		       final_answer, hints_used, audio_play_count
		FROM word_test_results WHERE test_result_id = $1`

	rows, err := db.pool.Query(ctx, query, testResultID)
	if err != nil {
		return nil, fmt.Errorf("failed to get word test results: %w", err)
	}
	defer rows.Close()

	var results []models.WordTestResult
	for rows.Next() {
		var wtr models.WordTestResult
		var answersJSON []byte
		err := rows.Scan(
			&wtr.Word, &answersJSON, &wtr.Attempts, &wtr.Correct,
			&wtr.TimeSpent, &wtr.FinalAnswer, &wtr.HintsUsed, &wtr.AudioPlayCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan word test result: %w", err)
		}

		if answersJSON != nil {
			if err := json.Unmarshal(answersJSON, &wtr.UserAnswers); err != nil {
				return nil, fmt.Errorf("failed to unmarshal user answers: %w", err)
			}
		}

		results = append(results, wtr)
	}

	return results, nil
}

func (db *Postgres) SaveTestResult(result *models.TestResult) error {
	ctx := context.Background()

	if result.ID == "" {
		result.ID = uuid.New().String()
	}

	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO test_results (id, word_set_id, user_id, score, total_words,
		                          correct_words, time_spent, mode, completed_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err = tx.Exec(ctx, query,
		result.ID, result.WordSetID, result.UserID, result.Score,
		result.TotalWords, result.CorrectWords, result.TimeSpent, result.Mode,
		result.CompletedAt, result.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to save test result: %w", err)
	}

	// Insert word test results
	for _, wtr := range result.Words {
		answersJSON, err := json.Marshal(wtr.UserAnswers)
		if err != nil {
			return fmt.Errorf("failed to marshal user answers: %w", err)
		}

		wtrQuery := `
			INSERT INTO word_test_results (id, test_result_id, word, user_answers,
			                               attempts, correct, time_spent, final_answer,
			                               hints_used, audio_play_count)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

		_, err = tx.Exec(ctx, wtrQuery,
			uuid.New().String(), result.ID, wtr.Word, answersJSON,
			wtr.Attempts, wtr.Correct, wtr.TimeSpent, wtr.FinalAnswer,
			wtr.HintsUsed, wtr.AudioPlayCount,
		)
		if err != nil {
			return fmt.Errorf("failed to save word test result: %w", err)
		}
	}

	return tx.Commit(ctx)
}

// ============================================================================
// Audio File Operations
// ============================================================================

func (db *Postgres) GetAudioFile(word, language, voiceID string) (*models.AudioFile, error) {
	ctx := context.Background()
	query := `
		SELECT id, word, language, voice_id, url, created_at
		FROM audio_files WHERE word = $1 AND language = $2 AND voice_id = $3`

	var af models.AudioFile
	err := db.pool.QueryRow(ctx, query, word, language, voiceID).Scan(
		&af.ID, &af.Word, &af.Language, &af.VoiceID,
		&af.URL, &af.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get audio file: %w", err)
	}

	return &af, nil
}

func (db *Postgres) SaveAudioFile(af *models.AudioFile) error {
	ctx := context.Background()

	if af.ID == "" {
		af.ID = uuid.New().String()
	}

	query := `
		INSERT INTO audio_files (id, word, language, voice_id, url, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (word, language, voice_id) DO UPDATE SET
			url = EXCLUDED.url`

	_, err := db.pool.Exec(ctx, query,
		af.ID, af.Word, af.Language, af.VoiceID,
		af.URL, af.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to save audio file: %w", err)
	}

	return nil
}

// ============================================================================
// Progress and Stats Operations
// ============================================================================

func (db *Postgres) GetFamilyProgress(familyID string) ([]models.FamilyProgress, error) {
	ctx := context.Background()

	// Get all family members
	membersQuery := `
		SELECT u.id, u.display_name, u.role
		FROM users u
		JOIN family_members fm ON u.id = fm.user_id
		WHERE fm.family_id = $1`

	rows, err := db.pool.Query(ctx, membersQuery, familyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get family members: %w", err)
	}
	defer rows.Close()

	var progress []models.FamilyProgress
	for rows.Next() {
		var fp models.FamilyProgress
		err := rows.Scan(&fp.UserID, &fp.UserName, &fp.Role)
		if err != nil {
			return nil, fmt.Errorf("failed to scan member: %w", err)
		}

		// Get stats for this user
		statsQuery := `
			SELECT COUNT(*), COALESCE(AVG(score), 0), COALESCE(SUM(total_words), 0),
			       COALESCE(SUM(correct_words), 0), COALESCE(MAX(completed_at), NOW())
			FROM test_results WHERE user_id = $1`

		err = db.pool.QueryRow(ctx, statsQuery, fp.UserID).Scan(
			&fp.TotalTests, &fp.AverageScore, &fp.TotalWords,
			&fp.CorrectWords, &fp.LastActivity,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to get user stats: %w", err)
		}

		// Get recent results
		recentQuery := `
			SELECT id, word_set_id, user_id, score, total_words, correct_words,
			       time_spent, completed_at, created_at
			FROM test_results WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 5`

		recentRows, err := db.pool.Query(ctx, recentQuery, fp.UserID)
		if err != nil {
			return nil, fmt.Errorf("failed to get recent results: %w", err)
		}

		for recentRows.Next() {
			var result models.TestResult
			err := recentRows.Scan(
				&result.ID, &result.WordSetID, &result.UserID, &result.Score,
				&result.TotalWords, &result.CorrectWords, &result.TimeSpent,
				&result.CompletedAt, &result.CreatedAt,
			)
			if err != nil {
				recentRows.Close()
				return nil, fmt.Errorf("failed to scan recent result: %w", err)
			}
			fp.RecentResults = append(fp.RecentResults, result)
		}
		recentRows.Close()

		progress = append(progress, fp)
	}

	return progress, nil
}

func (db *Postgres) GetFamilyStats(familyID string) (*models.FamilyStats, error) {
	ctx := context.Background()

	stats := &models.FamilyStats{}

	// Get member counts
	memberQuery := `
		SELECT COUNT(*) FILTER (WHERE u.role = 'child'), COUNT(*)
		FROM users u
		JOIN family_members fm ON u.id = fm.user_id
		WHERE fm.family_id = $1`

	err := db.pool.QueryRow(ctx, memberQuery, familyID).Scan(
		&stats.TotalChildren, &stats.TotalMembers,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get member counts: %w", err)
	}

	// Get word set count
	wsQuery := `SELECT COUNT(*) FROM word_sets WHERE family_id = $1`
	err = db.pool.QueryRow(ctx, wsQuery, familyID).Scan(&stats.TotalWordSets)
	if err != nil {
		return nil, fmt.Errorf("failed to get word set count: %w", err)
	}

	// Get test stats
	testQuery := `
		SELECT COUNT(*), COALESCE(AVG(tr.score), 0), COALESCE(MAX(tr.completed_at), NOW())
		FROM test_results tr
		JOIN users u ON tr.user_id = u.id
		JOIN family_members fm ON u.id = fm.user_id
		WHERE fm.family_id = $1`

	err = db.pool.QueryRow(ctx, testQuery, familyID).Scan(
		&stats.TotalTestsCompleted, &stats.AverageFamilyScore, &stats.LastActivity,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get test stats: %w", err)
	}

	// Get most active child
	activeQuery := `
		SELECT u.id
		FROM users u
		JOIN family_members fm ON u.id = fm.user_id
		LEFT JOIN test_results tr ON u.id = tr.user_id
		WHERE fm.family_id = $1 AND u.role = 'child'
		GROUP BY u.id
		ORDER BY COUNT(tr.id) DESC
		LIMIT 1`

	var mostActive string
	err = db.pool.QueryRow(ctx, activeQuery, familyID).Scan(&mostActive)
	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("failed to get most active child: %w", err)
	}
	if mostActive != "" {
		stats.MostActiveChild = &mostActive
	}

	return stats, nil
}

func (db *Postgres) GetUserProgress(userID string) (*models.FamilyProgress, error) {
	ctx := context.Background()

	// Get user info
	userQuery := `SELECT id, display_name, role FROM users WHERE id = $1`
	var fp models.FamilyProgress
	err := db.pool.QueryRow(ctx, userQuery, userID).Scan(&fp.UserID, &fp.UserName, &fp.Role)
	if err == pgx.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Get stats
	statsQuery := `
		SELECT COUNT(*), COALESCE(AVG(score), 0), COALESCE(SUM(total_words), 0),
		       COALESCE(SUM(correct_words), 0), COALESCE(MAX(completed_at), NOW())
		FROM test_results WHERE user_id = $1`

	err = db.pool.QueryRow(ctx, statsQuery, userID).Scan(
		&fp.TotalTests, &fp.AverageScore, &fp.TotalWords,
		&fp.CorrectWords, &fp.LastActivity,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get user stats: %w", err)
	}

	return &fp, nil
}

// ============================================================================
// Family Invitation Operations
// ============================================================================

func (db *Postgres) CreateFamilyInvitation(invitation *models.FamilyInvitation) error {
	ctx := context.Background()
	query := `
		INSERT INTO family_invitations (id, family_id, email, role, invited_by, status, created_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := db.pool.Exec(ctx, query,
		invitation.ID,
		invitation.FamilyID,
		invitation.Email,
		invitation.Role,
		invitation.InvitedBy,
		invitation.Status,
		invitation.CreatedAt,
		invitation.ExpiresAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create family invitation: %w", err)
	}

	return nil
}

func (db *Postgres) GetPendingInvitationsByEmail(email string) ([]models.FamilyInvitation, error) {
	ctx := context.Background()
	query := `
		SELECT i.id, i.family_id, i.email, i.role, i.invited_by, i.status, i.created_at, i.expires_at
		FROM family_invitations i
		WHERE LOWER(i.email) = LOWER($1) AND i.status = 'pending'
		ORDER BY i.created_at DESC`

	rows, err := db.pool.Query(ctx, query, email)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending invitations: %w", err)
	}
	defer rows.Close()

	var invitations []models.FamilyInvitation
	for rows.Next() {
		var inv models.FamilyInvitation
		err := rows.Scan(
			&inv.ID,
			&inv.FamilyID,
			&inv.Email,
			&inv.Role,
			&inv.InvitedBy,
			&inv.Status,
			&inv.CreatedAt,
			&inv.ExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan invitation: %w", err)
		}
		invitations = append(invitations, inv)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating invitations: %w", err)
	}

	return invitations, nil
}

func (db *Postgres) GetFamilyInvitations(familyID string) ([]models.FamilyInvitation, error) {
	ctx := context.Background()
	query := `
		SELECT id, family_id, email, role, invited_by, status, created_at, expires_at
		FROM family_invitations
		WHERE family_id = $1
		ORDER BY created_at DESC`

	rows, err := db.pool.Query(ctx, query, familyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get family invitations: %w", err)
	}
	defer rows.Close()

	var invitations []models.FamilyInvitation
	for rows.Next() {
		var inv models.FamilyInvitation
		err := rows.Scan(
			&inv.ID,
			&inv.FamilyID,
			&inv.Email,
			&inv.Role,
			&inv.InvitedBy,
			&inv.Status,
			&inv.CreatedAt,
			&inv.ExpiresAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan invitation: %w", err)
		}
		invitations = append(invitations, inv)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating invitations: %w", err)
	}

	return invitations, nil
}

func (db *Postgres) AcceptInvitation(invitationID, userID string) error {
	ctx := context.Background()
	tx, err := db.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Get invitation details
	var inv models.FamilyInvitation
	query := `
		SELECT id, family_id, email, role, invited_by, status
		FROM family_invitations
		WHERE id = $1 AND status = 'pending'`

	err = tx.QueryRow(ctx, query, invitationID).Scan(
		&inv.ID,
		&inv.FamilyID,
		&inv.Email,
		&inv.Role,
		&inv.InvitedBy,
		&inv.Status,
	)
	if err == pgx.ErrNoRows {
		return fmt.Errorf("invitation not found or already processed")
	}
	if err != nil {
		return fmt.Errorf("failed to get invitation: %w", err)
	}

	// Update user's family_id
	updateUserQuery := `UPDATE users SET family_id = $1 WHERE id = $2`
	_, err = tx.Exec(ctx, updateUserQuery, inv.FamilyID, userID)
	if err != nil {
		return fmt.Errorf("failed to update user family: %w", err)
	}

	// Add user to family_members table
	addMemberQuery := `
		INSERT INTO family_members (family_id, user_id, role, joined_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (family_id, user_id) DO NOTHING`

	_, err = tx.Exec(ctx, addMemberQuery, inv.FamilyID, userID, inv.Role)
	if err != nil {
		return fmt.Errorf("failed to add family member: %w", err)
	}

	// Update invitation status
	updateInvQuery := `UPDATE family_invitations SET status = 'accepted' WHERE id = $1`
	_, err = tx.Exec(ctx, updateInvQuery, invitationID)
	if err != nil {
		return fmt.Errorf("failed to update invitation status: %w", err)
	}

	if err = tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (db *Postgres) DeleteInvitation(invitationID string) error {
	ctx := context.Background()
	query := `DELETE FROM family_invitations WHERE id = $1`

	result, err := db.pool.Exec(ctx, query, invitationID)
	if err != nil {
		return fmt.Errorf("failed to delete invitation: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("invitation not found")
	}

	return nil
}

// ============================================================================
// Verification Operations
// ============================================================================

func (db *Postgres) VerifyFamilyMembership(userID, familyID string) error {
	ctx := context.Background()
	query := `SELECT 1 FROM family_members WHERE user_id = $1 AND family_id = $2`

	var exists int
	err := db.pool.QueryRow(ctx, query, userID, familyID).Scan(&exists)
	if err == pgx.ErrNoRows {
		return ErrNotFamilyMember
	}
	if err != nil {
		return fmt.Errorf("failed to verify family membership: %w", err)
	}

	return nil
}

func (db *Postgres) VerifyParentPermission(userID, familyID string) error {
	ctx := context.Background()
	query := `SELECT 1 FROM family_members WHERE user_id = $1 AND family_id = $2 AND role = 'parent'`

	var exists int
	err := db.pool.QueryRow(ctx, query, userID, familyID).Scan(&exists)
	if err == pgx.ErrNoRows {
		return ErrNotParent
	}
	if err != nil {
		return fmt.Errorf("failed to verify parent permission: %w", err)
	}

	return nil
}

func (db *Postgres) VerifyChildOwnership(parentID, childID string) error {
	ctx := context.Background()
	query := `SELECT 1 FROM users WHERE id = $1 AND parent_id = $2 AND role = 'child'`

	var exists int
	err := db.pool.QueryRow(ctx, query, childID, parentID).Scan(&exists)
	if err == pgx.ErrNoRows {
		return ErrNotChildOwner
	}
	if err != nil {
		return fmt.Errorf("failed to verify child ownership: %w", err)
	}

	return nil
}

func (db *Postgres) VerifyWordSetAccess(familyID, wordSetID string) error {
	ctx := context.Background()
	query := `SELECT 1 FROM word_sets WHERE id = $1 AND family_id = $2`

	var exists int
	err := db.pool.QueryRow(ctx, query, wordSetID, familyID).Scan(&exists)
	if err == pgx.ErrNoRows {
		return ErrNoAccess
	}
	if err != nil {
		return fmt.Errorf("failed to verify word set access: %w", err)
	}

	return nil
}

// ============================================================================
// Word Set Assignment Operations
// ============================================================================

func (db *Postgres) AssignWordSetToUser(wordSetID, userID, assignedBy string) error {
	ctx := context.Background()

	// Verify the user is a child
	var role string
	roleQuery := `SELECT role FROM users WHERE id = $1`
	err := db.pool.QueryRow(ctx, roleQuery, userID).Scan(&role)
	if err == pgx.ErrNoRows {
		return fmt.Errorf("user not found")
	}
	if err != nil {
		return fmt.Errorf("failed to verify user role: %w", err)
	}
	if role != "child" {
		return fmt.Errorf("only children can be assigned to wordsets")
	}

	// Insert assignment
	query := `
		INSERT INTO wordset_assignments (wordset_id, user_id, assigned_by, assigned_at)
		VALUES ($1, $2, $3, now())
		ON CONFLICT (wordset_id, user_id) DO NOTHING`

	_, err = db.pool.Exec(ctx, query, wordSetID, userID, assignedBy)
	if err != nil {
		return fmt.Errorf("failed to assign wordset to user: %w", err)
	}

	return nil
}

func (db *Postgres) UnassignWordSetFromUser(wordSetID, userID string) error {
	ctx := context.Background()

	query := `DELETE FROM wordset_assignments WHERE wordset_id = $1 AND user_id = $2`

	result, err := db.pool.Exec(ctx, query, wordSetID, userID)
	if err != nil {
		return fmt.Errorf("failed to unassign wordset from user: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("assignment not found")
	}

	return nil
}

func (db *Postgres) GetWordSetAssignments(wordSetID string) ([]string, error) {
	ctx := context.Background()

	query := `SELECT user_id FROM wordset_assignments WHERE wordset_id = $1 ORDER BY assigned_at`

	rows, err := db.pool.Query(ctx, query, wordSetID)
	if err != nil {
		return nil, fmt.Errorf("failed to get wordset assignments: %w", err)
	}
	defer rows.Close()

	var userIDs []string
	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, fmt.Errorf("failed to scan assignment: %w", err)
		}
		userIDs = append(userIDs, userID)
	}

	return userIDs, nil
}
