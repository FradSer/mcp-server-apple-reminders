/**
 * tests/tools/handlers.test.ts
 * Tests for the refactored, Markdown-outputting tool handlers.
 */

import {
  handleCreateReminder,
  handleCreateReminderList,
  handleDeleteReminder,
  handleDeleteReminderList,
  handleMoveReminder,
  handleReadReminderLists,
  handleReadReminders,
  handleUpdateReminder,
  handleUpdateReminderList,
} from '../tools/handlers.js';
import { handleAsyncOperation } from '../utils/errorHandling.js';
import { reminderRepository } from '../utils/reminderRepository.js';

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
        { id: '1', title: 'Test', isCompleted: false, list: 'Inbox' },
      ];
      mockReminderRepository.findReminders.mockResolvedValue(mockReminders);
      const result = await handleReadReminders({ action: 'read' });
      const content = result.content[0].text as string;
      expect(content).toContain('### Reminders (Total: 1)');
      expect(content).toContain('- [ ] Test');
    });
  });

  describe('handleCreateReminder', () => {
    it('should return a Markdown success message with ID', async () => {
      const newReminder = {
        id: 'rem-123',
        title: 'New Task',
        isCompleted: false,
        list: 'Inbox',
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
