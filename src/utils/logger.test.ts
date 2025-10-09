// Use global Jest functions to avoid extra dependencies
import { debugLog, logError, logger } from './logger.js';

describe('Logger Tests', () => {
  let mockConsoleLog: jest.SpiedFunction<typeof console.log>;
  let mockConsoleError: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Clear environment variables for consistent testing
    delete process.env.DEBUG;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original console methods
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('debugLog', () => {
    test('should always log debug messages', () => {
      debugLog('Test debug message', { key: 'value' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[DEBUG]',
        'Test debug message',
        { key: 'value' },
      );
    });

    test('should handle multiple arguments', () => {
      debugLog('Message', 'arg1', 'arg2', { object: 'value' });

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[DEBUG]',
        'Message',
        'arg1',
        'arg2',
        { object: 'value' },
      );
    });

    test('should handle no arguments', () => {
      debugLog();

      expect(mockConsoleError).toHaveBeenCalledWith('[DEBUG]');
    });

    test('should handle complex objects', () => {
      const complexObject = {
        nested: { array: [1, 2, 3] },
        func: () => 'test',
        null: null,
        undefined: undefined,
      };

      debugLog('Complex object:', complexObject);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[DEBUG]',
        'Complex object:',
        complexObject,
      );
    });
  });

  describe('logError', () => {
    test('should always log error messages', () => {
      logError('Error message', new Error('Test error'));

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[ERROR]',
        'Error message: Test error',
      );
    });

    test('should log errors even when DEBUG is not set', () => {
      logError('Critical error');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[ERROR]',
        'Critical error',
      );
    });

    test('should handle error object as second argument', () => {
      const error1 = new Error('First error');

      logError('Error occurred', error1);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[ERROR]',
        'Error occurred: First error',
      );
    });

    test('should handle message only', () => {
      logError('Simple error message');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[ERROR]',
        'Simple error message',
      );
    });

    test('should handle undefined error argument', () => {
      logError('Message with undefined error', undefined);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[ERROR]',
        'Message with undefined error',
      );
    });
  });

  describe('logger object', () => {
    test('should have debug and error methods', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('should call debugLog when logger.debug is used', () => {
      logger.debug('Test message');

      expect(mockConsoleError).toHaveBeenCalledWith('[DEBUG]', 'Test message');
    });

    test('should call logError when logger.error is used', () => {
      logger.error('Test error');

      expect(mockConsoleError).toHaveBeenCalledWith('[ERROR]', 'Test error');
    });
  });

  describe('Production environment behavior', () => {
    test('should still log errors in production', () => {
      process.env.NODE_ENV = 'production';

      logError('Production error');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[ERROR]',
        'Production error',
      );
    });

    test('should log debug messages in production', () => {
      process.env.NODE_ENV = 'production';

      debugLog('Production debug message');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[DEBUG]',
        'Production debug message',
      );
    });
  });
});
