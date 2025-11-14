/**
 * notesFormatter.ts
 * Standardized formatting utilities for reminder notes to ensure consistency
 * and correct format for related reminder references.
 */

import { escapeRegex } from './helpers.js';
import {
  formatRelatedReminders,
  type RelatedReminder,
} from './reminderLinks.js';

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
 * Extracts reminder IDs and titles from reference format: [Title] (ID: {id}) (List)
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

    // Parse reference format: - [Title] (ID: {id}) (List)
    const referenceMatch = trimmed.match(
      /^-\s*\[(.+?)\]\s*\(ID:\s*([^)]+)\)(?:\s*\((.+?)\))?$/,
    );
    if (referenceMatch && currentRelationship) {
      const [, title, id, list] = referenceMatch;
      reminders.push({
        id: id.trim(),
        title,
        list,
        relationship: currentRelationship,
      });
    }
  }

  return reminders;
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
