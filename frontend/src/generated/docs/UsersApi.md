# UsersApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiUsersPost**](#apiuserspost) | **POST** /api/users | Create User|
|[**apiUsersProfileGet**](#apiusersprofileget) | **GET** /api/users/profile | Get User Profile|
|[**apiUsersResultsGet**](#apiusersresultsget) | **GET** /api/users/results | Get Test Results|
|[**apiUsersResultsPost**](#apiusersresultspost) | **POST** /api/users/results | Save Test Result|

# **apiUsersPost**
> ModelsAPIResponse apiUsersPost(request)

Create a new user account after OIDC authentication

### Example

```typescript
import {
    UsersApi,
    Configuration,
    ApiUsersPostRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let request: ApiUsersPostRequest; //User creation request

const { status, data } = await apiInstance.apiUsersPost(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **ApiUsersPostRequest**| User creation request | |


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
|**201** | User created successfully |  -  |
|**400** | Invalid request data |  -  |
|**401** | Auth identity not found in token |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersProfileGet**
> ModelsAPIResponse apiUsersProfileGet()

Get the current user\'s profile information

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

const { status, data } = await apiInstance.apiUsersProfileGet();
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
|**200** | User profile data |  -  |
|**401** | User not authenticated |  -  |
|**404** | User not found - needs registration |  -  |
|**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiUsersResultsGet**
> ModelsAPIResponse apiUsersResultsGet()

Get test results for the authenticated user

### Example

```typescript
import {
    UsersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

const { status, data } = await apiInstance.apiUsersResultsGet();
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

# **apiUsersResultsPost**
> ModelsAPIResponse apiUsersResultsPost(request)

Save a test result for the authenticated user

### Example

```typescript
import {
    UsersApi,
    Configuration,
    ModelsSaveResultRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UsersApi(configuration);

let request: ModelsSaveResultRequest; //Test result data

const { status, data } = await apiInstance.apiUsersResultsPost(
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

