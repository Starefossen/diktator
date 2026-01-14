/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { handlers_IncrementMasteryRequest } from '../models/handlers_IncrementMasteryRequest';
import type { models_APIResponse } from '../models/models_APIResponse';
import type { models_WordMastery } from '../models/models_WordMastery';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MasteryService {
    /**
     * Get mastery for word set
     * Get mastery progress for all words in a word set for the authenticated user
     * @param wordSetId Word Set ID
     * @returns any Mastery records
     * @throws ApiError
     */
    public static getApiMastery(
        wordSetId: string,
    ): CancelablePromise<(models_APIResponse & {
        data?: Array<models_WordMastery>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mastery/{wordSetId}',
            path: {
                'wordSetId': wordSetId,
            },
            errors: {
                401: `User authentication required`,
                500: `Failed to retrieve mastery`,
            },
        });
    }
    /**
     * Increment mastery for a word
     * Increment the mastery counter for a specific word and input mode
     * @param wordSetId Word Set ID
     * @param body Increment request
     * @returns any Updated mastery record
     * @throws ApiError
     */
    public static postApiMasteryIncrement(
        wordSetId: string,
        body: handlers_IncrementMasteryRequest,
    ): CancelablePromise<(models_APIResponse & {
        data?: models_WordMastery;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/mastery/{wordSetId}/increment',
            path: {
                'wordSetId': wordSetId,
            },
            body: body,
            errors: {
                400: `Invalid request`,
                401: `User authentication required`,
                500: `Failed to increment mastery`,
            },
        });
    }
    /**
     * Get mastery for specific word
     * Get mastery progress for a specific word in a word set
     * @param wordSetId Word Set ID
     * @param word Word text
     * @returns any Mastery record
     * @throws ApiError
     */
    public static getApiMasteryWord(
        wordSetId: string,
        word: string,
    ): CancelablePromise<(models_APIResponse & {
        data?: models_WordMastery;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mastery/{wordSetId}/word/{word}',
            path: {
                'wordSetId': wordSetId,
                'word': word,
            },
            errors: {
                401: `User authentication required`,
                500: `Failed to retrieve mastery`,
            },
        });
    }
}
