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

    it.each([
      ['create reminder', 'Failed to create reminder'],
      ['update reminder', 'Failed to update reminder'],
      ['delete reminder', 'Failed to delete reminder'],
    ])(
      'should format error message for "%s"',
      async (operationName, expectedText) => {
        const mockOperation = jest.fn().mockRejectedValue(new Error('Failed'));

        const result = await handleAsyncOperation(mockOperation, operationName);

        expect(result.content[0].text).toContain(expectedText);
      },
    );

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

    it.each([
      ['String error', 'string error'],
      [{ code: 'ERROR' }, { code: 'ERROR' }],
    ])(
      'should handle non-Error exceptions: %s',
      async (errorValue, _description) => {
        const mockOperation = jest.fn().mockRejectedValue(errorValue);

        const result = await handleAsyncOperation(
          mockOperation,
          'test operation',
        );

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe(
          'Failed to test operation: System error occurred',
        );
      },
    );

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
