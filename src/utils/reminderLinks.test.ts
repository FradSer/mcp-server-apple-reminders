/**
 * reminderLinks.test.ts
 * Tests for reminder references and related reminder formatting
 */

import {
  extractReminderIdsFromNotes,
  formatRelatedReminders,
  type RelatedReminder,
} from './reminderLinks.js';

describe('reminderLinks', () => {
  describe('formatRelatedReminders', () => {
    it('should format related reminders by relationship type', () => {
      const related: RelatedReminder[] = [
        {
          id: 'dep1',
          title: 'Dependency 1',
          list: 'Work',
          relationship: 'dependency',
        },
        {
          id: 'dep2',
          title: 'Dependency 2',
          list: 'Personal',
          relationship: 'dependency',
        },
        { id: 'follow1', title: 'Follow-up Task', relationship: 'follow-up' },
      ];

      const result = formatRelatedReminders(related);

      expect(result).toContain('Dependencies:');
      expect(result).toContain('- [Dependency 1] (ID: dep1) (Work)');
      expect(result).toContain('- [Dependency 2] (ID: dep2) (Personal)');
      expect(result).toContain('Follow-up tasks:');
      expect(result).toContain('- [Follow-up Task] (ID: follow1)');
    });

    it('should handle reminders without lists', () => {
      const related: RelatedReminder[] = [
        { id: 'task1', title: 'Task 1', relationship: 'related' },
      ];

      const result = formatRelatedReminders(related);

      expect(result).toContain('Related reminders:');
      expect(result).toContain('- [Task 1] (ID: task1)');
    });

    it('should return empty string for no related reminders', () => {
      const result = formatRelatedReminders([]);
      expect(result).toBe('');
    });
  });

  describe('extractReminderIdsFromNotes', () => {
    it('should extract reminder IDs from reference format', () => {
      const notes =
        'Task notes\n\nRelated reminders:\n- [Task 1] (ID: task1)\n- [Task 2] (ID: task-2-with-dash)';

      const ids = extractReminderIdsFromNotes(notes);
      expect(ids).toContain('task1');
      expect(ids).toContain('task-2-with-dash');
    });

    it('should handle IDs with spaces', () => {
      const notes = 'Related: [Task] (ID: task with spaces)';

      const ids = extractReminderIdsFromNotes(notes);
      expect(ids).toContain('task with spaces');
    });

    it('should return empty array for notes without references', () => {
      const notes = 'Just regular notes without any references';

      const ids = extractReminderIdsFromNotes(notes);
      expect(ids).toEqual([]);
    });

    it('should handle empty or undefined notes', () => {
      expect(extractReminderIdsFromNotes('')).toEqual([]);
      expect(extractReminderIdsFromNotes(undefined)).toEqual([]);
    });
  });
});
