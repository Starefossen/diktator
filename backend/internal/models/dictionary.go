package models

// DictionaryWord represents a simplified word entry from ord.uib.no
// This is a normalized representation extracted from the complex API response
type DictionaryWord struct {
	Lemma       string   `json:"lemma"`       // Base form of the word
	WordClass   string   `json:"wordClass"`   // NOUN, VERB, ADJ, ADV, etc.
	Inflections []string `json:"inflections"` // All inflected forms (katt, katten, katter, kattene)
	Definition  string   `json:"definition"`  // Primary definition only
	ArticleID   int      `json:"articleId"`   // For linking to ordbokene.no (e.g., https://ordbokene.no/bm/ID)
}

// DictionarySuggestion represents an autocomplete suggestion from the dictionary
type DictionarySuggestion struct {
	Word      string `json:"word"`
	ArticleID int    `json:"articleId"`
}

// ValidateDictionaryRequest represents the request to validate a word
type ValidateDictionaryRequest struct {
	Word       string `form:"w" binding:"required"`     // Word to validate
	Dictionary string `form:"dict" binding:"omitempty"` // Dictionary code: "bm" (bokmål), "nn" (nynorsk)
}

// SuggestDictionaryRequest represents the request to get word suggestions
type SuggestDictionaryRequest struct {
	Query      string `form:"q" binding:"required"`               // Query prefix for suggestions
	Dictionary string `form:"dict" binding:"omitempty"`           // Dictionary code: "bm" (bokmål), "nn" (nynorsk)
	Limit      int    `form:"n" binding:"omitempty,min=1,max=20"` // Number of suggestions (default 5, max 20)
}
