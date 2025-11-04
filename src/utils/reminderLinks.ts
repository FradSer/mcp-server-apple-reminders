/**
 * reminderLinks.ts
 * Utilities for creating reminder deep links and managing related reminders
 */

import type { Reminder } from '../types/index.js';

/**
 * Apple Reminders deep link format
 * x-reminders://reminder?id={reminderId}
 */
export function createReminderDeepLink(reminderId: string): string {
  return `x-reminders://reminder?id=${encodeURIComponent(reminderId)}`;
}

/**
 * Create a markdown link for a reminder
 */
export function createReminderMarkdownLink(reminder: Reminder): string {
  const link = createReminderDeepLink(reminder.id);
  return `[${reminder.title}](${link})`;
}

/**
 * Related reminder information for notes
 */
export interface RelatedReminder {
  id: string;
  title: string;
  list?: string;
  relationship:
    | 'dependency'
    | 'follow-up'
    | 'related'
    | 'blocked-by'
    | 'prerequisite';
}

/**
 * Format related reminders as markdown links with relationship labels
 */
export function formatRelatedReminders(related: RelatedReminder[]): string {
  if (related.length === 0) return '';

  const groupedByRelationship = related.reduce(
    (acc, reminder) => {
      if (!acc[reminder.relationship]) {
        acc[reminder.relationship] = [];
      }
      acc[reminder.relationship].push(reminder);
      return acc;
    },
    {} as Record<string, RelatedReminder[]>,
  );

  const sections = Object.entries(groupedByRelationship).map(
    ([relationship, reminders]) => {
      const relationshipLabel = getRelationshipLabel(relationship);
      const links = reminders.map((r) =>
        r.list
          ? `[${r.title}](${createReminderDeepLink(r.id)}) (${r.list})`
          : `[${r.title}](${createReminderDeepLink(r.id)})`,
      );
      return `${relationshipLabel}:\n${links.map((link) => `- ${link}`).join('\n')}`;
    },
  );

  return `\n\nRelated reminders:\n${sections.join('\n\n')}`;
}

/**
 * Get human-readable relationship label
 */
function getRelationshipLabel(relationship: string): string {
  switch (relationship) {
    case 'dependency':
      return 'Dependencies';
    case 'follow-up':
      return 'Follow-up tasks';
    case 'related':
      return 'Related reminders';
    case 'blocked-by':
      return 'Blocked by';
    case 'prerequisite':
      return 'Prerequisites';
    default:
      return 'Related';
  }
}

/**
 * Note modification context and validation
 */
export interface NoteModificationContext {
  originalNotes?: string;
  modificationType:
    | 'add-critical-info'
    | 'add-related-reminders'
    | 'add-execution-guidance'
    | 'fix-completion-barrier';
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  isUserRequested: boolean;
}

/**
 * Validate if note modification is allowed based on strict criteria
 */
export function shouldModifyNotes(context: NoteModificationContext): {
  allowed: boolean;
  reason?: string;
} {
  // Rule 1: User explicitly requested modifications
  if (context.isUserRequested) {
    return {
      allowed: true,
      reason: 'User explicitly requested note modification',
    };
  }

  // Rule 2: Only allow high-confidence modifications (>90%)
  if (context.confidence < 90) {
    return {
      allowed: false,
      reason: `Confidence too low (${context.confidence}% < 90%)`,
    };
  }

  // Rule 3: Only allow critical information that prevents task completion
  const allowedTypes = ['add-critical-info', 'fix-completion-barrier'];
  if (!allowedTypes.includes(context.modificationType)) {
    return {
      allowed: false,
      reason: `Modification type not allowed: ${context.modificationType}`,
    };
  }

  // Rule 4: High impact modifications require extra scrutiny
  if (context.impact === 'high' && context.confidence < 95) {
    return {
      allowed: false,
      reason: `High impact modifications require 95%+ confidence (got ${context.confidence}%)`,
    };
  }

  return {
    allowed: true,
    reason: 'High-confidence critical information addition',
  };
}

/**
 * Create enhanced notes with related reminders
 */
export function createEnhancedNotes(
  originalNotes: string,
  relatedReminders: RelatedReminder[],
  additionalInfo?: string,
): string {
  let enhancedNotes = originalNotes || '';

  // Add additional critical information if provided
  if (additionalInfo) {
    enhancedNotes = enhancedNotes
      ? `${enhancedNotes}\n\n${additionalInfo}`
      : additionalInfo;
  }

  // Add related reminders
  if (relatedReminders.length > 0) {
    const relatedSection = formatRelatedReminders(relatedReminders);
    enhancedNotes = enhancedNotes
      ? `${enhancedNotes}${relatedSection}`
      : relatedSection.substring(2); // Remove leading "\n\n"
  }

  return enhancedNotes.trim();
}

/**
 * Extract reminder IDs from notes (for parsing existing links)
 */
export function extractReminderIdsFromNotes(notes?: string): string[] {
  if (!notes) return [];

  // Match x-reminders://reminder?id=URL patterns
  const regex = /x-reminders:\/\/reminder\?id=([^)\s]+)/g;
  const matches = [...notes.matchAll(regex)];

  return matches.map((match) => decodeURIComponent(match[1]));
}

/**
 * Check if notes already contain a link to a specific reminder
 */
export function hasReminderLink(notes: string, reminderId: string): boolean {
  const link = createReminderDeepLink(reminderId);
  return notes.includes(link);
}

/**
 * Types of critical information that justify note modifications
 */
export const CRITICAL_INFO_TYPES = {
  MISSING_RESOURCES: 'missing-resources',
  COMPLETION_DEPENDENCIES: 'completion-dependencies',
  BLOCKING_ISSUES: 'blocking-issues',
  REQUIRED_COORDINATION: 'required-coordination',
  TIME_SENSITIVE_INFO: 'time-sensitive-info',
  SAFETY_REQUIREMENTS: 'safety-requirements',
} as const;

export type CriticalInfoType =
  (typeof CRITICAL_INFO_TYPES)[keyof typeof CRITICAL_INFO_TYPES];
