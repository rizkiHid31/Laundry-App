import { Response } from 'express';
import { errorResponse } from './responseHelper';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export class AuthValidationError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
    }
}

export const validateEmail = (email: string): void => {
    if (!email) {
        throw new AuthValidationError(400, 'Email is required');
    }
    if (!EMAIL_REGEX.test(email)) {
        throw new AuthValidationError(400, 'Email format is invalid');
    }
};

export const validatePassword = (password: string): void => {
    if (!password) {
        throw new AuthValidationError(400, 'Password is required');
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
        throw new AuthValidationError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    if (!PASSWORD_REGEX.test(password)) {
        throw new AuthValidationError(400, 'Password must contain letters and numbers');
    }
};

export const validateRegistration = (email: string, firstName?: string, lastName?: string): void => {
    validateEmail(email);
    if (!firstName || firstName.trim() === '') {
        throw new AuthValidationError(400, 'First name is required');
    }
    if (!lastName || lastName.trim() === '') {
        throw new AuthValidationError(400, 'Last name is required');
    }
};

export const validateLoginInput = (email: string, password: string): void => {
    validateEmail(email);
    if (!password) {
        throw new AuthValidationError(400, 'Password is required');
    }
};

export const validateToken = (token: string | null): void => {
    if (!token) {
        throw new AuthValidationError(401, 'Token is required');
    }
};

export const validateProfileUpdate = (data: { firstName?: string; lastName?: string }): void => {
    if (data.firstName === '') {
        throw new AuthValidationError(400, 'First name cannot be empty');
    }
    if (data.lastName === '') {
        throw new AuthValidationError(400, 'Last name cannot be empty');
    }
};

export const sendErrorResponse = (res: Response, error: unknown) => {
    if (error instanceof AuthValidationError) {
        return errorResponse(res, error.statusCode, error.message);
    }
    return errorResponse(res, 500, 'Internal server error');
};