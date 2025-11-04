/**
 * tools/index.ts
 * Exports tool definitions and handler functions
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  CalendarToolArgs,
  ListsToolArgs,
  RemindersToolArgs,
} from '../types/index.js';
import { MESSAGES } from '../utils/constants.js';
import { TOOLS } from './definitions.js';
import {
  handleCreateCalendarEvent,
  handleCreateReminder,
  handleCreateReminderList,
  handleDeleteCalendarEvent,
  handleDeleteReminder,
  handleDeleteReminderList,
  handleReadCalendarEvents,
  handleReadReminderLists,
  handleReadReminders,
  handleUpdateCalendarEvent,
  handleUpdateReminder,
  handleUpdateReminderList,
} from './handlers.js';

/**
 * Routes tool calls to the appropriate handler based on the tool name
 * @param name - Name of the tool to call
 * @param args - Arguments for the tool
 * @returns Result of the tool call
 */
export async function handleToolCall(
  name: string,
  args?: RemindersToolArgs | ListsToolArgs | CalendarToolArgs,
): Promise<CallToolResult> {
  switch (name) {
    case 'reminders': {
      const action = args?.action;
      if (!args) {
        return {
          content: [
            {
              type: 'text',
              text: 'No arguments provided',
            },
          ],
          isError: true,
        };
      }
      switch (action) {
        case 'read':
          return handleReadReminders(args);
        case 'create':
          return handleCreateReminder(args);
        case 'update':
          return handleUpdateReminder(args);
        case 'delete':
          return handleDeleteReminder(args);
        default:
          return {
            content: [
              {
                type: 'text',
                text: MESSAGES.ERROR.UNKNOWN_ACTION(
                  'reminders',
                  String(action),
                ),
              },
            ],
            isError: true,
          };
      }
    }
    case 'lists': {
      const action = args?.action;
      switch (action) {
        case 'read':
          return handleReadReminderLists();
        case 'create':
          return handleCreateReminderList(args as ListsToolArgs);
        case 'update':
          return handleUpdateReminderList(args as ListsToolArgs);
        case 'delete':
          return handleDeleteReminderList(args as ListsToolArgs);
        default:
          return {
            content: [
              {
                type: 'text',
                text: MESSAGES.ERROR.UNKNOWN_ACTION('lists', String(action)),
              },
            ],
            isError: true,
          };
      }
    }
    case 'calendar': {
      const action = args?.action;
      if (!args) {
        return {
          content: [
            {
              type: 'text',
              text: 'No arguments provided',
            },
          ],
          isError: true,
        };
      }
      switch (action) {
        case 'read':
          return handleReadCalendarEvents(args as CalendarToolArgs);
        case 'create':
          return handleCreateCalendarEvent(args as CalendarToolArgs);
        case 'update':
          return handleUpdateCalendarEvent(args as CalendarToolArgs);
        case 'delete':
          return handleDeleteCalendarEvent(args as CalendarToolArgs);
        default:
          return {
            content: [
              {
                type: 'text',
                text: MESSAGES.ERROR.UNKNOWN_ACTION('calendar', String(action)),
              },
            ],
            isError: true,
          };
      }
    }
    default:
      return {
        content: [
          {
            type: 'text',
            text: MESSAGES.ERROR.UNKNOWN_TOOL(name),
          },
        ],
        isError: true,
      };
  }
}

export { TOOLS };
