# ModelsChildAccount


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**createdAt** | **string** |  | [optional] [default to undefined]
**displayName** | **string** |  | [optional] [default to undefined]
**email** | **string** |  | [optional] [default to undefined]
**familyId** | **string** |  | [optional] [default to undefined]
**id** | **string** |  | [optional] [default to undefined]
**isActive** | **boolean** | Parents can deactivate child accounts | [optional] [default to undefined]
**lastActiveAt** | **string** |  | [optional] [default to undefined]
**parentId** | **string** | The parent who created this child account | [optional] [default to undefined]
**role** | **string** | Always \&quot;child\&quot; | [optional] [default to undefined]

## Example

```typescript
import { ModelsChildAccount } from 'diktator-api-client';

const instance: ModelsChildAccount = {
    createdAt,
    displayName,
    email,
    familyId,
    id,
    isActive,
    lastActiveAt,
    parentId,
    role,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
