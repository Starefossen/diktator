/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_APIResponse } from '../models/models_APIResponse';
import type { models_DisplayNameUpdateRequest } from '../models/models_DisplayNameUpdateRequest';
import type { models_SaveResultRequest } from '../models/models_SaveResultRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Create User
     * Create a new user account after OIDC authentication
     * @param request User creation request
     * @returns models_APIResponse User created successfully
     * @throws ApiError
     */
    public static postApiUsers(
        request: {
            displayName?: string;
            email?: string;
            familyName?: string;
            role?: string;
        },
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users',
            body: request,
            errors: {
                400: `Invalid request data`,
                401: `Auth identity not found in token`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Update User Display Name
     * Update the current user's display name
     * @param body Display name update request
     * @returns models_APIResponse Display name updated successfully
     * @throws ApiError
     */
    public static patchApiUsersMeName(
        body: models_DisplayNameUpdateRequest,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/me/name',
            body: body,
            errors: {
                400: `Invalid request data or display name validation failed`,
                401: `User not authenticated`,
                500: `Failed to update display name`,
            },
        });
    }
    /**
     * Get User Profile
     * Get the current user's profile information
     * @returns models_APIResponse User profile data
     * @throws ApiError
     */
    public static getApiUsersProfile(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/profile',
            errors: {
                401: `User not authenticated`,
                404: `User not found - needs registration`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get Test Results
     * Get test results for the authenticated user
     * @returns models_APIResponse Test results
     * @throws ApiError
     */
    public static getApiUsersResults(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/results',
            errors: {
                401: `User authentication required`,
                500: `Failed to retrieve test results`,
            },
        });
    }
    /**
     * Save Test Result
     * Save a test result for the authenticated user
     * @param request Test result data
     * @returns models_APIResponse Test result saved successfully
     * @throws ApiError
     */
    public static postApiUsersResults(
        request: models_SaveResultRequest,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/results',
            body: request,
            errors: {
                400: `Invalid request data`,
                401: `User authentication required`,
                500: `Failed to save test result`,
            },
        });
    }
}
