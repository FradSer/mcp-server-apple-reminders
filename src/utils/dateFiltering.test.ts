/**
 * dateFiltering.test.ts
 * Tests for date filtering utilities
 */

import type { Reminder } from '../types/index.js';
import {
  applyReminderFilters,
  createDateBoundaries,
  filterRemindersByDate,
  type ReminderFilters,
} from './dateFiltering.js';

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

  describe('createDateBoundaries', () => {
    it('should create date boundaries with correct structure', () => {
      const boundaries = createDateBoundaries();

      expect(boundaries).toHaveProperty('today');
      expect(boundaries).toHaveProperty('tomorrow');
      expect(boundaries).toHaveProperty('weekEnd');

      // Check that dates are valid Date objects
      expect(boundaries.today).toBeInstanceOf(Date);
      expect(boundaries.tomorrow).toBeInstanceOf(Date);
      expect(boundaries.weekEnd).toBeInstanceOf(Date);

      // Check relative relationships
      expect(boundaries.tomorrow.getTime()).toBeGreaterThan(
        boundaries.today.getTime(),
      );
      expect(boundaries.weekEnd.getTime()).toBeGreaterThan(
        boundaries.tomorrow.getTime(),
      );
    });

    it('should handle different times of day correctly', () => {
      // Test at different hour to ensure date normalization
      const boundaries = createDateBoundaries();

      // Should always be start of day regardless of current time
      expect(boundaries.today.getHours()).toBe(0);
      expect(boundaries.today.getMinutes()).toBe(0);
      expect(boundaries.today.getSeconds()).toBe(0);
    });
  });

  describe('filterRemindersByDate', () => {
    const reminders: Reminder[] = [
      {
        id: '1',
        title: 'No due date',
        list: 'Default',
        isCompleted: false,
      },
      {
        id: '2',
        title: 'Due today',
        dueDate: '2024-01-15T15:00:00Z',
        list: 'Default',
        isCompleted: false,
      },
      {
        id: '3',
        title: 'Due tomorrow',
        dueDate: '2024-01-16T10:00:00Z',
        list: 'Default',
        isCompleted: false,
      },
      {
        id: '4',
        title: 'Due this week',
        dueDate: '2024-01-20T12:00:00Z',
        list: 'Default',
        isCompleted: false,
      },
      {
        id: '5',
        title: 'Due later',
        dueDate: '2024-02-01T09:00:00Z',
        list: 'Default',
        isCompleted: false,
      },
      {
        id: '6',
        title: 'Overdue',
        dueDate: '2024-01-10T08:00:00Z',
        list: 'Default',
        isCompleted: false,
      },
    ];

    it('should filter reminders with no due date', () => {
      const result = filterRemindersByDate(reminders, 'no-date');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter reminders due today', () => {
      const result = filterRemindersByDate(reminders, 'today');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter reminders due tomorrow', () => {
      const result = filterRemindersByDate(reminders, 'tomorrow');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('should filter reminders due this week', () => {
      const result = filterRemindersByDate(reminders, 'this-week');

      expect(result).toHaveLength(3); // today, tomorrow, and this week
      expect(result.map((r) => r.id)).toEqual(['2', '3', '4']);
    });

    it('should filter overdue reminders', () => {
      const result = filterRemindersByDate(reminders, 'overdue');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('6');
    });

    it('should handle reminders without due dates appropriately', () => {
      const result = filterRemindersByDate(reminders, 'today');

      expect(result.every((r) => r.dueDate)).toBe(true);
    });

    it('should handle unknown filter by returning all reminders with due dates', () => {
      // Create a filter that doesn't match any case
      const remindersWithDates = reminders.filter((r) => r.dueDate);
      const result = filterRemindersByDate(
        remindersWithDates,
        'unknown' as unknown as DateFilter,
      );

      // Should return all reminders since default case returns true
      expect(result.length).toBe(remindersWithDates.length);
    });
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
