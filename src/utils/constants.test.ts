/**
 * Tests for constants.ts
 */

import { MESSAGES } from './constants.js';

describe('Constants', () => {
  describe('MESSAGES', () => {
    describe('ERROR', () => {
      describe('INPUT_VALIDATION_FAILED', () => {
        it('should format validation error message', () => {
          const message =
            MESSAGES.ERROR.INPUT_VALIDATION_FAILED('Invalid field');
          expect(message).toBe('Input validation failed: Invalid field');
        });

        it('should handle different error details', () => {
          const message1 =
            MESSAGES.ERROR.INPUT_VALIDATION_FAILED('Field required');
          const message2 =
            MESSAGES.ERROR.INPUT_VALIDATION_FAILED('Invalid format');
          expect(message1).toBe('Input validation failed: Field required');
          expect(message2).toBe('Input validation failed: Invalid format');
        });
      });

      describe('UNKNOWN_TOOL', () => {
        it('should format unknown tool error message', () => {
          const message = MESSAGES.ERROR.UNKNOWN_TOOL('invalid_tool');
          expect(message).toBe('Unknown tool: invalid_tool');
        });

        it('should handle different tool names', () => {
          const message1 = MESSAGES.ERROR.UNKNOWN_TOOL('tool1');
          const message2 = MESSAGES.ERROR.UNKNOWN_TOOL('tool2');
          expect(message1).toBe('Unknown tool: tool1');
          expect(message2).toBe('Unknown tool: tool2');
        });
      });

      describe('UNKNOWN_ACTION', () => {
        it('should format unknown action error message', () => {
          const message = MESSAGES.ERROR.UNKNOWN_ACTION('reminders', 'invalid');
          expect(message).toBe('Unknown reminders action: invalid');
        });

        it('should handle different tool and action combinations', () => {
          const message1 = MESSAGES.ERROR.UNKNOWN_ACTION(
            'reminders',
            'unknown',
          );
          const message2 = MESSAGES.ERROR.UNKNOWN_ACTION('lists', 'invalid');
          expect(message1).toBe('Unknown reminders action: unknown');
          expect(message2).toBe('Unknown lists action: invalid');
        });
      });
    });
  });
});
