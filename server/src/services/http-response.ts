import type { Response } from "express";
import type { ApiResponse } from "../types/domain.js";

export function sendSuccess<T>(
  response: Response,
  statusCode: number,
  data: T
) {
  const payload: ApiResponse<T> = {
    success: true,
    data
  };

  return response.status(statusCode).json(payload);
}

export function sendError(
  response: Response,
  statusCode: number,
  error: string
) {
  const payload: ApiResponse<never> = {
    success: false,
    error
  };

  return response.status(statusCode).json(payload);
}
