/**
 * calendarRepository.ts
 * Repository pattern implementation for calendar event data access operations using EventKitCLI.
 */

import type { Calendar, CalendarEvent } from '../types/index.js';
import { executeCli } from './cliExecutor.js';

// Types matching the JSON output from EventKitCLI
interface EventJSON {
  id: string;
  title: string;
  calendar: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  location: string | null;
  url: string | null;
  isAllDay: boolean;
}

interface CalendarJSON {
  id: string;
  title: string;
}

interface EventsReadResult {
  calendars: CalendarJSON[];
  events: EventJSON[];
}

// Data interfaces for repository methods
interface CreateEventData {
  title: string;
  startDate: string;
  endDate: string;
  calendar?: string;
  notes?: string;
  location?: string;
  url?: string;
  isAllDay?: boolean;
}

interface UpdateEventData {
  id: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  calendar?: string;
  notes?: string;
  location?: string;
  url?: string;
  isAllDay?: boolean;
}

class CalendarRepository {
  private async readEvents(
    startDate?: string,
    endDate?: string,
    calendarName?: string,
    search?: string,
  ): Promise<EventsReadResult> {
    const args = ['--action', 'read-events'];
    if (startDate) args.push('--startDate', startDate);
    if (endDate) args.push('--endDate', endDate);
    if (calendarName) args.push('--filterCalendar', calendarName);
    if (search) args.push('--search', search);

    return executeCli<EventsReadResult>(args);
  }

  async findEventById(id: string): Promise<CalendarEvent> {
    const { events } = await this.readEvents();
    const event = events.find((e) => e.id === id);
    if (!event) {
      throw new Error(`Event with ID '${id}' not found.`);
    }
    return {
      ...event,
      notes: event.notes ?? undefined,
      location: event.location ?? undefined,
      url: event.url ?? undefined,
    };
  }

  async findEvents(
    filters: {
      startDate?: string;
      endDate?: string;
      calendarName?: string;
      search?: string;
    } = {},
  ): Promise<CalendarEvent[]> {
    const { events } = await this.readEvents(
      filters.startDate,
      filters.endDate,
      filters.calendarName,
      filters.search,
    );
    return events.map((e) => ({
      ...e,
      notes: e.notes ?? undefined,
      location: e.location ?? undefined,
      url: e.url ?? undefined,
    }));
  }

  async findAllCalendars(): Promise<Calendar[]> {
    return executeCli<CalendarJSON[]>(['--action', 'read-calendars']);
  }

  async createEvent(data: CreateEventData): Promise<EventJSON> {
    const args = [
      '--action',
      'create-event',
      '--title',
      data.title,
      '--startDate',
      data.startDate,
      '--endDate',
      data.endDate,
    ];
    if (data.calendar) args.push('--targetCalendar', data.calendar);
    if (data.notes) args.push('--note', data.notes);
    if (data.location) args.push('--location', data.location);
    if (data.url) args.push('--url', data.url);
    if (data.isAllDay !== undefined) {
      args.push('--isAllDay', String(data.isAllDay));
    }

    return executeCli<EventJSON>(args);
  }

  async updateEvent(data: UpdateEventData): Promise<EventJSON> {
    const args = ['--action', 'update-event', '--id', data.id];
    if (data.title) args.push('--title', data.title);
    if (data.calendar) args.push('--targetCalendar', data.calendar);
    if (data.startDate) args.push('--startDate', data.startDate);
    if (data.endDate) args.push('--endDate', data.endDate);
    if (data.notes) args.push('--note', data.notes);
    if (data.location) args.push('--location', data.location);
    if (data.url) args.push('--url', data.url);
    if (data.isAllDay !== undefined) {
      args.push('--isAllDay', String(data.isAllDay));
    }

    return executeCli<EventJSON>(args);
  }

  async deleteEvent(id: string): Promise<void> {
    await executeCli<unknown>(['--action', 'delete-event', '--id', id]);
  }
}

export const calendarRepository = new CalendarRepository();
