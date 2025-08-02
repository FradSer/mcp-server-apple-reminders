/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import moment from "moment";
import { debugLog } from "./logger.js";
import { execSync } from "child_process";

// Cache for the system's 24-hour time preference (macOS specific)
let use24HourTimeCached: boolean | undefined;

// Date format constants for AppleScript compatibility
const DATE_FORMAT_12_HOUR = "D MMMM YYYY h:mm:ss A" as const;
const DATE_FORMAT_24_HOUR = "D MMMM YYYY HH:mm:ss" as const;

/**
 * Clears the cached 24-hour time preference (for testing purposes only)
 * @internal This function should only be used in test environments
 */
export function clearTimePreferenceCache(): void {
    if (process.env.NODE_ENV !== 'test') {
        console.warn('clearTimePreferenceCache should only be used in test environments');
    }
    use24HourTimeCached = undefined;
}

/**
 * Determines if the system uses 24-hour time by reading a macOS default setting.
 * Caches the result for subsequent calls. Defaults to 12-hour on error or non-macOS.
 * @returns boolean - true if system uses 24-hour time, false otherwise.
 */
function determineSystem24HourTime(): boolean {
    // Cache the result after the first successful determination
    if (use24HourTimeCached === undefined) {
        try {
            // NOTE: This command is macOS specific. It will fail on other platforms.
            const result = execSync('defaults read -g AppleICUForce24HourTime').toString().trim();
            use24HourTimeCached = result === '1';
            debugLog(`System 24-hour time determined: ${use24HourTimeCached ? '24-hour' : '12-hour'}`);
        } catch (error) {
            debugLog(`Could not determine 24-hour setting using 'defaults' command. ` +
                     `Error: ${error}. Defaulting to 12-hour format.`);
            use24HourTimeCached = false; // Default to 12-hour on failure
        }
    }
    return use24HourTimeCached;
}

/**
 * Parses a date string in various formats and returns a formatted date string
 * suitable for AppleScript with locale-independent English month names
 * 
 * @param dateStr - Date string in standard format (YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, or ISO 8601)
 * @returns Formatted date string in English locale: "D MMMM YYYY" for date-only, "D MMMM YYYY HH:mm:ss" (24h) or "D MMMM YYYY h:mm:ss A" (12h) for datetime
 * @throws Error if the date format is invalid or unsupported
 * 
 * @example
 * ```typescript
 * parseDate('2024-12-25') // Returns: "25 December 2024" (date-only)
 * parseDate('2024-12-25 18:30:00') // Returns: "25 December 2024 6:30:00 PM" (12h system)
 * parseDate('2024-12-25 18:30:00') // Returns: "25 December 2024 18:30:00" (24h system)
 * ```
 */
export function parseDate(dateStr: string): string {
  try {
    // Check if this is a date-only format (YYYY-MM-DD without time)
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
    
    // Try parsing with moment, expecting 'YYYY-MM-DD HH:mm:ss' or other moment-parsable formats
    const parsedDate = moment(dateStr, [
      "YYYY-MM-DD HH:mm:ss", // Explicitly handle the documented format first
      moment.ISO_8601,       // Handle ISO formats
      "YYYY-MM-DD",          // Handle date-only format
    ], true); // Use strict parsing

    // If not valid, throw error with helpful context
    if (!parsedDate.isValid()) {
      throw new Error(
        `Invalid or unsupported date format: "${dateStr}". ` +
        `Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ` +
        `Example: "2024-12-25 14:30:00"`
      );
    }

    // Format with English locale for AppleScript compatibility
    const englishMoment = parsedDate.locale('en');
    
    let formattedDate;
    if (isDateOnly) {
        // For date-only inputs, return just the date without time
        formattedDate = englishMoment.format("D MMMM YYYY");
        debugLog("Parsed date (date-only):", formattedDate);
    } else {
        // Check if system uses 24-hour time for datetime inputs
        const use24Hour = determineSystem24HourTime();
        
        formattedDate = use24Hour 
            ? englishMoment.format(DATE_FORMAT_24_HOUR)
            : englishMoment.format(DATE_FORMAT_12_HOUR);
        
        debugLog(`Parsed date (${use24Hour ? '24' : '12'}-hour):`, formattedDate);
    }
    return formattedDate;
  } catch (error) {
    debugLog("Date parsing error:", error);
    throw new Error(
      `Invalid or unsupported date format: "${dateStr}". ` +
      `Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ` +
      `Example: "2024-12-25 14:30:00"`
    );
  }
} 