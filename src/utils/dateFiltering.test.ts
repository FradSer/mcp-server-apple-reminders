/**
 * dateFiltering.test.ts
 * Tests for date filtering utilities
 */

import type { Reminder } from '../types/index.js';
import { applyReminderFilters, type ReminderFilters } from './dateFiltering.js';

describe('DateFiltering', () => {
  // Mock Date to ensure consistent test results
  const mockNow = new Date('2024-01-15T00:00:00.000Z');
  const RealDate = global.Date;

  beforeEach(() => {
    global.Date = class extends RealDate {
      constructor(...args: ConstructorParameters<typeof RealDate>) {
        if (args.length === (0 as number)) {
          super(mockNow);
        } else {
          super(...args);
        }
      }
    } as typeof global.Date;
  });

  afterEach(() => {
    global.Date = RealDate;
  });

  describe('applyReminderFilters', () => {
    const reminders: Reminder[] = [
      {
        id: '1',
        title: 'Active reminder',
        list: 'Default',
        isCompleted: false,
      },
      {
        id: '2',
        title: 'Completed reminder',
        list: 'Default',
        isCompleted: true,
      },
      {
        id: '3',
        title: 'Work reminder',
        list: 'Work',
        isCompleted: false,
      },
      {
        id: '4',
        title: 'Project meeting',
        notes: 'Discuss project timeline',
        list: 'Work',
        isCompleted: false,
      },
      {
        id: '5',
        title: 'Personal task',
        dueDate: '2024-01-15T10:00:00Z',
        list: 'Personal',
        isCompleted: false,
      },
    ];

    it('should filter by completion status', () => {
      const filters: ReminderFilters = { showCompleted: false };
      const result = applyReminderFilters(reminders, filters);

      expect(result).toHaveLength(4);
      expect(result.every((r) => !r.isCompleted)).toBe(true);
    });

    it('should include completed reminders when showCompleted is true', () => {
      const filters: ReminderFilters = { showCompleted: true };
      const result = applyReminderFilters(reminders, filters);

      expect(result).toHaveLength(5);
    });

    it('should filter by list', () => {
      const filters: ReminderFilters = { list: 'Work' };
      const result = applyReminderFilters(reminders, filters);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.list === 'Work')).toBe(true);
    });

    it('should filter by search term in title', () => {
      const filters: ReminderFilters = { search: 'meeting' };
      const result = applyReminderFilters(reminders, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });

    it('should filter by search term in notes', () => {
      const filters: ReminderFilters = { search: 'timeline' };
      const result = applyReminderFilters(reminders, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });

    it('should filter by due date', () => {
      const filters: ReminderFilters = { dueWithin: 'today' };
      const result = applyReminderFilters(reminders, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('5');
    });

    it('should apply multiple filters together', () => {
      const filters: ReminderFilters = {
        list: 'Work',
        showCompleted: false,
        search: 'project',
      };
      const result = applyReminderFilters(reminders, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });

    it('should return all reminders when no filters applied', () => {
      const filters: ReminderFilters = {};
      const result = applyReminderFilters(reminders, filters);

      expect(result).toHaveLength(5);
    });

    it('should handle empty reminder list', () => {
      const filters: ReminderFilters = { search: 'test' };
      const result = applyReminderFilters([], filters);

      expect(result).toHaveLength(0);
    });

    it('should be case insensitive for search', () => {
      const filters: ReminderFilters = { search: 'PROJECT' };
      const result = applyReminderFilters(reminders, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('4');
    });
  });
});
