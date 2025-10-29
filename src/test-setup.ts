/**
 * Jest test setup file
 * This file is executed before all tests
 */

// Mock console.log for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DEBUG = 'true';

// Mock import.meta.url for Jest - provide a valid file path
const mockImportMeta = {
  url: `file://${process.cwd()}/src/index.ts`,
};

// Add import.meta to global
Object.defineProperty(global, 'import', {
  value: { meta: mockImportMeta },
  writable: false,
  configurable: true,
});

// Global test timeout
jest.setTimeout(10000);
