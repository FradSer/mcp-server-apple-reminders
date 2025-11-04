/**
 * constants.ts
 * Centralized constants and configuration values to eliminate magic numbers
 */

/**
 * Timeout values for async operations (in milliseconds)
 */
export const TIMEOUTS = {
  /** Default timeout for general operations */
  DEFAULT_OPERATION: 5000,
} as const;

/**
 * Exit codes for process operations
 */
export const EXIT_CODES = {
  /** Successful operation */
  SUCCESS: 0,

  /** General error */
  ERROR: 1,
} as const;

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
  SWIFT_BINARY_NAME: 'GetReminders',
} as const;

/**
 * Binary path configurations
 */
export const BINARY_PATHS = {
  /** Primary binary path (built distribution) */
  DIST_PATH: 'dist/swift/bin',

  /** Development binary path (source) */
  SRC_PATH: 'src/swift/bin',

  /** Fallback binary path */
  FALLBACK_PATH: 'swift/bin',

  /** Mock binary path for tests */
  MOCK_PATH: '/mock/path/to/binary',
} as const;

/**
 * Environment variable names
 */
export const ENVIRONMENT_VARS = {
  /** Node.js environment */
  NODE_ENV: 'NODE_ENV',

  /** Debug flag */
  DEBUG: 'DEBUG',
} as const;

/**
 * Environment values
 */
export const ENVIRONMENTS = {
  /** Test environment */
  TEST: 'test',

  /** Development environment */
  DEVELOPMENT: 'development',

  /** Production environment */
  PRODUCTION: 'production',
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
 * JSON formatting constants
 */
export const JSON_FORMATTING = {
  /** Indentation spaces for JSON.stringify */
  INDENT_SPACES: 2,
} as const;

/**
 * Success and error message templates
 */
export const MESSAGES = {
  /** Success messages */
  SUCCESS: {
    REMINDER_CREATED: (title: string, hasNotes: boolean) =>
      `Successfully created reminder: ${title}${hasNotes ? ' with notes' : ''}`,

    REMINDER_UPDATED: (title: string) =>
      `Successfully updated reminder "${title}"`,

    REMINDER_DELETED: (title: string) =>
      `Successfully deleted reminder: ${title}`,

    REMINDER_MOVED: (title: string, fromList: string, toList: string) =>
      `Successfully moved reminder "${title}" from ${fromList} to ${toList}`,

    LIST_CREATED: (name: string) =>
      `Successfully created reminder list: ${name}`,
  },

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
