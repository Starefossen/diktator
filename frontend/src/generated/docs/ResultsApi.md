# ResultsApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiResultsGet**](#apiresultsget) | **GET** /api/results | Get Test Results|
|[**apiResultsPost**](#apiresultspost) | **POST** /api/results | Save Test Result|

# **apiResultsGet**
> ModelsAPIResponse apiResultsGet()

Get test results for the authenticated user

### Example

```typescript
import {
    ResultsApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new ResultsApi(configuration);

const { status, data } = await apiInstance.apiResultsGet();
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
|**200** | Test results |  -  |
|**401** | User authentication required |  -  |
|**500** | Failed to retrieve test results |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiResultsPost**
> ModelsAPIResponse apiResultsPost(request)

Save a test result for the authenticated user

### Example

```typescript
import {
    ResultsApi,
    Configuration,
    ModelsSaveResultRequest
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new ResultsApi(configuration);

let request: ModelsSaveResultRequest; //Test result data

const { status, data } = await apiInstance.apiResultsPost(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **ModelsSaveResultRequest**| Test result data | |


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
|**201** | Test result saved successfully |  -  |
|**400** | Invalid request data |  -  |
|**401** | User authentication required |  -  |
|**500** | Failed to save test result |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

