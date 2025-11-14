/**
 * schemas.test.ts
 * Tests for validation schemas
 */

import { z } from 'zod/v3';
import {
  CreateReminderListSchema,
  CreateReminderSchema,
  DeleteReminderSchema,
  ReadRemindersSchema,
  RequiredListNameSchema,
  SafeDateSchema,
  SafeNoteSchema,
  SafeTextSchema,
  SafeUrlSchema,
  TodayOnlyDateSchema,
  UpdateReminderListSchema,
  UpdateReminderSchema,
  ValidationError,
  validateInput,
} from './schemas.js';

describe('ValidationSchemas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Base validation schemas', () => {
    describe('SafeTextSchema', () => {
      it('should validate safe text', () => {
        expect(() => SafeTextSchema.parse('Valid text')).not.toThrow();
        expect(() =>
          SafeTextSchema.parse('Text with numbers 123'),
        ).not.toThrow();
        expect(() =>
          SafeTextSchema.parse('Text with punctuation!'),
        ).not.toThrow();
      });

      it('should reject empty text', () => {
        expect(() => SafeTextSchema.parse('')).toThrow();
      });

      it('should reject text that is too long', () => {
        const longText = 'a'.repeat(201);
        expect(() => SafeTextSchema.parse(longText)).toThrow();
      });

      it('should reject text with invalid characters', () => {
        expect(() =>
          SafeTextSchema.parse('Text with control char \x00'),
        ).toThrow();
        // Note: \u200E (Right-to-left mark) is allowed by SAFE_TEXT_PATTERN as it's in the Unicode range
      });
    });

    describe('SafeNoteSchema', () => {
      it('should validate optional safe notes', () => {
        expect(() => SafeNoteSchema.parse(undefined)).not.toThrow();
        expect(() => SafeNoteSchema.parse('Valid note')).not.toThrow();
      });

      it('should reject notes that are too long', () => {
        const longNote = 'a'.repeat(2001);
        expect(() => SafeNoteSchema.parse(longNote)).toThrow();
      });

      it('should allow multiline notes', () => {
        const multilineNote = 'Line 1\nLine 2\r\nLine 3';
        expect(() => SafeNoteSchema.parse(multilineNote)).not.toThrow();
      });

      it('should use custom fieldName in error messages', () => {
        // SafeNoteSchema uses 'Note' as fieldName
        const longText = 'a'.repeat(2001);
        try {
          SafeNoteSchema.parse(longText);
          expect(true).toBe(false); // Should throw
        } catch (error) {
          // Error message should use custom 'Note' fieldName
          expect((error as Error).message).toContain('Note');
        }
      });
    });

    describe('RequiredListNameSchema', () => {
      it('should validate required list names', () => {
        expect(() => RequiredListNameSchema.parse('Work')).not.toThrow();
        expect(() => RequiredListNameSchema.parse('Personal')).not.toThrow();
      });

      it('should reject empty list names', () => {
        expect(() => RequiredListNameSchema.parse('')).toThrow();
      });

      it('should reject list names that are too long', () => {
        const longName = 'a'.repeat(101);
        expect(() => RequiredListNameSchema.parse(longName)).toThrow();
      });
    });

    describe('SafeDateSchema', () => {
      it('should validate ISO date formats', () => {
        expect(() => SafeDateSchema.parse('2024-01-15')).not.toThrow();
        expect(() => SafeDateSchema.parse('2024-01-15 10:30:00')).not.toThrow();
        expect(() =>
          SafeDateSchema.parse('2024-01-15T10:30:00Z'),
        ).not.toThrow();
      });

      it('should accept undefined dates', () => {
        expect(() => SafeDateSchema.parse(undefined)).not.toThrow();
      });

      it('should reject invalid date formats', () => {
        expect(() => SafeDateSchema.parse('01/15/2024')).toThrow();
        expect(() => SafeDateSchema.parse('not-a-date')).toThrow();
        // Note: DATE_PATTERN only checks basic format, doesn't validate date ranges
        expect(() => SafeDateSchema.parse('2024-13-45')).not.toThrow();
      });
    });

    describe('SafeUrlSchema', () => {
      it('should validate safe URLs', () => {
        expect(() => SafeUrlSchema.parse('https://example.com')).not.toThrow();
        expect(() =>
          SafeUrlSchema.parse('https://api.example.com/v1/users'),
        ).not.toThrow();
      });

      it('should accept undefined URLs', () => {
        expect(() => SafeUrlSchema.parse(undefined)).not.toThrow();
      });

      it('should reject URLs that are too long', () => {
        const longUrl = `https://example.com/${'a'.repeat(500)}`;
        expect(() => SafeUrlSchema.parse(longUrl)).toThrow();
      });

      it('should reject private/internal URLs', () => {
        expect(() => SafeUrlSchema.parse('http://127.0.0.1')).toThrow();
        expect(() => SafeUrlSchema.parse('http://192.168.1.1')).toThrow();
        expect(() => SafeUrlSchema.parse('http://10.0.0.1')).toThrow();
        expect(() => SafeUrlSchema.parse('http://localhost')).toThrow();
      });

      it('should reject invalid URL formats', () => {
        expect(() => SafeUrlSchema.parse('not-a-url')).toThrow();
        expect(() => SafeUrlSchema.parse('ftp://example.com')).toThrow();
      });
    });
  });

  describe('Tool-specific schemas', () => {
    describe('Action schemas validation patterns', () => {
      it.each([
        {
          name: 'CreateReminderSchema',
          schema: CreateReminderSchema,
          validInput: {
            title: 'Test reminder',
            dueDate: '2024-01-15',
            note: 'Test note',
            url: 'https://example.com',
            targetList: 'Work',
          },
          minimalInput: { title: 'Test reminder' },
          requiredFields: ['title'],
        },
        {
          name: 'UpdateReminderSchema',
          schema: UpdateReminderSchema,
          validInput: {
            id: '123',
            title: 'Updated title',
            dueDate: '2024-01-15',
            note: 'Updated note',
            url: 'https://example.com',
            completed: false,
            targetList: 'Work',
          },
          minimalInput: { id: '123' },
          requiredFields: ['id'],
        },
        {
          name: 'DeleteReminderSchema',
          schema: DeleteReminderSchema,
          validInput: { id: '123' },
          minimalInput: { id: '123' },
          requiredFields: ['id'],
        },
        {
          name: 'CreateReminderListSchema',
          schema: CreateReminderListSchema,
          validInput: { name: 'New List' },
          minimalInput: { name: 'New List' },
          requiredFields: ['name'],
        },
      ])(
        '$name validates correctly',
        ({ schema, validInput, minimalInput, requiredFields }) => {
          // Should validate full input
          expect(() => schema.parse(validInput)).not.toThrow();

          // Should validate minimal input with only required fields
          expect(() => schema.parse(minimalInput)).not.toThrow();

          // Should reject input missing required fields
          for (const field of requiredFields) {
            const invalidInput = { ...minimalInput } as Record<string, unknown>;
            delete invalidInput[field];
            expect(() => schema.parse(invalidInput)).toThrow();
          }
        },
      );
    });

    describe('ReadRemindersSchema', () => {
      it('should validate read reminders input with all optional fields', () => {
        const validInput = {
          id: '123',
          filterList: 'Work',
          showCompleted: true,
          search: 'meeting',
          dueWithin: 'today',
        };

        expect(() => ReadRemindersSchema.parse(validInput)).not.toThrow();
        expect(() => ReadRemindersSchema.parse({})).not.toThrow();
      });
    });

    describe('UpdateReminderListSchema', () => {
      it('should validate update list input with both required fields', () => {
        const validInput = {
          name: 'Old Name',
          newName: 'New Name',
        };

        expect(() => UpdateReminderListSchema.parse(validInput)).not.toThrow();
        expect(() => UpdateReminderListSchema.parse({ name: 'Old' })).toThrow();
        expect(() =>
          UpdateReminderListSchema.parse({ newName: 'New' }),
        ).toThrow();
      });
    });
  });

  describe('validateInput', () => {
    it('should return parsed data for valid input', () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const input = { name: 'John', age: 30 };

      const result = validateInput(schema, input);

      expect(result).toEqual(input);
    });

    it('should throw ValidationError for invalid input', () => {
      const schema = z.object({ name: z.string(), age: z.number() });
      const input = { name: 'John', age: 'thirty' };

      expect(() => validateInput(schema, input)).toThrow(ValidationError);
    });

    it('should include detailed error information', () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.number().min(0),
        email: z.string().email(),
      });
      const input = { name: 'J', age: -5, email: 'invalid-email' };

      try {
        validateInput(schema, input);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.details).toBeDefined();
        expect(
          Object.keys(validationError.details as Record<string, string[]>),
        ).toHaveLength(3);
      }
    });

    it('should handle ValidationError instances specially', () => {
      const schema = SafeTextSchema;
      const input = ''; // Invalid: empty string

      try {
        validateInput(schema, input);
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as Error).message).toContain('cannot be empty');
      }
    });
  });

  describe('TodayOnlyDateSchema', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should accept today dates in various formats', () => {
      const now = new Date('2024-11-14T10:30:00');
      jest.setSystemTime(now);

      expect(() => TodayOnlyDateSchema.parse('2024-11-14')).not.toThrow();
      expect(() =>
        TodayOnlyDateSchema.parse('2024-11-14 10:30:00'),
      ).not.toThrow();
      expect(() =>
        TodayOnlyDateSchema.parse('2024-11-14T10:30:00Z'),
      ).not.toThrow();
    });

    it('should reject yesterday dates', () => {
      const now = new Date('2024-11-14T10:30:00');
      jest.setSystemTime(now);

      expect(() => TodayOnlyDateSchema.parse('2024-11-13')).toThrow(
        'Date must be today',
      );
      expect(() => TodayOnlyDateSchema.parse('2024-11-13 23:59:59')).toThrow(
        'Date must be today',
      );
    });

    it('should reject tomorrow dates', () => {
      const now = new Date('2024-11-14T10:30:00');
      jest.setSystemTime(now);

      expect(() => TodayOnlyDateSchema.parse('2024-11-15')).toThrow(
        'Date must be today',
      );
      expect(() => TodayOnlyDateSchema.parse('2024-11-15 00:00:00')).toThrow(
        'Date must be today',
      );
    });

    it('should reject invalid date format', () => {
      const now = new Date('2024-11-14T10:30:00');
      jest.setSystemTime(now);

      expect(() => TodayOnlyDateSchema.parse('not-a-date')).toThrow();
      expect(() => TodayOnlyDateSchema.parse('11/14/2024')).toThrow();
    });

    it('should accept undefined as optional', () => {
      expect(() => TodayOnlyDateSchema.parse(undefined)).not.toThrow();
    });

    it('should handle edge case at midnight', () => {
      const midnight = new Date('2024-11-14T00:00:00');
      jest.setSystemTime(midnight);

      expect(() =>
        TodayOnlyDateSchema.parse('2024-11-14 00:00:00'),
      ).not.toThrow();
      expect(() => TodayOnlyDateSchema.parse('2024-11-13 23:59:59')).toThrow(
        'Date must be today',
      );
    });

    it('should handle edge case before midnight', () => {
      const beforeMidnight = new Date('2024-11-14T23:59:59');
      jest.setSystemTime(beforeMidnight);

      expect(() =>
        TodayOnlyDateSchema.parse('2024-11-14 23:59:59'),
      ).not.toThrow();
      expect(() => TodayOnlyDateSchema.parse('2024-11-15 00:00:00')).toThrow(
        'Date must be today',
      );
    });
  });

  describe('ValidationError', () => {
    it('should create error with message', () => {
      const error = new ValidationError('Test validation error');

      expect(error.message).toBe('Test validation error');
      expect(error.name).toBe('ValidationError');
    });

    it('should create error with message and details', () => {
      const details = { field1: ['Required'], field2: ['Invalid format'] };
      const error = new ValidationError('Validation failed', details);

      expect(error.message).toBe('Validation failed');
      expect(error.details).toBe(details);
    });

    it('should handle undefined details', () => {
      const error = new ValidationError('Test error');

      expect(error.details).toBeUndefined();
    });
  });

  describe('validateInput error handling', () => {
    it('should handle non-ZodError exceptions', () => {
      const schema = z.object({ name: z.string() });
      // Mock schema.parse to throw a non-ZodError
      const originalParse = schema.parse;
      schema.parse = jest.fn(() => {
        throw new Error('Unknown error');
      });

      expect(() => validateInput(schema, { name: 'test' })).toThrow(
        ValidationError,
      );

      const thrownError = (() => {
        try {
          validateInput(schema, { name: 'test' });
          return null;
        } catch (error) {
          return error;
        }
      })();

      expect(thrownError).toBeInstanceOf(ValidationError);
      expect((thrownError as ValidationError).message).toBe(
        'Input validation failed: Unknown error',
      );

      schema.parse = originalParse;
    });
  });
});
