# ModelsWordTestResult


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**attempts** | **number** | Number of attempts made | [optional] [default to undefined]
**audioPlayCount** | **number** | Number of times audio was played | [optional] [default to undefined]
**correct** | **boolean** | Whether the word was answered correctly | [optional] [default to undefined]
**errorTypes** | **Array&lt;string&gt;** | Detected spelling error types (doubleConsonant, silentH, etc.) | [optional] [default to undefined]
**finalAnswer** | **string** | The final answer provided | [optional] [default to undefined]
**hintsUsed** | **number** | Number of hints used (if applicable) | [optional] [default to undefined]
**timeSpent** | **number** | Time spent on this word in seconds | [optional] [default to undefined]
**userAnswers** | **Array&lt;string&gt;** | All answers the user provided for this word | [optional] [default to undefined]
**word** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { ModelsWordTestResult } from './api';

const instance: ModelsWordTestResult = {
    attempts,
    audioPlayCount,
    correct,
    errorTypes,
    finalAnswer,
    hintsUsed,
    timeSpent,
    userAnswers,
    word,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
