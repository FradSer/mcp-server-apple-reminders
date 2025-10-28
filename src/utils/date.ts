/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import { spawn } from 'node:child_process';
import moment from 'moment';
import { debugLog } from './logger.js';

// Date format constants for AppleScript compatibility
const DATE_ONLY_FORMAT = 'MMMM D, YYYY' as const;
const DATETIME_FORMAT_12_HOUR = 'MMMM D, YYYY h:mm:ss A' as const;
const DATETIME_FORMAT_24_HOUR = 'MMMM D, YYYY HH:mm:ss' as const;

/**
 * Time preference management using functional composition
 */
type TimePreferenceState = {
  cache?: boolean;
};

const timePreferenceState: TimePreferenceState = {};

/**
 * Gets the 24-hour time preference with lazy initialization
 */
function get24HourPreference(): boolean {
  if (timePreferenceState.cache === undefined) {
    timePreferenceState.cache = false; // Safe default
    initializeTimePreferenceAsync(); // Non-blocking async init
  }
  return timePreferenceState.cache;
}

/**
 * Initializes time preference asynchronously
 */
async function initializeTimePreferenceAsync(): Promise<void> {
  try {
    const result = await safeSystemCommand('defaults', [
      'read',
      '-g',
      'AppleICUForce24HourTime',
    ]);
    timePreferenceState.cache = result === '1';
    debugLog(
      `Time preference: ${timePreferenceState.cache ? '24-hour' : '12-hour'}`,
    );
  } catch (error) {
    timePreferenceState.cache = false;
    debugLog(`Using 12-hour default: ${(error as Error).message}`);
  }
}

/**
 * Clears the time preference cache (for testing)
 */
function clearTimePreferenceCache(): void {
  if (process.env.NODE_ENV === 'test') {
    timePreferenceState.cache = undefined;
  }
}

/**
 * Clear the cached system time preference for testing purposes only.
 * @internal
 */
export { clearTimePreferenceCache };

/**
 * Validates command execution for security
 */
function validateSystemCommand(command: string, args: string[]): void {
  if (command !== 'defaults' || !args.includes('AppleICUForce24HourTime')) {
    throw new Error(`Command not allowed: ${command}`);
  }
}

/**
 * Safely executes system command to read preferences with improved structure
 * @param command - Command to execute
 * @param args - Command arguments
 * @param timeout - Timeout in milliseconds
 * @returns Promise with command output
 */
async function safeSystemCommand(
  command: string,
  args: string[],
  timeout = 5000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Guard clause: validate command security
    try {
      validateSystemCommand(command, args);
    } catch (error) {
      reject(error);
      return;
    }

    const childProcess = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout,
      detached: false,
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      const result =
        code === 0
          ? resolve(stdout.trim())
          : reject(new Error(`Command failed: ${stderr}`));
      return result;
    });

    childProcess.on('error', (error) => {
      reject(new Error(`Process error: ${error.message}`));
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (!childProcess.killed) {
        childProcess.kill('SIGTERM');
      }
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    // Clear timeout on process completion
    childProcess.on('close', () => clearTimeout(timeoutId));
  });
}

/**
 * Checks if a date string represents a date-only format (YYYY-MM-DD without time)
 * @param dateStr - Date string to check
 * @returns true if the string is in date-only format, false otherwise
 *
 * @example
 * ```typescript
 * isDateOnlyFormat('2024-12-25') // Returns: true
 * isDateOnlyFormat('2024-12-25 14:30:00') // Returns: false
 * isDateOnlyFormat('2024-12-25T14:30:00Z') // Returns: false
 * ```
 */
export function isDateOnlyFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
}

/**
 * Result of parsing a date string, containing both formatted date and type information
 */
export interface ParsedDate {
  /** The formatted date string suitable for AppleScript */
  formatted: string;
  /** Whether this represents a date-only (true) or datetime (false) */
  isDateOnly: boolean;
}

/**
 * Parses a date string and returns both the formatted result and type information
 * @param dateStr - Date string in standard format
 * @returns Object containing formatted date and type information
 * @throws Error if the date format is invalid or unsupported
 */
export function parseDateWithType(dateStr: string): ParsedDate {
  const isDateOnly = isDateOnlyFormat(dateStr);
  const formatted = formatDate(dateStr, isDateOnly);

  return { formatted, isDateOnly };
}

/**
 * Generates AppleScript property string for date handling
 * @param dateStr - Date string to parse
 * @param quoteFn - Function to quote AppleScript strings
 * @returns AppleScript property string for the appropriate date type
 */
export function generateDateProperty(
  dateStr: string,
  quoteFn: (str: string) => string,
): string {
  const isDateOnly = isDateOnlyFormat(dateStr);
  const formatted = formatDate(dateStr, isDateOnly);
  const dateType = isDateOnly ? 'allday due date' : 'due date';
  return `, ${dateType}:date ${quoteFn(formatted)}`;
}

/**
 * Creates standardized error message for date parsing
 */
function createDateFormatErrorMessage(dateStr: string): string {
  return (
    `Invalid or unsupported date format: "${dateStr}". ` +
    `Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ` +
    `Example: "2024-12-25 14:30:00"`
  );
}

/**
 * Unified date formatting function with improved error handling
 * @param dateStr - Date string to parse
 * @param isDateOnly - Whether this is a date-only format
 * @returns Formatted date string
 * @throws Error if the date format is invalid
 */
function formatDate(dateStr: string, isDateOnly: boolean): string {
  let parsedDate: moment.Moment;

  try {
    parsedDate = moment(
      dateStr,
      ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'],
      true,
    );
  } catch {
    throw new Error(createDateFormatErrorMessage(dateStr));
  }

  // Guard clause: check if date is valid
  if (!parsedDate.isValid()) {
    throw new Error(createDateFormatErrorMessage(dateStr));
  }

  const englishMoment = parsedDate.locale('en');

  // Early return for date-only format
  if (isDateOnly) {
    return englishMoment.format(DATE_ONLY_FORMAT);
  }

  // Format based on system preference
  const format = get24HourPreference()
    ? DATETIME_FORMAT_24_HOUR
    : DATETIME_FORMAT_12_HOUR;

  return englishMoment.format(format);
}

/**
 * Parses a date string and returns formatted date for AppleScript
 * @param dateStr - Date string in standard format
 * @returns Formatted date string in English locale
 * @throws Error if the date format is invalid
 */
export function parseDate(dateStr: string): string {
  const isDateOnly = isDateOnlyFormat(dateStr);
  return formatDate(dateStr, isDateOnly);
}
