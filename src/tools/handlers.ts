/**
 * tools/handlers.ts
 * Implementation of tool handlers for Apple Reminders operations using the repository pattern.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ZodSchema } from 'zod';
import type { ListsToolArgs, RemindersToolArgs } from '../types/index.js';
import { MESSAGES } from '../utils/constants.js';
import {
  ErrorResponseFactory,
  handleAsyncOperation,
  handleJsonAsyncOperation,
} from '../utils/errorHandling.js';
import {
  reminderRepository,
  type UpdateReminderData,
} from '../utils/reminderRepository.js';
import {
  CreateReminderListSchema,
  CreateReminderSchema,
  DeleteReminderListSchema,
  DeleteReminderSchema,
  ReadRemindersSchema,
  UpdateReminderListSchema,
  UpdateReminderSchema,
  validateInput,
} from '../validation/schemas.js';

/**
 * Extracts validated arguments from tool args by removing the action field.
 */
const extractAndValidateArgs = <T>(
  args: RemindersToolArgs | ListsToolArgs | undefined,
  schema: ZodSchema<T>,
): T => {
  const { action: _, ...rest } = args ?? {};
  return validateInput(schema, rest);
};

// --- Reminder Handlers ---

export const handleCreateReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleJsonAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, CreateReminderSchema);
    return reminderRepository.createReminder({
      title: validatedArgs.title,
      notes: validatedArgs.note,
      url: validatedArgs.url,
      list: validatedArgs.targetList,
    });
  }, 'create reminder');
};

export const handleUpdateReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(args, UpdateReminderSchema);

      // Find the reminder by its original title to get the ID
      const reminderToUpdate = await reminderRepository.findReminderByTitle(
        validatedArgs.title,
        validatedArgs.targetList,
      );

      if (!reminderToUpdate) {
        throw new Error(`Reminder "${validatedArgs.title}" not found.`);
      }

      const updateData: UpdateReminderData = {
        id: reminderToUpdate.id,
        newTitle: validatedArgs.newTitle,
        notes: validatedArgs.note,
        url: validatedArgs.url,
        isCompleted: validatedArgs.completed,
        // Note: Moving lists via update is not supported by the CLI in this version,
        // but we pass the list to ensure we update the correct reminder if titles are duplicated across lists.
      };

      await reminderRepository.updateReminder(updateData);
      return MESSAGES.SUCCESS.REMINDER_UPDATED(
        validatedArgs.newTitle ?? validatedArgs.title,
      );
    },
    'update reminder',
    ErrorResponseFactory.createSuccessResponse,
  );
};

export const handleDeleteReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(args, DeleteReminderSchema);

      const reminderToDelete = await reminderRepository.findReminderByTitle(
        validatedArgs.title,
        validatedArgs.filterList,
      );

      if (!reminderToDelete) {
        throw new Error(`Reminder "${validatedArgs.title}" not found.`);
      }

      await reminderRepository.deleteReminder(reminderToDelete.id);
      return MESSAGES.SUCCESS.REMINDER_DELETED(validatedArgs.title);
    },
    'delete reminder',
    ErrorResponseFactory.createSuccessResponse,
  );
};

export const handleReadReminders = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleJsonAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, ReadRemindersSchema);
    const reminders = await reminderRepository.findReminders({
      list: validatedArgs.filterList,
      showCompleted: validatedArgs.showCompleted,
      search: validatedArgs.search,
      dueWithin: validatedArgs.dueWithin,
    });
    return { reminders, total: reminders.length };
  }, 'read reminders');
};

// --- List Handlers ---

export const handleReadReminderLists = async (): Promise<CallToolResult> => {
  return handleJsonAsyncOperation(async () => {
    const lists = await reminderRepository.findAllLists();
    return { lists, total: lists.length };
  }, 'read reminder lists');
};

export const handleCreateReminderList = async (
  args: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleJsonAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, CreateReminderListSchema);
    return reminderRepository.createReminderList(validatedArgs.name);
  }, 'create reminder list');
};

export const handleUpdateReminderList = async (
  args: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleJsonAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, UpdateReminderListSchema);
    return reminderRepository.updateReminderList(
      validatedArgs.name,
      validatedArgs.newName,
    );
  }, 'update reminder list');
};

export const handleDeleteReminderList = async (
  args: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(args, DeleteReminderListSchema);
      await reminderRepository.deleteReminderList(validatedArgs.name);
      return MESSAGES.SUCCESS.LIST_DELETED(validatedArgs.name);
    },
    'delete reminder list',
    ErrorResponseFactory.createSuccessResponse,
  );
};