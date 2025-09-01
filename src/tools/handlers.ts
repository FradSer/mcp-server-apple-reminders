/**
 * tools/handlers.ts
 * Implementation of tool handlers for Apple Reminders operations
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  ListsToolArgs,
  Reminder,
  RemindersToolArgs,
} from '../types/index.js';
import { MESSAGES } from '../utils/constants.js';
import type { ReminderFilters } from '../utils/dateFiltering.js';
import {
  ErrorResponseFactory,
  handleAsyncOperation,
  handleJsonAsyncOperation,
} from '../utils/errorHandling.js';
import { ReminderOrganizer } from '../utils/organizationStrategies.js';
import { ensurePermissions } from '../utils/permissions.js';
import {
  type CreateReminderData,
  type MoveReminderData,
  reminderRepository,
  type UpdateReminderData,
} from '../utils/reminderRepository.js';
import {
  CreateReminderListSchema,
  CreateReminderSchema,
  DeleteReminderSchema,
  ListReminderListsSchema,
  ListRemindersSchema,
  MoveReminderSchema,
  UpdateReminderSchema,
  validateInput,
} from '../validation/schemas.js';

/**
 * Creates a new reminder
 * @param args - Arguments for creating a reminder
 * @returns Result of the operation
 */
export async function handleCreateReminder(
  args: RemindersToolArgs,
): Promise<CallToolResult> {
  return handleAsyncOperation(
    async () => {
      await ensurePermissions();

      const { action: _ignored, ...rest } = args ?? {};
      const validatedArgs = validateInput(CreateReminderSchema, rest);

      const reminderData: CreateReminderData = {
        title: validatedArgs.title,
        dueDate: validatedArgs.dueDate,
        note: validatedArgs.note,
        url: validatedArgs.url,
        list: validatedArgs.list,
      };

      await reminderRepository.createReminder(reminderData);

      const hasNotes = Boolean(validatedArgs.note || validatedArgs.url);
      return MESSAGES.SUCCESS.REMINDER_CREATED(validatedArgs.title, hasNotes);
    },
    'create reminder',
    (message) => ErrorResponseFactory.createSuccessResponse(message),
  );
}

/**
 * Updates an existing reminder or performs batch operations
 * @param args - Arguments for updating a reminder or batch operations
 * @returns Result of the operation
 */
export async function handleUpdateReminder(
  args: RemindersToolArgs,
): Promise<CallToolResult> {
  return handleAsyncOperation(
    async () => {
      const { action: _ignored, ...rest } = args ?? {};
      const validatedArgs = validateInput(UpdateReminderSchema, rest);

      if (validatedArgs.batchOperation?.enabled) {
        return await processBatchOrganization(validatedArgs.batchOperation);
      }

      const updateData: UpdateReminderData = {
        title: validatedArgs.title,
        newTitle: validatedArgs.newTitle,
        dueDate: validatedArgs.dueDate,
        note: validatedArgs.note,
        url: validatedArgs.url,
        completed: validatedArgs.completed,
        list: validatedArgs.list,
      };

      await reminderRepository.updateReminder(updateData);

      return MESSAGES.SUCCESS.REMINDER_UPDATED(validatedArgs.title);
    },
    'update reminder',
    (message) => ErrorResponseFactory.createSuccessResponse(message),
  );
}

/**
 * Processes batch organization operations
 */
async function processBatchOrganization(batchOperation: {
  strategy?: string;
  createLists?: boolean;
  sourceList?: string;
  filter?: {
    completed?: boolean;
    search?: string;
    dueWithin?: string;
  };
}): Promise<string> {
  const filters = buildBatchFilters(batchOperation);
  const reminders = await reminderRepository.findReminders(filters);

  const strategy = batchOperation.strategy || 'category';
  const groups = ReminderOrganizer.organizeReminders(reminders, strategy);

  const results = await processBatchGroups(
    groups,
    batchOperation.createLists !== false,
  );

  return `Batch organization complete using ${strategy} strategy:\n${results.join('\n')}`;
}

/**
 * Builds filter criteria for batch operations
 */
function buildBatchFilters(batchOperation: {
  sourceList?: string;
  filter?: {
    completed?: boolean;
    search?: string;
    dueWithin?: string;
  };
}): ReminderFilters {
  const filters: ReminderFilters = {};

  if (batchOperation.sourceList) {
    filters.list = batchOperation.sourceList;
  }

  if (batchOperation.filter) {
    filters.showCompleted = batchOperation.filter.completed;
    filters.search = batchOperation.filter.search;
    filters.dueWithin = batchOperation.filter.dueWithin as
      | 'today'
      | 'tomorrow'
      | 'this-week'
      | 'overdue'
      | 'no-date';
  }

  return filters;
}

/**
 * Processes grouped reminders for batch organization
 */
async function processBatchGroups(
  groups: Record<string, Reminder[]>,
  createLists: boolean,
): Promise<string[]> {
  const results: string[] = [];

  for (const [groupName, groupReminders] of Object.entries(groups)) {
    if (createLists) {
      await createGroupListIfNeeded(groupName, results);
    }

    await moveRemindersToGroup(groupReminders, groupName, results);
  }

  return results;
}

/**
 * Creates a new list for a group if needed
 */
async function createGroupListIfNeeded(
  groupName: string,
  results: string[],
): Promise<void> {
  try {
    const listExists = await reminderRepository.listExists(groupName);
    if (!listExists) {
      await reminderRepository.createReminderList(groupName);
      results.push(`Created list: ${groupName}`);
    }
  } catch (_error) {
    // List might already exist or creation failed, continue silently
  }
}

/**
 * Moves reminders to their designated group
 */
async function moveRemindersToGroup(
  reminders: Reminder[],
  groupName: string,
  results: string[],
): Promise<void> {
  for (const reminder of reminders) {
    if (reminder.list !== groupName) {
      try {
        const moveData: MoveReminderData = {
          title: reminder.title,
          fromList: reminder.list,
          toList: groupName,
        };

        await reminderRepository.moveReminder(moveData);
        results.push(`Moved "${reminder.title}" to ${groupName}`);
      } catch (error) {
        results.push(
          `Failed to move "${reminder.title}": ${(error as Error).message}`,
        );
      }
    }
  }
}

/**
 * Deletes a reminder
 * @param args - Arguments for deleting a reminder
 * @returns Result of the operation
 */
export async function handleDeleteReminder(
  args: RemindersToolArgs,
): Promise<CallToolResult> {
  return handleAsyncOperation(
    async () => {
      const { action: _ignored, ...rest } = args ?? {};
      const validatedArgs = validateInput(DeleteReminderSchema, rest);

      await reminderRepository.deleteReminder(
        validatedArgs.title,
        validatedArgs.list,
      );

      return MESSAGES.SUCCESS.REMINDER_DELETED(validatedArgs.title);
    },
    'delete reminder',
    (message) => ErrorResponseFactory.createSuccessResponse(message),
  );
}

/**
 * Moves a reminder between lists
 * @param args - Arguments for moving a reminder
 * @returns Result of the operation
 */
export async function handleMoveReminder(
  args: RemindersToolArgs,
): Promise<CallToolResult> {
  return handleAsyncOperation(
    async () => {
      const { action: _ignored, ...rest } = args ?? {};
      const validatedArgs = validateInput(MoveReminderSchema, rest);

      const moveData: MoveReminderData = {
        title: validatedArgs.title,
        fromList: validatedArgs.fromList,
        toList: validatedArgs.toList,
      };

      await reminderRepository.moveReminder(moveData);

      return MESSAGES.SUCCESS.REMINDER_MOVED(
        validatedArgs.title,
        validatedArgs.fromList,
        validatedArgs.toList,
      );
    },
    'move reminder',
    (message) => ErrorResponseFactory.createSuccessResponse(message),
  );
}

/**
 * Lists all reminder lists or creates a new one
 * @param args - Optional arguments for creating a new list
 * @returns Result of the operation with the list of reminder lists in JSON format
 */
export async function handleListReminderLists(
  args?: ListsToolArgs,
): Promise<CallToolResult> {
  return handleJsonAsyncOperation(async () => {
    await ensurePermissions();

    const cleaned =
      args && typeof args === 'object'
        ? (() => {
            const { action: _ignored, ...rest } = args;
            return rest;
          })()
        : undefined;
    const validatedArgs = cleaned
      ? validateInput(ListReminderListsSchema, cleaned)
      : undefined;

    if (validatedArgs?.createNew) {
      const createResult = await handleCreateReminderList({
        action: 'create',
        name: validatedArgs.createNew.name,
      });
      if (createResult.isError) {
        throw new Error('Failed to create reminder list');
      }
      return { message: 'List created successfully' };
    }

    const lists = await reminderRepository.findAllLists();

    return {
      lists: lists.map((list) => ({
        id: list.id,
        title: list.title,
      })),
      total: lists.length,
    };
  }, 'list reminder lists');
}

/**
 * Lists reminders from a specific list or all reminders
 * @param args - Arguments for listing reminders
 * @returns Result of the operation with the list of reminders in JSON format
 */
export async function handleListReminders(
  args: RemindersToolArgs,
): Promise<CallToolResult> {
  return handleJsonAsyncOperation(async () => {
    await ensurePermissions();

    const { action: _ignored, ...rest } = args ?? {};
    const validatedArgs = validateInput(ListRemindersSchema, rest);

    const filters = buildListReminderFilters(validatedArgs);
    const reminders = await reminderRepository.findReminders(filters);

    return createReminderListResponse(reminders, filters);
  }, 'list reminders');
}

/**
 * Builds filter criteria from validated arguments
 */
function buildListReminderFilters(validatedArgs: {
  list?: string;
  showCompleted?: boolean;
  search?: string;
  dueWithin?: string;
}): ReminderFilters {
  return {
    list: validatedArgs.list,
    showCompleted: validatedArgs.showCompleted === true,
    search: validatedArgs.search,
    dueWithin: validatedArgs.dueWithin as
      | 'today'
      | 'tomorrow'
      | 'this-week'
      | 'overdue'
      | 'no-date',
  };
}

/**
 * Creates a formatted response for reminder lists
 */
function createReminderListResponse(
  reminders: Reminder[],
  filters: ReminderFilters,
) {
  const mappedReminders = reminders.map((reminder) => ({
    title: reminder.title,
    list: reminder.list,
    isCompleted: reminder.isCompleted === true,
    dueDate: reminder.dueDate || null,
    notes: reminder.notes || null,
  }));

  return {
    reminders: mappedReminders,
    total: mappedReminders.length,
    filter: {
      list: filters.list,
      showCompleted: filters.showCompleted || false,
      search: filters.search || null,
      dueWithin: filters.dueWithin || null,
    },
  };
}

/**
 * Creates a new reminder list
 * @param args - Arguments for creating a reminder list
 * @returns Result of the operation
 */
export async function handleCreateReminderList(
  args: ListsToolArgs,
): Promise<CallToolResult> {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = validateInput(CreateReminderListSchema, args);

      await reminderRepository.createReminderList(validatedArgs.name);

      return MESSAGES.SUCCESS.LIST_CREATED(validatedArgs.name);
    },
    'create reminder list',
    (message) => ErrorResponseFactory.createSuccessResponse(message),
  );
}
