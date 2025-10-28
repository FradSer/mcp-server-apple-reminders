/**
 * reminderRepository.ts
 * Repository pattern implementation for reminder data access operations
 */

import type { Reminder, ReminderList } from '../types/index.js';
import {
  ReminderCreationBuilder,
  ReminderDeletionBuilder,
  ReminderListCreationBuilder,
  ReminderListDeletionBuilder,
  ReminderListUpdateBuilder,
  ReminderMoveBuilder,
  ReminderUpdateScriptBuilder,
} from './appleScriptBuilders.js';
import { executeAppleScript } from './applescript.js';
import { applyReminderFilters, type ReminderFilters } from './dateFiltering.js';
import { debugLog } from './logger.js';
import { remindersManager } from './reminders.js';

/**
 * Interface for reminder creation data
 */
export interface CreateReminderData {
  title: string;
  dueDate?: string;
  note?: string;
  url?: string;
  list?: string;
}

/**
 * Interface for reminder update data
 */
export interface UpdateReminderData {
  title: string;
  newTitle?: string;
  dueDate?: string;
  note?: string;
  url?: string;
  completed?: boolean;
  list?: string;
}

/**
 * Interface for reminder move data
 */
export interface MoveReminderData {
  title: string;
  fromList: string;
  toList: string;
}

/**
 * Repository for reminder operations
 */
export class ReminderRepository {
  /**
   * Retrieves all reminders with optional filtering
   */
  async findReminders(filters: ReminderFilters = {}): Promise<Reminder[]> {
    const { reminders } = await remindersManager.getReminders(
      filters.showCompleted,
    );
    return applyReminderFilters(reminders, filters);
  }

  /**
   * Retrieves reminders from a specific list
   */
  async findRemindersByList(
    listName: string,
    filters: ReminderFilters = {},
  ): Promise<Reminder[]> {
    const allFilters: ReminderFilters = { ...filters, list: listName };
    return this.findReminders(allFilters);
  }

  /**
   * Finds a specific reminder by title and optional list
   */
  async findReminderByTitle(
    title: string,
    listName?: string,
  ): Promise<Reminder | null> {
    const reminders = await this.findReminders({ list: listName });
    return reminders.find((reminder) => reminder.title === title) || null;
  }

  /**
   * Creates a new reminder
   */
  async createReminder(data: CreateReminderData): Promise<void> {
    const builder = new ReminderCreationBuilder(data);
    const script = builder.build();

    debugLog('Creating reminder with script:', script);
    executeAppleScript(script);
  }

  /**
   * Updates an existing reminder
   */
  async updateReminder(data: UpdateReminderData): Promise<void> {
    const builder = new ReminderUpdateScriptBuilder(data);
    const script = builder.build();

    debugLog('Updating reminder with script:', script);
    executeAppleScript(script);
  }

  /**
   * Deletes a reminder
   */
  async deleteReminder(title: string, listName?: string): Promise<void> {
    const builder = new ReminderDeletionBuilder({ title, list: listName });
    const script = builder.build();

    debugLog('Deleting reminder with script:', script);
    executeAppleScript(script);
  }

  /**
   * Moves a reminder between lists
   */
  async moveReminder(data: MoveReminderData): Promise<void> {
    const builder = new ReminderMoveBuilder(
      data.title,
      data.fromList,
      data.toList,
    );
    const script = builder.build();

    debugLog('Moving reminder with script:', script);
    executeAppleScript(script);
  }

  /**
   * Gets all reminder lists
   */
  async findAllLists(): Promise<ReminderList[]> {
    const { lists } = await remindersManager.getReminders();
    return lists;
  }

  /**
   * Creates a new reminder list
   */
  async createReminderList(name: string): Promise<void> {
    const builder = new ReminderListCreationBuilder(name);
    const script = builder.build();

    debugLog('Creating reminder list with script:', script);
    executeAppleScript(script);
  }

  /**
   * Updates a reminder list name
   */
  async updateReminderList(
    currentName: string,
    newName: string,
  ): Promise<void> {
    const builder = new ReminderListUpdateBuilder(currentName, newName);
    const script = builder.build();

    debugLog('Updating reminder list with script:', script);
    executeAppleScript(script);
  }

  /**
   * Deletes a reminder list
   */
  async deleteReminderList(name: string): Promise<void> {
    const builder = new ReminderListDeletionBuilder(name);
    const script = builder.build();

    debugLog('Deleting reminder list with script:', script);
    executeAppleScript(script);
  }

  /**
   * Checks if a reminder list exists
   */
  async listExists(name: string): Promise<boolean> {
    const lists = await this.findAllLists();
    return lists.some((list) => list.title === name);
  }

  /**
   * Gets reminder count for a specific list
   */
  async getListReminderCount(
    listName: string,
    includeCompleted = false,
  ): Promise<number> {
    const reminders = await this.findRemindersByList(listName, {
      showCompleted: includeCompleted,
    });
    return reminders.length;
  }

  /**
   * Gets reminders grouped by completion status
   */
  async getRemindersGroupedByStatus(listName?: string): Promise<{
    active: Reminder[];
    completed: Reminder[];
  }> {
    const reminders = await this.findReminders({
      list: listName,
      showCompleted: true,
    });

    return {
      active: reminders.filter((r) => !r.isCompleted),
      completed: reminders.filter((r) => r.isCompleted),
    };
  }
}

/**
 * Singleton instance of the reminder repository
 */
export const reminderRepository = new ReminderRepository();
