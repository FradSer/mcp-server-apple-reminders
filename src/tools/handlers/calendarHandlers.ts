/**
 * handlers/calendarHandlers.ts
 * Handlers for calendar event operations
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { CalendarsToolArgs, CalendarToolArgs } from '../../types/index.js';
import { calendarRepository } from '../../utils/calendarRepository.js';
import { handleAsyncOperation } from '../../utils/errorHandling.js';
import { formatMultilineNotes } from '../../utils/helpers.js';
import {
  CreateCalendarEventSchema,
  DeleteCalendarEventSchema,
  ReadCalendarEventsSchema,
  ReadCalendarsSchema,
  UpdateCalendarEventSchema,
} from '../../validation/schemas.js';
import {
  extractAndValidateArgs,
  formatDeleteMessage,
  formatListMarkdown,
  formatSuccessMessage,
} from './shared.js';

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
    lines.push(`  - Notes: ${formatMultilineNotes(event.notes)}`);
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
    return formatSuccessMessage('created', 'event', event.title, event.id);
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
    return formatSuccessMessage('updated', 'event', event.title, event.id);
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
    return formatDeleteMessage('event', validatedArgs.id, {
      useQuotes: true,
      useIdPrefix: true,
      usePeriod: true,
      useColon: false,
    });
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

    return formatListMarkdown(
      'Calendar Events',
      events,
      formatEventMarkdown,
      'No calendar events found.',
    );
  }, 'read calendar events');
};

export const handleReadCalendars = async (
  args?: CalendarsToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    extractAndValidateArgs(args, ReadCalendarsSchema);
    const calendars = await calendarRepository.findAllCalendars();
    return formatListMarkdown(
      'Calendars',
      calendars,
      (calendar) => [`- ${calendar.title} (ID: ${calendar.id})`],
      'No calendars found.',
    );
  }, 'read calendars');
};
