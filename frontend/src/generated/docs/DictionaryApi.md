# DictionaryApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiDictionaryStatsGet**](#apidictionarystatsget) | **GET** /api/dictionary/stats | Get dictionary service statistics|
|[**apiDictionarySuggestGet**](#apidictionarysuggestget) | **GET** /api/dictionary/suggest | Get word suggestions from the Norwegian dictionary|
|[**apiDictionaryValidateGet**](#apidictionaryvalidateget) | **GET** /api/dictionary/validate | Validate a word in the Norwegian dictionary|

# **apiDictionaryStatsGet**
> ModelsAPIResponse apiDictionaryStatsGet()

Get cache statistics and health status of the dictionary service

### Example

```typescript
import {
    DictionaryApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DictionaryApi(configuration);

const { status, data } = await apiInstance.apiDictionaryStatsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**ModelsAPIResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Dictionary service statistics |  -  |
|**500** | Dictionary service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiDictionarySuggestGet**
> ApiDictionarySuggestGet200Response apiDictionarySuggestGet()

Get autocomplete suggestions from ord.uib.no based on a query prefix

### Example

```typescript
import {
    DictionaryApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DictionaryApi(configuration);

let q: string; //Query prefix for suggestions (default to undefined)
let dict: string; //Dictionary code (bm=bokmål, nn=nynorsk) (optional) (default to 'bm')
let n: number; //Number of suggestions (1-20) (optional) (default to 5)

const { status, data } = await apiInstance.apiDictionarySuggestGet(
    q,
    dict,
    n
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **q** | [**string**] | Query prefix for suggestions | defaults to undefined|
| **dict** | [**string**] | Dictionary code (bm&#x3D;bokmål, nn&#x3D;nynorsk) | (optional) defaults to 'bm'|
| **n** | [**number**] | Number of suggestions (1-20) | (optional) defaults to 5|


### Return type

**ApiDictionarySuggestGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Suggestions returned |  -  |
|**400** | Invalid request |  -  |
|**500** | Dictionary service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiDictionaryValidateGet**
> ApiDictionaryValidateGet200Response apiDictionaryValidateGet()

Look up a word in ord.uib.no and return its information including lemma, word class, inflections, and definition

### Example

```typescript
import {
    DictionaryApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DictionaryApi(configuration);

let w: string; //Word to validate (default to undefined)
let dict: string; //Dictionary code (bm=bokmål, nn=nynorsk) (optional) (default to 'bm')

const { status, data } = await apiInstance.apiDictionaryValidateGet(
    w,
    dict
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **w** | [**string**] | Word to validate | defaults to undefined|
| **dict** | [**string**] | Dictionary code (bm&#x3D;bokmål, nn&#x3D;nynorsk) | (optional) defaults to 'bm'|


### Return type

**ApiDictionaryValidateGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Word not found (data is null) |  -  |
|**400** | Invalid request |  -  |
|**500** | Dictionary service unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

