/**
 * constants.ts
 * Centralized constants and configuration values to eliminate magic numbers
 */

/**
 * Date calculation constants
 */
export const DATE_CONSTANTS = {
  /** Milliseconds in one day */
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,

  /** Days in a week for filtering */
  DAYS_PER_WEEK: 7,

  /** Hours in a day */
  HOURS_PER_DAY: 24,

  /** Minutes in an hour */
  MINUTES_PER_HOUR: 60,

  /** Seconds in a minute */
  SECONDS_PER_MINUTE: 60,
} as const;

/**
 * File system and path constants
 */
export const FILE_SYSTEM = {
  /** Maximum directory traversal depth when searching for project root */
  MAX_DIRECTORY_SEARCH_DEPTH: 10,

  /** Package.json filename for project root detection */
  PACKAGE_JSON_FILENAME: 'package.json',

  /** Swift binary filename */
  SWIFT_BINARY_NAME: 'EventKitCLI',
} as const;

/**
 * Validation and security constants
 */
export const VALIDATION = {
  /** Maximum lengths for different text fields */
  MAX_TITLE_LENGTH: 200,
  MAX_NOTE_LENGTH: 2000,
  MAX_LIST_NAME_LENGTH: 100,
  MAX_SEARCH_LENGTH: 100,
  MAX_URL_LENGTH: 500,
} as const;

/**
 * Error message templates
 */
export const MESSAGES = {
  /** Error messages */
  ERROR: {
    INPUT_VALIDATION_FAILED: (details: string) =>
      `Input validation failed: ${details}`,

    UNKNOWN_TOOL: (name: string) => `Unknown tool: ${name}`,

    UNKNOWN_ACTION: (tool: string, action: string) =>
      `Unknown ${tool} action: ${action}`,

    SYSTEM_ERROR: (operation: string) =>
      `Failed to ${operation}: System error occurred`,
  },
} as const;
