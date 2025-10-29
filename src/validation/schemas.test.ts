/**
 * schemas.test.ts
 * Tests for validation schemas
 */

import { z } from 'zod';
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
  UpdateReminderListSchema,
  UpdateReminderSchema,
  ValidationError,
  validateInput,
} from './schemas.js';

// Local enum constants for testing
const DueWithinEnum = z
  .enum(['today', 'tomorrow', 'this-week', 'overdue', 'no-date'])
  .optional();
const OrganizeByEnum = z
  .enum(['priority', 'due_date', 'category', 'completion_status'])
  .optional();

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

    describe('Enums', () => {
      it('should validate DueWithinEnum values', () => {
        expect(() => DueWithinEnum.parse('today')).not.toThrow();
        expect(() => DueWithinEnum.parse('tomorrow')).not.toThrow();
        expect(() => DueWithinEnum.parse('this-week')).not.toThrow();
        expect(() => DueWithinEnum.parse('overdue')).not.toThrow();
        expect(() => DueWithinEnum.parse('no-date')).not.toThrow();
        expect(() => DueWithinEnum.parse('invalid')).toThrow();
      });

      it('should validate OrganizeByEnum values', () => {
        expect(() => OrganizeByEnum.parse('priority')).not.toThrow();
        expect(() => OrganizeByEnum.parse('due_date')).not.toThrow();
        expect(() => OrganizeByEnum.parse('category')).not.toThrow();
        expect(() => OrganizeByEnum.parse('completion_status')).not.toThrow();
        expect(() => OrganizeByEnum.parse('invalid')).toThrow();
      });
    });
  });

  describe('Tool-specific schemas', () => {
    describe('CreateReminderSchema', () => {
      it('should validate create reminder input', () => {
        const validInput = {
          title: 'Test reminder',
          dueDate: '2024-01-15',
          note: 'Test note',
          url: 'https://example.com',
          targetList: 'Work',
        };

        expect(() => CreateReminderSchema.parse(validInput)).not.toThrow();
      });

      it('should require title', () => {
        const invalidInput = {
          dueDate: '2024-01-15',
        };

        expect(() => CreateReminderSchema.parse(invalidInput)).toThrow();
      });

      it('should make other fields optional', () => {
        const minimalInput = {
          title: 'Test reminder',
        };

        expect(() => CreateReminderSchema.parse(minimalInput)).not.toThrow();
      });
    });

    describe('ReadRemindersSchema', () => {
      it('should validate read reminders input', () => {
        const validInput = {
          id: '123',
          filterList: 'Work',
          showCompleted: true,
          search: 'meeting',
          dueWithin: 'today',
        };

        expect(() => ReadRemindersSchema.parse(validInput)).not.toThrow();
      });

      it('should make all fields optional', () => {
        expect(() => ReadRemindersSchema.parse({})).not.toThrow();
      });
    });

    describe('UpdateReminderSchema', () => {
      it('should validate update reminder input', () => {
        const validInput = {
          id: '123',
          title: 'Updated title',
          dueDate: '2024-01-15',
          note: 'Updated note',
          url: 'https://example.com',
          completed: false,
          targetList: 'Work',
        };

        expect(() => UpdateReminderSchema.parse(validInput)).not.toThrow();
      });

      it('should require id', () => {
        const invalidInput = {
          title: 'Updated title',
        };

        expect(() => UpdateReminderSchema.parse(invalidInput)).toThrow();
      });

      it('should make other fields optional', () => {
        const minimalInput = {
          id: '123',
        };

        expect(() => UpdateReminderSchema.parse(minimalInput)).not.toThrow();
      });
    });

    describe('DeleteReminderSchema', () => {
      it('should validate delete reminder input', () => {
        const validInput = {
          id: '123',
        };

        expect(() => DeleteReminderSchema.parse(validInput)).not.toThrow();
      });

      it('should require id', () => {
        expect(() => DeleteReminderSchema.parse({})).toThrow();
      });
    });

    describe('CreateReminderListSchema', () => {
      it('should validate create list input', () => {
        const validInput = {
          name: 'New List',
        };

        expect(() => CreateReminderListSchema.parse(validInput)).not.toThrow();
      });

      it('should require name', () => {
        expect(() => CreateReminderListSchema.parse({})).toThrow();
      });
    });

    describe('UpdateReminderListSchema', () => {
      it('should validate update list input', () => {
        const validInput = {
          name: 'Old Name',
          newName: 'New Name',
        };

        expect(() => UpdateReminderListSchema.parse(validInput)).not.toThrow();
      });

      it('should require both name and newName', () => {
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
});
