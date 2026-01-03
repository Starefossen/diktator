# FamiliesApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiFamiliesChildrenGet**](#apifamilieschildrenget) | **GET** /api/families/children | Get Family Children|
|[**apiFamiliesGet**](#apifamiliesget) | **GET** /api/families | Get Family Information|
|[**apiFamiliesInvitationsGet**](#apifamiliesinvitationsget) | **GET** /api/families/invitations | Get Family Invitations|
|[**apiFamiliesInvitationsInvitationIdDelete**](#apifamiliesinvitationsinvitationiddelete) | **DELETE** /api/families/invitations/{invitationId} | Delete Family Invitation|
|[**apiFamiliesMembersPost**](#apifamiliesmemberspost) | **POST** /api/families/members | Add Family Member|
|[**apiFamiliesMembersUserIdDelete**](#apifamiliesmembersuseriddelete) | **DELETE** /api/families/members/{userId} | Remove Family Member|
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
} from './api';

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
} from './api';

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

# **apiFamiliesInvitationsGet**
> ModelsAPIResponse apiFamiliesInvitationsGet()

Get all invitations for the family (parent only)

### Example

```typescript
import {
    FamiliesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FamiliesApi(configuration);

const { status, data } = await apiInstance.apiFamiliesInvitationsGet();
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
|**200** | Family invitations retrieved successfully |  -  |
|**500** | Failed to retrieve invitations |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesInvitationsInvitationIdDelete**
> ModelsAPIResponse apiFamiliesInvitationsInvitationIdDelete()

Cancel/delete a pending invitation (parent only)

### Example

```typescript
import {
    FamiliesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FamiliesApi(configuration);

let invitationId: string; //Invitation ID (default to undefined)

const { status, data } = await apiInstance.apiFamiliesInvitationsInvitationIdDelete(
    invitationId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **invitationId** | [**string**] | Invitation ID | defaults to undefined|


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
|**200** | Invitation deleted successfully |  -  |
|**404** | Invitation not found |  -  |
|**500** | Failed to delete invitation |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesMembersPost**
> ModelsAPIResponse apiFamiliesMembersPost(request)

Add a parent or child to the family. For parents, creates an invitation. For children, creates a pending account linked when they log in.

### Example

```typescript
import {
    FamiliesApi,
    Configuration,
    ModelsAddFamilyMemberRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new FamiliesApi(configuration);

let request: ModelsAddFamilyMemberRequest; //Family member details

const { status, data } = await apiInstance.apiFamiliesMembersPost(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **ModelsAddFamilyMemberRequest**| Family member details | |


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
|**201** | Member added or invited successfully |  -  |
|**400** | Invalid request data |  -  |
|**403** | Parent role required |  -  |
|**500** | Service unavailable or failed to add member |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesMembersUserIdDelete**
> ModelsAPIResponse apiFamiliesMembersUserIdDelete()

Remove a parent or child from the family (parent only, cannot remove created_by parent)

### Example

```typescript
import {
    FamiliesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FamiliesApi(configuration);

let userId: string; //User ID (default to undefined)

const { status, data } = await apiInstance.apiFamiliesMembersUserIdDelete(
    userId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userId** | [**string**] | User ID | defaults to undefined|


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
|**200** | Member removed successfully |  -  |
|**400** | Invalid request or cannot remove creator |  -  |
|**404** | Member not found |  -  |
|**500** | Failed to remove member |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiFamiliesProgressGet**
> ModelsAPIResponse apiFamiliesProgressGet()

Get progress data for all family members

### Example

```typescript
import {
    FamiliesApi,
    Configuration
} from './api';

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
} from './api';

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
} from './api';

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

