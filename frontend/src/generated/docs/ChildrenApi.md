# ChildrenApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiFamiliesChildrenChildIdDelete**](#apifamilieschildrenchildiddelete) | **DELETE** /api/families/children/{childId} | Delete Child Account|
|[**apiFamiliesChildrenChildIdProgressGet**](#apifamilieschildrenchildidprogressget) | **GET** /api/families/children/{childId}/progress | Get Child Progress|
|[**apiFamiliesChildrenChildIdPut**](#apifamilieschildrenchildidput) | **PUT** /api/families/children/{childId} | Update Child Account|
|[**apiFamiliesChildrenChildIdResultsGet**](#apifamilieschildrenchildidresultsget) | **GET** /api/families/children/{childId}/results | Get Child Results|

# **apiFamiliesChildrenChildIdDelete**
> ModelsAPIResponse apiFamiliesChildrenChildIdDelete()

Delete a child account (parent only)

### Example

```typescript
import {
    ChildrenApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ChildrenApi(configuration);

let childId: string; //Child ID (default to undefined)

const { status, data } = await apiInstance.apiFamiliesChildrenChildIdDelete(
    childId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **childId** | [**string**] | Child ID | defaults to undefined|


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
|**200** | Child account deleted successfully |  -  |
|**401** | Parent access required |  -  |
|**404** | Child not found |  -  |
|**500** | Failed to delete child account |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesChildrenChildIdProgressGet**
> ModelsAPIResponse apiFamiliesChildrenChildIdProgressGet()

Get progress data for a specific child

### Example

```typescript
import {
    ChildrenApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ChildrenApi(configuration);

let childId: string; //Child ID (default to undefined)

const { status, data } = await apiInstance.apiFamiliesChildrenChildIdProgressGet(
    childId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **childId** | [**string**] | Child ID | defaults to undefined|


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
|**200** | Child progress data |  -  |
|**401** | Parent access required |  -  |
|**404** | Child not found |  -  |
|**500** | Failed to retrieve child progress |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesChildrenChildIdPut**
> ModelsAPIResponse apiFamiliesChildrenChildIdPut(request)

Update an existing child account (parent only)

### Example

```typescript
import {
    ChildrenApi,
    Configuration,
    ModelsChildAccount
} from './api';

const configuration = new Configuration();
const apiInstance = new ChildrenApi(configuration);

let childId: string; //Child ID (default to undefined)
let request: ModelsChildAccount; //Updated child account data

const { status, data } = await apiInstance.apiFamiliesChildrenChildIdPut(
    childId,
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **ModelsChildAccount**| Updated child account data | |
| **childId** | [**string**] | Child ID | defaults to undefined|


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
|**200** | Child account updated successfully |  -  |
|**400** | Invalid request data |  -  |
|**401** | Parent access required |  -  |
|**404** | Child not found |  -  |
|**500** | Failed to update child account |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesChildrenChildIdResultsGet**
> ModelsAPIResponse apiFamiliesChildrenChildIdResultsGet()

Get test results for a specific child

### Example

```typescript
import {
    ChildrenApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ChildrenApi(configuration);

let childId: string; //Child ID (default to undefined)

const { status, data } = await apiInstance.apiFamiliesChildrenChildIdResultsGet(
    childId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **childId** | [**string**] | Child ID | defaults to undefined|


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
|**200** | Child test results |  -  |
|**401** | Parent access required |  -  |
|**404** | Child not found |  -  |
|**500** | Failed to retrieve child results |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

