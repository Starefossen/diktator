# ModelsDictionaryWord


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**articleId** | **number** | For linking to ordbokene.no (e.g., https://ordbokene.no/bm/ID) | [optional] [default to undefined]
**definition** | **string** | Primary definition only | [optional] [default to undefined]
**inflections** | **Array&lt;string&gt;** | All inflected forms (katt, katten, katter, kattene) | [optional] [default to undefined]
**lemma** | **string** | Base form of the word | [optional] [default to undefined]
**wordClass** | **string** | NOUN, VERB, ADJ, ADV, etc. | [optional] [default to undefined]

## Example

```typescript
import { ModelsDictionaryWord } from './api';

const instance: ModelsDictionaryWord = {
    articleId,
    definition,
    inflections,
    lemma,
    wordClass,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
