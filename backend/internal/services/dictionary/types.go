package dictionary

// suggestResponse represents the response from ord.uib.no /api/suggest endpoint
// Example: https://ord.uib.no/api/suggest?q=katt&dict=bm&n=10
// The actual response wraps results in an "a" object
type suggestResponse struct {
	Q      string         `json:"q"`
	A      suggestResults `json:"a"`
	Cnt    int            `json:"cnt"`
	CMatch int            `json:"cmatch"`
}

// suggestResults contains the actual suggestion arrays
type suggestResults struct {
	Exact    []suggestEntry `json:"exact"`    // Exact matches
	Freetext []suggestEntry `json:"freetext"` // Freetext matches (inflected forms)
	Inflect  []suggestEntry `json:"inflect"`  // Inflection matches
	Similar  []suggestEntry `json:"similar"`  // Similar words
}

// suggestEntry is a tuple of [word, [dict1, dict2, ...]]
type suggestEntry []interface{}

// GetWord extracts the word from a suggest entry
func (e suggestEntry) GetWord() string {
	if len(e) > 0 {
		if word, ok := e[0].(string); ok {
			return word
		}
	}
	return ""
}

// articlesLookupResponse represents the response from /api/articles?w=word&dict=bm
// This returns article IDs for a given word
type articlesLookupResponse struct {
	Meta     map[string]articleMeta `json:"meta"`     // Meta info per dictionary
	Articles map[string][]int       `json:"articles"` // Article IDs per dictionary
}

// articleMeta contains metadata about article lookup
type articleMeta struct {
	Total int `json:"total"` // Total articles found
}

// article represents a single dictionary article from /{dict}/article/{id}.json
type article struct {
	Body      body     `json:"body"`
	Suggest   []string `json:"suggest"`
	Lemmas    []lemma  `json:"lemmas"`
	ArticleID int      `json:"article_id"`
}

// lemma represents a word lemma (base form) with its paradigm information
type lemma struct {
	Lemma           string         `json:"lemma"`
	InflectionClass string         `json:"inflection_class"` // e.g., "m1", "v1"
	ParadigmInfo    []paradigmInfo `json:"paradigm_info"`
}

// paradigmInfo represents word inflection patterns and grammatical info
type paradigmInfo struct {
	Tags       []string     `json:"tags"`       // Word class tags (e.g., "NOUN", "Masc")
	Inflection []inflection `json:"inflection"` // Inflected forms
}

// inflection represents a single inflected form of a word
type inflection struct {
	WordForm string   `json:"word_form"`
	Tags     []string `json:"tags"`
}

// body represents the article body with definitions
type body struct {
	Definitions []definition  `json:"definitions"`
	Etymology   []interface{} `json:"etymology"` // Etymology information (complex structure)
}

// definition represents a word definition
type definition struct {
	Content []interface{} `json:"content"` // Mixed content (strings and objects)
}
