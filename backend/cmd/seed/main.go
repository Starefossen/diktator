package main

import (
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/starefossen/diktator/backend/internal/migrate"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services"
	"github.com/starefossen/diktator/backend/internal/services/xp"
)

var norwegianWords = map[string][]struct {
	word        string
	definition  string
	translation string // English translation for translation mode
}{
	"Animals": {
		{"hund", "Et firbeint kjæledyr som gjerne bjeffеr", "dog"},
		{"katt", "Et lite kjæledyr som sier mjau", "cat"},
		{"fugl", "Et dyr som flyr og har vinger", "bird"},
		{"fisk", "Et dyr som svømmer i vannet", "fish"},
		{"hest", "Et stort dyr som man kan ri på", "horse"},
		{"ku", "Et stort dyr som gir melk", "cow"},
		{"gris", "Et rosa dyr som liker å bade i gjørme", "pig"},
		{"sau", "Et dyr med ull som sier bæ", "sheep"},
		{"kanin", "Et lite dyr med lange ører som hopper", "rabbit"},
		{"mus", "Et veldig lite dyr som liker ost", "mouse"},
	},
	"Colors": {
		{"rød", "Fargen på blod og jordbær", "red"},
		{"blå", "Fargen på himmelen og havet", "blue"},
		{"grønn", "Fargen på gress og trær", "green"},
		{"gul", "Fargen på solen og bananer", "yellow"},
		{"oransje", "Fargen på appelsiner og gulrøtter", "orange"},
		{"lilla", "Fargen mellom rødt og blått", "purple"},
		{"rosa", "En lys variant av rød farge", "pink"},
		{"hvit", "Fargen på snø og melk", "white"},
		{"svart", "Den mørkeste fargen", "black"},
		{"brun", "Fargen på jord og tre", "brown"},
	},
	"Family": {
		{"mor", "Den kvinnelige forelderen", "mother"},
		{"far", "Den mannlige forelderen", "father"},
		{"søster", "Jente som har samme foreldre som deg", "sister"},
		{"bror", "Gutt som har samme foreldre som deg", "brother"},
		{"bestemor", "Mamma til mamma eller pappa", "grandmother"},
		{"bestefar", "Pappa til mamma eller pappa", "grandfather"},
		{"tante", "Søster til mamma eller pappa", "aunt"},
		{"onkel", "Bror til mamma eller pappa", "uncle"},
		{"sønn", "Et mannlig barn", "son"},
		{"datter", "Et kvinnelig barn", "daughter"},
	},
	"Food": {
		{"brød", "Noe man baker av mel og spiser til frokost", "bread"},
		{"melk", "Hvit drikke som kommer fra kyr", "milk"},
		{"ost", "Mat laget av kumelk, ofte gul", "cheese"},
		{"eple", "En rund frukt som ofte er rød eller grønn", "apple"},
		{"banan", "En lang gul frukt som aper liker", "banana"},
		{"gulrot", "En oransje grønnsak som vokser i jorda", "carrot"},
		{"potet", "En grønnsak som vokser under jorda", "potato"},
		{"tomat", "En rød frukt som brukes i salat", "tomato"},
		{"kjøtt", "Mat som kommer fra dyr", "meat"},
		{"fisk", "Dyr fra havet som man kan spise", "fish"},
	},
	"School": {
		{"bok", "Noe man leser med mange sider", "book"},
		{"penn", "Noe man skriver med, bruker blekk", "pen"},
		{"blyant", "Noe man skriver med, kan viskes bort", "pencil"},
		{"skole", "Sted hvor barn lærer nye ting", "school"},
		{"lærer", "Person som hjelper barn å lære", "teacher"},
		{"elev", "Barn som går på skolen", "student"},
		{"tavle", "Stor flate som læreren skriver på", "board"},
		{"sekk", "Pose som barna bærer på ryggen", "backpack"},
		{"linjal", "Verktøy for å måle lengde", "ruler"},
		{"papir", "Hvitt materiale man skriver på", "paper"},
	},
}

// calculateXPForTest calculates XP for a test result using the same formulas as the XP service
func calculateXPForTest(score float64, mode models.TestMode, isFirstTime bool, completionCount int, daysAgo int) int {
	// Get base XP for mode
	baseXP := xp.BaseXPByMode[string(mode)]

	// Apply score multiplier
	scoreMultiplier := xp.ScoreMultiplier(score)

	// Apply first-time bonus
	firstTimeBonus := 1.0
	if isFirstTime {
		firstTimeBonus = 3.0
	}

	// Apply repetition decay (only if within 7 days and not first time)
	repetitionDecay := 1.0
	if !isFirstTime && daysAgo <= 7 {
		// completionCount includes THIS attempt, so:
		// 1 = first time (no decay)
		// 2 = second time (50% decay)
		// 3 = third time (25% decay)
		// 4+ = fourth+ time (10% decay)
		if completionCount == 2 {
			repetitionDecay = 0.5
		} else if completionCount == 3 {
			repetitionDecay = 0.25
		} else if completionCount >= 4 {
			repetitionDecay = 0.1
		}
	}

	totalXP := float64(baseXP) * scoreMultiplier * firstTimeBonus * repetitionDecay

	// Round down (int conversion), minimum 1 XP
	if totalXP < 1.0 {
		return 1
	}
	return int(totalXP)
}

func main() {
	log.Println("🌱 Starting database seeding...")

	// Run database migrations first
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgresql://postgres:postgres@localhost:5432/diktator?sslmode=disable"
	}

	log.Println("📦 Running database migrations...")
	if err := migrate.Run(databaseURL); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}

	// Initialize services
	serviceManager, err := services.NewManager()
	if err != nil {
		log.Fatalf("Failed to initialize services: %v", err)
	}
	defer serviceManager.Close()

	// Seed random number generator
	rand.Seed(time.Now().UnixNano())

	log.Println("📝 Skipping example families - using only development family...")

	// Track XP for each child across all test results
	childXP := make(map[string]int)
	childCompletions := make(map[string]map[string]int) // childID -> wordSetID|mode -> count

	// Create the mock dev user with test data
	log.Println("🔧 Creating mock development user with test data...")
	mockUserID := "mock-user-12345"
	mockFamilyID := "family-mock"

	mockUser := &models.User{
		ID:           mockUserID,
		AuthID:       mockUserID, // This matches the AuthID from mock.go
		Email:        "dev@localhost",
		DisplayName:  "Development User",
		FamilyID:     "", // Set after family creation
		Role:         "parent",
		IsActive:     true,
		CreatedAt:    time.Now().Add(-30 * 24 * time.Hour),
		LastActiveAt: time.Now(),
	}

	// Create user (without family_id yet)
	if err := serviceManager.DB.CreateUser(mockUser); err != nil {
		log.Printf("  Warning: Failed to create mock development user: %v", err)
		log.Println("  Skipping mock user setup...")
	} else {
		log.Println("  ✓ Created mock development user")

		// Create mock family
		mockFamily := &models.Family{
			ID:        mockFamilyID,
			Name:      "Development Family",
			CreatedBy: mockUserID,
			Members:   []string{mockUserID},
			CreatedAt: mockUser.CreatedAt,
			UpdatedAt: mockUser.CreatedAt,
		}
		if err := serviceManager.DB.CreateFamily(mockFamily); err != nil {
			log.Printf("  Warning: Failed to create mock family: %v", err)
		} else {
			log.Println("  ✓ Created mock family")
		}

		// Update user with family ID
		mockUser.FamilyID = mockFamilyID
		if err := serviceManager.DB.UpdateUser(mockUser); err != nil {
			log.Printf("  Warning: Failed to update mock user with family ID: %v", err)
		}

		// Create mock children with varied ages and progress levels
		mockChildren := []struct {
			name string
			age  int
		}{
			{"Mia Dev", 6},  // Minimal progress (2-3 tests, 40-60% scores)
			{"Alex Dev", 9}, // Medium progress (6-9 tests, 65-80% scores)
			{"Sam Dev", 12}, // Lots of progress (10-15 tests, 75-92% scores)
		}

		for j, childData := range mockChildren {
			childID := fmt.Sprintf("mock-child-%d", j+1)

			// Calculate birth year from age
			currentYear := time.Now().Year()
			birthYear := currentYear - childData.age

			child := &models.User{
				ID:           childID,
				AuthID:       childID,
				Email:        fmt.Sprintf("child%d@dev.localhost", j+1),
				DisplayName:  childData.name,
				FamilyID:     mockFamilyID,
				Role:         "child",
				ParentID:     &mockUserID,
				IsActive:     true,
				BirthYear:    &birthYear,
				CreatedAt:    mockUser.CreatedAt.Add(time.Duration(j+1) * 24 * time.Hour),
				LastActiveAt: time.Now(),
			}

			if err := serviceManager.DB.CreateUser(child); err != nil {
				log.Printf("    Warning: Failed to create mock child %s: %v", child.DisplayName, err)
				continue
			}

			// Add child to family_members table
			if err := serviceManager.DB.AddFamilyMember(mockFamilyID, childID, "child"); err != nil {
				log.Printf("    Warning: Failed to add mock child to family_members: %v", err)
			}

			log.Printf("    ✓ Created mock child: %s (age %d)", child.DisplayName, childData.age)
		}

		// Create word sets for mock family
		log.Printf("  📚 Creating word sets for development family...")
		wordSetCount := 0

		// Define modes for different wordsets (same as main families)
		wordSetModes := map[string]struct {
			mode                 string
			targetLanguage       string
			translationDirection string
			includeTranslations  bool
		}{
			"Animals": {"translation", "en", "toTarget", true}, // Translation mode: Norwegian → English
			"Colors":  {"keyboard", "", "", false},             // Keyboard mode (audio-only spelling)
			"Family":  {"flashcard", "", "", false},            // Flashcard mode (visual exposure)
			"Food":    {"translation", "en", "toSource", true}, // Translation mode: English → Norwegian
			"School":  {"keyboard", "", "", false},             // Keyboard mode (audio-only spelling)
		}

		for category, words := range norwegianWords {
			// Only create 2 word sets for the mock user (Animals and Colors) to keep it simple
			if category != "Animals" && category != "Colors" {
				continue
			}

			wordSetID := fmt.Sprintf("wordset-mock-%s", category)

			// Get mode configuration for this category
			modeConfig, exists := wordSetModes[category]
			if !exists {
				modeConfig = struct {
					mode                 string
					targetLanguage       string
					translationDirection string
					includeTranslations  bool
				}{"flashcard", "", "", false}
			}

			// Build words array for the word set
			wordsArray := make([]struct {
				Word         string               `json:"word"`
				Audio        models.WordAudio     `json:"audio,omitempty"`
				Definition   string               `json:"definition,omitempty"`
				Translations []models.Translation `json:"translations,omitempty"`
			}, len(words))

			for pos, wordData := range words {
				var translations []models.Translation

				// Add English translation for translation mode wordsets
				if modeConfig.includeTranslations && modeConfig.targetLanguage != "" && wordData.translation != "" {
					translations = []models.Translation{
						{
							Language: modeConfig.targetLanguage,
							Text:     wordData.translation,
						},
					}
				}

				wordsArray[pos] = struct {
					Word         string               `json:"word"`
					Audio        models.WordAudio     `json:"audio,omitempty"`
					Definition   string               `json:"definition,omitempty"`
					Translations []models.Translation `json:"translations,omitempty"`
				}{
					Word:         wordData.word,
					Definition:   wordData.definition,
					Translations: translations,
				}
			}

			// Create test configuration
			testConfig := map[string]interface{}{
				"defaultMode": modeConfig.mode,
				"maxAttempts": 3,
			}

			// Add mode-specific settings
			if modeConfig.mode == "keyboard" {
				testConfig["autoPlayAudio"] = true
			} else if modeConfig.mode == "translation" && modeConfig.targetLanguage != "" {
				testConfig["targetLanguage"] = modeConfig.targetLanguage
				if modeConfig.translationDirection != "" {
					testConfig["translationDirection"] = modeConfig.translationDirection
				}
			}

			wordSet := &models.WordSet{
				ID:                wordSetID,
				Name:              fmt.Sprintf("Norwegian %s", category),
				Words:             wordsArray,
				FamilyID:          &mockFamilyID,
				IsGlobal:          false,
				CreatedBy:         mockUserID,
				Language:          "no",
				TestConfiguration: &testConfig,
				CreatedAt:         mockUser.CreatedAt.Add(time.Duration(wordSetCount+1) * 7 * 24 * time.Hour),
				UpdatedAt:         mockUser.CreatedAt.Add(time.Duration(wordSetCount+1) * 7 * 24 * time.Hour),
			}

			if err := serviceManager.DB.CreateWordSet(wordSet); err != nil {
				log.Printf("    Warning: Failed to create word set %s: %v", wordSet.Name, err)
				continue
			}

			log.Printf("    ✓ Created word set: %s (%d words, mode: %s)", wordSet.Name, len(words), modeConfig.mode)
			wordSetCount++

			// Create test results for mock children showing realistic age-based progress
			for j, childData := range mockChildren {
				childID := fmt.Sprintf("mock-child-%d", j+1)

				// More realistic test counts and score ranges
				// 6 years: 1-2 tests PER word set, 35-55% scores (struggling, just starting)
				// 9 years: 3-4 tests PER word set, 60-78% scores (medium, still learning)
				// 12 years: 5-6 tests PER word set, 72-88% scores (strong but realistic)
				var numTests int
				var minScore, maxScore float64

				if childData.age <= 6 {
					numTests = 1 + rand.Intn(2)     // 1-2 tests per word set
					minScore, maxScore = 35.0, 55.0 // Lower for young kids
				} else if childData.age <= 10 {
					numTests = 3 + rand.Intn(2)     // 3-4 tests per word set
					minScore, maxScore = 60.0, 78.0 // Medium, still learning
				} else {
					numTests = 5 + rand.Intn(2)     // 5-6 tests per word set
					minScore, maxScore = 72.0, 88.0 // Strong but not perfect
				}

				for testNum := 0; testNum < numTests; testNum++ {
					// More realistic progression with variance
					// Start lower, improve gradually, but with realistic dips
					progressFactor := float64(testNum) / float64(numTests) * 0.5 // 50% improvement range
					variance := float64(rand.Intn(15)) - 7.0                     // ±7% random variance
					baseScore := minScore + progressFactor*(maxScore-minScore) + variance

					// Clamp to realistic bounds
					if baseScore < minScore-5.0 {
						baseScore = minScore - 5.0
					}
					if baseScore > maxScore {
						baseScore = maxScore
					}
					if baseScore < 20.0 {
						baseScore = 20.0 // Minimum realistic score
					}

					correctWords := int(float64(len(words)) * baseScore / 100.0)

					// Create word results
					wordResults := make([]models.WordTestResult, len(words))
					for wi, word := range words {
						isCorrect := wi < correctWords
						attempts := 1
						userAnswers := []string{word.word}
						finalAnswer := word.word

						if !isCorrect {
							attempts = 1 + rand.Intn(2)
							runes := []rune(word.word)
							if len(runes) > 0 {
								wrongIdx := rand.Intn(len(runes))
								runes[wrongIdx] = 'x'
								finalAnswer = string(runes)
								userAnswers = []string{finalAnswer}
							}
						}

						wordResults[wi] = models.WordTestResult{
							Word:           word.word,
							UserAnswers:    userAnswers,
							Attempts:       attempts,
							Correct:        isCorrect,
							TimeSpent:      5 + rand.Intn(15),
							FinalAnswer:    finalAnswer,
							HintsUsed:      0,
							AudioPlayCount: 1 + rand.Intn(3),
						}
					}

					totalTimeSpent := 0
					for _, wr := range wordResults {
						totalTimeSpent += wr.TimeSpent
					}

					// Calculate XP for this test result
					completionKey := wordSetID + "|" + modeConfig.mode
					if childCompletions[childID] == nil {
						childCompletions[childID] = make(map[string]int)
					}
					completionCount := childCompletions[childID][completionKey]
					isFirstTime := completionCount == 0
					daysAgo := (numTests - testNum) * 5
					xpAwarded := calculateXPForTest(baseScore, models.TestMode(modeConfig.mode), isFirstTime, completionCount+1, daysAgo)
					childCompletions[childID][completionKey]++
					childXP[childID] += xpAwarded
					testResult := &models.TestResult{
						ID:           fmt.Sprintf("result-mock-%d-%d-%d", j+1, wordSetCount, testNum),
						WordSetID:    wordSetID,
						UserID:       childID,
						Mode:         modeConfig.mode,
						Score:        baseScore,
						TotalWords:   len(words),
						CorrectWords: correctWords,
						Words:        wordResults,
						TimeSpent:    totalTimeSpent,
						XPAwarded:    xpAwarded,
						CompletedAt:  time.Now().Add(-time.Duration(numTests-testNum) * 5 * 24 * time.Hour),
						CreatedAt:    time.Now().Add(-time.Duration(numTests-testNum) * 5 * 24 * time.Hour),
					}

					if err := serviceManager.DB.SaveTestResult(testResult); err != nil {
						log.Printf("      Warning: Failed to create test result for mock child: %v", err)
					}
				}

				// Create mastery records with realistic variation for mock children
				childAge := mockChildren[j].age
				for _, word := range words {
					// Letter tiles - all children show some progress
					if childAge >= models.WordBankUnlockAge {
						// Age 6+: Unlock word bank, vary mastery (some words fully mastered, some not)
						// Mia (6): 40-60% mastery, Alex (9): 70-90% mastery, Sam (12): 90-100% mastery
						var masteryChance int
						if childAge <= 6 {
							masteryChance = 50 // 50% chance to master each word
						} else if childAge <= 10 {
							masteryChance = 80 // 80% chance
						} else {
							masteryChance = 95 // 95% chance
						}

						if rand.Intn(100) < masteryChance {
							serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeLetterTiles)
							serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeLetterTiles)
						} else {
							// Partial progress (1 mastery point)
							serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeLetterTiles)
						}
					} else {
						// Under 6: Always partial mastery
						serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeLetterTiles)
					}

					// Word bank - age 7+, vary mastery
					if childAge >= models.KeyboardUnlockAge {
						var wordBankChance int
						if childAge <= 9 {
							wordBankChance = 30 // Alex: 30% mastery on word bank
						} else {
							wordBankChance = 75 // Sam: 75% mastery on word bank
						}

						if rand.Intn(100) < wordBankChance {
							serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeWordBank)
							serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeWordBank)
						}
					}

					// Keyboard - age 7+, Sam should have some mastery
					if childAge >= 12 {
						// Sam: 40% mastery on keyboard (hardest mode)
						if rand.Intn(100) < 40 {
							serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeKeyboard)
							serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeKeyboard)
						}
					}
				}

				log.Printf("      ✓ Created mastery records for %s (age %d): realistic varied progress", mockChildren[j].name, childAge)
			}
		}

		// Update XP for mock children
		log.Println("  💎 Updating XP and levels for development children...")
		for childID, totalXP := range childXP {
			level := xp.GetLevelNumber(totalXP)
			if err := serviceManager.DB.UpdateUserXP(childID, 0, totalXP, level); err != nil {
				log.Printf("    Warning: Failed to update XP for child %s: %v", childID, err)
			} else {
				levelInfo := xp.GetLevelInfo(level)
				log.Printf("    ✓ Child %s: %d XP, Level %d (%s)", childID, totalXP, level, levelInfo.NameNO)
			}
		}
	}

	log.Println("✅ Database seeding completed successfully!")
	log.Println("")
	log.Println("📊 Summary:")
	log.Println("  - 1 development family with realistic test data")
	log.Println("  - 3 children (Mia, Alex, Sam) with varied ages and progress")
	log.Println("  - 2 word sets (Animals, Colors) for development family")
	log.Println("  - Curated word sets are created by database migrations (not seed)")
	log.Println("  - Realistic test results with XP progression")
	log.Println("")
	log.Println("🔧 Development User:")
	log.Println("  - Email: dev@localhost")
	log.Println("  - Auth ID: mock-user-12345")
	log.Println("  - Family: Development Family")
	log.Println("  - Children: 2 (Alex Dev, Sam Dev)")
	log.Println("  - Word Sets: 2 (Animals, Colors)")
	log.Println("  - Use any Bearer token to authenticate in mock mode")
	log.Println("")
	log.Println("🚀 Ready for development!")
}
