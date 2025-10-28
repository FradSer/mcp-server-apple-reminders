// Use global Jest functions to avoid extra dependencies

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { handleToolCall, TOOLS } from './index.js';

// Mock all handler functions
jest.mock('./handlers.js', () => ({
  handleCreateReminder: jest.fn(),
  handleReadReminderLists: jest.fn(),
  handleReadReminders: jest.fn(),
  handleUpdateReminder: jest.fn(),
  handleDeleteReminder: jest.fn(),
  handleMoveReminder: jest.fn(),
  handleCreateReminderList: jest.fn(),
}));

jest.mock('./definitions.js', () => ({
  TOOLS: [
    { name: 'reminders', description: 'Unified reminders tool' },
    { name: 'lists', description: 'Reminder lists tool' },
  ],
}));

jest.mock('../utils/logger.js');

import {
  handleCreateReminder,
  handleCreateReminderList,
  handleDeleteReminder,
  handleMoveReminder,
  handleReadReminderLists,
  handleReadReminders,
  handleUpdateReminder,
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
const mockHandleMoveReminder = handleMoveReminder as jest.MockedFunction<
  typeof handleMoveReminder
>;
const _mockHandleCreateReminderList =
  handleCreateReminderList as jest.MockedFunction<
    typeof handleCreateReminderList
  >;

describe('Tools Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleToolCall', () => {
    test('should route reminders action=create to handleCreateReminder', async () => {
      const args = { action: 'create', title: 'Test reminder' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Success' }],
        isError: false,
      };

      mockHandleCreateReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('reminders', args);

      expect(mockHandleCreateReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should route reminders action=list to handleListReminders', async () => {
      const args = { action: 'list', list: 'Work' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Reminders list' }],
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

      const result = await handleToolCall('lists', { action: 'read' });

      expect(mockHandleReadReminderLists).toHaveBeenCalledWith({
        action: 'read',
      });
      expect(result).toEqual(expectedResult);
    });

    test('should route reminders action=update to handleUpdateReminder', async () => {
      const args = {
        action: 'update',
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
      const args = { action: 'delete', title: 'Delete me' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Deleted' }],
        isError: false,
      };

      mockHandleDeleteReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('reminders', args);

      expect(mockHandleDeleteReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should route reminders action=move to handleMoveReminder', async () => {
      const args = {
        action: 'move',
        title: 'Move me',
        fromList: 'A',
        toList: 'B',
      };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Moved' }],
        isError: false,
      };

      mockHandleMoveReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('reminders', args);

      expect(mockHandleMoveReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should return error for unknown tool', async () => {
      const result = await handleToolCall('unknown_tool', {});

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
      expect(mockHandleMoveReminder).not.toHaveBeenCalled();
    });

    test('should handle empty tool name', async () => {
      const result = await handleToolCall('', {});

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
      await handleToolCall(
        'reminders',
        null as RemindersToolArgs | ListsToolArgs,
      );
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
        handleToolCall('reminders', { action: 'create' }),
      ).rejects.toThrow('Handler failed');
    });

    test('should handle handlers returning different result types', async () => {
      const testCases = [
        {
          tool: 'reminders',
          args: { action: 'create' },
          handler: mockHandleCreateReminder,
          result: {
            content: [{ type: 'text' as const, text: 'Created' }],
            isError: false,
          },
        },
        {
          tool: 'reminders',
          args: { action: 'list' },
          handler: mockHandleReadReminders,
          result: {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({ reminders: [] }),
              },
            ],
            isError: false,
          },
        },
        {
          tool: 'reminders',
          args: { action: 'update' },
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
        action: 'create',
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
