/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import moment from "moment";
import { debugLog } from "./logger.js";
import { execSync } from "child_process";

// Cache for the system's 24-hour time preference (macOS specific)
let use24HourTimeCached: boolean | undefined;

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
 * suitable for AppleScript
 * 
 * @param dateStr - Date string in standard format or natural language
 * @returns Formatted date string (D MMMM YYYY H:mm:ss) or (D MMMM YYYY h:mm:ss A)
 * @throws Error if the date format is invalid
 */
export function parseDate(dateStr: string): string {
  try {
    // Try parsing with moment, expecting 'YYYY-MM-DD HH:mm:ss' or other moment-parsable formats
    const parsedDate = moment(dateStr, [
      "YYYY-MM-DD HH:mm:ss", // Explicitly handle the documented format first
      moment.ISO_8601,       // Handle ISO formats
      "YYYY-MM-DD",          // Handle date-only format
    ], true); // Use strict parsing

    // If not valid, throw error
    if (!parsedDate.isValid()) {
      throw new Error(`Invalid or unsupported date format: ${dateStr}. Please use 'YYYY-MM-DD HH:mm:ss'.`);
    }

    // Check if system uses 24-hour time
    const use24Hour = determineSystem24HourTime();

    let formattedDate;
    if (use24Hour) {
        // Format as 24-hour time
        formattedDate = parsedDate.format("D MMMM YYYY HH:mm:ss");
        debugLog("Parsed date (24-hour):", formattedDate);
    } else {
        // Format as 12-hour time with AM/PM
        formattedDate = parsedDate.format("D MMMM YYYY h:mm:ss A");
        debugLog("Parsed date (12-hour):", formattedDate);
    }
    return formattedDate;
  } catch (error) {
    debugLog("Date parsing error:", error);
    throw new Error(`Invalid date format: ${dateStr}`);
  }
} 