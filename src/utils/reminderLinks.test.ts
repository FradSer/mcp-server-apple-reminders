/**
 * reminderLinks.test.ts
 * Tests for reminder references and note modification validation
 */

import {
  CRITICAL_INFO_TYPES,
  createEnhancedNotes,
  extractReminderIdsFromNotes,
  formatRelatedReminders,
  hasReminderReference,
  type NoteModificationContext,
  type RelatedReminder,
  shouldModifyNotes,
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

  describe('shouldModifyNotes', () => {
    it('should allow user-requested modifications', () => {
      const context: NoteModificationContext = {
        originalNotes: 'Original notes',
        modificationType: 'add-execution-guidance',
        confidence: 50,
        impact: 'medium',
        isUserRequested: true,
      };

      const result = shouldModifyNotes(context);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('User explicitly requested note modification');
    });

    it('should reject low confidence modifications', () => {
      const context: NoteModificationContext = {
        modificationType: 'add-critical-info',
        confidence: 85, // Below 90%
        impact: 'medium',
        isUserRequested: false,
      };

      const result = shouldModifyNotes(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Confidence too low');
    });

    it('should reject non-critical modification types', () => {
      const context: NoteModificationContext = {
        modificationType: 'add-execution-guidance', // Not in allowed types
        confidence: 95,
        impact: 'medium',
        isUserRequested: false,
      };

      const result = shouldModifyNotes(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Modification type not allowed');
    });

    it('should reject high impact modifications with insufficient confidence', () => {
      const context: NoteModificationContext = {
        modificationType: 'add-critical-info',
        confidence: 92, // Below 95% for high impact
        impact: 'high',
        isUserRequested: false,
      };

      const result = shouldModifyNotes(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain(
        'High impact modifications require 95%+ confidence',
      );
    });

    it('should allow high confidence critical modifications', () => {
      const context: NoteModificationContext = {
        modificationType: 'add-critical-info',
        confidence: 95,
        impact: 'medium',
        isUserRequested: false,
      };

      const result = shouldModifyNotes(context);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain(
        'High-confidence critical information addition',
      );
    });

    it('should allow completion barrier fixes with high confidence', () => {
      const context: NoteModificationContext = {
        modificationType: 'fix-completion-barrier',
        confidence: 95, // High impact requires 95%+
        impact: 'high',
        isUserRequested: false,
      };

      const result = shouldModifyNotes(context);
      expect(result.allowed).toBe(true);
    });

    it('should allow completion barrier fixes with medium confidence', () => {
      const context: NoteModificationContext = {
        modificationType: 'fix-completion-barrier',
        confidence: 92, // Medium impact only needs >90%
        impact: 'medium',
        isUserRequested: false,
      };

      const result = shouldModifyNotes(context);
      expect(result.allowed).toBe(true);
    });
  });

  describe('createEnhancedNotes', () => {
    it('should add additional info to existing notes', () => {
      const result = createEnhancedNotes(
        'Original task notes',
        [],
        'CRITICAL: missing-resources - Need access to the design files',
      );

      expect(result).toBe(
        'Original task notes\n\nCRITICAL: missing-resources - Need access to the design files',
      );
    });

    it('should add related reminders to notes', () => {
      const related: RelatedReminder[] = [
        {
          id: 'dep1',
          title: 'Get design files',
          list: 'Work',
          relationship: 'prerequisite',
        },
      ];

      const result = createEnhancedNotes('Original notes', related);

      expect(result).toContain('Original notes');
      expect(result).toContain('Related reminders:');
      expect(result).toContain('Prerequisites:');
      expect(result).toContain('[Get design files] (ID: dep1) (Work)');
    });

    it('should handle empty original notes', () => {
      const result = createEnhancedNotes(
        '',
        [{ id: 'task1', title: 'Task 1', relationship: 'related' }],
        'Critical info',
      );

      expect(result).toContain('Critical info');
      expect(result).toContain('Related reminders:');
    });

    it('should combine additional info and related reminders', () => {
      const related: RelatedReminder[] = [
        { id: 'task1', title: 'Task 1', relationship: 'related' },
      ];

      const result = createEnhancedNotes('Original', related, 'Critical info');

      expect(result).toContain('Original');
      expect(result).toContain('Critical info');
      expect(result).toContain('Related reminders:');
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

  describe('hasReminderReference', () => {
    it('should detect existing reminder references', () => {
      const notes = 'Task notes\n\nRelated reminders:\n- [Task 1] (ID: task1)';

      expect(hasReminderReference(notes, 'task1')).toBe(true);
      expect(hasReminderReference(notes, 'task2')).toBe(false);
    });
  });

  describe('CRITICAL_INFO_TYPES', () => {
    it('should contain all expected critical info types', () => {
      expect(CRITICAL_INFO_TYPES.MISSING_RESOURCES).toBe('missing-resources');
      expect(CRITICAL_INFO_TYPES.COMPLETION_DEPENDENCIES).toBe(
        'completion-dependencies',
      );
      expect(CRITICAL_INFO_TYPES.BLOCKING_ISSUES).toBe('blocking-issues');
      expect(CRITICAL_INFO_TYPES.REQUIRED_COORDINATION).toBe(
        'required-coordination',
      );
      expect(CRITICAL_INFO_TYPES.TIME_SENSITIVE_INFO).toBe(
        'time-sensitive-info',
      );
      expect(CRITICAL_INFO_TYPES.SAFETY_REQUIREMENTS).toBe(
        'safety-requirements',
      );
    });
  });
});
