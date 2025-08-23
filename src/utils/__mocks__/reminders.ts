/**
 * Mock version of reminders.ts for testing
 */

import type { Reminder, ReminderList } from '../../types/index.js';

export class RemindersManager {
  constructor() {
    // Mock implementation - no binary path needed
  }

  async getReminders(showCompleted: boolean = false): Promise<{
    lists: ReminderList[];
    reminders: Reminder[];
  }> {
    // Return mock data for testing
    return {
      lists: [
        { id: 1, title: 'Default' },
        { id: 2, title: 'Work' },
        { id: 3, title: 'Personal' }
      ],
      reminders: [
        {
          title: 'Test Reminder 1',
          list: 'Default',
          isCompleted: false,
          dueDate: undefined,
          notes: undefined,
          url: undefined
        },
        {
          title: 'Test Reminder 2',
          list: 'Work',
          isCompleted: true,
          dueDate: '2024-03-12 10:00:00',
          notes: 'Test notes',
          url: 'https://example.com'
        }
      ]
    };
  }
}

// Export singleton instance
export const remindersManager = new RemindersManager(); 