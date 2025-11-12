/**
 * tools/handlers.ts
 * Implementation of tool handlers for Apple Reminders operations using the repository pattern.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ZodSchema } from 'zod/v3';
import type {
  CalendarsToolArgs,
  CalendarToolArgs,
  ListsToolArgs,
  RemindersToolArgs,
} from '../types/index.js';
import { calendarRepository } from '../utils/calendarRepository.js';
import { handleAsyncOperation } from '../utils/errorHandling.js';
// Permission checking is now handled in Swift layer (EventKitCLI.swift)
// This layer trusts Swift layer's permission handling
import { reminderRepository } from '../utils/reminderRepository.js';
import {
  CreateCalendarEventSchema,
  CreateReminderListSchema,
  CreateReminderSchema,
  DeleteCalendarEventSchema,
  DeleteReminderListSchema,
  DeleteReminderSchema,
  ReadCalendarEventsSchema,
  ReadCalendarsSchema,
  ReadRemindersSchema,
  UpdateCalendarEventSchema,
  UpdateReminderListSchema,
  UpdateReminderSchema,
  validateInput,
} from '../validation/schemas.js';

const extractAndValidateArgs = <T>(
  args:
    | RemindersToolArgs
    | ListsToolArgs
    | CalendarToolArgs
    | CalendarsToolArgs
    | undefined,
  schema: ZodSchema<T>,
): T => {
  const { action: _, ...rest } = args ?? {};
  return validateInput(schema, rest);
};

/**
 * Formats a reminder as a markdown list item
 */
const formatReminderMarkdown = (reminder: {
  title: string;
  isCompleted: boolean;
  list?: string;
  id?: string;
  notes?: string;
  dueDate?: string;
  url?: string;
}): string[] => {
  const lines: string[] = [];
  const checkbox = reminder.isCompleted ? '[x]' : '[ ]';
  lines.push(`- ${checkbox} ${reminder.title}`);
  if (reminder.list) lines.push(`  - List: ${reminder.list}`);
  if (reminder.id) lines.push(`  - ID: ${reminder.id}`);
  if (reminder.notes)
    lines.push(`  - Notes: ${reminder.notes.replace(/\n/g, '\n    ')}`);
  if (reminder.dueDate) lines.push(`  - Due: ${reminder.dueDate}`);
  if (reminder.url) lines.push(`  - URL: ${reminder.url}`);
  return lines;
};

// --- Reminder Handlers ---

/**
 * Permission checking is now handled in Swift layer (EventKitCLI.swift)
 * Swift layer uses EKEventStore.authorizationStatus() to check permission status
 * before operations, following EventKit best practices.
 *
 * TypeScript layer trusts Swift layer's permission handling and does not
 * duplicate permission checks here.
 */

export const handleCreateReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, CreateReminderSchema);
    const reminder = await reminderRepository.createReminder({
      title: validatedArgs.title,
      notes: validatedArgs.note,
      url: validatedArgs.url,
      list: validatedArgs.targetList,
      dueDate: validatedArgs.dueDate,
    });
    return `Successfully created reminder "${reminder.title}".\n- ID: ${reminder.id}`;
  }, 'create reminder');
};

export const handleUpdateReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, UpdateReminderSchema);
    const reminder = await reminderRepository.updateReminder({
      id: validatedArgs.id,
      newTitle: validatedArgs.title,
      notes: validatedArgs.note,
      url: validatedArgs.url,
      isCompleted: validatedArgs.completed,
      list: validatedArgs.targetList,
      dueDate: validatedArgs.dueDate,
    });
    return `Successfully updated reminder "${reminder.title}".\n- ID: ${reminder.id}`;
  }, 'update reminder');
};

export const handleDeleteReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, DeleteReminderSchema);
    await reminderRepository.deleteReminder(validatedArgs.id);
    return `Successfully deleted reminder with ID: ${validatedArgs.id}`;
  }, 'delete reminder');
};

export const handleReadReminders = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, ReadRemindersSchema);

    // Check if id is provided in args (before validation)
    // because id might be filtered out by schema validation if it's optional
    if (args.id) {
      const reminder = await reminderRepository.findReminderById(args.id);
      const markdownLines: string[] = [
        '### Reminder',
        '',
        ...formatReminderMarkdown(reminder),
      ];
      return markdownLines.join('\n');
    }

    // Otherwise, return all matching reminders
    const reminders = await reminderRepository.findReminders({
      list: validatedArgs.filterList,
      showCompleted: validatedArgs.showCompleted,
      search: validatedArgs.search,
      dueWithin: validatedArgs.dueWithin,
    });

    const markdownLines: string[] = [
      `### Reminders (Total: ${reminders.length})`,
      '',
    ];

    if (reminders.length === 0) {
      markdownLines.push('No reminders found matching the criteria.');
    } else {
      reminders.forEach((r) => {
        markdownLines.push(...formatReminderMarkdown(r));
      });
    }

    return markdownLines.join('\n');
  }, 'read reminders');
};

// --- List Handlers ---

export const handleReadReminderLists = async (): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const lists = await reminderRepository.findAllLists();
    const markdownLines: string[] = [];
    markdownLines.push(`### Reminder Lists (Total: ${lists.length})`);
    markdownLines.push('');

    if (lists.length === 0) {
      markdownLines.push('No reminder lists found.');
    } else {
      lists.forEach((l) => {
        markdownLines.push(`- ${l.title} (ID: ${l.id})`);
      });
    }

    return markdownLines.join('\n');
  }, 'read reminder lists');
};

export const handleCreateReminderList = async (
  args: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(
      args,
      CreateReminderListSchema,
    );
    const list = await reminderRepository.createReminderList(
      validatedArgs.name,
    );
    return `Successfully created list "${list.title}".\n- ID: ${list.id}`;
  }, 'create reminder list');
};

export const handleUpdateReminderList = async (
  args: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(
      args,
      UpdateReminderListSchema,
    );
    const list = await reminderRepository.updateReminderList(
      validatedArgs.name,
      validatedArgs.newName,
    );
    return `Successfully updated list to "${list.title}".\n- ID: ${list.id}`;
  }, 'update reminder list');
};

export const handleDeleteReminderList = async (
  args: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(
      args,
      DeleteReminderListSchema,
    );
    await reminderRepository.deleteReminderList(validatedArgs.name);
    return `Successfully deleted list "${validatedArgs.name}".`;
  }, 'delete reminder list');
};

// --- Calendar Event Handlers ---

/**
 * Formats a calendar event as a markdown list item
 */
const formatEventMarkdown = (event: {
  title: string;
  calendar?: string;
  id?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  location?: string;
  url?: string;
  isAllDay?: boolean;
}): string[] => {
  const lines: string[] = [];
  lines.push(`- ${event.title}`);
  if (event.calendar) lines.push(`  - Calendar: ${event.calendar}`);
  if (event.id) lines.push(`  - ID: ${event.id}`);
  if (event.startDate) lines.push(`  - Start: ${event.startDate}`);
  if (event.endDate) lines.push(`  - End: ${event.endDate}`);
  if (event.isAllDay) lines.push(`  - All Day: ${event.isAllDay}`);
  if (event.location) lines.push(`  - Location: ${event.location}`);
  if (event.notes)
    lines.push(`  - Notes: ${event.notes.replace(/\n/g, '\n    ')}`);
  if (event.url) lines.push(`  - URL: ${event.url}`);
  return lines;
};

export const handleCreateCalendarEvent = async (
  args: CalendarToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(
      args,
      CreateCalendarEventSchema,
    );
    const event = await calendarRepository.createEvent({
      title: validatedArgs.title,
      startDate: validatedArgs.startDate,
      endDate: validatedArgs.endDate,
      calendar: validatedArgs.targetCalendar,
      notes: validatedArgs.note,
      location: validatedArgs.location,
      url: validatedArgs.url,
      isAllDay: validatedArgs.isAllDay,
    });
    return `Successfully created event "${event.title}".\n- ID: ${event.id}`;
  }, 'create calendar event');
};

export const handleUpdateCalendarEvent = async (
  args: CalendarToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(
      args,
      UpdateCalendarEventSchema,
    );
    const event = await calendarRepository.updateEvent({
      id: validatedArgs.id,
      title: validatedArgs.title,
      startDate: validatedArgs.startDate,
      endDate: validatedArgs.endDate,
      calendar: validatedArgs.targetCalendar,
      notes: validatedArgs.note,
      location: validatedArgs.location,
      url: validatedArgs.url,
      isAllDay: validatedArgs.isAllDay,
    });
    return `Successfully updated event "${event.title}".\n- ID: ${event.id}`;
  }, 'update calendar event');
};

export const handleDeleteCalendarEvent = async (
  args: CalendarToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(
      args,
      DeleteCalendarEventSchema,
    );
    await calendarRepository.deleteEvent(validatedArgs.id);
    return `Successfully deleted event with ID "${validatedArgs.id}".`;
  }, 'delete calendar event');
};

export const handleReadCalendarEvents = async (
  args: CalendarToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(
      args,
      ReadCalendarEventsSchema,
    );

    if (validatedArgs.id) {
      const event = await calendarRepository.findEventById(validatedArgs.id);
      return formatEventMarkdown(event).join('\n');
    }

    const events = await calendarRepository.findEvents({
      startDate: validatedArgs.startDate,
      endDate: validatedArgs.endDate,
      calendarName: validatedArgs.filterCalendar,
      search: validatedArgs.search,
    });

    const markdownLines: string[] = [];
    markdownLines.push(`### Calendar Events (Total: ${events.length})`);
    markdownLines.push('');

    if (events.length === 0) {
      markdownLines.push('No calendar events found.');
    } else {
      events.forEach((e) => {
        markdownLines.push(...formatEventMarkdown(e));
      });
    }

    return markdownLines.join('\n');
  }, 'read calendar events');
};

export const handleReadCalendars = async (
  args?: CalendarsToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    extractAndValidateArgs(args, ReadCalendarsSchema);
    const calendars = await calendarRepository.findAllCalendars();
    const markdownLines: string[] = [];
    markdownLines.push(`### Calendars (Total: ${calendars.length})`);
    markdownLines.push('');

    if (calendars.length === 0) {
      markdownLines.push('No calendars found.');
    } else {
      calendars.forEach((c) => {
        markdownLines.push(`- ${c.title} (ID: ${c.id})`);
      });
    }

    return markdownLines.join('\n');
  }, 'read calendars');
};
