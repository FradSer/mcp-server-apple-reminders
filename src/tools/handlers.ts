/**
 * tools/handlers.ts
 * Implementation of tool handlers for Apple Reminders operations using the repository pattern.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ZodSchema } from 'zod/v3';
import type { ListsToolArgs, RemindersToolArgs } from '../types/index.js';
import { handleAsyncOperation } from '../utils/errorHandling.js';
import { reminderRepository } from '../utils/reminderRepository.js';
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
      const markdownLines: string[] = [];
      const checkbox = reminder.isCompleted ? '[x]' : '[ ]';
      markdownLines.push(`### Reminder`);
      markdownLines.push('');
      markdownLines.push(`- ${checkbox} ${reminder.title}`);
      if (reminder.list) markdownLines.push(`  - List: ${reminder.list}`);
      if (reminder.id) markdownLines.push(`  - ID: ${reminder.id}`);
      if (reminder.notes)
        markdownLines.push(
          `  - Notes: ${reminder.notes.replace(/\n/g, '\n    ')}`,
        );
      if (reminder.dueDate) markdownLines.push(`  - Due: ${reminder.dueDate}`);
      if (reminder.url) markdownLines.push(`  - URL: ${reminder.url}`);
      return markdownLines.join('\n');
    }

    // Otherwise, return all matching reminders
    const reminders = await reminderRepository.findReminders({
      list: validatedArgs.filterList,
      showCompleted: validatedArgs.showCompleted,
      search: validatedArgs.search,
      dueWithin: validatedArgs.dueWithin,
    });

    const markdownLines: string[] = [];
    markdownLines.push(`### Reminders (Total: ${reminders.length})`);
    markdownLines.push('');

    if (reminders.length === 0) {
      markdownLines.push('No reminders found matching the criteria.');
    } else {
      reminders.forEach((r) => {
        const checkbox = r.isCompleted ? '[x]' : '[ ]';
        markdownLines.push(`- ${checkbox} ${r.title}`);
        if (r.list) markdownLines.push(`  - List: ${r.list}`);
        if (r.id) markdownLines.push(`  - ID: ${r.id}`);
        if (r.notes)
          markdownLines.push(`  - Notes: ${r.notes.replace(/\n/g, '\n    ')}`);
        if (r.dueDate) markdownLines.push(`  - Due: ${r.dueDate}`);
        if (r.url) markdownLines.push(`  - URL: ${r.url}`);
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
