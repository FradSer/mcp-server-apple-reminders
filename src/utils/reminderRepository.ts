/**
 * reminderRepository.ts
 * Repository pattern implementation for reminder data access operations using RemindersCLI.
 */

import type { Reminder, ReminderList } from '../types/index.js';
import { executeCli } from './cliExecutor.js';
import type { ReminderFilters } from './dateFiltering.js';
import { applyReminderFilters } from './dateFiltering.js';

// Types matching the JSON output from RemindersCLI
interface ReminderJSON {
  id: string;
  title: string;
  isCompleted: boolean;
  list: string;
  notes: string | null;
  url: string | null;
  dueDate: string | null;
}

interface ListJSON {
  id: string;
  title: string;
}

interface ReadResult {
  lists: ListJSON[];
  reminders: ReminderJSON[];
}

// Data interfaces for repository methods
export interface CreateReminderData {
  title: string;
  list?: string;
  notes?: string;
  url?: string;
  dueDate?: string;
}

export interface UpdateReminderData {
  id: string;
  newTitle?: string;
  list?: string;
  notes?: string;
  url?: string;
  isCompleted?: boolean;
  dueDate?: string;
}

export class ReminderRepository {
  private async readAll(): Promise<ReadResult> {
    return executeCli<ReadResult>([
      '--action',
      'read',
      '--showCompleted',
      'true',
    ]);
  }

  async findReminderById(id: string): Promise<Reminder> {
    const { reminders } = await this.readAll();
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) {
      throw new Error(`Reminder with ID '${id}' not found.`);
    }
    return {
      ...reminder,
      notes: reminder.notes ?? undefined,
      url: reminder.url ?? undefined,
      dueDate: reminder.dueDate ?? undefined,
    };
  }

  async findReminders(filters: ReminderFilters = {}): Promise<Reminder[]> {
    const { reminders } = await this.readAll();
    const mappedReminders: Reminder[] = reminders.map((r) => ({
      ...r,
      notes: r.notes ?? undefined,
      url: r.url ?? undefined,
      dueDate: r.dueDate ?? undefined,
    }));
    return applyReminderFilters(mappedReminders, filters);
  }

  async findAllLists(): Promise<ReminderList[]> {
    const { lists } = await this.readAll();
    return lists;
  }

  async createReminder(data: CreateReminderData): Promise<ReminderJSON> {
    const args = ['--action', 'create', '--title', data.title];
    if (data.list) args.push('--targetList', data.list);
    if (data.notes) args.push('--note', data.notes);
    if (data.url) args.push('--url', data.url);
    if (data.dueDate) args.push('--dueDate', data.dueDate);

    return executeCli<ReminderJSON>(args);
  }

  async updateReminder(data: UpdateReminderData): Promise<ReminderJSON> {
    const args = ['--action', 'update', '--id', data.id];
    if (data.newTitle) args.push('--title', data.newTitle);
    if (data.list) args.push('--targetList', data.list);
    if (data.notes) args.push('--note', data.notes);
    if (data.url) args.push('--url', data.url);
    if (data.dueDate) args.push('--dueDate', data.dueDate);
    if (data.isCompleted !== undefined) {
      args.push('--isCompleted', String(data.isCompleted));
    }

    return executeCli<ReminderJSON>(args);
  }

  async deleteReminder(id: string): Promise<void> {
    await executeCli<unknown>(['--action', 'delete', '--id', id]);
  }

  async createReminderList(name: string): Promise<ListJSON> {
    return executeCli<ListJSON>(['--action', 'create-list', '--name', name]);
  }

  async updateReminderList(
    currentName: string,
    newName: string,
  ): Promise<ListJSON> {
    return executeCli<ListJSON>([
      '--action',
      'update-list',
      '--name',
      currentName,
      '--newName',
      newName,
    ]);
  }

  async deleteReminderList(name: string): Promise<void> {
    await executeCli<unknown>(['--action', 'delete-list', '--name', name]);
  }
}

export const reminderRepository = new ReminderRepository();
