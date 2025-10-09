/**
 * naturalLanguageDate.ts
 * Enhanced date parsing with natural language support using chrono-node
 */

import * as chrono from 'chrono-node';
import moment from 'moment';
import { debugLog } from './logger.js';
import { parseDate, isDateOnlyFormat, type ParsedDate } from './date.js';

/**
 * Configuration for natural language date parsing
 */
interface NaturalLanguageConfig {
  /** Reference date for relative time expressions (defaults to now) */
  referenceDate?: Date;
  /** Whether to prefer future dates for ambiguous expressions */
  preferFuture?: boolean;
  /** Timezone for parsing (defaults to system timezone) */
  timezone?: string;
}

/**
 * Result of natural language date parsing
 */
export interface NaturalLanguageParseResult {
  /** The parsed date in ISO format */
  isoDate: string;
  /** Whether this represents a date-only (true) or datetime (false) */
  isDateOnly: boolean;
  /** The original input string */
  originalInput: string;
  /** Confidence score (0-1) for the parsing result */
  confidence: number;
  /** Parsed date object for further processing */
  parsedDate: Date;
  /** Formatted date string for AppleScript */
  formattedForAppleScript: string;
}

/**
 * Common natural language time expressions and their mappings
 */
const TIME_EXPRESSIONS = {
  // Relative times
  'now': () => new Date(),
  'today': () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  },
  'tomorrow': () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  },
  'yesterday': () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
  },
  
  // Days of week
  'monday': () => getNextWeekday(1),
  'tuesday': () => getNextWeekday(2),
  'wednesday': () => getNextWeekday(3),
  'thursday': () => getNextWeekday(4),
  'friday': () => getNextWeekday(5),
  'saturday': () => getNextWeekday(6),
  'sunday': () => getNextWeekday(0),
  
  // Chinese expressions
  '今天': () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  },
  '明天': () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  },
  '后天': () => {
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(0, 0, 0, 0);
    return dayAfterTomorrow;
  },
  '昨天': () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
  },
  
  // Time periods
  'this week': () => getStartOfWeek(new Date()),
  'next week': () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return getStartOfWeek(nextWeek);
  },
  'this month': () => {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    return thisMonth;
  },
  'next month': () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
  },
} as const;

/**
 * Gets the next occurrence of a specific weekday
 */
function getNextWeekday(weekday: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  const daysUntilTarget = (weekday - currentDay + 7) % 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
  targetDate.setHours(0, 0, 0, 0);
  return targetDate;
}

/**
 * Gets the start of the week (Monday)
 */
function getStartOfWeek(date: Date): Date {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * Parses natural language time expressions
 * @param input - Natural language time expression
 * @param config - Parsing configuration
 * @returns Parsed date result or null if parsing fails
 */
export function parseNaturalLanguageTime(
  input: string,
  config: NaturalLanguageConfig = {}
): NaturalLanguageParseResult | null {
  try {
    const normalizedInput = input.toLowerCase().trim();
    
    // Check for direct time expressions first
    if (TIME_EXPRESSIONS[normalizedInput as keyof typeof TIME_EXPRESSIONS]) {
      const parsedDate = TIME_EXPRESSIONS[normalizedInput as keyof typeof TIME_EXPRESSIONS]();
      return createParseResult(input, parsedDate, true, 1.0);
    }
    
    // Use chrono-node for more complex parsing
    const referenceDate = config.referenceDate || new Date();
    const chronoResults = chrono.parse(input, referenceDate, {
      forwardDate: config.preferFuture ?? true,
    });
    
    if (chronoResults.length === 0) {
      debugLog(`No natural language parsing result for: "${input}"`);
      return null;
    }
    
    // Use the first (most confident) result
    const result = chronoResults[0];
    const parsedDate = result.start.date();
    const confidence = 0.8; // Default confidence for chrono parsing
    
    // Determine if it's date-only based on whether time was specified
    const isDateOnly = !result.start.isCertain('hour');
    
    return createParseResult(input, parsedDate, isDateOnly, confidence);
    
  } catch (error) {
    debugLog(`Error parsing natural language time: "${input}"`, { error: (error as Error).message });
    return null;
  }
}

/**
 * Creates a standardized parse result
 */
function createParseResult(
  originalInput: string,
  parsedDate: Date,
  isDateOnly: boolean,
  confidence: number
): NaturalLanguageParseResult {
  const isoDate = isDateOnly 
    ? moment(parsedDate).format('YYYY-MM-DD')
    : moment(parsedDate).format('YYYY-MM-DD HH:mm:ss');
    
  // Use existing parseDate function for AppleScript formatting
  let formattedForAppleScript: string;
  try {
    formattedForAppleScript = parseDate(isoDate);
  } catch (error) {
    // Fallback to moment formatting if parseDate fails
    const momentDate = moment(parsedDate).locale('en');
    formattedForAppleScript = isDateOnly
      ? momentDate.format('MMMM D, YYYY')
      : momentDate.format('MMMM D, YYYY h:mm:ss A');
  }
  
  return {
    isoDate,
    isDateOnly,
    originalInput,
    confidence,
    parsedDate,
    formattedForAppleScript,
  };
}

/**
 * Enhanced date parsing that tries natural language first, then falls back to standard formats
 * @param input - Date input (natural language or standard format)
 * @param config - Parsing configuration
 * @returns Parsed date result
 * @throws Error if parsing fails completely
 */
export function parseDateWithNaturalLanguage(
  input: string,
  config: NaturalLanguageConfig = {}
): NaturalLanguageParseResult {
  // First try natural language parsing
  const naturalResult = parseNaturalLanguageTime(input, config);
  if (naturalResult) {
    debugLog(`Successfully parsed natural language: "${input}" -> ${naturalResult.isoDate}`);
    return naturalResult;
  }
  
  // Fallback to standard format parsing
  try {
    const standardResult = parseDate(input);
    const isDateOnly = isDateOnlyFormat(input);
    const parsedDate = moment(input, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'], true).toDate();
    
    return {
      isoDate: input,
      isDateOnly,
      originalInput: input,
      confidence: 0.9, // High confidence for standard formats
      parsedDate,
      formattedForAppleScript: standardResult,
    };
  } catch (error) {
    throw new Error(
      `Unable to parse date: "${input}". ` +
      `Supported formats: natural language (e.g., "tomorrow", "next Monday"), ` +
      `YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, ISO 8601. ` +
      `Examples: "tomorrow at 3pm", "2024-12-25", "next Friday"`
    );
  }
}

/**
 * Validates if a string can be parsed as a date (natural language or standard)
 * @param input - Input string to validate
 * @returns true if the input can be parsed as a date
 */
export function isValidDateInput(input: string): boolean {
  try {
    parseDateWithNaturalLanguage(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets a list of supported natural language expressions
 * @returns Array of supported expressions
 */
export function getSupportedTimeExpressions(): string[] {
  return [
    'now', 'today', 'tomorrow', 'yesterday',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'this week', 'next week', 'this month', 'next month',
    '今天', '明天', '后天', '昨天',
    'at 3pm', 'at 9am', 'in 2 hours', 'next Monday at 2pm',
    'tomorrow morning', 'this evening', 'next Friday afternoon',
  ];
}