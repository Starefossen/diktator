/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_WordTestResult } from './models_WordTestResult';
export type models_SaveResultRequest = {
    correctWords: number;
    incorrectWords?: Array<string>;
    mode: models_SaveResultRequest.mode;
    score: number;
    timeSpent?: number;
    totalWords: number;
    wordSetId: string;
    words?: Array<models_WordTestResult>;
};
export namespace models_SaveResultRequest {
    export enum mode {
        LETTER_TILES = 'letterTiles',
        WORD_BANK = 'wordBank',
        KEYBOARD = 'keyboard',
        MISSING_LETTERS = 'missingLetters',
        FLASHCARD = 'flashcard',
        LOOK_COVER_WRITE = 'lookCoverWrite',
        TRANSLATION = 'translation',
    }
}

