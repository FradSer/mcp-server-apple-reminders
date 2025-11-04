/**
 * reminderLinks.test.ts
 * Tests for reminder deep links and note modification validation
 */

import {
  CRITICAL_INFO_TYPES,
  createEnhancedNotes,
  createReminderDeepLink,
  createReminderMarkdownLink,
  extractReminderIdsFromNotes,
  formatRelatedReminders,
  hasReminderLink,
  type NoteModificationContext,
  type RelatedReminder,
  shouldModifyNotes,
} from './reminderLinks.js';

describe('reminderLinks', () => {
  describe('createReminderDeepLink', () => {
    it('should create proper deep link format', () => {
      const link = createReminderDeepLink('test-123');
      expect(link).toBe('x-reminders://reminder?id=test-123');
    });

    it('should handle special characters in reminder ID', () => {
      const link = createReminderDeepLink('test-123&foo=bar');
      expect(link).toBe('x-reminders://reminder?id=test-123%26foo%3Dbar');
    });
  });

  describe('createReminderMarkdownLink', () => {
    it('should create markdown link with reminder title', () => {
      const reminder = {
        id: 'test-123',
        title: 'Test Task',
        isCompleted: false,
        list: 'Work',
        notes: undefined,
        dueDate: undefined,
        url: undefined,
      };

      const link = createReminderMarkdownLink(reminder);
      expect(link).toBe('[Test Task](x-reminders://reminder?id=test-123)');
    });
  });

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
      expect(result).toContain(
        '- [Dependency 1](x-reminders://reminder?id=dep1) (Work)',
      );
      expect(result).toContain(
        '- [Dependency 2](x-reminders://reminder?id=dep2) (Personal)',
      );
      expect(result).toContain('Follow-up tasks:');
      expect(result).toContain(
        '- [Follow-up Task](x-reminders://reminder?id=follow1)',
      );
    });

    it('should handle reminders without lists', () => {
      const related: RelatedReminder[] = [
        { id: 'task1', title: 'Task 1', relationship: 'related' },
      ];

      const result = formatRelatedReminders(related);

      expect(result).toContain('Related reminders:');
      expect(result).toContain('- [Task 1](x-reminders://reminder?id=task1)');
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
      expect(result).toContain(
        '[Get design files](x-reminders://reminder?id=dep1) (Work)',
      );
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
    it('should extract reminder IDs from deep links', () => {
      const notes =
        'Task notes\n\nRelated reminders:\n- [Task 1](x-reminders://reminder?id=task1)\n- [Task 2](x-reminders://reminder?id=task-2-with-dash)';

      const ids = extractReminderIdsFromNotes(notes);
      expect(ids).toContain('task1');
      expect(ids).toContain('task-2-with-dash');
    });

    it('should handle URL-encoded IDs', () => {
      const notes =
        'Related: [Task](x-reminders://reminder?id=task%26param%3Dvalue)';

      const ids = extractReminderIdsFromNotes(notes);
      expect(ids).toContain('task&param=value');
    });

    it('should return empty array for notes without links', () => {
      const notes = 'Just regular notes without any links';

      const ids = extractReminderIdsFromNotes(notes);
      expect(ids).toEqual([]);
    });

    it('should handle empty or undefined notes', () => {
      expect(extractReminderIdsFromNotes('')).toEqual([]);
      expect(extractReminderIdsFromNotes(undefined)).toEqual([]);
    });
  });

  describe('hasReminderLink', () => {
    it('should detect existing reminder links', () => {
      const notes =
        'Task notes\n\nRelated reminders:\n- [Task 1](x-reminders://reminder?id=task1)';

      expect(hasReminderLink(notes, 'task1')).toBe(true);
      expect(hasReminderLink(notes, 'task2')).toBe(false);
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
