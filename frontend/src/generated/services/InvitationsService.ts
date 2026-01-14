/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_APIResponse } from '../models/models_APIResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvitationsService {
    /**
     * Get Pending Invitations
     * Get all pending invitations for the authenticated user's email
     * @returns models_APIResponse Pending invitations retrieved
     * @throws ApiError
     */
    public static getApiInvitationsPending(): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/invitations/pending',
            errors: {
                500: `Failed to retrieve invitations`,
            },
        });
    }
    /**
     * Accept Invitation
     * Accept a pending family invitation and join the family. For first-time users, this also links their OIDC identity to the family child account.
     * @param invitationId Invitation ID
     * @returns models_APIResponse Invitation accepted successfully
     * @throws ApiError
     */
    public static postApiInvitationsAccept(
        invitationId: string,
    ): CancelablePromise<models_APIResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/invitations/{invitationId}/accept',
            path: {
                'invitationId': invitationId,
            },
            errors: {
                400: `Invalid invitation ID`,
                404: `Invitation not found`,
                500: `Failed to accept invitation`,
            },
        });
    }
}
