# InvitationsApi

All URIs are relative to *http://localhost:8080/api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiInvitationsInvitationIdAcceptPost**](#apiinvitationsinvitationidacceptpost) | **POST** /api/invitations/{invitationId}/accept | Accept Invitation|
|[**apiInvitationsPendingGet**](#apiinvitationspendingget) | **GET** /api/invitations/pending | Get Pending Invitations|

# **apiInvitationsInvitationIdAcceptPost**
> ModelsAPIResponse apiInvitationsInvitationIdAcceptPost()

Accept a pending family invitation and join the family. For first-time users, this also links their OIDC identity to the family child account.

### Example

```typescript
import {
    InvitationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InvitationsApi(configuration);

let invitationId: string; //Invitation ID (default to undefined)

const { status, data } = await apiInstance.apiInvitationsInvitationIdAcceptPost(
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
|**200** | Invitation accepted successfully |  -  |
|**400** | Invalid invitation ID |  -  |
|**404** | Invitation not found |  -  |
|**500** | Failed to accept invitation |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiInvitationsPendingGet**
> ModelsAPIResponse apiInvitationsPendingGet()

Get all pending invitations for the authenticated user\'s email

### Example

```typescript
import {
    InvitationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InvitationsApi(configuration);

const { status, data } = await apiInstance.apiInvitationsPendingGet();
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
|**200** | Pending invitations retrieved |  -  |
|**500** | Failed to retrieve invitations |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

