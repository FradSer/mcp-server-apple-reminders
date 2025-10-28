/**
 * urlHelpers.ts
 * Utilities for handling URLs in reminder notes with structured format
 */

/**
 * Extracts URLs from a structured note format
 * @param notes - The note content to parse
 * @returns Array of extracted URLs
 */
export function extractUrlsFromNotes(
  notes: string | null | undefined,
): string[] {
  if (!notes) return [];

  // Look for all structured URLs sections
  const urlSectionMatches = notes.matchAll(
    /\n\nURLs:\n((?:- https?:\/\/[^\s\n]+\n?)+)/g,
  );
  const allUrls = [];

  for (const match of urlSectionMatches) {
    // Extract URLs from structured format
    const urlLines = match[1];
    const sectionUrls = urlLines
      .split('\n')
      .map((line) => line.replace(/^- /, '').trim())
      .filter((url) => url.length > 0);
    allUrls.push(...sectionUrls);
  }

  if (allUrls.length > 0) {
    return allUrls;
  }

  // Fallback: extract any URLs using regex for backward compatibility
  const urlRegex = /https?:\/\/[^\s]+/g;
  return notes.match(urlRegex) || [];
}

/**
 * Formats note content with URLs in structured format
 * @param note - The note content (can be empty or undefined)
 * @param urls - Array of URLs to append
 * @returns Formatted note content with structured URLs
 */
export function formatNoteWithUrls(
  note: string | undefined | null,
  urls: string[],
): string {
  const cleanNote = removeUrlSections(note || '').trim();
  const validUrls = urls.filter((url) => url && isValidUrl(url));

  if (validUrls.length === 0) {
    return cleanNote;
  }

  const urlSection = formatUrlSection(validUrls);

  if (!cleanNote) {
    return urlSection;
  }

  return `${cleanNote}\n\n${urlSection}`;
}

/**
 * Formats URLs in the structured section format
 * @param urls - Array of URLs to format
 * @returns Formatted URL section string
 */
export function formatUrlSection(urls: string[]): string {
  if (urls.length === 0) return '';

  const urlList = urls.map((url) => `- ${url}`).join('\n');
  return `URLs:\n${urlList}`;
}

/**
 * Removes existing URL sections from note content
 * @param notes - The note content to clean
 * @returns Note content with URL sections removed
 */
export function removeUrlSections(notes: string | null | undefined): string {
  if (!notes) return '';

  // Remove structured URL sections
  return notes
    .replace(/\n\nURLs:\n(?:- https?:\/\/[^\s\n]+\n?)+/g, '')
    .replace(/\n\nURL: https?:\/\/[^\s\n]+/g, '') // Legacy format
    .replace(/URL: https?:\/\/[^\s\n]+/g, '') // Handle cases without leading newlines
    .trim();
}

/**
 * Combines note content with a single URL using structured format
 * @param note - The note content
 * @param url - The URL to add
 * @returns Combined content in structured format
 */
export function combineNoteWithUrl(
  note: string | undefined | null,
  url: string | undefined | null,
): string {
  if (!url) return note || '';
  if (!isValidUrl(url)) return note || '';

  return formatNoteWithUrls(note, [url]);
}

/**
 * Validates if a string is a valid URL
 * @param url - String to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }

  try {
    new URL(url);
    return /^https?:\/\//.test(url);
  } catch {
    return false;
  }
}

/**
 * Extracts note content without URLs
 * @param notes - The full note content
 * @returns Note content with URLs removed
 */
export function extractNoteContent(notes: string | null | undefined): string {
  return removeUrlSections(notes);
}

/**
 * Parses a reminder note into separate note content and URLs
 * @param notes - The full note content to parse
 * @returns Object with separate note and urls properties
 */
export function parseReminderNote(notes: string | null | undefined): {
  note: string;
  urls: string[];
} {
  if (!notes) {
    return { note: '', urls: [] };
  }

  const urls = extractUrlsFromNotes(notes);
  const note = extractNoteContent(notes);

  return { note, urls };
}

/**
 * Updates existing note content with new URLs, maintaining structure
 * @param existingNotes - Current note content
 * @param newUrls - New URLs to add or replace with
 * @returns Updated note content with structured URLs
 */
export function updateNoteWithUrls(
  existingNotes: string | null | undefined,
  newUrls: string[],
): string {
  const cleanNote = extractNoteContent(existingNotes);
  return formatNoteWithUrls(cleanNote, newUrls);
}
