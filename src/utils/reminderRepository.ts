/**
 * reminderRepository.ts
 * Repository pattern implementation for reminder data access operations using EventKitCLI.
 */

import type { Reminder, ReminderList } from '../types/index.js';
import type {
  CreateReminderData,
  ListJSON,
  ReminderJSON,
  ReminderReadResult,
  UpdateReminderData,
} from '../types/repository.js';
import { executeCli } from './cliExecutor.js';
import type { ReminderFilters } from './dateFiltering.js';
import { applyReminderFilters } from './dateFiltering.js';
import {
  addOptionalArg,
  addOptionalBooleanArg,
  nullToUndefined,
} from './helpers.js';
import { normalizeDueDateString } from './timeHelpers.js';

class ReminderRepository {
  private mapReminder(reminder: ReminderJSON): Reminder {
    const normalizedDueDate = normalizeDueDateString(reminder.dueDate);
    const formattedDueDate = normalizedDueDate ?? reminder.dueDate ?? undefined;

    const normalizedReminder = nullToUndefined(reminder, [
      'notes',
      'url',
      'dueDate',
    ]) as Reminder;

    if (formattedDueDate) {
      normalizedReminder.dueDate = formattedDueDate;
    } else {
      delete normalizedReminder.dueDate;
    }

    return normalizedReminder;
  }

  private mapReminders(reminders: ReminderJSON[]): Reminder[] {
    return reminders.map((reminder) => this.mapReminder(reminder));
  }

  private async readAll(): Promise<ReminderReadResult> {
    return executeCli<ReminderReadResult>([
      '--action',
      'read',
      '--showCompleted',
      'true',
    ]);
  }

  async findReminderById(id: string): Promise<Reminder> {
    const { reminders } = await this.readAll();
    const reminder = this.mapReminders(reminders).find((r) => r.id === id);
    if (!reminder) {
      throw new Error(`Reminder with ID '${id}' not found.`);
    }
    return reminder;
  }

  async findReminders(filters: ReminderFilters = {}): Promise<Reminder[]> {
    const { reminders } = await this.readAll();
    const normalizedReminders = this.mapReminders(reminders);
    return applyReminderFilters(normalizedReminders, filters);
  }

  async findAllLists(): Promise<ReminderList[]> {
    const { lists } = await this.readAll();
    return lists;
  }

  async createReminder(data: CreateReminderData): Promise<ReminderJSON> {
    const args = ['--action', 'create', '--title', data.title];
    addOptionalArg(args, '--targetList', data.list);
    addOptionalArg(args, '--note', data.notes);
    addOptionalArg(args, '--url', data.url);
    addOptionalArg(args, '--dueDate', data.dueDate);

    return executeCli<ReminderJSON>(args);
  }

  async updateReminder(data: UpdateReminderData): Promise<ReminderJSON> {
    const args = ['--action', 'update', '--id', data.id];
    addOptionalArg(args, '--title', data.newTitle);
    addOptionalArg(args, '--targetList', data.list);
    addOptionalArg(args, '--note', data.notes);
    addOptionalArg(args, '--url', data.url);
    addOptionalArg(args, '--dueDate', data.dueDate);
    addOptionalBooleanArg(args, '--isCompleted', data.isCompleted);

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
