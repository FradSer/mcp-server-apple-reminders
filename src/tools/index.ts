/**
 * tools/index.ts
 * Exports tool definitions and handler functions
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  CalendarsToolArgs,
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
  handleReadCalendars,
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
const TOOL_ALIASES: Record<string, string> = {
  reminders_tasks: 'reminders.tasks',
  reminders_lists: 'reminders.lists',
  calendar_events: 'calendar.events',
  calendar_calendars: 'calendar.calendars',
};

function normalizeToolName(name: string): string {
  return TOOL_ALIASES[name] ?? name;
}

export async function handleToolCall(
  name: string,
  args?:
    | RemindersToolArgs
    | ListsToolArgs
    | CalendarToolArgs
    | CalendarsToolArgs,
): Promise<CallToolResult> {
  const normalizedName = normalizeToolName(name);

  switch (normalizedName) {
    case 'reminders.tasks': {
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
                  'reminders.tasks',
                  String(action),
                ),
              },
            ],
            isError: true,
          };
      }
    }
    case 'reminders.lists': {
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
                text: MESSAGES.ERROR.UNKNOWN_ACTION(
                  'reminders.lists',
                  String(action),
                ),
              },
            ],
            isError: true,
          };
      }
    }
    case 'calendar.events': {
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
                text: MESSAGES.ERROR.UNKNOWN_ACTION(
                  'calendar.events',
                  String(action),
                ),
              },
            ],
            isError: true,
          };
      }
    }
    case 'calendar.calendars':
      return handleReadCalendars(args as CalendarsToolArgs | undefined);
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
