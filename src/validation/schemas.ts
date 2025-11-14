/**
 * validation/schemas.ts
 * Comprehensive input validation schemas using Zod for security
 */

import { z } from 'zod/v3';
import { VALIDATION } from '../utils/constants.js';
import { getTodayStart, getTomorrowStart } from '../utils/dateUtils.js';

// Security patterns – allow printable Unicode text while blocking dangerous control and delimiter chars.
// Allows standard printable ASCII, extended Latin, CJK, plus newlines/tabs for notes.
// Blocks: control chars (0x00-0x1F except \n\r\t), DEL, dangerous delimiters, Unicode line separators
// This keeps Chinese/Unicode names working while remaining safe with AppleScript quoting.
const SAFE_TEXT_PATTERN = /^[\u0020-\u007E\u00A0-\uFFFF\n\r\t]*$/u;
// Support multiple date formats: YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, or ISO 8601
// Basic validation - detailed parsing handled by Swift
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}.*$/;
const BARE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// URL validation that blocks internal/private network addresses and localhost
// Prevents SSRF attacks while allowing legitimate external URLs
const URL_PATTERN =
  /^https?:\/\/(?!(?:127\.|192\.168\.|10\.|localhost|0\.0\.0\.0))[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?:\/[^\s<>"{}|\\^`[\]]*)?$/i;

// Maximum lengths for security (imported from constants.ts)

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
export const SafeTextSchema = createSafeTextSchema(
  1,
  VALIDATION.MAX_TITLE_LENGTH,
);
export const SafeNoteSchema = createOptionalSafeTextSchema(
  VALIDATION.MAX_NOTE_LENGTH,
  'Note',
);
export const SafeListNameSchema = createOptionalSafeTextSchema(
  VALIDATION.MAX_LIST_NAME_LENGTH,
  'List name',
);
export const RequiredListNameSchema = createSafeTextSchema(
  1,
  VALIDATION.MAX_LIST_NAME_LENGTH,
  'List name',
);
export const SafeSearchSchema = createOptionalSafeTextSchema(
  VALIDATION.MAX_SEARCH_LENGTH,
  'Search term',
);

export const SafeDateSchema = z
  .string()
  .regex(
    DATE_PATTERN,
    "Date must be in format 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', or ISO 8601 (e.g., '2025-10-30T04:00:00Z')",
  )
  .optional();

/**
 * Checks if a date string represents today in local timezone
 */
// Bare YYYY-MM-DD strings parse in UTC in JS engines, so normalize them to local midnight.
function parseDateRespectingLocalTimezone(dateString: string): Date | null {
  if (BARE_DATE_PATTERN.test(dateString)) {
    const [yearString, monthString, dayString] = dateString.split('-');
    const year = Number(yearString);
    const monthIndex = Number(monthString) - 1;
    const day = Number(dayString);
    if ([year, monthIndex, day].some(Number.isNaN)) {
      return null;
    }
    return new Date(year, monthIndex, day);
  }

  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function isTodayDateString(dateString: string): boolean {
  try {
    const inputDate = parseDateRespectingLocalTimezone(dateString);
    if (!inputDate) {
      return false;
    }
    const today = getTodayStart();
    const tomorrow = getTomorrowStart();
    return inputDate >= today && inputDate < tomorrow;
  } catch {
    return false;
  }
}

/**
 * Date schema that enforces today-only policy (local timezone)
 */
export const TodayOnlyDateSchema = z
  .string()
  .regex(
    DATE_PATTERN,
    "Date must be in format 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', or ISO 8601",
  )
  .refine(isTodayDateString, {
    message: 'Date must be today (not past or future dates)',
  })
  .optional();

/**
 * Creates a required date schema with validation
 */
const createRequiredDateSchema = (fieldName: string) =>
  z
    .string()
    .regex(
      DATE_PATTERN,
      `${fieldName} must be in format 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', or ISO 8601`,
    )
    .min(1, `${fieldName} is required`);

export const SafeUrlSchema = z
  .string()
  .regex(URL_PATTERN, 'URL must be a valid HTTP or HTTPS URL')
  .max(
    VALIDATION.MAX_URL_LENGTH,
    `URL cannot exceed ${VALIDATION.MAX_URL_LENGTH} characters`,
  )
  .optional();

// Reusable schemas for common fields
const DueWithinEnum = z
  .enum(['today', 'tomorrow', 'this-week', 'overdue', 'no-date'])
  .optional();

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
export const CreateCalendarEventSchema = z.object({
  title: SafeTextSchema,
  startDate: createRequiredDateSchema('Start date'),
  endDate: createRequiredDateSchema('End date'),
  note: SafeNoteSchema,
  location: createOptionalSafeTextSchema(
    VALIDATION.MAX_LOCATION_LENGTH,
    'Location',
  ),
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
  location: createOptionalSafeTextSchema(
    VALIDATION.MAX_LOCATION_LENGTH,
    'Location',
  ),
  url: SafeUrlSchema,
  isAllDay: z.boolean().optional(),
  targetCalendar: SafeListNameSchema,
});

export const DeleteCalendarEventSchema = z.object({
  id: SafeIdSchema,
});

export const ReadCalendarsSchema = z.object({});

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
