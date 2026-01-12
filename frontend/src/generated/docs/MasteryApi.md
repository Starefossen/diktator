# MasteryApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiMasteryWordSetIdGet**](#apimasterywordsetidget) | **GET** /api/mastery/{wordSetId} | Get mastery for word set|
|[**apiMasteryWordSetIdIncrementPost**](#apimasterywordsetidincrementpost) | **POST** /api/mastery/{wordSetId}/increment | Increment mastery for a word|
|[**apiMasteryWordSetIdWordWordGet**](#apimasterywordsetidwordwordget) | **GET** /api/mastery/{wordSetId}/word/{word} | Get mastery for specific word|

# **apiMasteryWordSetIdGet**
> ApiMasteryWordSetIdGet200Response apiMasteryWordSetIdGet()

Get mastery progress for all words in a word set for the authenticated user

### Example

```typescript
import {
    MasteryApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MasteryApi(configuration);

let wordSetId: string; //Word Set ID (default to undefined)

const { status, data } = await apiInstance.apiMasteryWordSetIdGet(
    wordSetId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **wordSetId** | [**string**] | Word Set ID | defaults to undefined|


### Return type

**ApiMasteryWordSetIdGet200Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Mastery records |  -  |
|**401** | User authentication required |  -  |
|**500** | Failed to retrieve mastery |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiMasteryWordSetIdIncrementPost**
> ApiMasteryWordSetIdIncrementPost200Response apiMasteryWordSetIdIncrementPost(body)

Increment the mastery counter for a specific word and input mode

### Example

```typescript
import {
    MasteryApi,
    Configuration,
    HandlersIncrementMasteryRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new MasteryApi(configuration);

let wordSetId: string; //Word Set ID (default to undefined)
let body: HandlersIncrementMasteryRequest; //Increment request

const { status, data } = await apiInstance.apiMasteryWordSetIdIncrementPost(
    wordSetId,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **HandlersIncrementMasteryRequest**| Increment request | |
| **wordSetId** | [**string**] | Word Set ID | defaults to undefined|


### Return type

**ApiMasteryWordSetIdIncrementPost200Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Updated mastery record |  -  |
|**400** | Invalid request |  -  |
|**401** | User authentication required |  -  |
|**500** | Failed to increment mastery |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiMasteryWordSetIdWordWordGet**
> ApiMasteryWordSetIdIncrementPost200Response apiMasteryWordSetIdWordWordGet()

Get mastery progress for a specific word in a word set

### Example

```typescript
import {
    MasteryApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MasteryApi(configuration);

let wordSetId: string; //Word Set ID (default to undefined)
let word: string; //Word text (default to undefined)

const { status, data } = await apiInstance.apiMasteryWordSetIdWordWordGet(
    wordSetId,
    word
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **wordSetId** | [**string**] | Word Set ID | defaults to undefined|
| **word** | [**string**] | Word text | defaults to undefined|


### Return type

**ApiMasteryWordSetIdIncrementPost200Response**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Mastery record |  -  |
|**401** | User authentication required |  -  |
|**500** | Failed to retrieve mastery |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

