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
    describe('reminders tool routing', () => {
      it.each([
        [
          'read',
          mockHandleReadReminders,
          { action: 'read' as const, id: '123' },
        ],
        [
          'create',
          mockHandleCreateReminder,
          { action: 'create' as const, title: 'Test reminder' },
        ],
        [
          'update',
          mockHandleUpdateReminder,
          {
            action: 'update' as const,
            title: 'Old title',
            newTitle: 'New title',
          },
        ],
        [
          'delete',
          mockHandleDeleteReminder,
          { action: 'delete' as const, title: 'Delete me' },
        ],
      ])(
        'should route reminders action=%s correctly',
        async (_action, mockHandler, args) => {
          const expectedResult: CallToolResult = {
            content: [{ type: 'text', text: 'Success' }],
            isError: false,
          };

          mockHandler.mockResolvedValue(expectedResult);

          const result = await handleToolCall('reminders', args);

          expect(mockHandler).toHaveBeenCalledWith(args);
          expect(result).toEqual(expectedResult);
        },
      );
    });

    describe('error handling', () => {
      it('should return error for unknown tool and not call handlers', async () => {
        const result = await handleToolCall(
          'unknown_tool',
          {} as RemindersToolArgs,
        );

        expect(result).toEqual({
          content: [{ type: 'text', text: 'Unknown tool: unknown_tool' }],
          isError: true,
        });
        expect(mockHandleCreateReminder).not.toHaveBeenCalled();
        expect(mockHandleReadReminders).not.toHaveBeenCalled();
        expect(mockHandleReadReminderLists).not.toHaveBeenCalled();
        expect(mockHandleUpdateReminder).not.toHaveBeenCalled();
        expect(mockHandleDeleteReminder).not.toHaveBeenCalled();
      });

      it('should return error for empty tool name', async () => {
        const result = await handleToolCall('', {} as RemindersToolArgs);

        expect(result).toEqual({
          content: [{ type: 'text', text: 'Unknown tool: ' }],
          isError: true,
        });
      });

      it('should return error for unknown lists action', async () => {
        const result = await handleToolCall('lists', {
          action: 'unknown',
        } as unknown as ListsToolArgs);

        expect(result).toEqual({
          content: [{ type: 'text', text: 'Unknown lists action: unknown' }],
          isError: true,
        });
      });

      it('should propagate handler errors', async () => {
        const error = new Error('Handler failed');
        mockHandleCreateReminder.mockRejectedValue(error);

        await expect(
          handleToolCall('reminders', { action: 'create' as const }),
        ).rejects.toThrow('Handler failed');
      });

      it('should handle complex arguments', async () => {
        const complexArgs = {
          action: 'create' as const,
          title: 'Complex reminder',
          dueDate: '2024-12-25 18:00:00',
          list: 'Work Tasks',
          note: 'Complex note',
          url: 'https://example.com/task',
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

    describe('reminders tool error handling', () => {
      it.each([
        [undefined, 'No arguments provided'],
        [{ action: undefined }, 'Unknown reminders action: undefined'],
        [{ action: 'unknown' }, 'Unknown reminders action: unknown'],
      ])(
        'should return error for invalid reminders args',
        async (args, expectedText) => {
          const result = await handleToolCall(
            'reminders',
            args as unknown as RemindersToolArgs,
          );

          expect(result).toEqual({
            content: [{ type: 'text', text: expectedText }],
            isError: true,
          });
        },
      );
    });

    describe('lists tool routing', () => {
      it.each([
        [
          'read',
          mockHandleReadReminderLists,
          { action: 'read' as const },
          undefined,
        ],
        [
          'create',
          mockHandleCreateReminderList,
          { action: 'create' as const, name: 'New List' },
          { action: 'create', name: 'New List' },
        ],
        [
          'update',
          mockHandleUpdateReminderList,
          { action: 'update' as const, name: 'Old Name', newName: 'New Name' },
          { action: 'update', name: 'Old Name', newName: 'New Name' },
        ],
        [
          'delete',
          mockHandleDeleteReminderList,
          { action: 'delete' as const, name: 'List Name' },
          { action: 'delete', name: 'List Name' },
        ],
      ])(
        'should route lists action=%s correctly',
        async (_action, mockHandler, args, expectedCallArgs) => {
          const expectedResult: CallToolResult = {
            content: [{ type: 'text', text: 'Success' }],
            isError: false,
          };

          mockHandler.mockResolvedValue(expectedResult);

          const result = await handleToolCall('lists', args as ListsToolArgs);

          if (expectedCallArgs) {
            expect(mockHandler).toHaveBeenCalledWith(expectedCallArgs);
          } else {
            expect(mockHandler).toHaveBeenCalled();
          }
          expect(result).toEqual(expectedResult);
        },
      );
    });

    describe('lists tool validation errors', () => {
      it.each([
        [
          'create',
          mockHandleCreateReminderList,
          { action: 'create' as const },
          'name',
        ],
        [
          'update',
          mockHandleUpdateReminderList,
          { action: 'update' as const, newName: 'New Name' },
          'name',
        ],
        [
          'update',
          mockHandleUpdateReminderList,
          { action: 'update' as const, name: 'Old Name' },
          'newName',
        ],
        [
          'delete',
          mockHandleDeleteReminderList,
          { action: 'delete' as const },
          'name',
        ],
      ])(
        'should return validation error when lists %s field is missing',
        async (_action, mockHandler, args, missingField) => {
          mockHandler.mockResolvedValue({
            content: [
              {
                type: 'text',
                text: `Input validation failed: ${missingField}: List name cannot be empty`,
              },
            ],
            isError: true,
          });

          const result = await handleToolCall('lists', args as ListsToolArgs);

          expect(result.isError).toBe(true);
          expect(result.content[0]?.type).toBe('text');
          expect(String(result.content[0]?.text)).toContain(
            'Input validation failed',
          );
          expect(String(result.content[0]?.text)).toContain(missingField);
        },
      );
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
    it('should export TOOLS array with expected tools', () => {
      expect(TOOLS).toBeDefined();
      expect(Array.isArray(TOOLS)).toBe(true);
      expect(TOOLS.length).toBeGreaterThan(0);

      const toolNames = TOOLS.map((tool) => tool.name);
      expect(toolNames).toContain('reminders');
      expect(toolNames).toContain('lists');
    });
  });
});
