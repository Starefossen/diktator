/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_APIResponse } from '../models/models_APIResponse';
import type { models_DisplayNameUpdateRequest } from '../models/models_DisplayNameUpdateRequest';
import type { models_UpdateChildBirthYearRequest } from '../models/models_UpdateChildBirthYearRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChildrenService {
    /**
     * Update Child Account
     * Update a child account's display name (parent only)
     * @param childId Child ID
     * @param body Display name update request
     * @returns models_APIResponse Child account updated successfully
     * @throws ApiError
     */
    public static putApiFamiliesChildren(
        childId: string,
        body: models_DisplayNameUpdateRequest,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/families/children/{childId}',
            path: {
                'childId': childId,
            },
            body: body,
            errors: {
                400: `Invalid request data`,
                401: `Parent access required`,
                403: `Not authorized to update this child`,
                500: `Failed to update child account`,
            },
        });
    }
    /**
     * Delete Child Account
     * Delete a child account (parent only)
     * @param childId Child ID
     * @returns models_APIResponse Child account deleted successfully
     * @throws ApiError
     */
    public static deleteApiFamiliesChildren(
        childId: string,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/families/children/{childId}',
            path: {
                'childId': childId,
            },
            errors: {
                401: `Parent access required`,
                404: `Child not found`,
                500: `Failed to delete child account`,
            },
        });
    }
    /**
     * Update Child Birth Year
     * Update a child account's birth year (parent only)
     * @param childId Child ID
     * @param body Birth year update request
     * @returns models_APIResponse Child birth year updated successfully
     * @throws ApiError
     */
    public static patchApiFamiliesChildrenBirthyear(
        childId: string,
        body: models_UpdateChildBirthYearRequest,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/families/children/{childId}/birthyear',
            path: {
                'childId': childId,
            },
            body: body,
            errors: {
                400: `Invalid request data`,
                401: `Parent access required`,
                403: `Not authorized to update this child`,
                500: `Failed to update child birth year`,
            },
        });
    }
    /**
     * Get Child Progress
     * Get progress data for a specific child
     * @param childId Child ID
     * @returns models_APIResponse Child progress data
     * @throws ApiError
     */
    public static getApiFamiliesChildrenProgress(
        childId: string,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/families/children/{childId}/progress',
            path: {
                'childId': childId,
            },
            errors: {
                401: `Parent access required`,
                404: `Child not found`,
                500: `Failed to retrieve child progress`,
            },
        });
    }
    /**
     * Get Child Results
     * Get test results for a specific child
     * @param childId Child ID
     * @returns models_APIResponse Child test results
     * @throws ApiError
     */
    public static getApiFamiliesChildrenResults(
        childId: string,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/families/children/{childId}/results',
            path: {
                'childId': childId,
            },
            errors: {
                401: `Parent access required`,
                404: `Child not found`,
                500: `Failed to retrieve child results`,
            },
        });
    }
}
