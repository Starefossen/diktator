/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type models_AddFamilyMemberRequest = {
    birthYear?: number;
    displayName: string;
    email: string;
    familyId: string;
    role: models_AddFamilyMemberRequest.role;
};
export namespace models_AddFamilyMemberRequest {
    export enum role {
        PARENT = 'parent',
        CHILD = 'child',
    }
}

