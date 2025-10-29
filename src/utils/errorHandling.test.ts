/**
 * errorHandling.test.ts
 * Tests for error handling utilities
 */

import { ValidationError } from '../validation/schemas.js';
import {
  ErrorResponseFactory,
  handleAsyncOperation,
  handleJsonAsyncOperation,
} from './errorHandling.js';

describe('ErrorHandling', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('ErrorResponseFactory', () => {
    describe('createErrorResponse', () => {
      it('should create error response with string message', () => {
        const result = ErrorResponseFactory.createErrorResponse(
          'test operation',
          'Test error message',
        );

        // In test environment, it shows generic error message
        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: 'Failed to test operation: System error occurred',
            },
          ],
          isError: true,
        });
      });

      it('should create error response with Error object', () => {
        const error = new Error('Test error');
        const result = ErrorResponseFactory.createErrorResponse(
          'test operation',
          error,
        );

        expect(result).toEqual({
          content: [
            { type: 'text', text: 'Failed to test operation: Test error' },
          ],
          isError: true,
        });
      });

      it('should create generic error message in test mode', () => {
        // In test mode, it shows generic error message for security

        const result = ErrorResponseFactory.createErrorResponse(
          'test operation',
          'Sensitive error details',
        );

        expect(result.content[0].text).toBe(
          'Failed to test operation: System error occurred',
        );
      });

      it('should show detailed error in development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const result = ErrorResponseFactory.createErrorResponse(
          'test operation',
          new Error('Detailed error'),
        );

        expect(result.content[0].text).toBe(
          'Failed to test operation: Detailed error',
        );

        process.env.NODE_ENV = originalEnv;
      });

      it('should handle ValidationError specially', () => {
        const validationError = new ValidationError('Validation failed', {
          field1: ['Required field'],
          field2: ['Invalid format'],
        });

        const result = ErrorResponseFactory.createErrorResponse(
          'validate',
          validationError,
        );

        expect(result.content[0].text).toBe('Validation failed');
        expect(result.isError).toBe(true);
      });

      it('should handle unknown error types', () => {
        const result = ErrorResponseFactory.createErrorResponse(
          'test operation',
          null,
        );

        expect(result.content[0].text).toBe(
          'Failed to test operation: System error occurred',
        );
      });
    });

    describe('createJsonErrorResponse', () => {
      it('should create JSON error response', () => {
        const result = ErrorResponseFactory.createJsonErrorResponse(
          'test operation',
          'Error occurred',
        );

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Failed to test operation: System error occurred',
                  isError: true,
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        });
      });

      it('should format JSON with proper indentation', () => {
        const result = ErrorResponseFactory.createJsonErrorResponse(
          'test',
          'error',
        );

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toEqual({
          error: 'Failed to test: System error occurred',
          isError: true,
        });
      });
    });

    describe('createSuccessResponse', () => {
      it('should create success response', () => {
        const result = ErrorResponseFactory.createSuccessResponse(
          'Operation completed',
        );

        expect(result).toEqual({
          content: [{ type: 'text', text: 'Operation completed' }],
          isError: false,
        });
      });
    });

    describe('createJsonSuccessResponse', () => {
      it('should create JSON success response', () => {
        const data = { result: 'success', count: 5 };
        const result = ErrorResponseFactory.createJsonSuccessResponse(data);

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
          isError: false,
        });
      });

      it('should handle complex objects', () => {
        const data = {
          reminders: [
            { id: '1', title: 'Test' },
            { id: '2', title: 'Another' },
          ],
          total: 2,
        };
        const result = ErrorResponseFactory.createJsonSuccessResponse(data);

        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toEqual(data);
      });
    });
  });

  describe('handleAsyncOperation', () => {
    it('should return success response on successful operation', async () => {
      const mockOperation = jest.fn().mockResolvedValue('Success message');

      const result = await handleAsyncOperation(
        mockOperation,
        'test operation',
      );

      expect(mockOperation).toHaveBeenCalled();
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Success message' }],
        isError: false,
      });
    });

    it('should return error response on failed operation', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error('Operation failed'));

      const result = await handleAsyncOperation(
        mockOperation,
        'test operation',
      );

      expect(mockOperation).toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to test operation');
    });

    it('should handle different operation names', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Failed'));

      const result = await handleAsyncOperation(
        mockOperation,
        'create reminder',
      );

      expect(result.content[0].text).toContain('Failed to create reminder');
    });
  });

  describe('handleJsonAsyncOperation', () => {
    it('should return JSON success response on successful operation', async () => {
      const mockData = { id: '123', title: 'Test Reminder' };
      const mockOperation = jest.fn().mockResolvedValue(mockData);

      const result = await handleJsonAsyncOperation(
        mockOperation,
        'test operation',
      );

      expect(mockOperation).toHaveBeenCalled();
      expect(result.isError).toBe(false);

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(mockData);
    });

    it('should return JSON error response on failed operation', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error('JSON operation failed'));

      const result = await handleJsonAsyncOperation(
        mockOperation,
        'test operation',
      );

      expect(mockOperation).toHaveBeenCalled();
      expect(result.isError).toBe(true);

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain('Failed to test operation');
      expect(parsed.isError).toBe(true);
    });

    it('should handle complex return types', async () => {
      const mockData = {
        reminders: [
          { id: '1', title: 'First' },
          { id: '2', title: 'Second' },
        ],
        metadata: { total: 2, filtered: false },
      };
      const mockOperation = jest.fn().mockResolvedValue(mockData);

      const result = await handleJsonAsyncOperation(
        mockOperation,
        'fetch reminders',
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual(mockData);
    });
  });
});
