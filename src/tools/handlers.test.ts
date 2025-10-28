/**
 * tests/tools/handlers.test.ts
 * Tests for the refactored tool handlers.
 */

import { reminderRepository } from '../utils/reminderRepository.js';
import {
  handleCreateReminder,
  handleDeleteReminder,
  handleReadReminders,
  handleUpdateReminder,
  handleReadReminderLists,
  handleCreateReminderList,
  handleUpdateReminderList,
  handleDeleteReminderList,
} from '../tools/handlers.js';
import { MESSAGES } from '../utils/constants.js';

// Mock CLI executor to avoid import.meta issues in tests
jest.mock('../utils/cliExecutor.js');

// Mock the entire repository
jest.mock('../utils/reminderRepository.js');

// Typecast the mock for easier use
const mockReminderRepository = reminderRepository as jest.Mocked<typeof reminderRepository>;

describe('Tool Handlers', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // --- Reminder Handlers ---

  describe('handleReadReminders', () => {
    it('should call repository and return reminders', async () => {
      const mockReminders = [{ id: '1', title: 'Test', isCompleted: false, list: 'Inbox' }];
      mockReminderRepository.findReminders.mockResolvedValue(mockReminders);

      const result = await handleReadReminders({ action: 'read' });
      const data = JSON.parse(result.content[0].text as string);

      expect(mockReminderRepository.findReminders).toHaveBeenCalled();
      expect(data.reminders).toEqual(mockReminders);
      expect(data.total).toBe(1);
    });
  });

  describe('handleCreateReminder', () => {
    it('should call repository with correct data', async () => {
      const newReminder = { id: '2', title: 'New Reminder', isCompleted: false, list: 'Inbox' };
      mockReminderRepository.createReminder.mockResolvedValue(newReminder);

      await handleCreateReminder({ action: 'create', title: 'New Reminder' });

      expect(mockReminderRepository.createReminder).toHaveBeenCalledWith({
        title: 'New Reminder',
        list: undefined,
        notes: undefined,
        url: undefined,
      });
    });
  });

  describe('handleUpdateReminder', () => {
    it('should find a reminder by title and then update it by ID', async () => {
      const existingReminder = { id: 'rem-123', title: 'Old Title', isCompleted: false, list: 'Inbox' };
      mockReminderRepository.findReminderByTitle.mockResolvedValue(existingReminder);
      mockReminderRepository.updateReminder.mockResolvedValue({ ...existingReminder, title: 'New Title' });

      await handleUpdateReminder({ action: 'update', title: 'Old Title', newTitle: 'New Title' });

      expect(mockReminderRepository.findReminderByTitle).toHaveBeenCalledWith('Old Title', undefined);
      expect(mockReminderRepository.updateReminder).toHaveBeenCalledWith({
        id: 'rem-123',
        newTitle: 'New Title',
        notes: undefined,
        url: undefined,
        isCompleted: undefined,
      });
    });

    it('should return an error response if the reminder to update is not found', async () => {
      mockReminderRepository.findReminderByTitle.mockResolvedValue(null);

      const result = await handleUpdateReminder({ action: 'update', title: 'Nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Reminder "Nonexistent" not found');
    });
  });

  describe('handleDeleteReminder', () => {
    it('should find a reminder by title and then delete it by ID', async () => {
      const existingReminder = { id: 'rem-456', title: 'Delete Me', isCompleted: false, list: 'Inbox' };
      mockReminderRepository.findReminderByTitle.mockResolvedValue(existingReminder);
      mockReminderRepository.deleteReminder.mockResolvedValue(undefined);

      await handleDeleteReminder({ action: 'delete', title: 'Delete Me' });

      expect(mockReminderRepository.findReminderByTitle).toHaveBeenCalledWith('Delete Me', undefined);
      expect(mockReminderRepository.deleteReminder).toHaveBeenCalledWith('rem-456');
    });

    it('should return an error response if the reminder to delete is not found', async () => {
      mockReminderRepository.findReminderByTitle.mockResolvedValue(null);

      const result = await handleDeleteReminder({ action: 'delete', title: 'Nonexistent' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Reminder "Nonexistent" not found');
    });
  });

  // --- List Handlers ---

  describe('handleReadReminderLists', () => {
    it('should call repository and return lists', async () => {
      const mockLists = [{ id: 'list-1', title: 'Inbox' }];
      mockReminderRepository.findAllLists.mockResolvedValue(mockLists);

      const result = await handleReadReminderLists();
      const data = JSON.parse(result.content[0].text as string);

      expect(mockReminderRepository.findAllLists).toHaveBeenCalled();
      expect(data.lists).toEqual(mockLists);
      expect(data.total).toBe(1);
    });
  });

  describe('handleCreateReminderList', () => {
    it('should call repository to create a list', async () => {
      const newList = { id: 'list-2', title: 'New List' };
      mockReminderRepository.createReminderList.mockResolvedValue(newList);

      await handleCreateReminderList({ action: 'create', name: 'New List' });

      expect(mockReminderRepository.createReminderList).toHaveBeenCalledWith('New List');
    });
  });

  describe('handleUpdateReminderList', () => {
    it('should call repository to update a list', async () => {
      const updatedList = { id: 'list-3', title: 'Updated Name' };
      mockReminderRepository.updateReminderList.mockResolvedValue(updatedList);

      await handleUpdateReminderList({ action: 'update', name: 'Old Name', newName: 'Updated Name' });

      expect(mockReminderRepository.updateReminderList).toHaveBeenCalledWith('Old Name', 'Updated Name');
    });
  });

  describe('handleDeleteReminderList', () => {
    it('should call repository to delete a list', async () => {
      mockReminderRepository.deleteReminderList.mockResolvedValue(undefined);

      const result = await handleDeleteReminderList({ action: 'delete', name: 'Old List' });

      expect(mockReminderRepository.deleteReminderList).toHaveBeenCalledWith('Old List');
      expect(result.content[0].text).toBe(MESSAGES.SUCCESS.LIST_DELETED('Old List'));
    });
  });
});