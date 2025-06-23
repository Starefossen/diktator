# UsersApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiUsersPost**](#apiuserspost) | **POST** /api/users | Create User|
|[**apiUsersProfileGet**](#apiusersprofileget) | **GET** /api/users/profile | Get User Profile|

# **apiUsersPost**
> ModelsAPIResponse apiUsersPost(request)

Create a new user account after Firebase authentication

### Example

```typescript
import {
    UsersApi,
    Configuration,
    ApiUsersPostRequest
} from 'diktator-api-client';

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
|**401** | Firebase UID not found in token |  -  |
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
} from 'diktator-api-client';

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

