/**
 * reminderRepository.test.ts
 * Tests for reminder repository
 */

import type { Reminder, ReminderList } from '../types/index.js';
import { executeCli } from './cliExecutor.js';
import type { ReminderFilters } from './dateFiltering.js';
import { applyReminderFilters } from './dateFiltering.js';
import { reminderRepository } from './reminderRepository.js';

// Mock dependencies
jest.mock('./cliExecutor.js');
jest.mock('./dateFiltering.js');

const mockExecuteCli = executeCli as jest.MockedFunction<typeof executeCli>;
const mockApplyReminderFilters = applyReminderFilters as jest.MockedFunction<
  typeof applyReminderFilters
>;

describe('ReminderRepository', () => {
  const repository = reminderRepository;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findReminderById', () => {
    it('should return reminder when found', async () => {
      const mockReminders: Partial<Reminder>[] = [
        { id: '1', title: 'Test 1', isCompleted: false, list: 'Default' },
        { id: '2', title: 'Test 2', isCompleted: true, list: 'Work' },
      ];
      const mockLists: ReminderList[] = [];

      mockExecuteCli.mockResolvedValue({
        reminders: mockReminders,
        lists: mockLists,
      });

      const result = await repository.findReminderById('2');

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'read',
        '--showCompleted',
        'true',
      ]);

      expect(result).toEqual({
        id: '2',
        title: 'Test 2',
        isCompleted: true,
        list: 'Work',
        notes: undefined,
        url: undefined,
        dueDate: undefined,
      });
    });

    it('should throw error when reminder not found', async () => {
      const mockReminders: Partial<Reminder>[] = [
        { id: '1', title: 'Test 1', isCompleted: false, list: 'Default' },
      ];

      mockExecuteCli.mockResolvedValue({
        reminders: mockReminders,
        lists: [],
      });

      await expect(repository.findReminderById('999')).rejects.toThrow(
        "Reminder with ID '999' not found.",
      );
    });

    it('should handle reminders with notes and url', async () => {
      const mockReminders: Partial<Reminder>[] = [
        {
          id: '1',
          title: 'Test',
          isCompleted: false,
          list: 'Default',
          notes: 'Some notes',
          url: 'https://example.com',
          dueDate: '2024-01-15',
        },
      ];

      mockExecuteCli.mockResolvedValue({
        reminders: mockReminders,
        lists: [],
      });

      const result = await repository.findReminderById('1');

      expect(result.notes).toBe('Some notes');
      expect(result.url).toBe('https://example.com');
      expect(result.dueDate).toBe('2024-01-15');
    });

    it('should handle null notes and url as undefined', async () => {
      const mockReminders: Partial<Reminder>[] = [
        {
          id: '1',
          title: 'Test',
          isCompleted: false,
          list: 'Default',
          notes: undefined,
          url: undefined,
          dueDate: undefined,
        },
      ];

      mockExecuteCli.mockResolvedValue({
        reminders: mockReminders,
        lists: [],
      });

      const result = await repository.findReminderById('1');

      expect(result.notes).toBeUndefined();
      expect(result.url).toBeUndefined();
      expect(result.dueDate).toBeUndefined();
    });
  });

  describe('findReminders', () => {
    it('should return filtered reminders', async () => {
      const mockReminders: Partial<Reminder>[] = [
        { id: '1', title: 'Test 1', isCompleted: false, list: 'Default' },
        { id: '2', title: 'Test 2', isCompleted: true, list: 'Work' },
      ];
      const mockLists: ReminderList[] = [];
      const filters: ReminderFilters = { showCompleted: false };
      const filteredReminders: Reminder[] = [
        { id: '1', title: 'Test 1', isCompleted: false, list: 'Default' },
      ];

      mockExecuteCli.mockResolvedValue({
        reminders: mockReminders,
        lists: mockLists,
      });
      mockApplyReminderFilters.mockReturnValue(filteredReminders);

      const result = await repository.findReminders(filters);

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'read',
        '--showCompleted',
        'true',
      ]);
      expect(mockApplyReminderFilters).toHaveBeenCalledWith(
        expect.any(Array),
        filters,
      );
      expect(result).toBe(filteredReminders);
    });

    it('should convert JSON reminders to proper Reminder objects', async () => {
      const mockReminders: Partial<Reminder>[] = [
        {
          id: '1',
          title: 'Test',
          isCompleted: false,
          list: 'Default',
          notes: 'Notes',
          url: 'https://example.com',
          dueDate: '2024-01-15',
        },
      ];

      mockExecuteCli.mockResolvedValue({
        reminders: mockReminders,
        lists: [],
      });
      mockApplyReminderFilters.mockImplementation((reminders) => reminders);

      const result = await repository.findReminders();

      expect(result[0]).toEqual({
        id: '1',
        title: 'Test',
        isCompleted: false,
        list: 'Default',
        notes: 'Notes',
        url: 'https://example.com',
        dueDate: '2024-01-15',
      });
    });

    it('should handle empty filters', async () => {
      const mockReminders: Partial<Reminder>[] = [
        { id: '1', title: 'Test', isCompleted: false, list: 'Default' },
      ];

      mockExecuteCli.mockResolvedValue({
        reminders: mockReminders,
        lists: [],
      });
      mockApplyReminderFilters.mockImplementation((reminders) => reminders);

      const result = await repository.findReminders();

      expect(result).toHaveLength(1);
    });
  });

  describe('findAllLists', () => {
    it('should return all reminder lists', async () => {
      const mockLists: ReminderList[] = [
        { id: '1', title: 'Default' },
        { id: '2', title: 'Work' },
      ];

      mockExecuteCli.mockResolvedValue({
        reminders: [],
        lists: mockLists,
      });

      const result = await repository.findAllLists();

      expect(result).toEqual(mockLists);
    });

    it('should return empty array when no lists', async () => {
      mockExecuteCli.mockResolvedValue({
        reminders: [],
        lists: [],
      });

      const result = await repository.findAllLists();

      expect(result).toEqual([]);
    });
  });

  describe('createReminder', () => {
    it('should create reminder with all fields', async () => {
      const data = {
        title: 'New Reminder',
        list: 'Work',
        notes: 'Some notes',
        url: 'https://example.com',
        dueDate: '2024-01-15',
      };
      const mockResult: Reminder = {
        id: '123',
        title: 'New Reminder',
        isCompleted: false,
        list: 'Default',
      };

      mockExecuteCli.mockResolvedValue(mockResult);

      const result = await repository.createReminder(data);

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'create',
        '--title',
        'New Reminder',
        '--targetList',
        'Work',
        '--note',
        'Some notes',
        '--url',
        'https://example.com',
        '--dueDate',
        '2024-01-15',
      ]);
      expect(result).toBe(mockResult);
    });

    it('should create reminder with minimal fields', async () => {
      const data = {
        title: 'Simple Reminder',
      };
      const mockResult: Reminder = {
        id: '123',
        title: 'Simple Reminder',
        isCompleted: false,
        list: 'Default',
      };

      mockExecuteCli.mockResolvedValue(mockResult);

      const result = await repository.createReminder(data);

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'create',
        '--title',
        'Simple Reminder',
      ]);
      expect(result).toBe(mockResult);
    });

    it('should handle optional fields correctly', async () => {
      const data = {
        title: 'Test',
        list: 'Work',
        // notes, url, dueDate omitted
      };
      const mockResult: Reminder = {
        id: '123',
        title: 'Test',
        isCompleted: false,
        list: 'Default',
      };

      mockExecuteCli.mockResolvedValue(mockResult);

      await repository.createReminder(data);

      const args = mockExecuteCli.mock.calls[0][0];
      expect(args).not.toContain('--note');
      expect(args).not.toContain('--url');
      expect(args).not.toContain('--dueDate');
    });
  });

  describe('updateReminder', () => {
    it('should update reminder with all fields', async () => {
      const data = {
        id: '123',
        newTitle: 'Updated Title',
        list: 'Work',
        notes: 'Updated notes',
        url: 'https://updated.com',
        isCompleted: true,
        dueDate: '2024-01-20',
      };
      const mockResult: Reminder = {
        id: '123',
        title: 'Updated Title',
        isCompleted: false,
        list: 'Default',
      };

      mockExecuteCli.mockResolvedValue(mockResult);

      const result = await repository.updateReminder(data);

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'update',
        '--id',
        '123',
        '--title',
        'Updated Title',
        '--targetList',
        'Work',
        '--note',
        'Updated notes',
        '--url',
        'https://updated.com',
        '--dueDate',
        '2024-01-20',
        '--isCompleted',
        'true',
      ]);
      expect(result).toBe(mockResult);
    });

    it('should update reminder with minimal fields', async () => {
      const data = {
        id: '123',
      };
      const mockResult: { id: string } = { id: '123' };

      mockExecuteCli.mockResolvedValue(mockResult);

      const result = await repository.updateReminder(data);

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'update',
        '--id',
        '123',
      ]);
      expect(result).toBe(mockResult);
    });

    it('should handle optional isCompleted field', async () => {
      const data = {
        id: '123',
        isCompleted: false,
      };

      mockExecuteCli.mockResolvedValue({ id: '123' });

      await repository.updateReminder(data);

      const args = mockExecuteCli.mock.calls[0][0];
      expect(args).toContain('--isCompleted');
      expect(args).toContain('false');
    });

    it('should skip isCompleted when undefined', async () => {
      const data = {
        id: '123',
        newTitle: 'Updated',
        // isCompleted not provided
      };

      mockExecuteCli.mockResolvedValue({ id: '123' });

      await repository.updateReminder(data);

      const args = mockExecuteCli.mock.calls[0][0];
      expect(args).not.toContain('--isCompleted');
    });
  });

  describe('deleteReminder', () => {
    it('should delete reminder by id', async () => {
      mockExecuteCli.mockResolvedValue(undefined);

      await repository.deleteReminder('123');

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'delete',
        '--id',
        '123',
      ]);
    });
  });

  describe('createReminderList', () => {
    it('should create reminder list', async () => {
      const mockResult: ReminderList = { id: '456', title: 'New List' };

      mockExecuteCli.mockResolvedValue(mockResult);

      const result = await repository.createReminderList('New List');

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'create-list',
        '--name',
        'New List',
      ]);
      expect(result).toBe(mockResult);
    });
  });

  describe('updateReminderList', () => {
    it('should update reminder list', async () => {
      const mockResult: ReminderList = { id: '456', title: 'Updated List' };

      mockExecuteCli.mockResolvedValue(mockResult);

      const result = await repository.updateReminderList(
        'Old Name',
        'New Name',
      );

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'update-list',
        '--name',
        'Old Name',
        '--newName',
        'New Name',
      ]);
      expect(result).toBe(mockResult);
    });
  });

  describe('deleteReminderList', () => {
    it('should delete reminder list', async () => {
      mockExecuteCli.mockResolvedValue(undefined);

      await repository.deleteReminderList('Test List');

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'delete-list',
        '--name',
        'Test List',
      ]);
    });
  });

  describe('reminderRepository instance', () => {
    it('should export a reminderRepository instance', () => {
      expect(reminderRepository).toBeDefined();
      expect(typeof reminderRepository.findReminders).toBe('function');
    });
  });
});
