/**
 * notesFormatter.test.ts
 * Tests for standardized note formatting utilities
 */

import {
  extractReminderIdsFromText,
  formatStandardizedNotes,
  mergeNoteComponents,
  type NoteComponents,
  parseNoteComponents,
} from './notesFormatter.js';

describe('notesFormatter', () => {
  describe('formatStandardizedNotes', () => {
    it('should format notes with all components', () => {
      const components: NoteComponents = {
        criticalInfo: {
          reason: 'Blocked by',
          details: 'Need approval from manager',
        },
        originalContent: 'Complete the quarterly report',
        relatedReminders: [
          {
            id: 'rem-123',
            title: 'Get manager approval',
            list: 'Work',
            relationship: 'dependency',
          },
        ],
      };

      const formatted = formatStandardizedNotes(components);
      expect(formatted).toContain(
        'CRITICAL: Blocked by - Need approval from manager',
      );
      expect(formatted).toContain('Complete the quarterly report');
      expect(formatted).toContain('Related reminders:');
      expect(formatted).toContain(
        '[Get manager approval] (ID: rem-123) (Work)',
      );
    });

    it('should format notes with only critical info', () => {
      const components: NoteComponents = {
        criticalInfo: {
          reason: 'Missing resources',
          details: 'Need access to database',
        },
      };

      const formatted = formatStandardizedNotes(components);
      expect(formatted).toBe(
        'CRITICAL: Missing resources - Need access to database',
      );
    });

    it('should format notes with only original content', () => {
      const components: NoteComponents = {
        originalContent: 'Buy groceries',
      };

      const formatted = formatStandardizedNotes(components);
      expect(formatted).toBe('Buy groceries');
    });

    it('should format notes with only related reminders', () => {
      const components: NoteComponents = {
        relatedReminders: [
          {
            id: 'rem-123',
            title: 'Task 1',
            relationship: 'related',
          },
          {
            id: 'rem-456',
            title: 'Task 2',
            list: 'Personal',
            relationship: 'follow-up',
          },
        ],
      };

      const formatted = formatStandardizedNotes(components);
      expect(formatted).toContain('Related reminders:');
      expect(formatted).toContain('[Task 1] (ID: rem-123)');
      expect(formatted).toContain('[Task 2] (ID: rem-456) (Personal)');
    });

    it('should handle empty components', () => {
      const formatted = formatStandardizedNotes({});
      expect(formatted).toBe('');
    });
  });

  describe('parseNoteComponents', () => {
    it('should parse notes with all components', () => {
      const notes = `CRITICAL: Blocked by - Need approval from manager

Complete the quarterly report

Related reminders:
Dependencies:
- [Get manager approval] (ID: rem-123) (Work)`;

      const parsed = parseNoteComponents(notes);
      expect(parsed.criticalInfo).toEqual({
        reason: 'Blocked by',
        details: 'Need approval from manager',
      });
      expect(parsed.originalContent).toBe('Complete the quarterly report');
      expect(parsed.relatedReminders).toHaveLength(1);
      expect(parsed.relatedReminders?.[0]).toEqual({
        id: 'rem-123',
        title: 'Get manager approval',
        list: 'Work',
        relationship: 'dependency',
      });
    });

    it('should parse notes with only critical info', () => {
      const notes = 'CRITICAL: Missing resources - Need access to database';
      const parsed = parseNoteComponents(notes);
      expect(parsed.criticalInfo).toEqual({
        reason: 'Missing resources',
        details: 'Need access to database',
      });
      expect(parsed.originalContent).toBeUndefined();
    });

    it('should parse notes with only original content', () => {
      const notes = 'Buy groceries';
      const parsed = parseNoteComponents(notes);
      expect(parsed.originalContent).toBe('Buy groceries');
      expect(parsed.criticalInfo).toBeUndefined();
    });

    it('should handle empty notes', () => {
      const parsed = parseNoteComponents(undefined);
      expect(parsed).toEqual({});
    });
  });

  describe('extractReminderIdsFromText', () => {
    it('should extract reminder IDs from reference format', () => {
      const text =
        'Related reminders:\n- [Task 1] (ID: rem-123)\n- [Task 2] (ID: rem-456)';
      const ids = extractReminderIdsFromText(text);
      expect(ids).toHaveLength(2);
      expect(ids).toContain('rem-123');
      expect(ids).toContain('rem-456');
    });

    it('should handle IDs with spaces', () => {
      const text = '[Task] (ID: task with spaces)';
      const ids = extractReminderIdsFromText(text);
      expect(ids).toContain('task with spaces');
    });

    it('should return empty array for text without references', () => {
      const ids = extractReminderIdsFromText('Just regular text');
      expect(ids).toEqual([]);
    });
  });

  describe('mergeNoteComponents', () => {
    it('should merge components intelligently', () => {
      const existing: NoteComponents = {
        originalContent: 'Original note',
        relatedReminders: [
          {
            id: 'rem-1',
            title: 'Existing reminder',
            relationship: 'related',
          },
        ],
      };

      const updates: Partial<NoteComponents> = {
        criticalInfo: {
          reason: 'Blocked by',
          details: 'Need approval',
        },
        relatedReminders: [
          {
            id: 'rem-2',
            title: 'New reminder',
            relationship: 'dependency',
          },
        ],
      };

      const merged = mergeNoteComponents(existing, updates);
      expect(merged.criticalInfo).toEqual(updates.criticalInfo);
      expect(merged.originalContent).toBe('Original note');
      expect(merged.relatedReminders).toHaveLength(2);
      expect(merged.relatedReminders?.map((r) => r.id)).toEqual([
        'rem-1',
        'rem-2',
      ]);
    });

    it('should deduplicate related reminders by ID', () => {
      const existing: NoteComponents = {
        relatedReminders: [
          {
            id: 'rem-1',
            title: 'Task 1',
            relationship: 'related',
          },
        ],
      };

      const updates: Partial<NoteComponents> = {
        relatedReminders: [
          {
            id: 'rem-1',
            title: 'Task 1 Updated',
            relationship: 'dependency',
          },
          {
            id: 'rem-2',
            title: 'Task 2',
            relationship: 'follow-up',
          },
        ],
      };

      const merged = mergeNoteComponents(existing, updates);
      expect(merged.relatedReminders).toHaveLength(2);
      // First occurrence should be kept
      expect(merged.relatedReminders?.[0].id).toBe('rem-1');
      expect(merged.relatedReminders?.[0].title).toBe('Task 1');
    });
  });
});
