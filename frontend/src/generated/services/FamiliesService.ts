/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_AddFamilyMemberRequest } from '../models/models_AddFamilyMemberRequest';
import type { models_APIResponse } from '../models/models_APIResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FamiliesService {
    /**
     * Get Family Information
     * Get information about the user's family
     * @returns models_APIResponse Family information
     * @throws ApiError
     */
    public static getApiFamilies(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/families',
            errors: {
                401: `Family access validation required`,
                500: `Service unavailable or failed to retrieve family`,
            },
        });
    }
    /**
     * Get Family Children
     * Get all children in the authenticated user's family
     * @returns models_APIResponse List of family children
     * @throws ApiError
     */
    public static getApiFamiliesChildren(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/families/children',
            errors: {
                401: `Family access validation required`,
                500: `Failed to retrieve children`,
            },
        });
    }
    /**
     * Get Family Invitations
     * Get all invitations for the family (parent only)
     * @returns models_APIResponse Family invitations retrieved successfully
     * @throws ApiError
     */
    public static getApiFamiliesInvitations(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/families/invitations',
            errors: {
                500: `Failed to retrieve invitations`,
            },
        });
    }
    /**
     * Delete Family Invitation
     * Cancel/delete a pending invitation (parent only)
     * @param invitationId Invitation ID
     * @returns models_APIResponse Invitation deleted successfully
     * @throws ApiError
     */
    public static deleteApiFamiliesInvitations(
        invitationId: string,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/families/invitations/{invitationId}',
            path: {
                'invitationId': invitationId,
            },
            errors: {
                404: `Invitation not found`,
                500: `Failed to delete invitation`,
            },
        });
    }
    /**
     * Add Family Member
     * Add a parent or child to the family. For parents, creates an invitation.
     * For children, creates a pending account linked when they log in.
     * @param request Family member details
     * @returns models_APIResponse Member added or invited successfully
     * @throws ApiError
     */
    public static postApiFamiliesMembers(
        request: models_AddFamilyMemberRequest,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/families/members',
            body: request,
            errors: {
                400: `Invalid request data`,
                403: `Parent role required`,
                500: `Service unavailable or failed to add member`,
            },
        });
    }
    /**
     * Remove Family Member
     * Remove a parent or child from the family (parent only, cannot remove created_by parent)
     * @param userId User ID
     * @returns models_APIResponse Member removed successfully
     * @throws ApiError
     */
    public static deleteApiFamiliesMembers(
        userId: string,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/families/members/{userId}',
            path: {
                'userId': userId,
            },
            errors: {
                400: `Invalid request or cannot remove creator`,
                404: `Member not found`,
                500: `Failed to remove member`,
            },
        });
    }
    /**
     * Get Family Progress
     * Get progress data for all family members
     * @returns models_APIResponse Family progress data
     * @throws ApiError
     */
    public static getApiFamiliesProgress(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/families/progress',
            errors: {
                401: `Family access validation required`,
                500: `Failed to retrieve family progress`,
            },
        });
    }
    /**
     * Get Family Results
     * Get test results for all members of the authenticated user's family
     * @returns models_APIResponse Family test results
     * @throws ApiError
     */
    public static getApiFamiliesResults(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/families/results',
            errors: {
                401: `Family access validation required`,
                500: `Failed to retrieve family results`,
            },
        });
    }
    /**
     * Get Family Statistics
     * Get statistical data for the authenticated user's family
     * @returns models_APIResponse Family statistics
     * @throws ApiError
     */
    public static getApiFamiliesStats(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/families/stats',
            errors: {
                401: `Family access validation required`,
                500: `Failed to retrieve family stats`,
            },
        });
    }
}
