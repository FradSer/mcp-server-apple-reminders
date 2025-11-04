/**
 * notesFormatter.ts
 * Standardized formatting utilities for reminder notes to ensure consistency
 * and correct deep link format for related reminders.
 */

import {
  createReminderDeepLink,
  formatRelatedReminders,
  type RelatedReminder,
} from './reminderLinks.js';

/**
 * Normalize notes text by validating and fixing deep link formats
 * This ensures all reminder links follow the correct format
 */
export function normalizeNotesText(notes: string): string {
  if (!notes) {
    return notes;
  }

  // Extract all reminder IDs and normalize their links
  const normalizedLinks = extractAndNormalizeReminderIds(notes);

  if (normalizedLinks.length === 0) {
    // No links found, return as-is
    return notes;
  }

  // Replace malformed links (those without x-reminders:// prefix)
  // but preserve already correct links
  let normalized = notes;

  // Find and replace malformed patterns: reminder?id=... without x-reminders://
  // But only if they're inside markdown link format [text](...)
  normalized = normalized.replace(
    /\[([^\]]+)\]\((reminder\?id=[^\s)]+)\)/g,
    (match, title, link) => {
      // If link already has x-reminders://, keep it
      if (link.startsWith('x-reminders://')) {
        return match;
      }
      // Otherwise, add the prefix
      const idMatch = link.match(/reminder\?id=(.+)/);
      if (idMatch) {
        const id = decodeURIComponent(idMatch[1]);
        return `[${title}](x-reminders://reminder?id=${encodeURIComponent(id)})`;
      }
      return match;
    },
  );

  return normalized;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Standardized note structure components
 */
export interface NoteComponents {
  /** Critical information that blocks task completion */
  criticalInfo?: {
    reason: string;
    details: string;
  };
  /** Original note content */
  originalContent?: string;
  /** Related reminders with relationship context */
  relatedReminders?: RelatedReminder[];
}

/**
 * Format a standardized reminder note with proper structure:
 * 1. CRITICAL information (if any) at the beginning
 * 2. Original content in the middle
 * 3. Related reminders section at the end
 */
export function formatStandardizedNotes(components: NoteComponents): string {
  const parts: string[] = [];

  // Add CRITICAL information first
  if (components.criticalInfo) {
    const { reason, details } = components.criticalInfo;
    parts.push(`CRITICAL: ${reason} - ${details}`);
  }

  // Add original content
  if (components.originalContent) {
    if (parts.length > 0) {
      parts.push(''); // Add separator after CRITICAL
    }
    parts.push(components.originalContent);
  }

  // Add related reminders at the end
  if (components.relatedReminders && components.relatedReminders.length > 0) {
    const relatedSection = formatRelatedReminders(components.relatedReminders);
    parts.push(relatedSection);
  }

  return parts.join('\n').trim();
}

/**
 * Parse existing notes to extract structured components
 */
export function parseNoteComponents(notes?: string): NoteComponents {
  if (!notes) {
    return {};
  }

  const components: NoteComponents = {};

  // Extract CRITICAL information
  const criticalMatch = notes.match(
    /^CRITICAL:\s*(.+?)\s*-\s*(.+?)(?:\n\n|\nRelated reminders:|$)/s,
  );
  if (criticalMatch) {
    components.criticalInfo = {
      reason: criticalMatch[1].trim(),
      details: criticalMatch[2].trim(),
    };
  }

  // Extract related reminders section
  const relatedMatch = notes.match(/Related reminders:([\s\S]*)$/);
  if (relatedMatch) {
    components.relatedReminders = parseRelatedRemindersFromText(
      relatedMatch[1],
    );
  }

  // Extract original content (everything except CRITICAL and Related reminders)
  let originalContent = notes;

  // Remove CRITICAL section if present
  if (criticalMatch) {
    // Match the entire CRITICAL line including the reason and details
    const criticalLine = `CRITICAL: ${criticalMatch[1].trim()} - ${criticalMatch[2].trim()}`;
    originalContent = originalContent.replace(
      new RegExp(
        `^${escapeRegex(criticalLine)}(?:\\n\\n|\\n(?=\\n)|\\nRelated reminders:|$)`,
        's',
      ),
      '',
    );
  }

  // Remove Related reminders section if present
  if (relatedMatch) {
    originalContent = originalContent.replace(/Related reminders:[\s\S]*$/, '');
  }

  originalContent = originalContent.trim();
  if (originalContent) {
    components.originalContent = originalContent;
  }

  return components;
}

/**
 * Parse related reminders from formatted text
 * Extracts reminder IDs and titles from markdown links
 */
function parseRelatedRemindersFromText(text: string): RelatedReminder[] {
  const reminders: RelatedReminder[] = [];
  const lines = text.split('\n');

  let currentRelationship: RelatedReminder['relationship'] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if this is a relationship label
    const relationshipLabels: Record<string, RelatedReminder['relationship']> =
      {
        'Dependencies:': 'dependency',
        'Follow-up tasks:': 'follow-up',
        'Related reminders:': 'related',
        'Blocked by:': 'blocked-by',
        'Prerequisites:': 'prerequisite',
      };

    for (const [label, relationship] of Object.entries(relationshipLabels)) {
      if (trimmed.startsWith(label)) {
        currentRelationship = relationship;
        break;
      }
    }

    // Parse markdown link: [Title](x-reminders://reminder?id=ID) (List)
    const linkMatch = trimmed.match(
      /^-\s*\[(.+?)\]\(x-reminders:\/\/reminder\?id=([^)]+)\)(?:\s*\((.+?)\))?$/,
    );
    if (linkMatch && currentRelationship) {
      const [, title, id, list] = linkMatch;
      reminders.push({
        id: decodeURIComponent(id),
        title,
        list,
        relationship: currentRelationship,
      });
    }
  }

  return reminders;
}

/**
 * Validate and normalize reminder deep link format
 * Ensures the link follows the correct format: x-reminders://reminder?id={id}
 */
export function validateAndNormalizeDeepLink(link: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  // Try to extract ID from various formats
  const patterns = [
    /x-reminders:\/\/reminder\?id=([^\s)]+)/,
    /id=([^\s)]+)/,
    /reminder\?id=([^\s)]+)/,
  ];

  for (const pattern of patterns) {
    const match = link.match(pattern);
    if (match) {
      const id = decodeURIComponent(match[1]);
      return {
        valid: true,
        normalized: createReminderDeepLink(id),
      };
    }
  }

  return {
    valid: false,
    error: 'Invalid deep link format. Expected: x-reminders://reminder?id={id}',
  };
}

/**
 * Extract reminder IDs from text that might contain malformed links
 * Attempts to fix common formatting issues
 */
export function extractAndNormalizeReminderIds(
  text: string,
): Array<{ id: string; normalizedLink: string }> {
  const results: Array<{ id: string; normalizedLink: string }> = [];

  // Pattern 1: Standard format
  const standardPattern = /x-reminders:\/\/reminder\?id=([^\s)]+)/g;
  let match: RegExpExecArray | null = standardPattern.exec(text);
  while (match !== null) {
    const id = decodeURIComponent(match[1]);
    results.push({
      id,
      normalizedLink: createReminderDeepLink(id),
    });
    match = standardPattern.exec(text);
  }

  // Pattern 2: Malformed format without proper encoding
  const malformedPattern = /reminder\?id=([^\s)]+)/g;
  const seen = new Set(results.map((r) => r.id));
  match = malformedPattern.exec(text);
  while (match !== null) {
    let id = match[1];
    // Try to decode if it's URL encoded
    try {
      id = decodeURIComponent(id);
    } catch {
      // If decoding fails, use as-is
    }
    if (!seen.has(id)) {
      results.push({
        id,
        normalizedLink: createReminderDeepLink(id),
      });
      seen.add(id);
    }
    match = malformedPattern.exec(text);
  }

  return results;
}

/**
 * Merge note components intelligently
 * Preserves existing structure while adding new components
 */
export function mergeNoteComponents(
  existing: NoteComponents,
  updates: Partial<NoteComponents>,
): NoteComponents {
  const merged: NoteComponents = {};

  // Merge critical info (new takes precedence)
  merged.criticalInfo = updates.criticalInfo || existing.criticalInfo;

  // Merge original content
  if (updates.originalContent && existing.originalContent) {
    // If both exist, combine them
    merged.originalContent = `${existing.originalContent}\n\n${updates.originalContent}`;
  } else {
    merged.originalContent =
      updates.originalContent || existing.originalContent;
  }

  // Merge related reminders (combine arrays, deduplicate by ID)
  const allRelated = [
    ...(existing.relatedReminders || []),
    ...(updates.relatedReminders || []),
  ];
  const seen = new Set<string>();
  merged.relatedReminders = allRelated.filter((r) => {
    if (seen.has(r.id)) {
      return false;
    }
    seen.add(r.id);
    return true;
  });

  return merged;
}
