## diktator-api-client@1.0.0

This generator creates TypeScript/JavaScript client that utilizes [axios](https://github.com/axios/axios). The generated Node module can be used in the following environments:

Environment
* Node.js
* Webpack
* Browserify

Language level
* ES5 - you must have a Promises/A+ library installed
* ES6

Module system
* CommonJS
* ES6 module system

It can be used in both TypeScript and JavaScript. In TypeScript, the definition will be automatically resolved via `package.json`. ([Reference](https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html))

### Building

To build and compile the typescript sources to javascript use:
```
npm install
npm run build
```

### Publishing

First build the package then run `npm publish`

### Consuming

navigate to the folder of your consuming project and run one of the following commands.

_published:_

```
npm install diktator-api-client@1.0.0 --save
```

_unPublished (not recommended):_

```
npm install PATH_TO_GENERATED_PACKAGE --save
```

### Documentation for API Endpoints

All URIs are relative to *http://localhost:8080/api*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*ChildrenApi* | [**apiFamiliesChildrenChildIdDelete**](docs/ChildrenApi.md#apifamilieschildrenchildiddelete) | **DELETE** /api/families/children/{childId} | Delete Child Account
*ChildrenApi* | [**apiFamiliesChildrenChildIdProgressGet**](docs/ChildrenApi.md#apifamilieschildrenchildidprogressget) | **GET** /api/families/children/{childId}/progress | Get Child Progress
*ChildrenApi* | [**apiFamiliesChildrenChildIdPut**](docs/ChildrenApi.md#apifamilieschildrenchildidput) | **PUT** /api/families/children/{childId} | Update Child Account
*ChildrenApi* | [**apiFamiliesChildrenChildIdResultsGet**](docs/ChildrenApi.md#apifamilieschildrenchildidresultsget) | **GET** /api/families/children/{childId}/results | Get Child Results
*ChildrenApi* | [**apiFamiliesChildrenPost**](docs/ChildrenApi.md#apifamilieschildrenpost) | **POST** /api/families/children | Create Child Account
*FamiliesApi* | [**apiFamiliesChildrenGet**](docs/FamiliesApi.md#apifamilieschildrenget) | **GET** /api/families/children | Get Family Children
*FamiliesApi* | [**apiFamiliesGet**](docs/FamiliesApi.md#apifamiliesget) | **GET** /api/families | Get Family Information
*FamiliesApi* | [**apiFamiliesProgressGet**](docs/FamiliesApi.md#apifamiliesprogressget) | **GET** /api/families/progress | Get Family Progress
*FamiliesApi* | [**apiFamiliesResultsGet**](docs/FamiliesApi.md#apifamiliesresultsget) | **GET** /api/families/results | Get Family Results
*FamiliesApi* | [**apiFamiliesStatsGet**](docs/FamiliesApi.md#apifamiliesstatsget) | **GET** /api/families/stats | Get Family Statistics
*HealthApi* | [**healthGet**](docs/HealthApi.md#healthget) | **GET** /health | Health Check
*UsersApi* | [**apiUsersPost**](docs/UsersApi.md#apiuserspost) | **POST** /api/users | Create User
*UsersApi* | [**apiUsersProfileGet**](docs/UsersApi.md#apiusersprofileget) | **GET** /api/users/profile | Get User Profile
*UsersApi* | [**apiUsersResultsGet**](docs/UsersApi.md#apiusersresultsget) | **GET** /api/users/results | Get Test Results
*UsersApi* | [**apiUsersResultsPost**](docs/UsersApi.md#apiusersresultspost) | **POST** /api/users/results | Save Test Result
*WordsetsApi* | [**apiWordsetsGet**](docs/WordsetsApi.md#apiwordsetsget) | **GET** /api/wordsets | Get Word Sets
*WordsetsApi* | [**apiWordsetsIdAudioAudioIdGet**](docs/WordsetsApi.md#apiwordsetsidaudioaudioidget) | **GET** /api/wordsets/{id}/audio/{audioId} | Stream Audio File by ID
*WordsetsApi* | [**apiWordsetsIdDelete**](docs/WordsetsApi.md#apiwordsetsiddelete) | **DELETE** /api/wordsets/{id} | Delete Word Set
*WordsetsApi* | [**apiWordsetsIdGenerateAudioPost**](docs/WordsetsApi.md#apiwordsetsidgenerateaudiopost) | **POST** /api/wordsets/{id}/generate-audio | Generate Audio
*WordsetsApi* | [**apiWordsetsIdPut**](docs/WordsetsApi.md#apiwordsetsidput) | **PUT** /api/wordsets/{id} | Update Word Set
*WordsetsApi* | [**apiWordsetsPost**](docs/WordsetsApi.md#apiwordsetspost) | **POST** /api/wordsets | Create Word Set
*WordsetsApi* | [**apiWordsetsVoicesGet**](docs/WordsetsApi.md#apiwordsetsvoicesget) | **GET** /api/wordsets/voices | List available TTS voices


### Documentation For Models

 - [ApiUsersPostRequest](docs/ApiUsersPostRequest.md)
 - [ApiWordsetsVoicesGet200Response](docs/ApiWordsetsVoicesGet200Response.md)
 - [ModelsAPIResponse](docs/ModelsAPIResponse.md)
 - [ModelsChildAccount](docs/ModelsChildAccount.md)
 - [ModelsCreateChildAccountRequest](docs/ModelsCreateChildAccountRequest.md)
 - [ModelsCreateWordSetRequest](docs/ModelsCreateWordSetRequest.md)
 - [ModelsSaveResultRequest](docs/ModelsSaveResultRequest.md)
 - [ModelsUpdateWordSetRequest](docs/ModelsUpdateWordSetRequest.md)
 - [ModelsWordTestResult](docs/ModelsWordTestResult.md)


<a id="documentation-for-authorization"></a>
## Documentation For Authorization


Authentication schemes defined for the API:
<a id="BearerAuth"></a>
### BearerAuth

- **Type**: API key
- **API key parameter name**: Authorization
- **Location**: HTTP header

