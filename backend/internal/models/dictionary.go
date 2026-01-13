package models

// DictionaryWord represents a simplified word entry from ord.uib.no
// This is a normalized representation extracted from the complex API response
type DictionaryWord struct {
	Lemma       string   `json:"lemma"`
	WordClass   string   `json:"wordClass"`
	Definition  string   `json:"definition"`
	Inflections []string `json:"inflections"`
	ArticleID   int      `json:"articleId"`
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
