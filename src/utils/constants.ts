/**
 * constants.ts
 * Centralized constants and configuration values to eliminate magic numbers
 */

/**
 * Success and error message templates
 */
export const MESSAGES = {
  /** Error messages */
  ERROR: {
    INPUT_VALIDATION_FAILED: (details: string) =>
      `Input validation failed: ${details}`,

    UNKNOWN_TOOL: (name: string) => `Unknown tool: ${name}`,

    UNKNOWN_ACTION: (tool: string, action: string) =>
      `Unknown ${tool} action: ${action}`,
  },
} as const;
