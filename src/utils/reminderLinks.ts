/**
 * reminderLinks.ts
 * Utilities for managing related reminders in notes
 */

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
 * Format related reminders with relationship labels
 * Format: [Title] (ID: {id}) (List Name)
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
      const references = reminders.map((r) => {
        const base = `[${r.title}] (ID: ${r.id})`;
        return r.list ? `${base} (${r.list})` : base;
      });
      return `${relationshipLabel}:\n${references.map((ref) => `- ${ref}`).join('\n')}`;
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
 * Extract reminder IDs from notes (for parsing existing references)
 * Format: [Title] (ID: {id})
 */
export function extractReminderIdsFromNotes(notes?: string): string[] {
  if (!notes) return [];

  // Match [Title] (ID: {id}) patterns
  const regex = /\[[^\]]+\]\s*\(ID:\s*([^)]+)\)/g;
  const matches = [...notes.matchAll(regex)];

  return matches.map((match) => match[1].trim());
}
