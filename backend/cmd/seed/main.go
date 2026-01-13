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

	// Create test families with users and data
	families := []struct {
		parentName   string
		parentEmail  string
		familyName   string
		childrenData []struct {
			name  string
			email string
			age   int
		}
	}{
		{
			parentName:  "Anna Hansen",
			parentEmail: "anna@example.no",
			familyName:  "Hansen Family",
			childrenData: []struct {
				name  string
				email string
				age   int
			}{
				{"Emma Hansen", "emma@example.no", 12},
				{"Lucas Hansen", "lucas@example.no", 9},
				{"Mia Hansen", "mia@example.no", 6},
			},
		},
		{
			parentName:  "Ole Johansen",
			parentEmail: "ole@example.no",
			familyName:  "Johansen Family",
			childrenData: []struct {
				name  string
				email string
				age   int
			}{
				{"Sofia Johansen", "sofia@example.no", 9},
				{"Noah Johansen", "noah@example.no", 11},
				{"Olivia Johansen", "olivia@example.no", 7},
			},
		},
		{
			parentName:  "Kari Olsen",
			parentEmail: "kari@example.no",
			familyName:  "Olsen Family",
			childrenData: []struct {
				name  string
				email string
				age   int
			}{
				{"Nora Olsen", "nora@example.no", 12},
			},
		},
	}

	log.Println("📝 Creating families and users...")

	for i, familyData := range families {
		// Create parent user
		parentID := fmt.Sprintf("parent-%d", i+1)
		familyID := fmt.Sprintf("family-%d", i+1)

		parent := &models.User{
			ID:           parentID,
			AuthID:       parentID,
			Email:        familyData.parentEmail,
			DisplayName:  familyData.parentName,
			FamilyID:     "", // Set after family creation
			Role:         "parent",
			IsActive:     true,
			CreatedAt:    time.Now().Add(-time.Duration(rand.Intn(90)) * 24 * time.Hour),
			LastActiveAt: time.Now().Add(-time.Duration(rand.Intn(7)) * 24 * time.Hour),
		}

		if err := serviceManager.DB.CreateUser(parent); err != nil {
			log.Printf("Warning: Failed to create parent %s: %v", parent.DisplayName, err)
			continue
		}

		// Create family
		family := &models.Family{
			ID:        familyID,
			Name:      familyData.familyName,
			CreatedBy: parentID,
			Members:   []string{parentID},
			CreatedAt: parent.CreatedAt,
			UpdatedAt: parent.CreatedAt,
		}

		if err := serviceManager.DB.CreateFamily(family); err != nil {
			log.Printf("Warning: Failed to create family %s: %v", family.Name, err)
			continue
		}

		// Update parent with family ID
		parent.FamilyID = familyID
		if err := serviceManager.DB.UpdateUser(parent); err != nil {
			log.Printf("Warning: Failed to update parent with family ID: %v", err)
			continue
		}

		log.Printf("  ✓ Created family: %s", family.Name)

		// Create children
		for j, childData := range familyData.childrenData {
			childID := fmt.Sprintf("child-%d-%d", i+1, j+1)

			// Calculate birth year from age
			currentYear := time.Now().Year()
			birthYear := currentYear - childData.age

			child := &models.User{
				ID:           childID,
				AuthID:       childID,
				Email:        childData.email,
				DisplayName:  childData.name,
				FamilyID:     familyID,
				Role:         "child",
				ParentID:     &parentID,
				IsActive:     true,
				BirthYear:    &birthYear,
				CreatedAt:    parent.CreatedAt.Add(time.Duration(j+1) * 24 * time.Hour),
				LastActiveAt: time.Now().Add(-time.Duration(rand.Intn(3)) * 24 * time.Hour),
			}

			if err := serviceManager.DB.CreateUser(child); err != nil {
				log.Printf("    Warning: Failed to create child %s: %v", child.DisplayName, err)
				continue
			}

			// Add child to family_members table
			if err := serviceManager.DB.AddFamilyMember(familyID, childID, "child"); err != nil {
				log.Printf("    Warning: Failed to add child to family_members: %v", err)
			}

			log.Printf("    ✓ Created child: %s (age %d)", child.DisplayName, childData.age)
		}

		// Create word sets for this family
		log.Printf("  📚 Creating word sets...")
		wordSetCount := 0

		// Define modes for different wordsets
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
			wordSetID := fmt.Sprintf("wordset-%d-%s", i+1, category)
			modeConfig := wordSetModes[category]

			// Build words array for the word set
			wordsArray := make([]struct {
				Word         string               `json:"word"`
				Audio        models.WordAudio     `json:"audio,omitempty"`
				Definition   string               `json:"definition,omitempty"`
				Translations []models.Translation `json:"translations,omitempty"`
			}, len(words))

			for pos, wordData := range words {
				var translations []models.Translation
				if modeConfig.includeTranslations && modeConfig.targetLanguage != "" {
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

			// Create test configuration based on mode
			testConfig := map[string]interface{}{
				"defaultMode":       modeConfig.mode,
				"maxAttempts":       3,
				"autoPlayAudio":     modeConfig.mode == "keyboard", // Auto-play in keyboard mode (audio-only spelling)
				"enableAutocorrect": false,
				"showCorrectAnswer": true,
				"autoAdvance":       false,
				"shuffleWords":      false,
			}
			if modeConfig.targetLanguage != "" {
				testConfig["targetLanguage"] = modeConfig.targetLanguage
			}
			if modeConfig.translationDirection != "" {
				testConfig["translationDirection"] = modeConfig.translationDirection
			}

			wordSet := &models.WordSet{
				ID:                wordSetID,
				Name:              fmt.Sprintf("Norwegian %s", category),
				Words:             wordsArray,
				FamilyID:          &familyID,
				IsGlobal:          false,
				CreatedBy:         parentID,
				Language:          "no",
				TestConfiguration: &testConfig,
				CreatedAt:         parent.CreatedAt.Add(time.Duration(wordSetCount+1) * 7 * 24 * time.Hour),
				UpdatedAt:         parent.CreatedAt.Add(time.Duration(wordSetCount+1) * 7 * 24 * time.Hour),
			}

			if err := serviceManager.DB.CreateWordSet(wordSet); err != nil {
				log.Printf("    Warning: Failed to create word set %s: %v", wordSet.Name, err)
				continue
			}

			log.Printf("    ✓ Created word set: %s (%d words, mode: %s)", wordSet.Name, len(words), modeConfig.mode)
			wordSetCount++

			// Create test results for children in this family
			for j, childData := range familyData.childrenData {
				childID := fmt.Sprintf("child-%d-%d", i+1, j+1)

				// Create realistic test results based on age and progression
				// 6 years: 2-3 tests, 40-60% scores (minimal progress)
				// 7-8 years: 4-6 tests, 55-70% scores (developing)
				// 9-10 years: 6-9 tests, 65-80% scores (medium progress)
				// 11-12 years: 10-15 tests, 75-92% scores (lots of progress, realistic)
				var numTests int
				var minScore, maxScore float64

				if childData.age <= 6 {
					numTests = 2 + rand.Intn(2) // 2-3 tests
					minScore, maxScore = 40.0, 60.0
				} else if childData.age <= 8 {
					numTests = 4 + rand.Intn(3) // 4-6 tests
					minScore, maxScore = 55.0, 70.0
				} else if childData.age <= 10 {
					numTests = 6 + rand.Intn(4) // 6-9 tests
					minScore, maxScore = 65.0, 80.0
				} else {
					numTests = 10 + rand.Intn(6) // 10-15 tests
					minScore, maxScore = 75.0, 92.0
				}

				for testNum := 0; testNum < numTests; testNum++ {
					// Calculate score with gradual improvement over tests
					progressFactor := float64(testNum) / float64(numTests) * 0.7 // 70% improvement range
					baseScore := minScore + progressFactor*(maxScore-minScore) + float64(rand.Intn(10))
					if baseScore > maxScore {
						baseScore = maxScore
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
							// Make some mistakes
							attempts = 1 + rand.Intn(2)
							// Simple mistakes: wrong letters
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
							TimeSpent:      5 + rand.Intn(15), // 5-20 seconds per word
							FinalAnswer:    finalAnswer,
							HintsUsed:      0,
							AudioPlayCount: 1 + rand.Intn(3),
						}
					}

					totalTimeSpent := 0
					for _, wr := range wordResults {
						totalTimeSpent += wr.TimeSpent
					}

					testResult := &models.TestResult{
						ID:          fmt.Sprintf("result-%d-%d-%d-%d", i+1, j+1, wordSetCount, testNum),
						WordSetID:   wordSetID,
						UserID:      childID,
						Mode:        modeConfig.mode,
						TimeSpent:   totalTimeSpent,
						CompletedAt: time.Now().Add(-time.Duration(numTests-testNum) * 7 * 24 * time.Hour),
						CreatedAt:   time.Now().Add(-time.Duration(numTests-testNum) * 7 * 24 * time.Hour),
					}

					if err := serviceManager.DB.SaveTestResult(testResult); err != nil {
						log.Printf("      Warning: Failed to create test result for %s: %v", childData.name, err)
					}
				}

				// Create mastery records to show learning progress
				// All ages: letter tiles mastery (shows their progress)
				// Age 6+: also unlock word bank (2 letter_tiles_correct per word)
				// Age 7+: also unlock keyboard (2 word_bank_correct per word)
				for _, word := range words {
					// All children get letter tiles mastery to show progress
					if childData.age >= models.WordBankUnlockAge {
						// Age 6+: Full mastery to unlock word bank
						serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeLetterTiles)
						serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeLetterTiles)
					} else {
						// Under 6: Partial mastery (shows progress but doesn't unlock)
						serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeLetterTiles)
					}

					// Age 7+: Also unlock keyboard mode
					if childData.age >= models.KeyboardUnlockAge {
						serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeWordBank)
						serviceManager.DB.IncrementMastery(childID, wordSetID, word.word, models.TestModeWordBank)
					}
				}

				log.Printf("      ✓ Created mastery records for %s (age %d): %s", childData.name, childData.age, func() string {
					if childData.age >= models.WordBankUnlockAge && childData.age >= models.KeyboardUnlockAge {
						return "word bank unlocked, keyboard unlocked"
					} else if childData.age >= models.KeyboardUnlockAge {
						return "keyboard unlocked"
					} else if childData.age >= models.WordBankUnlockAge {
						return "word bank unlocked"
					} else {
						return "letter tiles progress tracked"
					}
				}())
			}
		}
	}

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
	}

	log.Println("✅ Database seeding completed successfully!")
	log.Println("")
	log.Println("📊 Summary:")
	log.Println("  - 4 families total (3 with realistic data + 1 development family)")
	log.Println("  - 8 children across all families")
	log.Println("  - 17 family word sets (5 categories × 3 families + 2 for dev family)")
	log.Println("  - Curated word sets are created by database migrations (not seed)")
	log.Println("  - Realistic test results showing improvement over time")
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
