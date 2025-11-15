/**
 * constants.test.ts
 * Tests for constants and error message templates
 */

import { FILE_SYSTEM, MESSAGES, VALIDATION } from './constants.js';

describe('constants', () => {
  describe('FILE_SYSTEM', () => {
    it('should have correct values', () => {
      expect(FILE_SYSTEM.MAX_DIRECTORY_SEARCH_DEPTH).toBe(10);
      expect(FILE_SYSTEM.PACKAGE_JSON_FILENAME).toBe('package.json');
      expect(FILE_SYSTEM.SWIFT_BINARY_NAME).toBe('EventKitCLI');
    });
  });

  describe('VALIDATION', () => {
    it('should have correct max lengths', () => {
      expect(VALIDATION.MAX_TITLE_LENGTH).toBe(200);
      expect(VALIDATION.MAX_NOTE_LENGTH).toBe(2000);
      expect(VALIDATION.MAX_LIST_NAME_LENGTH).toBe(100);
      expect(VALIDATION.MAX_SEARCH_LENGTH).toBe(100);
      expect(VALIDATION.MAX_URL_LENGTH).toBe(500);
      expect(VALIDATION.MAX_LOCATION_LENGTH).toBe(200);
    });
  });

  describe('MESSAGES.ERROR', () => {
    it('should generate INPUT_VALIDATION_FAILED message', () => {
      const message = MESSAGES.ERROR.INPUT_VALIDATION_FAILED('invalid field');
      expect(message).toBe('Input validation failed: invalid field');
    });

    it('should generate UNKNOWN_TOOL message', () => {
      const message = MESSAGES.ERROR.UNKNOWN_TOOL('unknown_tool');
      expect(message).toBe('Unknown tool: unknown_tool');
    });

    it('should generate UNKNOWN_ACTION message', () => {
      const message = MESSAGES.ERROR.UNKNOWN_ACTION('reminders', 'invalid');
      expect(message).toBe('Unknown reminders action: invalid');
    });

    it('should generate SYSTEM_ERROR message', () => {
      const message = MESSAGES.ERROR.SYSTEM_ERROR('process data');
      expect(message).toBe('Failed to process data: System error occurred');
    });
  });
});
