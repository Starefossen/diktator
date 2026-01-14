/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_APIResponse } from '../models/models_APIResponse';
import type { models_CreateWordSetRequest } from '../models/models_CreateWordSetRequest';
import type { models_UpdateWordSetRequest } from '../models/models_UpdateWordSetRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WordsetsService {
    /**
     * Get Word Sets
     * Get word sets for the authenticated user's family
     * @returns models_APIResponse Word sets for the family
     * @throws ApiError
     */
    public static getApiWordsets(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/wordsets',
            errors: {
                401: `Family access validation required`,
                500: `Service unavailable or failed to retrieve word sets`,
            },
        });
    }
    /**
     * Create Word Set
     * Create a new word set for practice
     * @param request Word set creation request
     * @returns models_APIResponse Word set created successfully
     * @throws ApiError
     */
    public static postApiWordsets(
        request: models_CreateWordSetRequest,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/wordsets',
            body: request,
            errors: {
                400: `Invalid request data`,
                401: `User authentication required`,
                500: `Failed to create word set`,
            },
        });
    }
    /**
     * Get Curated Word Sets
     * Get curated word sets available to all users (global/official word sets)
     * @returns models_APIResponse Curated word sets
     * @throws ApiError
     */
    public static getApiWordsetsCurated(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/wordsets/curated',
            errors: {
                500: `Service unavailable or failed to retrieve word sets`,
            },
        });
    }
    /**
     * List available TTS voices
     * Get a list of available Text-to-Speech voices for a specific language
     * @param language Language code (e.g., 'en', 'nb-NO')
     * @returns any List of available voices
     * @throws ApiError
     */
    public static getApiWordsetsVoices(
        language?: string,
    ): CancelablePromise<(models_APIResponse & {
        data?: Array<any>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/wordsets/voices',
            query: {
                'language': language,
            },
            errors: {
                500: `Failed to retrieve voices`,
            },
        });
    }
    /**
     * Update Word Set
     * Update an existing word set name, words, and configuration. Audio will be regenerated automatically for new/changed words.
     * @param id Word Set ID
     * @param request Word set update request
     * @returns models_APIResponse Word set updated successfully
     * @throws ApiError
     */
    public static putApiWordsets(
        id: string,
        request: models_UpdateWordSetRequest,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/wordsets/{id}',
            path: {
                'id': id,
            },
            body: request,
            errors: {
                400: `Invalid request data or word set ID required`,
                401: `User authentication required`,
                404: `Word set not found`,
                500: `Failed to update word set`,
            },
        });
    }
    /**
     * Delete Word Set
     * Delete a word set by ID and all associated audio files from storage
     * @param id Word Set ID
     * @returns models_APIResponse Word set and audio files deleted successfully
     * @throws ApiError
     */
    public static deleteApiWordsets(
        id: string,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/wordsets/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Word set ID is required`,
                404: `Word set not found`,
                500: `Failed to delete word set`,
            },
        });
    }
    /**
     * Assign Word Set to User
     * Assign a word set to a child user (parent only)
     * @param id Word set ID
     * @param userId Child user ID
     * @returns models_APIResponse Word set assigned successfully
     * @throws ApiError
     */
    public static postApiWordsetsAssignments(
        id: string,
        userId: string,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/wordsets/{id}/assignments/{userId}',
            path: {
                'id': id,
                'userId': userId,
            },
            errors: {
                400: `Invalid request`,
                403: `Parent role required`,
                500: `Failed to assign word set`,
            },
        });
    }
    /**
     * Unassign Word Set from User
     * Remove a word set assignment from a child user (parent only)
     * @param id Word set ID
     * @param userId Child user ID
     * @returns models_APIResponse Word set unassigned successfully
     * @throws ApiError
     */
    public static deleteApiWordsetsAssignments(
        id: string,
        userId: string,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/wordsets/{id}/assignments/{userId}',
            path: {
                'id': id,
                'userId': userId,
            },
            errors: {
                400: `Invalid request`,
                403: `Parent role required`,
                500: `Failed to unassign word set`,
            },
        });
    }
    /**
     * Stream Audio for Word or Sentence
     * Stream TTS audio for a specific word or sentence in a word set (generates on-demand, cached by browser). Automatically uses appropriate speaking rate for single words (0.8x) vs sentences (0.9x). Supports both GET and HEAD methods for iOS Safari compatibility.
     * @param id Word Set ID
     * @param word Word or sentence to generate audio for
     * @returns binary Audio file content (OGG Opus)
     * @throws ApiError
     */
    public static getApiWordsetsWordsAudio(
        id: string,
        word: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/wordsets/{id}/words/{word}/audio',
            path: {
                'id': id,
                'word': word,
            },
            errors: {
                400: `Invalid request`,
                404: `Word set not found`,
                500: `Failed to generate audio`,
            },
        });
    }
    /**
     * Stream Audio for Word or Sentence
     * Stream TTS audio for a specific word or sentence in a word set (generates on-demand, cached by browser). Automatically uses appropriate speaking rate for single words (0.8x) vs sentences (0.9x). Supports both GET and HEAD methods for iOS Safari compatibility.
     * @param id Word Set ID
     * @param word Word or sentence to generate audio for
     * @returns binary Audio file content (OGG Opus)
     * @throws ApiError
     */
    public static headApiWordsetsWordsAudio(
        id: string,
        word: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/api/wordsets/{id}/words/{word}/audio',
            path: {
                'id': id,
                'word': word,
            },
            errors: {
                400: `Invalid request`,
                404: `Word set not found`,
                500: `Failed to generate audio`,
            },
        });
    }
}
