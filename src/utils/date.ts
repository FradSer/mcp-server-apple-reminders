/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import moment from "moment";
import { debugLog } from "./logger.js";
import { spawn } from "child_process";
import { promisify } from "util";

// Date format constants for AppleScript compatibility
const DATE_ONLY_FORMAT = "MMMM D, YYYY" as const;
const DATETIME_FORMAT_12_HOUR = "MMMM D, YYYY h:mm:ss A" as const;
const DATETIME_FORMAT_24_HOUR = "MMMM D, YYYY HH:mm:ss" as const;

/**
 * Simplified time preference manager
 */
class TimePreferenceManager {
  private static cache?: boolean;
  
  static get24HourPreference(): boolean {
    if (this.cache === undefined) {
      this.cache = false; // Safe default
      this.initializeAsync(); // Non-blocking async init
    }
    return this.cache;
  }
  
  private static async initializeAsync(): Promise<void> {
    try {
      const result = await safeSystemCommand('defaults', ['read', '-g', 'AppleICUForce24HourTime']);
      this.cache = result === '1';
      debugLog(`Time preference: ${this.cache ? '24-hour' : '12-hour'}`);
    } catch (error) {
      this.cache = false;
      debugLog(`Using 12-hour default: ${(error as Error).message}`);
    }
  }
  
  static clearCache(): void {
    if (process.env.NODE_ENV === 'test') this.cache = undefined;
  }
}

/**
 * Clear the cached system time preference for testing purposes only.
 * @internal
 */
export function clearTimePreferenceCache(): void {
  TimePreferenceManager.clearCache();
}

/**
 * Safely executes system command to read preferences
 * @param command - Command to execute 
 * @param args - Command arguments
 * @param timeout - Timeout in milliseconds
 * @returns Promise with command output
 */
async function safeSystemCommand(command: string, args: string[], timeout = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
        // Simplified security check
        if (command !== 'defaults' || !args.includes('AppleICUForce24HourTime')) {
            reject(new Error(`Command not allowed: ${command}`));
            return;
        }
        
        const process = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout,
            detached: false,
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout?.on('data', (data) => stdout += data.toString());
        process.stderr?.on('data', (data) => stderr += data.toString());
        
        process.on('close', (code) => {
            code === 0 ? resolve(stdout.trim()) : reject(new Error(`Command failed: ${stderr}`));
        });
        
        process.on('error', (error) => reject(new Error(`Process error: ${error.message}`)));
        
        setTimeout(() => {
            if (!process.killed) process.kill('SIGTERM');
            reject(new Error(`Command timed out after ${timeout}ms`));
        }, timeout);
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
export function generateDateProperty(dateStr: string, quoteFn: (str: string) => string): string {
  const isDateOnly = isDateOnlyFormat(dateStr);
  const formatted = formatDate(dateStr, isDateOnly);
  const dateType = isDateOnly ? 'allday due date' : 'due date';
  return `, ${dateType}:date ${quoteFn(formatted)}`;
}

/**
 * Unified date formatting function
 * @param dateStr - Date string to parse
 * @param isDateOnly - Whether this is a date-only format
 * @returns Formatted date string
 * @throws Error if the date format is invalid
 */
function formatDate(dateStr: string, isDateOnly: boolean): string {
  let parsedDate: any;
  try {
    parsedDate = moment(dateStr, [
      "YYYY-MM-DD HH:mm:ss",
      moment.ISO_8601,
      "YYYY-MM-DD",
    ], true);
  } catch {
    // Normalize any parsing exceptions to a consistent message expected by tests/consumers
    throw new Error(
      `Invalid or unsupported date format: "${dateStr}". ` +
      `Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ` +
      `Example: "2024-12-25 14:30:00"`
    );
  }

  if (!parsedDate.isValid()) {
    throw new Error(
      `Invalid or unsupported date format: "${dateStr}". ` +
      `Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ` +
      `Example: "2024-12-25 14:30:00"`
    );
  }

  const englishMoment = parsedDate.locale('en');
  
  if (isDateOnly) {
    return englishMoment.format(DATE_ONLY_FORMAT);
  }
  
  const use24Hour = TimePreferenceManager.get24HourPreference();
  const format = use24Hour ? DATETIME_FORMAT_24_HOUR : DATETIME_FORMAT_12_HOUR;
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