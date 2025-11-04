/**
 * notesFormatter.test.ts
 * Tests for standardized note formatting utilities
 */

import {
  extractAndNormalizeReminderIds,
  formatStandardizedNotes,
  mergeNoteComponents,
  type NoteComponents,
  normalizeNotesText,
  parseNoteComponents,
  validateAndNormalizeDeepLink,
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
        '[Get manager approval](x-reminders://reminder?id=rem-123) (Work)',
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
      expect(formatted).toContain(
        '[Task 1](x-reminders://reminder?id=rem-123)',
      );
      expect(formatted).toContain(
        '[Task 2](x-reminders://reminder?id=rem-456) (Personal)',
      );
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
- [Get manager approval](x-reminders://reminder?id=rem-123) (Work)`;

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

  describe('validateAndNormalizeDeepLink', () => {
    it('should validate and normalize correct deep link', () => {
      const result = validateAndNormalizeDeepLink(
        'x-reminders://reminder?id=test-123',
      );
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('x-reminders://reminder?id=test-123');
    });

    it('should fix malformed link format', () => {
      const result = validateAndNormalizeDeepLink('reminder?id=test-123');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('x-reminders://reminder?id=test-123');
    });

    it('should handle URL-encoded IDs', () => {
      const result = validateAndNormalizeDeepLink(
        'x-reminders://reminder?id=test%2D123',
      );
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('x-reminders://reminder?id=test-123');
    });

    it('should reject invalid format', () => {
      const result = validateAndNormalizeDeepLink('invalid-link');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid deep link format');
    });
  });

  describe('extractAndNormalizeReminderIds', () => {
    it('should extract reminder IDs from properly formatted links', () => {
      const text =
        'Related reminders:\n- [Task 1](x-reminders://reminder?id=rem-123)\n- [Task 2](x-reminders://reminder?id=rem-456)';
      const results = extractAndNormalizeReminderIds(text);
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('rem-123');
      expect(results[0].normalizedLink).toBe(
        'x-reminders://reminder?id=rem-123',
      );
      expect(results[1].id).toBe('rem-456');
    });

    it('should extract IDs from malformed links', () => {
      const text = 'reminder?id=rem-123';
      const results = extractAndNormalizeReminderIds(text);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('rem-123');
      expect(results[0].normalizedLink).toBe(
        'x-reminders://reminder?id=rem-123',
      );
    });

    it('should handle URL-encoded IDs', () => {
      const text = 'x-reminders://reminder?id=rem%2D123';
      const results = extractAndNormalizeReminderIds(text);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('rem-123');
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

  describe('normalizeNotesText', () => {
    it('should normalize malformed deep links', () => {
      const notes = 'Related reminders:\n- [Task 1](reminder?id=rem-123)';
      const normalized = normalizeNotesText(notes);
      expect(normalized).toContain('x-reminders://reminder?id=rem-123');
    });

    it('should preserve correctly formatted links', () => {
      const notes =
        'Related reminders:\n- [Task 1](x-reminders://reminder?id=rem-123)';
      const normalized = normalizeNotesText(notes);
      expect(normalized).toBe(notes);
    });

    it('should normalize multiple malformed links', () => {
      const notes =
        'Related reminders:\n- [Task 1](reminder?id=rem-123)\n- [Task 2](reminder?id=rem-456)';
      const normalized = normalizeNotesText(notes);
      expect(normalized).toContain('x-reminders://reminder?id=rem-123');
      expect(normalized).toContain('x-reminders://reminder?id=rem-456');
    });

    it('should handle notes without links', () => {
      const notes = 'Just some regular notes';
      const normalized = normalizeNotesText(notes);
      expect(normalized).toBe(notes);
    });

    it('should handle empty notes', () => {
      const normalized = normalizeNotesText('');
      expect(normalized).toBe('');
    });
  });
});
