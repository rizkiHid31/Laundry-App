import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data?: T;
}

interface ErrorResponse {
  success: false;
  message: string;
}

export const successResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
  };
  if (data) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

export const errorResponse = (res: Response, statusCode: number, message: string): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
  };
  return res.status(statusCode).json(response);
};

export const createdResponse = <T>(res: Response, message: string, data?: T): Response => {
  return successResponse(res, 201, message, data);
};

export const okResponse = <T>(res: Response, message: string, data?: T): Response => {
  return successResponse(res, 200, message, data);
};

export const unauthorizedResponse = (res: Response, message = 'Unauthorized'): Response => {
  return errorResponse(res, 401, message);
};

export const forbiddenResponse = (res: Response, message = 'Forbidden'): Response => {
  return errorResponse(res, 403, message);
};

export const notFoundResponse = (res: Response, message = 'Not found'): Response => {
  return errorResponse(res, 404, message);
};
