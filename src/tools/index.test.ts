// Use global Jest functions to avoid extra dependencies

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ListsToolArgs, RemindersToolArgs } from '../types/index.js';
import { handleToolCall, TOOLS } from './index.js';

// Mock all handler functions
jest.mock('./handlers.js', () => ({
  handleCreateReminder: jest.fn(),
  handleReadReminderLists: jest.fn(),
  handleReadReminders: jest.fn(),
  handleUpdateReminder: jest.fn(),
  handleDeleteReminder: jest.fn(),
  handleCreateReminderList: jest.fn(),
  handleUpdateReminderList: jest.fn(),
  handleDeleteReminderList: jest.fn(),
}));

jest.mock('./definitions.js', () => ({
  TOOLS: [
    { name: 'reminders', description: 'Unified reminders tool' },
    { name: 'lists', description: 'Reminder lists tool' },
  ],
}));

import {
  handleCreateReminder,
  handleCreateReminderList,
  handleDeleteReminder,
  handleDeleteReminderList,
  handleReadReminderLists,
  handleReadReminders,
  handleUpdateReminder,
  handleUpdateReminderList,
} from './handlers.js';

const mockHandleCreateReminder = handleCreateReminder as jest.MockedFunction<
  typeof handleCreateReminder
>;
const mockHandleReadReminderLists =
  handleReadReminderLists as jest.MockedFunction<
    typeof handleReadReminderLists
  >;
const mockHandleReadReminders = handleReadReminders as jest.MockedFunction<
  typeof handleReadReminders
>;
const mockHandleUpdateReminder = handleUpdateReminder as jest.MockedFunction<
  typeof handleUpdateReminder
>;
const mockHandleDeleteReminder = handleDeleteReminder as jest.MockedFunction<
  typeof handleDeleteReminder
>;
const mockHandleCreateReminderList =
  handleCreateReminderList as jest.MockedFunction<
    typeof handleCreateReminderList
  >;
const mockHandleUpdateReminderList =
  handleUpdateReminderList as jest.MockedFunction<
    typeof handleUpdateReminderList
  >;
const mockHandleDeleteReminderList =
  handleDeleteReminderList as jest.MockedFunction<
    typeof handleDeleteReminderList
  >;

describe('Tools Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleToolCall', () => {
    test('should route reminders action=create to handleCreateReminder', async () => {
      const args = { action: 'create' as const, title: 'Test reminder' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Success' }],
        isError: false,
      };

      mockHandleCreateReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('reminders', args);

      expect(mockHandleCreateReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should route reminders action=read to handleReadReminders', async () => {
      const args = { action: 'read' as const, id: '123' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Reminder details' }],
        isError: false,
      };

      mockHandleReadReminders.mockResolvedValue(expectedResult);

      const result = await handleToolCall('reminders', args);

      expect(mockHandleReadReminders).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should route lists action=list to handleListReminderLists', async () => {
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Lists' }],
        isError: false,
      };

      mockHandleReadReminderLists.mockResolvedValue(expectedResult);

      const result = await handleToolCall('lists', { action: 'read' as const });

      expect(mockHandleReadReminderLists).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    test('should route reminders action=update to handleUpdateReminder', async () => {
      const args = {
        action: 'update' as const,
        title: 'Old title',
        newTitle: 'New title',
      };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Updated' }],
        isError: false,
      };

      mockHandleUpdateReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('reminders', args);

      expect(mockHandleUpdateReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should route reminders action=delete to handleDeleteReminder', async () => {
      const args = { action: 'delete' as const, title: 'Delete me' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Deleted' }],
        isError: false,
      };

      mockHandleDeleteReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('reminders', args);

      expect(mockHandleDeleteReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should return error for unknown tool', async () => {
      const result = await handleToolCall(
        'unknown_tool',
        {} as RemindersToolArgs,
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Unknown tool: unknown_tool',
          },
        ],
        isError: true,
      });

      // Verify no handlers were called
      expect(mockHandleCreateReminder).not.toHaveBeenCalled();
      expect(mockHandleReadReminders).not.toHaveBeenCalled();
      expect(mockHandleReadReminderLists).not.toHaveBeenCalled();
      expect(mockHandleUpdateReminder).not.toHaveBeenCalled();
      expect(mockHandleDeleteReminder).not.toHaveBeenCalled();
    });

    test('should handle empty tool name', async () => {
      const result = await handleToolCall('', {} as RemindersToolArgs);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Unknown tool: ',
          },
        ],
        isError: true,
      });
    });

    test('should handle null/undefined args', async () => {
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Success' }],
        isError: false,
      };

      mockHandleCreateReminder.mockResolvedValue(expectedResult);

      // Test with null args
      await handleToolCall('reminders', undefined);
      expect(mockHandleCreateReminder).not.toHaveBeenCalled();

      // Test with missing action
      await handleToolCall(
        'reminders',
        {} as RemindersToolArgs | ListsToolArgs,
      );
      expect(mockHandleCreateReminder).not.toHaveBeenCalled();
    });

    test('should propagate handler errors', async () => {
      const error = new Error('Handler failed');
      mockHandleCreateReminder.mockRejectedValue(error);

      await expect(
        handleToolCall('reminders', { action: 'create' as const }),
      ).rejects.toThrow('Handler failed');
    });

    test('should handle handlers returning different result types', async () => {
      const testCases = [
        {
          tool: 'reminders',
          args: { action: 'create' as const },
          handler: mockHandleCreateReminder,
          result: {
            content: [{ type: 'text' as const, text: 'Created' }],
            isError: false,
          },
        },
        {
          tool: 'reminders',
          args: { action: 'update' as const },
          handler: mockHandleUpdateReminder,
          result: {
            content: [{ type: 'text' as const, text: 'Updated successfully' }],
            isError: false,
          },
        },
      ];

      for (const testCase of testCases) {
        testCase.handler.mockResolvedValue(testCase.result);

        const result = await handleToolCall(
          testCase.tool,
          testCase.args as RemindersToolArgs | ListsToolArgs,
        );

        expect(result).toEqual(testCase.result);
        expect(testCase.handler).toHaveBeenCalled();

        testCase.handler.mockClear();
      }
    });

    test('should handle complex arguments', async () => {
      const complexArgs = {
        action: 'create' as const,
        title: 'Complex reminder',
        dueDate: '2024-12-25 18:00:00',
        list: 'Work Tasks',
        note: 'This is a complex note with\nmultiple lines\nand special chars: !@#$%',
        url: 'https://example.com/task',
        metadata: {
          priority: 'high',
          tags: ['urgent', 'client'],
          nested: { deep: 'value' },
        },
      };

      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Complex reminder created' }],
        isError: false,
      };

      mockHandleCreateReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('reminders', complexArgs);

      expect(mockHandleCreateReminder).toHaveBeenCalledWith(complexArgs);
      expect(result).toEqual(expectedResult);
    });

    test('should return error when reminders args is undefined', async () => {
      const result = await handleToolCall('reminders', undefined);

      expect(result).toEqual({
        content: [{ type: 'text', text: 'No arguments provided' }],
        isError: true,
      });
    });

    test('should return error when reminders args action is undefined', async () => {
      // Test the branch where args exists but action is undefined
      // This covers line 45 switch statement with undefined action
      const result = await handleToolCall('reminders', {
        action: undefined,
      } as unknown as RemindersToolArgs);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Unknown reminders action: undefined',
          },
        ],
        isError: true,
      });
    });

    test('should return error for unknown reminders action', async () => {
      const result = await handleToolCall('reminders', {
        action: 'unknown',
      } as unknown as RemindersToolArgs);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Unknown reminders action: unknown',
          },
        ],
        isError: true,
      });
    });

    test('should route lists action=create to handleCreateReminderList', async () => {
      const args = { action: 'create' as const, name: 'New List' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Created list' }],
        isError: false,
      };

      mockHandleCreateReminderList.mockResolvedValue(expectedResult);

      const result = await handleToolCall('lists', args);

      expect(mockHandleCreateReminderList).toHaveBeenCalledWith({
        action: 'create',
        name: 'New List',
      });
      expect(result).toEqual(expectedResult);
    });

    test('should return error when lists create name is missing', async () => {
      const result = await handleToolCall('lists', {
        action: 'create' as const,
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Input validation failed: Name is required for list creation',
          },
        ],
        isError: true,
      });
    });

    test('should route lists action=update to handleUpdateReminderList', async () => {
      const args = {
        action: 'update' as const,
        name: 'Old Name',
        newName: 'New Name',
      };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Updated list' }],
        isError: false,
      };

      mockHandleUpdateReminderList.mockResolvedValue(expectedResult);

      const result = await handleToolCall('lists', args);

      expect(mockHandleUpdateReminderList).toHaveBeenCalledWith({
        action: 'update',
        name: 'Old Name',
        newName: 'New Name',
      });
      expect(result).toEqual(expectedResult);
    });

    test('should return error when lists update name is missing', async () => {
      const result = await handleToolCall('lists', {
        action: 'update' as const,
        newName: 'New Name',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Input validation failed: Name and newName are required for list update',
          },
        ],
        isError: true,
      });
    });

    test('should return error when lists update newName is missing', async () => {
      const result = await handleToolCall('lists', {
        action: 'update' as const,
        name: 'Old Name',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Input validation failed: Name and newName are required for list update',
          },
        ],
        isError: true,
      });
    });

    test('should route lists action=delete to handleDeleteReminderList', async () => {
      const args = { action: 'delete' as const, name: 'List Name' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Deleted list' }],
        isError: false,
      };

      mockHandleDeleteReminderList.mockResolvedValue(expectedResult);

      const result = await handleToolCall('lists', args);

      expect(mockHandleDeleteReminderList).toHaveBeenCalledWith({
        action: 'delete',
        name: 'List Name',
      });
      expect(result).toEqual(expectedResult);
    });

    test('should return error when lists delete name is missing', async () => {
      const result = await handleToolCall('lists', {
        action: 'delete' as const,
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Input validation failed: Name is required for list deletion',
          },
        ],
        isError: true,
      });
    });

    test('should return error for unknown lists action', async () => {
      const result = await handleToolCall('lists', {
        action: 'unknown',
      } as unknown as ListsToolArgs);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Unknown lists action: unknown',
          },
        ],
        isError: true,
      });
    });
  });

  describe('TOOLS export', () => {
    test('should export TOOLS array', () => {
      expect(TOOLS).toBeDefined();
      expect(Array.isArray(TOOLS)).toBe(true);
      expect(TOOLS.length).toBeGreaterThan(0);
    });

    test('should contain expected tool definitions', () => {
      const toolNames = TOOLS.map((tool) => tool.name);

      expect(toolNames).toContain('reminders');
      expect(toolNames).toContain('lists');
    });
  });
});
