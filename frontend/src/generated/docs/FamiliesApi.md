# FamiliesApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiFamiliesChildrenGet**](#apifamilieschildrenget) | **GET** /api/families/children | Get Family Children|
|[**apiFamiliesGet**](#apifamiliesget) | **GET** /api/families | Get Family Information|
|[**apiFamiliesProgressGet**](#apifamiliesprogressget) | **GET** /api/families/progress | Get Family Progress|
|[**apiFamiliesResultsGet**](#apifamiliesresultsget) | **GET** /api/families/results | Get Family Results|
|[**apiFamiliesStatsGet**](#apifamiliesstatsget) | **GET** /api/families/stats | Get Family Statistics|

# **apiFamiliesChildrenGet**
> ModelsAPIResponse apiFamiliesChildrenGet()

Get all children in the authenticated user\'s family

### Example

```typescript
import {
    FamiliesApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new FamiliesApi(configuration);

const { status, data } = await apiInstance.apiFamiliesChildrenGet();
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
|**200** | List of family children |  -  |
|**401** | Family access validation required |  -  |
|**500** | Failed to retrieve children |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesGet**
> ModelsAPIResponse apiFamiliesGet()

Get information about the user\'s family

### Example

```typescript
import {
    FamiliesApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new FamiliesApi(configuration);

const { status, data } = await apiInstance.apiFamiliesGet();
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
|**200** | Family information |  -  |
|**401** | Family access validation required |  -  |
|**500** | Service unavailable or failed to retrieve family |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesProgressGet**
> ModelsAPIResponse apiFamiliesProgressGet()

Get progress data for all family members

### Example

```typescript
import {
    FamiliesApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new FamiliesApi(configuration);

const { status, data } = await apiInstance.apiFamiliesProgressGet();
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
|**200** | Family progress data |  -  |
|**401** | Family access validation required |  -  |
|**500** | Failed to retrieve family progress |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesResultsGet**
> ModelsAPIResponse apiFamiliesResultsGet()

Get test results for all members of the authenticated user\'s family

### Example

```typescript
import {
    FamiliesApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new FamiliesApi(configuration);

const { status, data } = await apiInstance.apiFamiliesResultsGet();
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
|**200** | Family test results |  -  |
|**401** | Family access validation required |  -  |
|**500** | Failed to retrieve family results |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesStatsGet**
> ModelsAPIResponse apiFamiliesStatsGet()

Get statistical data for the authenticated user\'s family

### Example

```typescript
import {
    FamiliesApi,
    Configuration
} from 'diktator-api-client';

const configuration = new Configuration();
const apiInstance = new FamiliesApi(configuration);

const { status, data } = await apiInstance.apiFamiliesStatsGet();
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
|**200** | Family statistics |  -  |
|**401** | Family access validation required |  -  |
|**500** | Failed to retrieve family stats |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

