package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/starefossen/diktator/backend/internal/models"
	"github.com/starefossen/diktator/backend/internal/services/dictionary"
)

// GetDictionaryService retrieves the dictionary service from context or global service manager
func GetDictionaryService(c *gin.Context) *dictionary.Service {
	sm := GetServiceManager(c)
	if sm != nil && sm.Dictionary != nil {
		return sm.Dictionary
	}
	return nil
}

// ValidateDictionaryWord validates a word against the Norwegian dictionary
// @Summary		Validate a word in the Norwegian dictionary
// @Description	Look up a word in ord.uib.no and return its information including lemma, word class, inflections, and definition
// @Tags			dictionary
// @Accept			json
// @Produce		json
// @Param			w		query		string	true	"Word to validate"
// @Param			dict	query		string	false	"Dictionary code (bm=bokmål, nn=nynorsk)"	default(bm)
// @Success		200		{object}	models.APIResponse{data=models.DictionaryWord}	"Word found in dictionary"
// @Success		200		{object}	models.APIResponse{data=nil}					"Word not found (data is null)"
// @Failure		400		{object}	models.APIResponse								"Invalid request"
// @Failure		500		{object}	models.APIResponse								"Dictionary service unavailable"
// @Router			/api/dictionary/validate [get]
func ValidateDictionaryWord(c *gin.Context) {
	dictService := GetDictionaryService(c)
	if dictService == nil {
		c.JSON(http.StatusServiceUnavailable, models.APIResponse{
			Error: "Dictionary service not available",
		})
		return
	}

	var req models.ValidateDictionaryRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Word parameter 'w' is required",
		})
		return
	}

	result, err := dictService.ValidateWord(c.Request.Context(), req.Word, req.Dictionary)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: err.Error(),
		})
		return
	}

	if result == nil {
		c.JSON(http.StatusOK, models.APIResponse{
			Data:    nil,
			Message: "Word not found in dictionary",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    result,
		Message: "Word found in dictionary",
	})
}

// SuggestDictionaryWords returns word suggestions for autocomplete
// @Summary		Get word suggestions from the Norwegian dictionary
// @Description	Get autocomplete suggestions from ord.uib.no based on a query prefix
// @Tags			dictionary
// @Accept			json
// @Produce		json
// @Param			q		query		string	true	"Query prefix for suggestions"
// @Param			dict	query		string	false	"Dictionary code (bm=bokmål, nn=nynorsk)"	default(bm)
// @Param			n		query		int		false	"Number of suggestions (1-20)"				default(5)
// @Success		200		{object}	models.APIResponse{data=[]models.DictionarySuggestion}	"Suggestions returned"
// @Failure		400		{object}	models.APIResponse										"Invalid request"
// @Failure		500		{object}	models.APIResponse										"Dictionary service unavailable"
// @Router			/api/dictionary/suggest [get]
func SuggestDictionaryWords(c *gin.Context) {
	dictService := GetDictionaryService(c)
	if dictService == nil {
		c.JSON(http.StatusServiceUnavailable, models.APIResponse{
			Error: "Dictionary service not available",
		})
		return
	}

	var req models.SuggestDictionaryRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Query parameter 'q' is required",
		})
		return
	}

	suggestions, err := dictService.Suggest(c.Request.Context(), req.Query, req.Dictionary, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: suggestions,
	})
}

// GetDictionaryStats returns dictionary service statistics
// @Summary		Get dictionary service statistics
// @Description	Get cache statistics and health status of the dictionary service
// @Tags			dictionary
// @Accept			json
// @Produce		json
// @Success		200	{object}	models.APIResponse	"Dictionary service statistics"
// @Failure		500	{object}	models.APIResponse	"Dictionary service unavailable"
// @Router			/api/dictionary/stats [get]
func GetDictionaryStats(c *gin.Context) {
	dictService := GetDictionaryService(c)
	if dictService == nil {
		c.JSON(http.StatusServiceUnavailable, models.APIResponse{
			Error: "Dictionary service not available",
		})
		return
	}

	items, bytes, maxBytes := dictService.CacheStats()

	c.JSON(http.StatusOK, models.APIResponse{
		Data: map[string]interface{}{
			"cache": map[string]interface{}{
				"items":     items,
				"usedBytes": bytes,
				"maxBytes":  maxBytes,
			},
			"status": "healthy",
		},
	})
}
