# WordsetsApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiWordsetsGet**](#apiwordsetsget) | **GET** /api/wordsets | Get Word Sets|
|[**apiWordsetsIdAudioAudioIdGet**](#apiwordsetsidaudioaudioidget) | **GET** /api/wordsets/{id}/audio/{audioId} | Stream Audio File by ID|
|[**apiWordsetsIdDelete**](#apiwordsetsiddelete) | **DELETE** /api/wordsets/{id} | Delete Word Set|
|[**apiWordsetsIdGenerateAudioPost**](#apiwordsetsidgenerateaudiopost) | **POST** /api/wordsets/{id}/generate-audio | Generate Audio|
|[**apiWordsetsIdPut**](#apiwordsetsidput) | **PUT** /api/wordsets/{id} | Update Word Set|
|[**apiWordsetsPost**](#apiwordsetspost) | **POST** /api/wordsets | Create Word Set|
|[**apiWordsetsVoicesGet**](#apiwordsetsvoicesget) | **GET** /api/wordsets/voices | List available TTS voices|

# **apiWordsetsGet**
> ModelsAPIResponse apiWordsetsGet()

Get word sets for the authenticated user\'s family

### Example

```typescript
import {
    WordsetsApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new WordsetsApi(configuration);

const { status, data } = await apiInstance.apiWordsetsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**ModelsAPIResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Word sets for the family |  -  |
|**401** | Family access validation required |  -  |
|**500** | Service unavailable or failed to retrieve word sets |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWordsetsIdAudioAudioIdGet**
> File apiWordsetsIdAudioAudioIdGet()

Stream audio file for a specific audio ID within a wordset

### Example

```typescript
import {
    WordsetsApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new WordsetsApi(configuration);

let id: string; //WordSet ID (default to undefined)
let audioId: string; //Audio ID to stream (default to undefined)

const { status, data } = await apiInstance.apiWordsetsIdAudioAudioIdGet(
    id,
    audioId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | WordSet ID | defaults to undefined|
| **audioId** | [**string**] | Audio ID to stream | defaults to undefined|


### Return type

**File**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: audio/mpeg


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Audio file content |  -  |
|**400** | Invalid request |  -  |
|**404** | Audio file not found |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWordsetsIdDelete**
> ModelsAPIResponse apiWordsetsIdDelete()

Delete a word set by ID and all associated audio files from storage

### Example

```typescript
import {
    WordsetsApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new WordsetsApi(configuration);

let id: string; //Word Set ID (default to undefined)

const { status, data } = await apiInstance.apiWordsetsIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Word Set ID | defaults to undefined|


### Return type

**ModelsAPIResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Word set and audio files deleted successfully |  -  |
|**400** | Word set ID is required |  -  |
|**404** | Word set not found |  -  |
|**500** | Failed to delete word set |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWordsetsIdGenerateAudioPost**
> ModelsAPIResponse apiWordsetsIdGenerateAudioPost()

Generate TTS audio for all words in a word set

### Example

```typescript
import {
    WordsetsApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new WordsetsApi(configuration);

let id: string; //Word Set ID (default to undefined)

const { status, data } = await apiInstance.apiWordsetsIdGenerateAudioPost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Word Set ID | defaults to undefined|


### Return type

**ModelsAPIResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | Audio generation started |  -  |
|**400** | Word set ID is required |  -  |
|**404** | Word set not found |  -  |
|**500** | Failed to start audio generation |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWordsetsIdPut**
> ModelsAPIResponse apiWordsetsIdPut(request)

Update an existing word set name, words, and configuration. Audio will be regenerated automatically for new/changed words.

### Example

```typescript
import {
    WordsetsApi,
    Configuration,
    ModelsUpdateWordSetRequest
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new WordsetsApi(configuration);

let id: string; //Word Set ID (default to undefined)
let request: ModelsUpdateWordSetRequest; //Word set update request

const { status, data } = await apiInstance.apiWordsetsIdPut(
    id,
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **ModelsUpdateWordSetRequest**| Word set update request | |
| **id** | [**string**] | Word Set ID | defaults to undefined|


### Return type

**ModelsAPIResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Word set updated successfully |  -  |
|**400** | Invalid request data or word set ID required |  -  |
|**401** | User authentication required |  -  |
|**404** | Word set not found |  -  |
|**500** | Failed to update word set |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWordsetsPost**
> ModelsAPIResponse apiWordsetsPost(request)

Create a new word set for practice

### Example

```typescript
import {
    WordsetsApi,
    Configuration,
    ModelsCreateWordSetRequest
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new WordsetsApi(configuration);

let request: ModelsCreateWordSetRequest; //Word set creation request

const { status, data } = await apiInstance.apiWordsetsPost(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **ModelsCreateWordSetRequest**| Word set creation request | |


### Return type

**ModelsAPIResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Word set created successfully |  -  |
|**400** | Invalid request data |  -  |
|**401** | User authentication required |  -  |
|**500** | Failed to create word set |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWordsetsVoicesGet**
> ApiWordsetsVoicesGet200Response apiWordsetsVoicesGet()

Get a list of available Text-to-Speech voices for a specific language

### Example

```typescript
import {
    WordsetsApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new WordsetsApi(configuration);

let language: string; //Language code (e.g., \'en\', \'nb-NO\') (optional) (default to undefined)

const { status, data } = await apiInstance.apiWordsetsVoicesGet(
    language
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **language** | [**string**] | Language code (e.g., \&#39;en\&#39;, \&#39;nb-NO\&#39;) | (optional) defaults to undefined|


### Return type

**ApiWordsetsVoicesGet200Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | List of available voices |  -  |
|**500** | Failed to retrieve voices |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

