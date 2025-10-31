/**
 * tests/tools/handlers.test.ts
 * Tests for the refactored, Markdown-outputting tool handlers.
 */

import {
  handleCreateReminder,
  handleCreateReminderList,
  handleDeleteReminder,
  handleDeleteReminderList,
  handleReadReminderLists,
  handleReadReminders,
  handleUpdateReminder,
  handleUpdateReminderList,
} from '../tools/handlers.js';
import { handleAsyncOperation } from '../utils/errorHandling.js';
import { reminderRepository } from '../utils/reminderRepository.js';

// Mock the cliExecutor to avoid import.meta issues
jest.mock('../utils/cliExecutor.js', () => ({
  executeCli: jest.fn(),
}));

// Mock the repository and error handling
jest.mock('../utils/reminderRepository.js');
jest.mock('../utils/errorHandling.js');

const mockReminderRepository = reminderRepository as jest.Mocked<
  typeof reminderRepository
>;
const mockHandleAsyncOperation = handleAsyncOperation as jest.Mock;

// Simplified wrapper mock for testing. It mimics the real implementation.
mockHandleAsyncOperation.mockImplementation(async (operation) => {
  try {
    const result = await operation();
    return { content: [{ type: 'text', text: result }], isError: false };
  } catch (error) {
    return {
      content: [{ type: 'text', text: (error as Error).message }],
      isError: true,
    };
  }
});

describe('Tool Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Reminder Handlers ---

  describe('handleReadReminders', () => {
    it('should return reminders formatted as Markdown', async () => {
      const mockReminders = [
        {
          id: '1',
          title: 'Test',
          isCompleted: false,
          list: 'Inbox',
        },
      ];
      mockReminderRepository.findReminders.mockResolvedValue(mockReminders);
      const result = await handleReadReminders({ action: 'read' });
      const content = result.content[0].text as string;
      expect(content).toContain('### Reminders (Total: 1)');
      expect(content).toContain('- [ ] Test');
    });

    it('should return single reminder when id is provided', async () => {
      const mockReminder = {
        id: '123',
        title: 'Single Reminder',
        isCompleted: false,
        list: 'Work',
        notes: 'Some notes',
        dueDate: '2024-12-25',
        url: 'https://example.com',
      };
      mockReminderRepository.findReminderById.mockResolvedValue(mockReminder);
      const result = await handleReadReminders({
        action: 'read',
        id: '123',
      });
      const content = result.content[0].text as string;
      expect(content).toContain('### Reminder');
      expect(content).toContain('- [ ] Single Reminder');
      expect(content).toContain('- List: Work');
      expect(content).toContain('- ID: 123');
      expect(content).toContain('- Notes: Some notes');
      expect(content).toContain('- Due: 2024-12-25');
      expect(content).toContain('- URL: https://example.com');
    });

    it('should return single completed reminder with checkbox', async () => {
      const mockReminder = {
        id: '456',
        title: 'Completed Task',
        isCompleted: true,
        list: 'Done',
      };
      mockReminderRepository.findReminderById.mockResolvedValue(mockReminder);
      const result = await handleReadReminders({
        action: 'read',
        id: '456',
      });
      const content = result.content[0].text as string;
      expect(content).toContain('- [x] Completed Task');
    });

    it('should return empty list message when no reminders found', async () => {
      mockReminderRepository.findReminders.mockResolvedValue([]);
      const result = await handleReadReminders({ action: 'read' });
      const content = result.content[0].text as string;
      expect(content).toContain('### Reminders (Total: 0)');
      expect(content).toContain('No reminders found matching the criteria.');
    });

    it('should format reminders with notes containing newlines', async () => {
      const mockReminders = [
        {
          id: '1',
          title: 'Task',
          isCompleted: false,
          list: 'Work',
          notes: 'Line 1\nLine 2\nLine 3',
        },
      ];
      mockReminderRepository.findReminders.mockResolvedValue(mockReminders);
      const result = await handleReadReminders({ action: 'read' });
      const content = result.content[0].text as string;
      expect(content).toContain('Notes: Line 1\n    Line 2\n    Line 3');
    });
  });

  describe('handleCreateReminder', () => {
    it('should return a Markdown success message with ID', async () => {
      const newReminder = {
        id: 'rem-123',
        title: 'New Task',
        isCompleted: false,
        list: 'Inbox',
        notes: null,
        url: null,
        dueDate: null,
      };
      mockReminderRepository.createReminder.mockResolvedValue(newReminder);
      const result = await handleCreateReminder({
        action: 'create',
        title: 'New Task',
      });
      const content = result.content[0].text as string;
      expect(content).toContain('Successfully created reminder "New Task"');
      expect(content).toContain('- ID: rem-123');
    });
  });

  describe('handleUpdateReminder', () => {
    it('should return a Markdown success message with ID', async () => {
      const updatedReminder = {
        id: 'rem-456',
        title: 'Updated Task',
        isCompleted: true,
        list: 'Inbox',
        notes: null,
        url: null,
        dueDate: null,
      };
      mockReminderRepository.updateReminder.mockResolvedValue(updatedReminder);
      const result = await handleUpdateReminder({
        action: 'update',
        id: 'rem-456',
        title: 'Updated Task',
      });
      const content = result.content[0].text as string;
      expect(content).toContain('Successfully updated reminder "Updated Task"');
      expect(content).toContain('- ID: rem-456');
    });
  });

  describe('handleDeleteReminder', () => {
    it('should return a Markdown success message', async () => {
      mockReminderRepository.deleteReminder.mockResolvedValue(undefined);
      const result = await handleDeleteReminder({
        action: 'delete',
        id: 'rem-789',
      });
      const content = result.content[0].text as string;
      expect(content).toBe('Successfully deleted reminder with ID: rem-789');
    });
  });

  // --- List Handlers ---

  describe('handleReadReminderLists', () => {
    it('should return lists formatted as Markdown', async () => {
      const mockLists = [{ id: 'list-1', title: 'Inbox' }];
      mockReminderRepository.findAllLists.mockResolvedValue(mockLists);
      const result = await handleReadReminderLists();
      const content = result.content[0].text as string;
      expect(content).toContain('### Reminder Lists (Total: 1)');
      expect(content).toContain('- Inbox (ID: list-1)');
    });

    it('should return empty list message when no lists found', async () => {
      mockReminderRepository.findAllLists.mockResolvedValue([]);
      const result = await handleReadReminderLists();
      const content = result.content[0].text as string;
      expect(content).toContain('### Reminder Lists (Total: 0)');
      expect(content).toContain('No reminder lists found.');
    });
  });

  describe('handleCreateReminderList', () => {
    it('should return a Markdown success message with ID', async () => {
      const newList = { id: 'list-abc', title: 'New List' };
      mockReminderRepository.createReminderList.mockResolvedValue(newList);
      const result = await handleCreateReminderList({
        action: 'create',
        name: 'New List',
      });
      const content = result.content[0].text as string;
      expect(content).toContain('Successfully created list "New List"');
      expect(content).toContain('- ID: list-abc');
    });
  });

  describe('handleUpdateReminderList', () => {
    it('should return a Markdown success message with ID', async () => {
      const updatedList = { id: 'list-def', title: 'Updated Name' };
      mockReminderRepository.updateReminderList.mockResolvedValue(updatedList);
      const result = await handleUpdateReminderList({
        action: 'update',
        name: 'Old Name',
        newName: 'Updated Name',
      });
      const content = result.content[0].text as string;
      expect(content).toContain('Successfully updated list to "Updated Name"');
      expect(content).toContain('- ID: list-def');
    });
  });

  describe('handleDeleteReminderList', () => {
    it('should return a Markdown success message', async () => {
      mockReminderRepository.deleteReminderList.mockResolvedValue(undefined);
      const result = await handleDeleteReminderList({
        action: 'delete',
        name: 'Old List',
      });
      const content = result.content[0].text as string;
      expect(content).toBe('Successfully deleted list "Old List".');
    });
  });
});
