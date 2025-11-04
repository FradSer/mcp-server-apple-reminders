// Use global Jest functions to avoid extra dependencies

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  CalendarToolArgs,
  ListsToolArgs,
  RemindersToolArgs,
} from '../types/index.js';
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
  handleCreateCalendarEvent: jest.fn(),
  handleReadCalendarEvents: jest.fn(),
  handleUpdateCalendarEvent: jest.fn(),
  handleDeleteCalendarEvent: jest.fn(),
  handlePermissionStatus: jest.fn(),
  handlePermissionRequest: jest.fn(),
}));

jest.mock('./definitions.js', () => ({
  TOOLS: [
    { name: 'reminders', description: 'Unified reminders tool' },
    { name: 'lists', description: 'Reminder lists tool' },
    { name: 'calendar', description: 'Calendar events tool' },
    {
      name: 'permissions',
      description: 'Checks and requests calendar or reminders access',
    },
  ],
}));

import {
  handleCreateCalendarEvent,
  handleCreateReminder,
  handleCreateReminderList,
  handleDeleteCalendarEvent,
  handleDeleteReminder,
  handleDeleteReminderList,
  handlePermissionRequest,
  handlePermissionStatus,
  handleReadCalendarEvents,
  handleReadReminderLists,
  handleReadReminders,
  handleUpdateCalendarEvent,
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
const mockHandleCreateCalendarEvent =
  handleCreateCalendarEvent as jest.MockedFunction<
    typeof handleCreateCalendarEvent
  >;
const mockHandleReadCalendarEvents =
  handleReadCalendarEvents as jest.MockedFunction<
    typeof handleReadCalendarEvents
  >;
const mockHandleUpdateCalendarEvent =
  handleUpdateCalendarEvent as jest.MockedFunction<
    typeof handleUpdateCalendarEvent
  >;
const mockHandleDeleteCalendarEvent =
  handleDeleteCalendarEvent as jest.MockedFunction<
    typeof handleDeleteCalendarEvent
  >;
const mockHandlePermissionStatus =
  handlePermissionStatus as jest.MockedFunction<typeof handlePermissionStatus>;
const mockHandlePermissionRequest =
  handlePermissionRequest as jest.MockedFunction<
    typeof handlePermissionRequest
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
      expect(toolNames).toContain('calendar');
      expect(toolNames).toContain('permissions');
    });
  });

  describe('permissions tool routing', () => {
    it('should route status action to permission status handler', async () => {
      const expected: CallToolResult = {
        content: [{ type: 'text', text: 'Calendar status' }],
        isError: false,
      };
      mockHandlePermissionStatus.mockResolvedValue(expected);

      const args = { action: 'status' as const, target: 'calendar' };
      const result = await handleToolCall('permissions', args);

      expect(mockHandlePermissionStatus).toHaveBeenCalledWith(args);
      expect(result).toEqual(expected);
    });

    it('should route request action to permission request handler', async () => {
      const expected: CallToolResult = {
        content: [{ type: 'text', text: 'Request done' }],
        isError: false,
      };
      mockHandlePermissionRequest.mockResolvedValue(expected);

      const args = { action: 'request' as const, target: 'reminders' };
      const result = await handleToolCall('permissions', args);

      expect(mockHandlePermissionRequest).toHaveBeenCalledWith(args);
      expect(result).toEqual(expected);
    });

    it('should return error for unknown permission action', async () => {
      const result = await handleToolCall('permissions', {
        action: 'invalid',
        target: 'calendar',
      } as unknown as { action: 'status'; target: 'calendar' });

      expect(result).toEqual({
        content: [
          { type: 'text', text: 'Unknown permissions action: invalid' },
        ],
        isError: true,
      });
    });
  });

  describe('calendar tool routing', () => {
    it.each([
      ['read', mockHandleReadCalendarEvents, { action: 'read' as const }],
      [
        'create',
        mockHandleCreateCalendarEvent,
        {
          action: 'create' as const,
          title: 'New Event',
          startDate: '2025-11-04 14:00:00',
          endDate: '2025-11-04 16:00:00',
        },
      ],
      [
        'update',
        mockHandleUpdateCalendarEvent,
        {
          action: 'update' as const,
          id: 'event-123',
          title: 'Updated Event',
        },
      ],
      [
        'delete',
        mockHandleDeleteCalendarEvent,
        { action: 'delete' as const, id: 'event-123' },
      ],
    ])(
      'should route calendar action=%s correctly',
      async (_action, mockHandler, args) => {
        const expectedResult: CallToolResult = {
          content: [{ type: 'text', text: 'Success' }],
          isError: false,
        };

        mockHandler.mockResolvedValue(expectedResult);

        const result = await handleToolCall(
          'calendar',
          args as CalendarToolArgs,
        );

        expect(mockHandler).toHaveBeenCalledWith(args);
        expect(result).toEqual(expectedResult);
      },
    );

    it('should return error for unknown calendar action', async () => {
      const result = await handleToolCall('calendar', {
        action: 'unknown',
      } as unknown as CalendarToolArgs);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Unknown calendar action: unknown',
          },
        ],
        isError: true,
      });
    });

    it('should return error when calendar args are missing', async () => {
      const result = await handleToolCall('calendar', undefined);

      expect(result).toEqual({
        content: [{ type: 'text', text: 'No arguments provided' }],
        isError: true,
      });
    });
  });
});
