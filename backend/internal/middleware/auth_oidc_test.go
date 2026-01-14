package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/auth"
	"github.com/starefossen/diktator/backend/internal/services/db"
)

type stubValidator struct{}

func (stubValidator) ValidateSession(ctx context.Context, token string) (*auth.Identity, error) {
	return &auth.Identity{ID: "oidc-user", Email: "parent@example.com"}, nil
}

func (stubValidator) ValidateSessionFromCookie(ctx context.Context, cookieValue string) (*auth.Identity, error) {
	return &auth.Identity{ID: "oidc-user", Email: "parent@example.com"}, nil
}

func (stubValidator) Close() error { return nil }

type stubRepo struct{}

func (stubRepo) Close() error                                        { return nil }
func (stubRepo) GetUser(userID string) (*models.User, error)         { return nil, db.ErrUserNotFound }
func (stubRepo) GetUserByAuthID(authID string) (*models.User, error) { return nil, db.ErrUserNotFound }
func (stubRepo) GetUserByEmail(email string) (*models.User, error)   { return nil, db.ErrUserNotFound }
func (stubRepo) CreateUser(user *models.User) error                  { return nil }
func (stubRepo) UpdateUser(user *models.User) error                  { return nil }
func (stubRepo) DeleteUser(userID string) error                      { return nil }
func (stubRepo) LinkUserToAuthID(userID, authID string) error        { return nil }
func (stubRepo) GetFamily(familyID string) (*models.Family, error)   { return nil, db.ErrFamilyNotFound }
func (stubRepo) CreateFamily(family *models.Family) error            { return nil }
func (stubRepo) UpdateFamily(family *models.Family) error            { return nil }
func (stubRepo) DeleteFamily(familyID string) error                  { return nil }
func (stubRepo) AddFamilyMember(familyID, userID, role string) error { return nil }
func (stubRepo) GetChild(childID string) (*models.ChildAccount, error) {
	return nil, db.ErrChildNotFound
}
func (stubRepo) GetFamilyChildren(familyID string) ([]models.ChildAccount, error) {
	return nil, nil
}
func (stubRepo) CreateChild(child *models.ChildAccount) error                  { return nil }
func (stubRepo) UpdateChild(child *models.ChildAccount) error                  { return nil }
func (stubRepo) DeleteChild(childID string) error                              { return nil }
func (stubRepo) GetWordSet(id string) (*models.WordSet, error)                 { return nil, db.ErrWordSetNotFound }
func (stubRepo) GetWordSets(familyID string) ([]models.WordSet, error)         { return nil, nil }
func (stubRepo) CreateWordSet(wordSet *models.WordSet) error                   { return nil }
func (stubRepo) UpdateWordSet(wordSet *models.WordSet) error                   { return nil }
func (stubRepo) DeleteWordSet(id string) error                                 { return nil }
func (stubRepo) GetTestResults(userID string) ([]models.TestResult, error)     { return nil, nil }
func (stubRepo) GetFamilyResults(familyID string) ([]models.TestResult, error) { return nil, nil }
func (stubRepo) SaveTestResult(result *models.TestResult) error                { return nil }
func (stubRepo) GetAudioFile(word, language, voiceID string) (*models.AudioFile, error) {
	return nil, nil
}
func (stubRepo) SaveAudioFile(audioFile *models.AudioFile) error { return nil }
func (stubRepo) GetFamilyProgress(familyID string) ([]models.FamilyProgress, error) {
	return nil, nil
}
func (stubRepo) GetFamilyStats(familyID string) (*models.FamilyStats, error) { return nil, nil }
func (stubRepo) GetUserProgress(userID string) (*models.FamilyProgress, error) {
	return nil, nil
}

// Family invitation operations
func (stubRepo) CreateFamilyInvitation(invitation *models.FamilyInvitation) error {
	return nil
}
func (stubRepo) GetPendingInvitationsByEmail(email string) ([]models.FamilyInvitation, error) {
	return nil, nil
}
func (stubRepo) GetFamilyInvitations(familyID string) ([]models.FamilyInvitation, error) {
	return nil, nil
}
func (stubRepo) AcceptInvitation(invitationID, userID string) error { return nil }
func (stubRepo) DeleteInvitation(invitationID string) error         { return nil }

func (stubRepo) VerifyFamilyMembership(userID, familyID string) error { return nil }
func (stubRepo) VerifyParentPermission(userID, familyID string) error { return nil }
func (stubRepo) VerifyChildOwnership(parentID, childID string) error  { return nil }
func (stubRepo) VerifyWordSetAccess(familyID, wordSetID string) error { return nil }

// Word set assignment methods
func (stubRepo) AssignWordSetToUser(wordSetID, userID, assignedBy string) error {
	return nil
}
func (stubRepo) UnassignWordSetFromUser(wordSetID, userID string) error { return nil }
func (stubRepo) GetWordSetAssignments(wordSetID string) ([]string, error) {
	return nil, nil
}
func (stubRepo) UpdateUserDisplayName(userID, displayName string) error    { return nil }
func (stubRepo) UpdateChildDisplayName(childID, displayName string) error  { return nil }
func (stubRepo) UpdateChildBirthYear(childID string, birthYear *int) error { return nil }
func (stubRepo) GetGlobalWordSets() ([]models.WordSet, error)              { return nil, nil }
func (stubRepo) IsGlobalWordSet(wordSetID string) (bool, error)            { return false, nil }

// Word mastery operations
func (stubRepo) GetWordMastery(userID, wordSetID, word string) (*models.WordMastery, error) {
	return nil, nil
}
func (stubRepo) GetWordSetMastery(userID, wordSetID string) ([]models.WordMastery, error) {
	return nil, nil
}
func (stubRepo) IncrementMastery(userID, wordSetID, word string, mode models.TestMode) (*models.WordMastery, error) {
	return nil, nil
}

// XP operations
func (stubRepo) GetUserXP(userID string) (int, int, error) {
	return 0, 1, nil
}
func (stubRepo) UpdateUserXP(userID string, xpAwarded, newTotalXP, newLevel int) error {
	return nil
}
func (stubRepo) GetRecentCompletions(userID, wordSetID, mode string, since time.Time) (int, error) {
	return 0, nil
}
func (stubRepo) IsFirstCompletion(userID, wordSetID, mode string) (bool, error) {
	return true, nil
}

func TestOIDCAuthMiddlewareRequiresRegistration(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(OIDCAuthMiddleware(stubValidator{}, stubRepo{}))
	r.GET("/protected", func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer token")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for unregistered user, got %d", w.Code)
	}

	var resp models.APIResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	dataMap, ok := resp.Data.(map[string]interface{})
	needsReg, hasFlag := dataMap["needsRegistration"].(bool)
	if !ok || !hasFlag || !needsReg {
		t.Fatalf("expected needsRegistration flag in response")
	}
}
