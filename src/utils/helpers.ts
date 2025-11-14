/**
 * helpers.ts
 * General utility functions for common operations
 */

/**
 * CLI argument building utilities
 */

/**
 * Adds an optional string argument to the args array if the value is defined
 */
export function addOptionalArg(
  args: string[],
  flag: string,
  value: string | undefined,
): void {
  if (value) {
    args.push(flag, value);
  }
}

/**
 * Adds an optional boolean argument to the args array if the value is defined
 */
export function addOptionalBooleanArg(
  args: string[],
  flag: string,
  value: boolean | undefined,
): void {
  if (value !== undefined) {
    args.push(flag, String(value));
  }
}

/**
 * Type conversion utilities
 */

/**
 * Converts null values to undefined for optional fields
 * This is useful when converting from JSON (which uses null) to TypeScript types (which use undefined)
 */
export function nullToUndefined<T>(obj: T, fields: (keyof T)[]): T {
  const result = { ...obj } as Record<string, unknown>;
  for (const field of fields) {
    const fieldKey = String(field);
    if (result[fieldKey] === null) {
      result[fieldKey] = undefined;
    }
  }
  return result as T;
}

/**
 * String manipulation utilities
 */

/**
 * Escape special regex characters in a string
 * Used for safely constructing regex patterns from user input
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Formats multiline notes for markdown display by indenting continuation lines
 * Replaces newlines with newline + indentation to maintain proper formatting
 */
export function formatMultilineNotes(notes: string): string {
  return notes.replace(/\n/g, '\n    ');
}
