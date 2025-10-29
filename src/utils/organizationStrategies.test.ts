/**
 * organizationStrategies.test.ts
 * Tests for reminder organization strategies
 */

import type { Reminder } from '../types/index.js';
import { ReminderOrganizer } from './organizationStrategies.js';

describe('OrganizationStrategies', () => {
  describe('ReminderOrganizer', () => {
    describe('categorizeByPriority', () => {
      it('should categorize as High Priority for urgent keywords', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Urgent meeting',
          list: 'Work',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByPriority(reminder);
        expect(category).toBe('High Priority');
      });

      it('should categorize as Low Priority for low priority keywords', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Someday maybe',
          list: 'Personal',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByPriority(reminder);
        expect(category).toBe('Low Priority');
      });

      it('should categorize as Medium Priority for neutral content', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Regular task',
          list: 'Default',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByPriority(reminder);
        expect(category).toBe('Medium Priority');
      });

      it('should check both title and notes for keywords', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Task',
          notes: 'This is critical for the project',
          list: 'Work',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByPriority(reminder);
        expect(category).toBe('High Priority');
      });

      it('should be case insensitive', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'URGENT TASK',
          list: 'Work',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByPriority(reminder);
        expect(category).toBe('High Priority');
      });

      it('should handle empty notes', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Regular task',
          notes: undefined,
          list: 'Default',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByPriority(reminder);
        expect(category).toBe('Medium Priority');
      });
    });

    describe('categorizeByDueDate', () => {
      it('should delegate to categorizeReminderByDueDate', () => {
        // Create a reminder due in the current day
        const now = new Date();
        const todayDue = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
        const reminder: Reminder = {
          id: '1',
          title: 'Test',
          dueDate: todayDue.toISOString(),
          list: 'Default',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByDueDate(reminder);
        expect(['Due Today', 'Due This Week']).toContain(category);
      });
    });

    describe('categorizeByCompletion', () => {
      it('should categorize completed reminders', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Completed task',
          list: 'Default',
          isCompleted: true,
        };

        const category = ReminderOrganizer.categorizeByCompletion(reminder);
        expect(category).toBe('Completed');
      });

      it('should categorize active reminders', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Active task',
          list: 'Default',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByCompletion(reminder);
        expect(category).toBe('Active');
      });
    });

    describe('categorizeByCategory', () => {
      it('should categorize work-related reminders', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Team meeting',
          list: 'Work',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByCategory(reminder);
        expect(category).toBe('Work');
      });

      it('should categorize personal reminders', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Call mom',
          notes: 'Family matters',
          list: 'Personal',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByCategory(reminder);
        expect(category).toBe('Personal');
      });

      it('should categorize shopping reminders', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Buy groceries',
          list: 'Shopping',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByCategory(reminder);
        expect(category).toBe('Shopping');
      });

      it('should categorize health-related reminders', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Doctor appointment',
          list: 'Health',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByCategory(reminder);
        expect(category).toBe('Health');
      });

      it('should categorize finance reminders', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Pay bills',
          list: 'Finance',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByCategory(reminder);
        expect(category).toBe('Finance');
      });

      it('should categorize travel reminders', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Book flight',
          list: 'Travel',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByCategory(reminder);
        expect(category).toBe('Travel');
      });

      it('should categorize education reminders', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Study session',
          list: 'Education',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByCategory(reminder);
        expect(category).toBe('Education');
      });

      it('should categorize as Uncategorized for unknown content', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Random task xyz123',
          list: 'Misc',
          isCompleted: false,
        };

        const category = ReminderOrganizer.categorizeByCategory(reminder);
        expect(category).toBe('Uncategorized');
      });

      it('should prioritize first matching category', () => {
        const reminder: Reminder = {
          id: '1',
          title: 'Work meeting with family',
          list: 'Mixed',
          isCompleted: false,
        };

        // Should match Work before Personal due to order in implementation
        const category = ReminderOrganizer.categorizeByCategory(reminder);
        expect(category).toBe('Work');
      });
    });

    describe('organizeReminders', () => {
      const reminders: Reminder[] = [
        {
          id: '1',
          title: 'Urgent work meeting',
          list: 'Work',
          isCompleted: false,
        },
        {
          id: '2',
          title: 'Buy groceries',
          list: 'Shopping',
          isCompleted: false,
        },
        {
          id: '3',
          title: 'Completed task',
          list: 'Work',
          isCompleted: true,
        },
        {
          id: '4',
          title: 'Call mom',
          list: 'Personal',
          isCompleted: false,
        },
      ];

      it('should organize by priority', () => {
        const result = ReminderOrganizer.organizeReminders(reminders, 'priority');

        expect(Object.keys(result)).toContain('High Priority');
        expect(Object.keys(result)).toContain('Medium Priority');
        expect(result['High Priority']).toHaveLength(1);
        expect(result['Medium Priority']).toHaveLength(3); // groceries, completed task, call mom
      });

      it('should organize by due date', () => {
        const result = ReminderOrganizer.organizeReminders(reminders, 'due_date');

        // All reminders have no due date, so should be categorized as "No Due Date"
        expect(result['No Due Date']).toHaveLength(4);
      });

      it('should organize by completion status', () => {
        const result = ReminderOrganizer.organizeReminders(reminders, 'completion_status');

        expect(result['Active']).toHaveLength(3);
        expect(result['Completed']).toHaveLength(1);
      });

      it('should organize by category as default', () => {
        const result = ReminderOrganizer.organizeReminders(reminders);

        expect(result['Work']).toHaveLength(1); // urgent work meeting
        expect(result['Shopping']).toHaveLength(1); // buy groceries
        expect(result['Uncategorized']).toHaveLength(2); // completed task, call mom
      });

      it('should handle empty reminder list', () => {
        const result = ReminderOrganizer.organizeReminders([], 'category');

        expect(result).toEqual({});
      });

      it('should create new groups for new categories', () => {
        const result = ReminderOrganizer.organizeReminders(reminders, 'category');

        // Should have separate groups for each category
        expect(Object.keys(result).length).toBeGreaterThan(0);
        Object.values(result).forEach(group => {
          expect(Array.isArray(group)).toBe(true);
          expect(group.length).toBeGreaterThan(0);
        });
      });

      it('should preserve reminder objects in groups', () => {
        const result = ReminderOrganizer.organizeReminders(reminders, 'category');

        const workReminders = result['Work'] || [];
        expect(workReminders[0]).toHaveProperty('id');
        expect(workReminders[0]).toHaveProperty('title');
        expect(workReminders[0]).toHaveProperty('list');
      });
    });
  });
});
