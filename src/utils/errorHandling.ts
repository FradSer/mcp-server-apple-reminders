/**
 * errorHandling.ts
 * Centralized error handling utilities for consistent error responses
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ValidationError } from '../validation/schemas.js';

/**
 * Creates a descriptive error message, showing validation details in dev mode.
 */
function createErrorMessage(operation: string, error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'System error occurred';
  const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG;

  // For validation errors, always return the detailed message.
  if (error instanceof ValidationError) {
    return message;
  }

  // For other errors, be generic in production.
  return isDev
    ? `Failed to ${operation}: ${message}`
    : `Failed to ${operation}: System error occurred`;
}

/**
 * Simplified error handling utilities
 */
export const ErrorResponseFactory = {
  createErrorResponse(operation: string, error: unknown): CallToolResult {
    return {
      content: [{ type: 'text', text: createErrorMessage(operation, error) }],
      isError: true,
    };
  },

  createJsonErrorResponse(operation: string, error: unknown): CallToolResult {
    const data = { error: createErrorMessage(operation, error), isError: true };
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      isError: true,
    };
  },

  createSuccessResponse(message: string): CallToolResult {
    return {
      content: [{ type: 'text', text: message }],
      isError: false,
    };
  },

  createJsonSuccessResponse(data: unknown): CallToolResult {
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      isError: false,
    };
  },
};

/**
 * Utility for handling async operations with consistent error handling
 */
export async function handleAsyncOperation(
  operation: () => Promise<string>,
  operationName: string,
): Promise<CallToolResult> {
  try {
    const result = await operation();
    return ErrorResponseFactory.createSuccessResponse(result);
  } catch (error) {
    return ErrorResponseFactory.createErrorResponse(operationName, error);
  }
}

/**
 * Utility for handling async operations that return JSON responses
 */
export async function handleJsonAsyncOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<CallToolResult> {
  try {
    const result = await operation();
    return ErrorResponseFactory.createJsonSuccessResponse(result);
  } catch (error) {
    return ErrorResponseFactory.createJsonErrorResponse(operationName, error);
  }
}
