/**
 * applescript.ts
 * Utilities for interacting with AppleScript on macOS
 */

import { execSync } from 'node:child_process';
import { debugLog } from './logger.js';

/**
 * Escapes special characters in a string for safe use in AppleScript
 * Properly handles Unicode characters including Chinese text
 * @param str - String to escape
 * @returns Escaped string safe for AppleScript
 */
function escapeAppleScriptString(str: string): string {
  return str
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\t/g, '\\t'); // Escape tabs
}

/**
 * Executes an AppleScript command and returns the result
 * @param script - AppleScript code to execute
 * @returns The trimmed output of the AppleScript execution
 * @throws Error if the AppleScript execution fails
 */
export function executeAppleScript(script: string): string {
  try {
    // Use heredoc syntax to avoid shell injection issues
    // Set encoding to UTF-8 to properly handle Unicode characters
    const command = `osascript << 'EOF'\n${script}\nEOF`;
    return execSync(command, { encoding: 'utf8' }).toString().trim();
  } catch (error) {
    debugLog('AppleScript execution error:', error);
    throw error;
  }
}

/**
 * Creates an AppleScript block with tell application "Reminders"
 * @param scriptBody - The body of the script to include inside the tell block
 * @returns Complete AppleScript with tell application wrapper
 */
export function createRemindersScript(scriptBody: string): string {
  return `tell application "Reminders"\n${scriptBody}\nend tell`;
}

/**
 * Safely quotes a string for use in AppleScript
 * @param str - String to quote
 * @returns Properly quoted and escaped string for AppleScript
 */
export function quoteAppleScriptString(str: string): string {
  return `"${escapeAppleScriptString(str)}"`;
}
