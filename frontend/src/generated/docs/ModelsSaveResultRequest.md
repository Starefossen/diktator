# ModelsSaveResultRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**correctWords** | **number** |  | [default to undefined]
**incorrectWords** | **Array&lt;string&gt;** | Deprecated: Use Words field for detailed information | [optional] [default to undefined]
**mode** | **string** |  | [default to undefined]
**score** | **number** |  | [default to undefined]
**timeSpent** | **number** |  | [optional] [default to undefined]
**totalWords** | **number** |  | [default to undefined]
**wordSetId** | **string** |  | [default to undefined]
**words** | [**Array&lt;ModelsWordTestResult&gt;**](ModelsWordTestResult.md) | Detailed information for each word in the test | [optional] [default to undefined]

## Example

```typescript
import { ModelsSaveResultRequest } from './api';

const instance: ModelsSaveResultRequest = {
    correctWords,
    incorrectWords,
    mode,
    score,
    timeSpent,
    totalWords,
    wordSetId,
    words,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
