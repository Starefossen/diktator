package firestore

import (
	"context"
	"errors"
	"log"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/starefossen/diktator/backend/internal/models"
	"google.golang.org/api/option"
)

type Service struct {
	client *firestore.Client
	ctx    context.Context
}

// NewService creates a new Firestore service
func NewService() (*Service, error) {
	ctx := context.Background()

	projectID := os.Getenv("GOOGLE_CLOUD_PROJECT")
	if projectID == "" {
		projectID = "diktator-dev" // fallback for development
	}

	// Check if we're using the emulator
	if emulatorHost := os.Getenv("FIRESTORE_EMULATOR_HOST"); emulatorHost != "" {
		log.Printf("Using Firestore emulator at %s", emulatorHost)
		client, err := firestore.NewClient(ctx, projectID)
		if err != nil {
			return nil, err
		}
		return &Service{client: client, ctx: ctx}, nil
	}

	// Production: use service account or application default credentials
	var client *firestore.Client
	var err error

	if credsPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"); credsPath != "" {
		client, err = firestore.NewClient(ctx, projectID, option.WithCredentialsFile(credsPath))
	} else {
		// Use application default credentials (for Cloud Run)
		client, err = firestore.NewClient(ctx, projectID)
	}

	if err != nil {
		return nil, err
	}

	return &Service{client: client, ctx: ctx}, nil
}

// Close closes the Firestore client
func (s *Service) Close() error {
	return s.client.Close()
}

// CreateWordSet creates a new word set
func (s *Service) CreateWordSet(wordSet *models.WordSet) error {
	_, err := s.client.Collection("wordsets").Doc(wordSet.ID).Set(s.ctx, wordSet)
	return err
}

// GetWordSets retrieves word sets for a family
func (s *Service) GetWordSets(familyID string) ([]models.WordSet, error) {
	var wordSets []models.WordSet

	iter := s.client.Collection("wordsets").
		Where("familyId", "==", familyID).
		OrderBy("createdAt", firestore.Desc).
		Documents(s.ctx)

	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		var wordSet models.WordSet
		if err := doc.DataTo(&wordSet); err != nil {
			continue
		}
		wordSet.ID = doc.Ref.ID
		wordSets = append(wordSets, wordSet)
	}

	return wordSets, nil
}

// GetWordSet retrieves a single word set by ID
func (s *Service) GetWordSet(id string) (*models.WordSet, error) {
	doc, err := s.client.Collection("wordsets").Doc(id).Get(s.ctx)
	if err != nil {
		return nil, err
	}

	var wordSet models.WordSet
	if err := doc.DataTo(&wordSet); err != nil {
		return nil, err
	}
	wordSet.ID = doc.Ref.ID

	return &wordSet, nil
}

// DeleteWordSet deletes a word set
func (s *Service) DeleteWordSet(id string) error {
	_, err := s.client.Collection("wordsets").Doc(id).Delete(s.ctx)
	return err
}

// SaveTestResult saves a test result
func (s *Service) SaveTestResult(result *models.TestResult) error {
	_, err := s.client.Collection("results").Doc(result.ID).Set(s.ctx, result)
	return err
}

// GetTestResults retrieves test results for a user
func (s *Service) GetTestResults(userID string) ([]models.TestResult, error) {
	var results []models.TestResult

	iter := s.client.Collection("results").
		Where("userId", "==", userID).
		OrderBy("completedAt", firestore.Desc).
		Limit(50). // Limit to last 50 results
		Documents(s.ctx)

	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		var result models.TestResult
		if err := doc.DataTo(&result); err != nil {
			continue
		}
		result.ID = doc.Ref.ID
		results = append(results, result)
	}

	return results, nil
}

// GetFamilyResults retrieves test results for all members of a family
func (s *Service) GetFamilyResults(familyID string) ([]models.TestResult, error) {
	var allResults []models.TestResult

	// First, get all family members (parent + children)
	familyMembers, err := s.GetFamilyChildren(familyID)
	if err != nil {
		return nil, err
	}

	// Add the parent user ID - get it from the family record
	family, err := s.GetFamily(familyID)
	if err != nil {
		return nil, err
	}

	// Collect all user IDs (parent + children)
	userIDs := []string{family.CreatedBy}
	for _, child := range familyMembers {
		userIDs = append(userIDs, child.ID)
	}

	// Get results for all family members
	for _, userID := range userIDs {
		userResults, err := s.GetTestResults(userID)
		if err != nil {
			// Continue with other users if one fails
			continue
		}
		allResults = append(allResults, userResults...)
	}

	return allResults, nil
}

// SaveAudioFile saves audio file metadata
func (s *Service) SaveAudioFile(audioFile *models.AudioFile) error {
	_, err := s.client.Collection("audiofiles").Doc(audioFile.ID).Set(s.ctx, audioFile)
	return err
}

// GetAudioFile retrieves audio file metadata
func (s *Service) GetAudioFile(word, language, voiceID string) (*models.AudioFile, error) {
	iter := s.client.Collection("audiofiles").
		Where("word", "==", word).
		Where("language", "==", language).
		Where("voiceId", "==", voiceID).
		Limit(1).
		Documents(s.ctx)

	defer iter.Stop()

	doc, err := iter.Next()
	if err != nil {
		return nil, err
	}

	var audioFile models.AudioFile
	if err := doc.DataTo(&audioFile); err != nil {
		return nil, err
	}
	audioFile.ID = doc.Ref.ID

	return &audioFile, nil
}

// Family Management Methods

// GetFamily retrieves family information by ID
func (s *Service) GetFamily(familyID string) (*models.Family, error) {
	doc, err := s.client.Collection("families").Doc(familyID).Get(s.ctx)
	if err != nil {
		return nil, err
	}

	var family models.Family
	if err := doc.DataTo(&family); err != nil {
		return nil, err
	}
	family.ID = doc.Ref.ID

	return &family, nil
}

// CreateFamily creates a new family
func (s *Service) CreateFamily(family *models.Family) error {
	family.CreatedAt = time.Now()
	family.UpdatedAt = time.Now()

	_, err := s.client.Collection("families").Doc(family.ID).Set(s.ctx, family)
	return err
}

// UpdateFamily updates an existing family
func (s *Service) UpdateFamily(family *models.Family) error {
	family.UpdatedAt = time.Now()

	_, err := s.client.Collection("families").Doc(family.ID).Set(s.ctx, family, firestore.MergeAll)
	return err
}

// DeleteFamily deletes a family
func (s *Service) DeleteFamily(familyID string) error {
	_, err := s.client.Collection("families").Doc(familyID).Delete(s.ctx)
	return err
}

// GetUser retrieves user information by ID
func (s *Service) GetUser(userID string) (*models.User, error) {
	doc, err := s.client.Collection("users").Doc(userID).Get(s.ctx)
	if err != nil {
		return nil, err
	}

	var user models.User
	if err := doc.DataTo(&user); err != nil {
		return nil, err
	}
	user.ID = doc.Ref.ID

	return &user, nil
}

// GetUserByFirebaseUID retrieves user information by Firebase UID
func (s *Service) GetUserByFirebaseUID(firebaseUID string) (*models.User, error) {
	iter := s.client.Collection("users").
		Where("firebaseUID", "==", firebaseUID).
		Limit(1).
		Documents(s.ctx)

	defer iter.Stop()

	doc, err := iter.Next()
	if err != nil {
		return nil, ErrUserNotFound
	}

	var user models.User
	if err := doc.DataTo(&user); err != nil {
		return nil, err
	}
	user.ID = doc.Ref.ID
	return &user, nil
}

// CreateUser creates a new user in the database
func (s *Service) CreateUser(user *models.User) error {
	_, err := s.client.Collection("users").Doc(user.ID).Set(s.ctx, user)
	return err
}

// UpdateUser updates an existing user in the database
func (s *Service) UpdateUser(user *models.User) error {
	_, err := s.client.Collection("users").Doc(user.ID).Set(s.ctx, user)
	return err
}

// DeleteUser deletes a user from the database
func (s *Service) DeleteUser(userID string) error {
	_, err := s.client.Collection("users").Doc(userID).Delete(s.ctx)
	return err
}

// GetFamilyChildren retrieves all child accounts in a family
func (s *Service) GetFamilyChildren(familyID string) ([]models.ChildAccount, error) {
	var children []models.ChildAccount

	// Query the "children" collection directly since that's where CreateChild stores the data
	iter := s.client.Collection("children").
		Where("familyId", "==", familyID).
		Documents(s.ctx)

	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		var child models.ChildAccount
		if err := doc.DataTo(&child); err != nil {
			continue
		}
		child.ID = doc.Ref.ID

		children = append(children, child)
	}

	return children, nil
}

// GetFamilyProgress retrieves progress data for all family children (not parents)
func (s *Service) GetFamilyProgress(familyID string) ([]models.FamilyProgress, error) {
	var progress []models.FamilyProgress
	userIDMap := make(map[string]bool) // Track processed user IDs to avoid duplicates

	// Get children from the "children" collection (created via CreateChild)
	childrenIter := s.client.Collection("children").
		Where("familyId", "==", familyID).
		Documents(s.ctx)

	defer childrenIter.Stop()

	for {
		doc, err := childrenIter.Next()
		if err != nil {
			break
		}

		var child models.ChildAccount
		if err := doc.DataTo(&child); err != nil {
			continue
		}
		child.ID = doc.Ref.ID

		// Skip if we've already processed this user ID
		if userIDMap[child.ID] {
			continue
		}
		userIDMap[child.ID] = true

		// Get test results for this child
		results, err := s.GetTestResults(child.ID)
		if err != nil {
			results = []models.TestResult{} // Continue with empty results
		}

		// Calculate progress metrics
		totalTests := len(results)
		totalScore := 0.0
		totalWords := 0
		correctWords := 0

		for _, result := range results {
			totalScore += result.Score
			totalWords += result.TotalWords
			correctWords += result.CorrectWords
		}

		averageScore := 0.0
		if totalTests > 0 {
			averageScore = totalScore / float64(totalTests)
		}

		// Get recent results (last 5)
		recentResults := results
		if len(results) > 5 {
			recentResults = results[:5]
		}

		var lastActivity time.Time
		if len(results) > 0 {
			lastActivity = results[0].CompletedAt
		}

		childProgress := models.FamilyProgress{
			UserID:        child.ID,
			UserName:      child.DisplayName,
			Role:          child.Role, // Should be "child"
			TotalTests:    totalTests,
			AverageScore:  averageScore,
			TotalWords:    totalWords,
			CorrectWords:  correctWords,
			LastActivity:  lastActivity,
			RecentResults: recentResults,
		}
		progress = append(progress, childProgress)
	}

	// Also get children from the "users" collection who have role "child" for backward compatibility
	usersIter := s.client.Collection("users").
		Where("familyId", "==", familyID).
		Where("role", "==", "child").
		Documents(s.ctx)

	defer usersIter.Stop()

	for {
		doc, err := usersIter.Next()
		if err != nil {
			break
		}

		var user models.User
		if err := doc.DataTo(&user); err != nil {
			continue
		}
		user.ID = doc.Ref.ID

		// Skip if we've already processed this user ID
		if userIDMap[user.ID] {
			continue
		}
		userIDMap[user.ID] = true

		// Get test results for this child user
		results, err := s.GetTestResults(user.ID)
		if err != nil {
			results = []models.TestResult{} // Continue with empty results
		}

		// Calculate progress metrics
		totalTests := len(results)
		totalScore := 0.0
		totalWords := 0
		correctWords := 0

		for _, result := range results {
			totalScore += result.Score
			totalWords += result.TotalWords
			correctWords += result.CorrectWords
		}

		averageScore := 0.0
		if totalTests > 0 {
			averageScore = totalScore / float64(totalTests)
		}

		// Get recent results (last 5)
		recentResults := results
		if len(results) > 5 {
			recentResults = results[:5]
		}

		var lastActivity time.Time
		if len(results) > 0 {
			lastActivity = results[0].CompletedAt
		}

		userProgress := models.FamilyProgress{
			UserID:        user.ID,
			UserName:      user.DisplayName,
			Role:          user.Role,
			TotalTests:    totalTests,
			AverageScore:  averageScore,
			TotalWords:    totalWords,
			CorrectWords:  correctWords,
			LastActivity:  lastActivity,
			RecentResults: recentResults,
		}
		progress = append(progress, userProgress)
	}

	return progress, nil
}

// GetFamilyStats retrieves aggregated statistics for a family
func (s *Service) GetFamilyStats(familyID string) (*models.FamilyStats, error) {
	// Get all test results for family members
	familyMembers, err := s.client.Collection("users").
		Where("familyId", "==", familyID).
		Documents(s.ctx).GetAll()

	if err != nil {
		return nil, err
	}

	var memberIDs []string
	for _, doc := range familyMembers {
		memberIDs = append(memberIDs, doc.Ref.ID)
	}

	if len(memberIDs) == 0 {
		return &models.FamilyStats{
			TotalMembers:        0,
			TotalChildren:       0,
			TotalWordSets:       0,
			TotalTestsCompleted: 0,
			AverageFamilyScore:  0,
			LastActivity:        time.Time{},
		}, nil
	}

	// Get all test results for family members
	var allResults []models.TestResult
	for _, memberID := range memberIDs {
		results, err := s.GetTestResults(memberID)
		if err == nil {
			allResults = append(allResults, results...)
		}
	}

	// Calculate aggregated stats
	totalTests := len(allResults)
	totalScore := 0.0
	totalWords := 0
	correctWords := 0

	for _, result := range allResults {
		totalScore += result.Score
		totalWords += result.TotalWords
		correctWords += result.CorrectWords
	}

	averageScore := 0.0
	if totalTests > 0 {
		averageScore = totalScore / float64(totalTests)
	}

	// Count children
	childrenCount := 0
	for _, memberID := range memberIDs {
		user, err := s.GetUser(memberID)
		if err == nil && user.Role == "child" {
			childrenCount++
		}
	}

	// Count word sets for this family
	wordSets, err := s.GetWordSets(familyID)
	wordSetsCount := 0
	if err == nil {
		wordSetsCount = len(wordSets)
	}

	// Find most recent activity
	var lastActivity time.Time
	for _, result := range allResults {
		if result.CompletedAt.After(lastActivity) {
			lastActivity = result.CompletedAt
		}
	}

	stats := &models.FamilyStats{
		TotalMembers:        len(memberIDs),
		TotalChildren:       childrenCount,
		TotalWordSets:       wordSetsCount,
		TotalTestsCompleted: totalTests,
		AverageFamilyScore:  averageScore,
		LastActivity:        lastActivity,
	}

	return stats, nil
}

// VerifyFamilyMembership checks if a user belongs to a specific family
func (s *Service) VerifyFamilyMembership(userID, familyID string) error {
	user, err := s.GetUser(userID)
	if err != nil {
		return err
	}

	if user.FamilyID != familyID {
		return ErrNotFamilyMember
	}

	return nil
}

// VerifyParentPermission checks if a user is a parent in the specified family
func (s *Service) VerifyParentPermission(userID, familyID string) error {
	user, err := s.GetUser(userID)
	if err != nil {
		return err
	}

	if user.FamilyID != familyID {
		return ErrNotFamilyMember
	}

	if user.Role != "parent" {
		return ErrNotParent
	}

	return nil
}

// VerifyChildOwnership checks if a parent owns a specific child account
func (s *Service) VerifyChildOwnership(parentID, childID string) error {
	child, err := s.GetUser(childID)
	if err != nil {
		return err
	}

	if child.ParentID == nil || *child.ParentID != parentID {
		return ErrNotChildOwner
	}

	return nil
}

// VerifyWordSetAccess checks if a family can access a specific word set
func (s *Service) VerifyWordSetAccess(familyID, wordSetID string) error {
	doc, err := s.client.Collection("wordsets").Doc(wordSetID).Get(s.ctx)
	if err != nil {
		return ErrWordSetNotFound
	}

	var wordSet models.WordSet
	if err := doc.DataTo(&wordSet); err != nil {
		return err
	}

	if wordSet.FamilyID != familyID {
		return ErrWordSetNotFound
	}

	return nil
}

// Child management methods

// GetChild retrieves a specific child account
func (s *Service) GetChild(childID string) (*models.ChildAccount, error) {
	doc, err := s.client.Collection("children").Doc(childID).Get(s.ctx)
	if err != nil {
		return nil, err
	}

	var child models.ChildAccount
	if err := doc.DataTo(&child); err != nil {
		return nil, err
	}

	return &child, nil
}

// CreateChild creates a new child account
func (s *Service) CreateChild(child *models.ChildAccount) error {
	child.CreatedAt = time.Now()
	child.LastActiveAt = time.Now()

	_, err := s.client.Collection("children").Doc(child.ID).Set(s.ctx, child)
	return err
}

// UpdateChild updates an existing child account
func (s *Service) UpdateChild(child *models.ChildAccount) error {
	child.LastActiveAt = time.Now()

	_, err := s.client.Collection("children").Doc(child.ID).Set(s.ctx, child, firestore.MergeAll)
	return err
}

// DeleteChild deletes a child account
func (s *Service) DeleteChild(childID string) error {
	_, err := s.client.Collection("children").Doc(childID).Delete(s.ctx)
	return err
}

// User progress methods

// GetUserProgress retrieves progress data for a specific user
func (s *Service) GetUserProgress(userID string) (*models.FamilyProgress, error) {
	// Query progress collection for the specific user
	docs, err := s.client.Collection("progress").Where("user_id", "==", userID).Documents(s.ctx).GetAll()
	if err != nil {
		return nil, err
	}

	if len(docs) == 0 {
		// Return empty progress if none found
		return &models.FamilyProgress{
			UserID:        userID,
			UserName:      "",
			Role:          "",
			TotalTests:    0,
			AverageScore:  0.0,
			TotalWords:    0,
			CorrectWords:  0,
			LastActivity:  time.Time{},
			RecentResults: []models.TestResult{},
		}, nil
	}

	// For simplicity, return the first progress record
	// In a real app, you might want to aggregate multiple progress records
	var progress models.FamilyProgress
	if err := docs[0].DataTo(&progress); err != nil {
		return nil, err
	}

	return &progress, nil
}

// Custom errors for security validation
var (
	ErrNotFamilyMember = errors.New("user is not a member of this family")
	ErrNotParent       = errors.New("user is not a parent")
	ErrNotChildOwner   = errors.New("user does not own this child account")
	ErrWordSetNotFound = errors.New("word set not found or not accessible")
	ErrUserNotFound    = errors.New("user not found")
)
