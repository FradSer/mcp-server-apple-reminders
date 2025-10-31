/**
 * Tests for constants.ts
 */

import { MESSAGES } from './constants.js';

describe('Constants', () => {
  describe('MESSAGES', () => {
    describe('ERROR', () => {
      describe('INPUT_VALIDATION_FAILED', () => {
        it.each([
          ['Invalid field', 'Input validation failed: Invalid field'],
          ['Field required', 'Input validation failed: Field required'],
          ['Invalid format', 'Input validation failed: Invalid format'],
        ])(
          'should format validation error message for "%s"',
          (input, expected) => {
            const message = MESSAGES.ERROR.INPUT_VALIDATION_FAILED(input);
            expect(message).toBe(expected);
          },
        );
      });

      describe('UNKNOWN_TOOL', () => {
        it.each([
          ['invalid_tool', 'Unknown tool: invalid_tool'],
          ['tool1', 'Unknown tool: tool1'],
          ['tool2', 'Unknown tool: tool2'],
        ])(
          'should format unknown tool error message for "%s"',
          (name, expected) => {
            const message = MESSAGES.ERROR.UNKNOWN_TOOL(name);
            expect(message).toBe(expected);
          },
        );
      });

      describe('UNKNOWN_ACTION', () => {
        it.each([
          ['reminders', 'invalid', 'Unknown reminders action: invalid'],
          ['reminders', 'unknown', 'Unknown reminders action: unknown'],
          ['lists', 'invalid', 'Unknown lists action: invalid'],
        ])(
          'should format unknown action error message for %s.%s',
          (tool, action, expected) => {
            const message = MESSAGES.ERROR.UNKNOWN_ACTION(tool, action);
            expect(message).toBe(expected);
          },
        );
      });
    });
  });
});
