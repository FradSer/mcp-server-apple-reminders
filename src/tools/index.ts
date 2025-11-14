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
} from './handlers/index.js';

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

/**
 * Creates an error response with the given message
 */
function createErrorResponse(message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
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
        return createErrorResponse('No arguments provided');
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
          return createErrorResponse(
            MESSAGES.ERROR.UNKNOWN_ACTION('reminders.tasks', String(action)),
          );
      }
    }
    case 'reminders.lists': {
      if (!args) {
        return createErrorResponse('No arguments provided');
      }
      const action = args.action;
      // Type narrowing: at this point args must be ListsToolArgs
      const listsArgs = args as ListsToolArgs;
      switch (action) {
        case 'read':
          return handleReadReminderLists();
        case 'create':
          return handleCreateReminderList(listsArgs);
        case 'update':
          return handleUpdateReminderList(listsArgs);
        case 'delete':
          return handleDeleteReminderList(listsArgs);
        default:
          return createErrorResponse(
            MESSAGES.ERROR.UNKNOWN_ACTION('reminders.lists', String(action)),
          );
      }
    }
    case 'calendar.events': {
      if (!args) {
        return createErrorResponse('No arguments provided');
      }
      const action = args.action;
      // Type narrowing: at this point args must be CalendarToolArgs
      const calendarArgs = args as CalendarToolArgs;
      switch (action) {
        case 'read':
          return handleReadCalendarEvents(calendarArgs);
        case 'create':
          return handleCreateCalendarEvent(calendarArgs);
        case 'update':
          return handleUpdateCalendarEvent(calendarArgs);
        case 'delete':
          return handleDeleteCalendarEvent(calendarArgs);
        default:
          return createErrorResponse(
            MESSAGES.ERROR.UNKNOWN_ACTION('calendar.events', String(action)),
          );
      }
    }
    case 'calendar.calendars': {
      // Type narrowing: at this point args must be CalendarsToolArgs or undefined
      const calendarsArgs = args as CalendarsToolArgs | undefined;
      return handleReadCalendars(calendarsArgs);
    }
    default:
      return createErrorResponse(MESSAGES.ERROR.UNKNOWN_TOOL(name));
  }
}

export { TOOLS };
