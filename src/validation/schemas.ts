/**
 * validation/schemas.ts
 * Comprehensive input validation schemas using Zod for security
 */

import { z } from 'zod';

// Security patterns – allow full Unicode text while blocking control and risky delimiter chars.
// Allows newlines for notes; blocks: most control chars, DEL, <, >, {, }, |, ^, ` and backslash.
// This keeps Chinese/Unicode names working while remaining safe with AppleScript quoting.
const SAFE_TEXT_PATTERN = /^[^\u0000-\u0009\u000B-\u001F\u007F<>\\\{\}\|\^`]*$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?$/;
const URL_PATTERN = /^https?:\/\/[^\s<>"{}|\\^`\[\]]+$/i;

// Maximum lengths for security
const MAX_TITLE_LENGTH = 200;
const MAX_NOTE_LENGTH = 2000;
const MAX_LIST_NAME_LENGTH = 100;
const MAX_SEARCH_LENGTH = 100;

/**
 * Base validation schemas
 */
export const SafeTextSchema = z.string()
  .min(1, "Text cannot be empty")
  .max(MAX_TITLE_LENGTH, `Text cannot exceed ${MAX_TITLE_LENGTH} characters`)
  .regex(SAFE_TEXT_PATTERN, "Text contains invalid characters. Only alphanumeric, spaces, and basic punctuation allowed");

export const SafeNoteSchema = z.string()
  .max(MAX_NOTE_LENGTH, `Note cannot exceed ${MAX_NOTE_LENGTH} characters`)
  .regex(SAFE_TEXT_PATTERN, "Note contains invalid characters")
  .optional();


export const SafeListNameSchema = z.string()
  .min(1, "List name cannot be empty")
  .max(MAX_LIST_NAME_LENGTH, `List name cannot exceed ${MAX_LIST_NAME_LENGTH} characters`)
  .regex(SAFE_TEXT_PATTERN, "List name contains invalid characters")
  .optional();

export const SafeDateSchema = z.string()
  .regex(DATE_PATTERN, "Date must be in format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'")
  .optional();

export const SafeUrlSchema = z.string()
  .regex(URL_PATTERN, "URL must be a valid HTTP or HTTPS URL")
  .max(500, "URL cannot exceed 500 characters")
  .optional();

export const SafeSearchSchema = z.string()
  .max(MAX_SEARCH_LENGTH, `Search term cannot exceed ${MAX_SEARCH_LENGTH} characters`)
  .regex(SAFE_TEXT_PATTERN, "Search term contains invalid characters")
  .optional();

/**
 * Tool-specific validation schemas
 */
export const CreateReminderSchema = z.object({
  title: SafeTextSchema,
  dueDate: SafeDateSchema,
  list: SafeListNameSchema,
  note: SafeNoteSchema,
  url: SafeUrlSchema,
});

export const ListRemindersSchema = z.object({
  list: SafeListNameSchema,
  showCompleted: z.boolean().optional().default(false),
  search: SafeSearchSchema,
  dueWithin: z.enum(["today", "tomorrow", "this-week", "overdue", "no-date"]).optional(),
});

export const UpdateReminderSchema = z.object({
  title: SafeTextSchema,
  newTitle: SafeTextSchema.optional(),
  dueDate: SafeDateSchema,
  note: SafeNoteSchema,
  completed: z.boolean().optional(),
  list: SafeListNameSchema,
  url: SafeUrlSchema,
  // Batch operation validation (simplified for security)
  batchOperation: z.object({
    enabled: z.boolean(),
    strategy: z.enum(["priority", "due_date", "category", "completion_status"]).optional(),
    sourceList: SafeListNameSchema,
    createLists: z.boolean().optional().default(true),
    filter: z.object({
      completed: z.boolean().optional(),
      search: SafeSearchSchema,
      dueWithin: z.enum(["today", "tomorrow", "this-week", "overdue", "no-date"]).optional(),
    }).optional(),
  }).optional(),
}).refine(
  (data) => data.title || (data.batchOperation?.enabled === true),
  {
    message: "Either title or enabled batch operation is required",
    path: ["title"],
  }
);

export const DeleteReminderSchema = z.object({
  title: SafeTextSchema,
  list: SafeListNameSchema,
});

export const MoveReminderSchema = z.object({
  title: SafeTextSchema,
  fromList: z.string()
    .min(1, "fromList cannot be empty")
    .max(MAX_LIST_NAME_LENGTH, `fromList cannot exceed ${MAX_LIST_NAME_LENGTH} characters`)
    .regex(SAFE_TEXT_PATTERN, "fromList contains invalid characters"),
  toList: z.string()
    .min(1, "toList cannot be empty")
    .max(MAX_LIST_NAME_LENGTH, `toList cannot exceed ${MAX_LIST_NAME_LENGTH} characters`)
    .regex(SAFE_TEXT_PATTERN, "toList contains invalid characters"),
});

export const ListReminderListsSchema = z.object({
  createNew: z.object({
    name: z.string()
      .min(1, "name cannot be empty")
      .max(MAX_LIST_NAME_LENGTH, `name cannot exceed ${MAX_LIST_NAME_LENGTH} characters`)
      .regex(SAFE_TEXT_PATTERN, "name contains invalid characters"),
  }).optional(),
});


export const CreateReminderListSchema = z.object({
  name: z.string()
    .min(1, "name cannot be empty")
    .max(MAX_LIST_NAME_LENGTH, `name cannot exceed ${MAX_LIST_NAME_LENGTH} characters`)
    .regex(SAFE_TEXT_PATTERN, "name contains invalid characters"),
});

/**
 * Validation error wrapper for consistent error handling
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Generic validation function with security error handling
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('; ');
      throw new ValidationError(`Input validation failed: ${errorMessages}`);
    }
    throw new ValidationError('Input validation failed: Unknown error');
  }
}

/**
 * Type exports for TypeScript integration
 */
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
export type ListRemindersInput = z.infer<typeof ListRemindersSchema>;
export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>;
export type DeleteReminderInput = z.infer<typeof DeleteReminderSchema>;
export type MoveReminderInput = z.infer<typeof MoveReminderSchema>;
export type ListReminderListsInput = z.infer<typeof ListReminderListsSchema>;
export type CreateReminderListInput = z.infer<typeof CreateReminderListSchema>;