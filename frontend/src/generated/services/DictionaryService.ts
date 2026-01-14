/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_APIResponse } from '../models/models_APIResponse';
import type { models_DictionarySuggestion } from '../models/models_DictionarySuggestion';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DictionaryService {
    /**
     * Get dictionary service statistics
     * Get cache statistics and health status of the dictionary service
     * @returns models_APIResponse Dictionary service statistics
     * @throws ApiError
     */
    public static getApiDictionaryStats(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dictionary/stats',
            errors: {
                500: `Dictionary service unavailable`,
            },
        });
    }
    /**
     * Get word suggestions from the Norwegian dictionary
     * Get autocomplete suggestions from ord.uib.no based on a query prefix
     * @param q Query prefix for suggestions
     * @param dict Dictionary code (bm=bokmål, nn=nynorsk)
     * @param n Number of suggestions (1-20)
     * @returns any Suggestions returned
     * @throws ApiError
     */
    public static getApiDictionarySuggest(
        q: string,
        dict: string = 'bm',
        n: number = 5,
    ): CancelablePromise<(models_APIResponse & {
        data?: Array<models_DictionarySuggestion>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dictionary/suggest',
            query: {
                'q': q,
                'dict': dict,
                'n': n,
            },
            errors: {
                400: `Invalid request`,
                500: `Dictionary service unavailable`,
            },
        });
    }
    /**
     * Validate a word in the Norwegian dictionary
     * Look up a word in ord.uib.no and return its information including lemma, word class, inflections, and definition
     * @param w Word to validate
     * @param dict Dictionary code (bm=bokmål, nn=nynorsk)
     * @returns any Word not found (data is null)
     * @throws ApiError
     */
    public static getApiDictionaryValidate(
        w: string,
        dict: string = 'bm',
    ): CancelablePromise<(models_APIResponse & {
        data?: any;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dictionary/validate',
            query: {
                'w': w,
                'dict': dict,
            },
            errors: {
                400: `Invalid request`,
                500: `Dictionary service unavailable`,
            },
        });
    }
}
