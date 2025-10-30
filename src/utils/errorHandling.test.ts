/**
 * errorHandling.test.ts
 * Tests for error handling utilities
 */

import { ValidationError } from '../validation/schemas.js';
import { handleAsyncOperation } from './errorHandling.js';

describe('ErrorHandling', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
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

    it('should handle ValidationError specially', async () => {
      const validationError = new ValidationError('Validation failed', {
        field1: ['Required field'],
      });

      const mockOperation = jest.fn().mockRejectedValue(validationError);

      const result = await handleAsyncOperation(mockOperation, 'validate');

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Validation failed');
    });

    it('should handle different operation names', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Failed'));

      const result = await handleAsyncOperation(
        mockOperation,
        'create reminder',
      );

      expect(result.content[0].text).toContain('Failed to create reminder');
    });

    it('should show detailed error in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error('Detailed error'));

      const result = await handleAsyncOperation(
        mockOperation,
        'test operation',
      );

      expect(result.content[0].text).toBe(
        'Failed to test operation: Detailed error',
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should show generic error in production mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalDebug = process.env.DEBUG;
      delete process.env.DEBUG;
      process.env.NODE_ENV = 'production';

      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error('Detailed error'));

      const result = await handleAsyncOperation(
        mockOperation,
        'test operation',
      );

      expect(result.content[0].text).toBe(
        'Failed to test operation: System error occurred',
      );

      process.env.NODE_ENV = originalNodeEnv;
      if (originalDebug) process.env.DEBUG = originalDebug;
    });

    it('should handle non-Error exceptions', async () => {
      const mockOperation = jest.fn().mockRejectedValue('String error');

      const result = await handleAsyncOperation(
        mockOperation,
        'test operation',
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe(
        'Failed to test operation: System error occurred',
      );
    });

    it('should handle object errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue({ code: 'ERROR' });

      const result = await handleAsyncOperation(
        mockOperation,
        'test operation',
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe(
        'Failed to test operation: System error occurred',
      );
    });

    it('should show detailed error when DEBUG is set', async () => {
      process.env.DEBUG = '1';
      process.env.NODE_ENV = 'production';

      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error('Debug error'));

      const result = await handleAsyncOperation(
        mockOperation,
        'test operation',
      );

      expect(result.content[0].text).toBe(
        'Failed to test operation: Debug error',
      );

      delete process.env.DEBUG;
      process.env.NODE_ENV = originalEnv;
    });
  });
});
