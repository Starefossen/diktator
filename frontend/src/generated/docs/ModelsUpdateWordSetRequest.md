# ModelsUpdateWordSetRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**language** | **string** |  | [default to undefined]
**name** | **string** |  | [default to undefined]
**testConfiguration** | **{ [key: string]: any; }** |  | [optional] [default to undefined]
**words** | [**Array&lt;ModelsWordInput&gt;**](ModelsWordInput.md) |  | [default to undefined]

## Example

```typescript
import { ModelsUpdateWordSetRequest } from 'diktator-api-client';

const instance: ModelsUpdateWordSetRequest = {
    language,
    name,
    testConfiguration,
    words,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
