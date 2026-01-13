// Package dictionary provides integration with external Norwegian dictionary APIs.
package dictionary

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/cache"
)

// Service provides access to the Norwegian dictionary API (ord.uib.no)
type Service struct {
	client       *http.Client
	cache        *cache.LRUCache
	rateLimiter  *rateLimiter
	baseURL      string
	cacheEnabled bool
}

// rateLimiter implements a simple token bucket rate limiter
type rateLimiter struct {
	lastRequest time.Time
	minInterval time.Duration
	mu          sync.Mutex
}

func newRateLimiter(requestsPerSecond float64) *rateLimiter {
	return &rateLimiter{
		minInterval: time.Duration(float64(time.Second) / requestsPerSecond),
	}
}

func (r *rateLimiter) wait() {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(r.lastRequest)
	if elapsed < r.minInterval {
		time.Sleep(r.minInterval - elapsed)
	}
	r.lastRequest = time.Now()
}

// Config holds configuration for the dictionary service
type Config struct {
	BaseURL           string  // Base URL for ord.uib.no API
	RequestsPerSecond float64 // Rate limit for upstream requests
	CacheSizeBytes    int64   // LRU cache size in bytes
	CacheEnabled      bool    // Whether to enable caching
	TimeoutSeconds    int     // HTTP client timeout
}

// DefaultConfig returns default configuration for the dictionary service
func DefaultConfig() *Config {
	return &Config{
		BaseURL:           "https://ord.uib.no",
		RequestsPerSecond: 2.0,             // Conservative rate limit
		CacheSizeBytes:    5 * 1024 * 1024, // 5MB cache
		CacheEnabled:      true,
		TimeoutSeconds:    10,
	}
}

// NewService creates a new dictionary service
func NewService(config *Config) *Service {
	if config == nil {
		config = DefaultConfig()
	}

	return &Service{
		client: &http.Client{
			Timeout: time.Duration(config.TimeoutSeconds) * time.Second,
		},
		cache:        cache.NewLRUCache(config.CacheSizeBytes),
		baseURL:      config.BaseURL,
		rateLimiter:  newRateLimiter(config.RequestsPerSecond),
		cacheEnabled: config.CacheEnabled,
	}
}

// ValidateWord looks up a word in the dictionary and returns its information
// Returns nil if the word is not found
func (s *Service) ValidateWord(ctx context.Context, word, dictionary string) (*models.DictionaryWord, error) {
	if dictionary == "" {
		dictionary = "bm" // Default to Bokmål
	}

	// Normalize the word
	word = strings.ToLower(strings.TrimSpace(word))
	if word == "" {
		return nil, fmt.Errorf("word cannot be empty")
	}

	// Check cache first
	cacheKey := fmt.Sprintf("validate:%s:%s", dictionary, word)
	if s.cacheEnabled {
		if cached, ok := s.cache.Get(cacheKey); ok {
			var result models.DictionaryWord
			if err := json.Unmarshal(cached, &result); err == nil {
				return &result, nil
			}
		}
	}

	// Rate limit upstream requests
	s.rateLimiter.wait()

	// Step 1: Get article IDs for the word using /api/articles?w=word
	lookupURL := fmt.Sprintf("%s/api/articles?w=%s&dict=%s",
		s.baseURL,
		url.QueryEscape(word),
		dictionary,
	)

	req, err := http.NewRequestWithContext(ctx, "GET", lookupURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create lookup request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		log.Printf("[Dictionary] Error looking up word '%s': %v", word, err)
		return nil, fmt.Errorf("dictionary service unavailable")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[Dictionary] Lookup returned status %d for word '%s'", resp.StatusCode, word)
		return nil, nil // Word not found
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read lookup response: %v", err)
	}

	// Parse the lookup response to get article IDs
	var lookupResp articlesLookupResponse
	if err := json.Unmarshal(body, &lookupResp); err != nil {
		log.Printf("[Dictionary] Error parsing lookup response: %v", err)
		return nil, fmt.Errorf("failed to parse dictionary response")
	}

	// Get article IDs for the dictionary
	articleIDs, ok := lookupResp.Articles[dictionary]
	if !ok || len(articleIDs) == 0 {
		log.Printf("[Dictionary] No articles found for word '%s' in dict '%s'", word, dictionary)
		return nil, nil // Word not found
	}

	// Step 2: Fetch the first article using /{dict}/article/{id}.json
	return s.fetchArticle(ctx, articleIDs[0], dictionary, cacheKey)
}

// fetchArticle retrieves and parses a dictionary article by ID
// Uses the /{dict}/article/{id}.json endpoint
func (s *Service) fetchArticle(ctx context.Context, articleID int, dictionary, cacheKey string) (*models.DictionaryWord, error) {
	// Rate limit upstream requests
	s.rateLimiter.wait()

	// Use the dictionary-specific article endpoint
	articleURL := fmt.Sprintf("%s/%s/article/%d.json",
		s.baseURL,
		dictionary,
		articleID,
	)

	req, err := http.NewRequestWithContext(ctx, "GET", articleURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create article request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		log.Printf("[Dictionary] Error fetching article %d: %v", articleID, err)
		return nil, fmt.Errorf("dictionary service unavailable")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[Dictionary] Article fetch returned status %d for ID %d", resp.StatusCode, articleID)
		return nil, nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read article response: %v", err)
	}

	// Parse the article response
	var articleResp article
	if err := json.Unmarshal(body, &articleResp); err != nil {
		log.Printf("[Dictionary] Error parsing article response: %v", err)
		return nil, fmt.Errorf("failed to parse dictionary article")
	}

	// Extract the simplified DictionaryWord from the article
	result := s.parseArticle(articleResp)

	// Cache the result
	if s.cacheEnabled && result != nil {
		if data, err := json.Marshal(result); err == nil {
			s.cache.Put(cacheKey, data)
		}
	}

	return result, nil
}

// Suggest returns word suggestions for autocomplete
func (s *Service) Suggest(ctx context.Context, query, dictionary string, limit int) ([]models.DictionarySuggestion, error) {
	if dictionary == "" {
		dictionary = "bm"
	}
	if limit <= 0 {
		limit = 5
	}
	if limit > 20 {
		limit = 20
	}

	query = strings.TrimSpace(query)
	if query == "" {
		return nil, fmt.Errorf("query cannot be empty")
	}

	// Check cache first
	cacheKey := fmt.Sprintf("suggest:%s:%s:%d", dictionary, query, limit)
	if s.cacheEnabled {
		if cached, ok := s.cache.Get(cacheKey); ok {
			var result []models.DictionarySuggestion
			if err := json.Unmarshal(cached, &result); err == nil {
				return result, nil
			}
		}
	}

	// Rate limit upstream requests
	s.rateLimiter.wait()

	suggestURL := fmt.Sprintf("%s/api/suggest?q=%s&dict=%s&n=%d",
		s.baseURL,
		url.QueryEscape(query),
		dictionary,
		limit,
	)

	req, err := http.NewRequestWithContext(ctx, "GET", suggestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create suggest request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		log.Printf("[Dictionary] Error getting suggestions for '%s': %v", query, err)
		return nil, fmt.Errorf("dictionary service unavailable")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[Dictionary] Suggest returned status %d for query '%s'", resp.StatusCode, query)
		return []models.DictionarySuggestion{}, nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read suggest response: %v", err)
	}

	var suggestResp suggestResponse
	if err := json.Unmarshal(body, &suggestResp); err != nil {
		log.Printf("[Dictionary] Error parsing suggest response: %v", err)
		return nil, fmt.Errorf("failed to parse dictionary response")
	}

	// Combine exact matches and similar suggestions, avoiding duplicates
	seen := make(map[string]bool)
	var suggestions []models.DictionarySuggestion

	// Add exact matches first (these are the most relevant)
	for _, entry := range suggestResp.A.Exact {
		word := entry.GetWord()
		if word != "" && !seen[word] && len(suggestions) < limit {
			seen[word] = true
			suggestions = append(suggestions, models.DictionarySuggestion{
				Word: word,
			})
		}
	}

	// Add freetext matches (inflected forms found in text)
	for _, entry := range suggestResp.A.Freetext {
		word := entry.GetWord()
		if word != "" && !seen[word] && len(suggestions) < limit {
			seen[word] = true
			suggestions = append(suggestions, models.DictionarySuggestion{
				Word: word,
			})
		}
	}

	// Add inflection matches
	for _, entry := range suggestResp.A.Inflect {
		word := entry.GetWord()
		if word != "" && !seen[word] && len(suggestions) < limit {
			seen[word] = true
			suggestions = append(suggestions, models.DictionarySuggestion{
				Word: word,
			})
		}
	}

	// Add similar matches last
	for _, entry := range suggestResp.A.Similar {
		word := entry.GetWord()
		if word != "" && !seen[word] && len(suggestions) < limit {
			seen[word] = true
			suggestions = append(suggestions, models.DictionarySuggestion{
				Word: word,
			})
		}
	}

	// Cache the result
	if s.cacheEnabled && len(suggestions) > 0 {
		if data, err := json.Marshal(suggestions); err == nil {
			s.cache.Put(cacheKey, data)
		}
	}

	return suggestions, nil
}

// parseArticle extracts a simplified DictionaryWord from the complex article structure
func (s *Service) parseArticle(art article) *models.DictionaryWord {
	result := &models.DictionaryWord{
		ArticleID: art.ArticleID,
	}

	// Extract lemma (base form) and paradigm info
	if len(art.Lemmas) > 0 {
		lemma := art.Lemmas[0]
		result.Lemma = lemma.Lemma

		// Extract word class from paradigm info tags
		if len(lemma.ParadigmInfo) > 0 {
			paradigm := lemma.ParadigmInfo[0]
			result.WordClass = s.mapWordClass(paradigm.Tags)

			// Extract inflections
			for _, inflect := range paradigm.Inflection {
				if inflect.WordForm != "" && !contains(result.Inflections, inflect.WordForm) {
					result.Inflections = append(result.Inflections, inflect.WordForm)
				}
			}
		}

		// Fall back to inflection_class if no paradigm tags
		if result.WordClass == "" && lemma.InflectionClass != "" {
			result.WordClass = s.mapWordClass([]string{lemma.InflectionClass})
		}
	}

	// Extract first definition
	if len(art.Body.Definitions) > 0 {
		for _, def := range art.Body.Definitions {
			if len(def.Content) > 0 {
				result.Definition = extractTextContent(def.Content)
				break
			}
		}
	}

	return result
}

// mapWordClass maps Norwegian word class tags to simple labels
func (s *Service) mapWordClass(tags []string) string {
	for _, tag := range tags {
		switch strings.ToLower(tag) {
		case "m", "m1", "m2", "m3":
			return "NOUN" // Masculine noun
		case "f", "f1", "f2", "f3":
			return "NOUN" // Feminine noun
		case "n", "n1", "n2", "n3":
			return "NOUN" // Neuter noun
		case "subst":
			return "NOUN"
		case "v", "verb":
			return "VERB"
		case "adj", "a":
			return "ADJ"
		case "adv":
			return "ADV"
		case "prep":
			return "PREP"
		case "konj":
			return "CONJ"
		case "pron":
			return "PRON"
		case "det":
			return "DET"
		case "interj":
			return "INTJ"
		}
	}
	return ""
}

// extractTextContent extracts plain text from content array
func extractTextContent(content []interface{}) string {
	var parts []string
	for _, item := range content {
		if str, ok := item.(string); ok {
			parts = append(parts, str)
		} else if m, ok := item.(map[string]interface{}); ok {
			if text, ok := m["content"].(string); ok {
				parts = append(parts, text)
			}
		}
	}
	return strings.Join(parts, " ")
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// Close closes the dictionary service
func (s *Service) Close() error {
	s.cache.Clear()
	return nil
}

// CacheStats returns cache statistics
func (s *Service) CacheStats() (items int, bytes int64, maxBytes int64) {
	return s.cache.Stats()
}
