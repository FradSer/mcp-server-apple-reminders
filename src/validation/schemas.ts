/**
 * validation/schemas.ts
 * Comprehensive input validation schemas using Zod for security
 */

import { z } from 'zod/v3';

// Security patterns – allow printable Unicode text while blocking dangerous control and delimiter chars.
// Allows standard printable ASCII, extended Latin, CJK, plus newlines/tabs for notes.
// Blocks: control chars (0x00-0x1F except \n\r\t), DEL, dangerous delimiters, Unicode line separators
// This keeps Chinese/Unicode names working while remaining safe with AppleScript quoting.
const SAFE_TEXT_PATTERN = /^[\u0020-\u007E\u00A0-\uFFFF\n\r\t]*$/u;
// Support multiple date formats: YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, or ISO 8601
// Basic validation - detailed parsing handled by Swift
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}.*$/;
// URL validation that blocks internal/private network addresses and localhost
// Prevents SSRF attacks while allowing legitimate external URLs
const URL_PATTERN =
  /^https?:\/\/(?!(?:127\.|192\.168\.|10\.|localhost|0\.0\.0\.0))[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?:\/[^\s<>"{}|\\^`[\]]*)?$/i;

// Maximum lengths for security
const MAX_TITLE_LENGTH = 200;
const MAX_NOTE_LENGTH = 2000;
const MAX_LIST_NAME_LENGTH = 100;
const MAX_SEARCH_LENGTH = 100;

/**
 * Schema factory functions for DRY principle and consistent validation
 */
const createSafeTextSchema = (
  minLength: number,
  maxLength: number,
  fieldName = 'Text',
) =>
  z
    .string()
    .min(minLength, `${fieldName} cannot be empty`)
    .max(maxLength, `${fieldName} cannot exceed ${maxLength} characters`)
    .regex(
      SAFE_TEXT_PATTERN,
      `${fieldName} contains invalid characters. Only alphanumeric, spaces, and basic punctuation allowed`,
    );

const createOptionalSafeTextSchema = (maxLength: number, fieldName = 'Text') =>
  z
    .string()
    .max(maxLength, `${fieldName} cannot exceed ${maxLength} characters`)
    .regex(SAFE_TEXT_PATTERN, `${fieldName} contains invalid characters`)
    .optional();

/**
 * Base validation schemas using factory functions
 */
export const SafeTextSchema = createSafeTextSchema(1, MAX_TITLE_LENGTH);
export const SafeNoteSchema = createOptionalSafeTextSchema(
  MAX_NOTE_LENGTH,
  'Note',
);
export const SafeListNameSchema = createOptionalSafeTextSchema(
  MAX_LIST_NAME_LENGTH,
  'List name',
);
export const RequiredListNameSchema = createSafeTextSchema(
  1,
  MAX_LIST_NAME_LENGTH,
  'List name',
);
export const SafeSearchSchema = createOptionalSafeTextSchema(
  MAX_SEARCH_LENGTH,
  'Search term',
);

export const SafeDateSchema = z
  .string()
  .regex(
    DATE_PATTERN,
    "Date must be in format 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', or ISO 8601 (e.g., '2025-10-30T04:00:00Z')",
  )
  .optional();

export const SafeUrlSchema = z
  .string()
  .regex(URL_PATTERN, 'URL must be a valid HTTP or HTTPS URL')
  .max(500, 'URL cannot exceed 500 characters')
  .optional();

// Reusable schemas for common fields
const DueWithinEnum = z
  .enum(['today', 'tomorrow', 'this-week', 'overdue', 'no-date'])
  .optional();

const PermissionTargetEnum = z.enum(['reminders', 'calendar']);

/**
 * Common field combinations for reusability
 */
const BaseReminderFields = {
  title: SafeTextSchema,
  dueDate: SafeDateSchema,
  note: SafeNoteSchema,
  url: SafeUrlSchema,
  targetList: SafeListNameSchema,
};

export const SafeIdSchema = z.string().min(1, 'ID cannot be empty');

/**
 * Tool-specific validation schemas
 */
export const CreateReminderSchema = z.object(BaseReminderFields);

export const ReadRemindersSchema = z.object({
  id: SafeIdSchema.optional(),
  filterList: SafeListNameSchema,
  showCompleted: z.boolean().optional().default(false),
  search: SafeSearchSchema,
  dueWithin: DueWithinEnum,
});

export const UpdateReminderSchema = z.object({
  id: SafeIdSchema,
  title: SafeTextSchema.optional(),
  dueDate: SafeDateSchema,
  note: SafeNoteSchema,
  url: SafeUrlSchema,
  completed: z.boolean().optional(),
  targetList: SafeListNameSchema,
});

export const DeleteReminderSchema = z.object({
  id: SafeIdSchema,
});

// Calendar event schemas
const _BaseCalendarEventFields = {
  title: SafeTextSchema,
  startDate: SafeDateSchema,
  endDate: SafeDateSchema,
  note: SafeNoteSchema,
  location: createOptionalSafeTextSchema(200, 'Location'),
  url: SafeUrlSchema,
  isAllDay: z.boolean().optional(),
  targetCalendar: SafeListNameSchema, // Reuse list name schema for calendar names
};

export const CreateCalendarEventSchema = z.object({
  title: SafeTextSchema,
  startDate: z
    .string()
    .regex(
      DATE_PATTERN,
      "Start date must be in format 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', or ISO 8601",
    )
    .min(1, 'Start date is required'),
  endDate: z
    .string()
    .regex(
      DATE_PATTERN,
      "End date must be in format 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', or ISO 8601",
    )
    .min(1, 'End date is required'),
  note: SafeNoteSchema,
  location: createOptionalSafeTextSchema(200, 'Location'),
  url: SafeUrlSchema,
  isAllDay: z.boolean().optional(),
  targetCalendar: SafeListNameSchema,
});

export const ReadCalendarEventsSchema = z.object({
  id: SafeIdSchema.optional(),
  filterCalendar: SafeListNameSchema,
  search: SafeSearchSchema,
  startDate: SafeDateSchema,
  endDate: SafeDateSchema,
});

export const UpdateCalendarEventSchema = z.object({
  id: SafeIdSchema,
  title: SafeTextSchema.optional(),
  startDate: SafeDateSchema,
  endDate: SafeDateSchema,
  note: SafeNoteSchema,
  location: createOptionalSafeTextSchema(200, 'Location'),
  url: SafeUrlSchema,
  isAllDay: z.boolean().optional(),
  targetCalendar: SafeListNameSchema,
});

export const DeleteCalendarEventSchema = z.object({
  id: SafeIdSchema,
});

export const CreateReminderListSchema = z.object({
  name: RequiredListNameSchema,
});

export const UpdateReminderListSchema = z.object({
  name: RequiredListNameSchema,
  newName: RequiredListNameSchema,
});

export const DeleteReminderListSchema = z.object({
  name: RequiredListNameSchema,
});

export const PermissionTargetSchema = z.object({
  target: PermissionTargetEnum,
});

/**
 * Validation error wrapper for consistent error handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Generic validation function with security error handling and logging
 */
export const validateInput = <T>(schema: z.ZodSchema<T>, input: unknown): T => {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');

      const errorDetails = error.errors.reduce<Record<string, string[]>>(
        (acc, err) => {
          const path = err.path.join('.');
          acc[path] = acc[path] ?? [];
          acc[path].push(err.message);
          return acc;
        },
        {},
      );

      throw new ValidationError(
        `Input validation failed: ${errorMessages}`,
        errorDetails,
      );
    }

    throw new ValidationError('Input validation failed: Unknown error');
  }
};
