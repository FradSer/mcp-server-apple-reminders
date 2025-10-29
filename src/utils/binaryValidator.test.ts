/**
 * binaryValidator.test.ts
 * Tests for binary validation utilities
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  validateBinaryPath,
  calculateBinaryHash,
  validateBinaryIntegrity,
  validateBinarySecurity,
  findSecureBinaryPath,
  getEnvironmentBinaryConfig,
  BinaryValidationError,
} from './binaryValidator.js';

// Mock modules for testing
jest.mock('node:fs');
jest.mock('node:crypto');
jest.mock('node:path');

describe('BinaryValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBinaryPath', () => {
    it('should throw error for non-absolute path when required', () => {
      expect(() => {
        validateBinaryPath('relative/path/binary', {
          requireAbsolutePath: true,
        });
      }).toThrow(BinaryValidationError);
    });

    it('should throw error for path traversal attempts', () => {
      expect(() => {
        validateBinaryPath('/allowed/path/../../../etc/passwd');
      }).toThrow(BinaryValidationError);
    });
  });


  describe('getEnvironmentBinaryConfig', () => {
    it('should return test configuration when NODE_ENV is test', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const config = getEnvironmentBinaryConfig();

      expect(config.requireAbsolutePath).toBe(false);
      expect(config.maxFileSize).toBe(100 * 1024 * 1024);

      process.env.NODE_ENV = originalEnv;
    });

    it('should return development configuration when NODE_ENV is development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const config = getEnvironmentBinaryConfig();

      expect(config.maxFileSize).toBe(100 * 1024 * 1024);

      process.env.NODE_ENV = originalEnv;
    });

    it('should return production configuration by default', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const config = getEnvironmentBinaryConfig();

      expect(config.requireAbsolutePath).toBe(true);
      expect(config.maxFileSize).toBe(50 * 1024 * 1024);
      expect(config.expectedHash).toBeUndefined(); // Would be set from env var

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('BinaryValidationError', () => {
    it('should create error with correct properties', () => {
      const error = new BinaryValidationError('Test message', 'TEST_CODE');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('BinaryValidationError');
    });
  });
});
