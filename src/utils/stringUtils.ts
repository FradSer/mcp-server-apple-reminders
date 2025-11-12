/**
 * stringUtils.ts
 * Common string manipulation utilities
 */

/**
 * Escape special regex characters in a string
 * Used for safely constructing regex patterns from user input
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
