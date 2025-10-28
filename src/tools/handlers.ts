/**
 * tools/handlers.ts
 * Implementation of tool handlers for Apple Reminders operations
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';
import type {
  DueWithinOption,
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
import { debugLog } from '../utils/logger.js';
import { ReminderOrganizer } from '../utils/organizationStrategies.js';
import {
  type CreateReminderData,
  type MoveReminderData,
  reminderRepository,
  type UpdateReminderData,
} from '../utils/reminderRepository.js';
import {
  BulkCreateRemindersSchema,
  BulkDeleteRemindersSchema,
  BulkUpdateRemindersSchema,
  CreateReminderListSchema,
  CreateReminderSchema,
  DeleteReminderListSchema,
  DeleteReminderSchema,
  MoveReminderSchema,
  ReadReminderListsSchema,
  ReadRemindersSchema,
  UpdateReminderListSchema,
  UpdateReminderSchema,
  validateInput,
} from '../validation/schemas.js';

type BulkUpdateArgs = z.infer<typeof BulkUpdateRemindersSchema>;
type BulkUpdateCriteria = BulkUpdateArgs['criteria'];
type BulkUpdateChanges = BulkUpdateArgs['updates'];
type BulkDeleteCriteria = z.infer<typeof BulkDeleteRemindersSchema>['criteria'];
type MoveReminderArgs = z.infer<typeof MoveReminderSchema>;
type BulkOperationCriteria = BulkUpdateCriteria | BulkDeleteCriteria;

/**
 * Extracts validated arguments from tool args by removing the action field
 */
const extractAndValidateArgs = <T>(
  args: RemindersToolArgs | ListsToolArgs | undefined,
  schema: z.ZodSchema<T>,
): T => {
  const { action: _, ...rest } = args ?? {};
  return validateInput(schema, rest);
};

/**
 * Creates a new reminder
 * @param args - Arguments for creating a reminder
 * @returns Result of the operation
 */
export const handleCreateReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(args, CreateReminderSchema);

      const reminderData: CreateReminderData = {
        title: validatedArgs.title,
        dueDate: validatedArgs.dueDate,
        note: validatedArgs.note,
        url: validatedArgs.url,
        list: validatedArgs.targetList,
      };

      await reminderRepository.createReminder(reminderData);

      const hasNotes = Boolean(validatedArgs.note || validatedArgs.url);
      return MESSAGES.SUCCESS.REMINDER_CREATED(validatedArgs.title, hasNotes);
    },
    'create reminder',
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Updates an existing reminder or performs batch operations
 * @param args - Arguments for updating a reminder or batch operations
 * @returns Result of the operation
 */
export const handleUpdateReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(args, UpdateReminderSchema);

      const updateData: UpdateReminderData = {
        title: validatedArgs.title,
        newTitle: validatedArgs.newTitle,
        dueDate: validatedArgs.dueDate,
        note: validatedArgs.note,
        url: validatedArgs.url,
        completed: validatedArgs.completed,
        list: validatedArgs.targetList,
      };

      await reminderRepository.updateReminder(updateData);
      return MESSAGES.SUCCESS.REMINDER_UPDATED(validatedArgs.title);
    },
    'update reminder',
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Processes grouped reminders for batch organization
 */
const processBatchGroups = async (
  groups: Record<string, Reminder[]>,
  createLists: boolean,
): Promise<string[]> => {
  const results: string[] = [];

  for (const [groupName, groupReminders] of Object.entries(groups)) {
    if (createLists) {
      await createGroupListIfNeeded(groupName, results);
    }
    await moveRemindersToGroup(groupReminders, groupName, results);
  }

  return results;
};

/**
 * Creates a new list for a group if needed
 */
const createGroupListIfNeeded = async (
  groupName: string,
  results: string[],
): Promise<void> => {
  try {
    const listExists = await reminderRepository.listExists(groupName);
    if (!listExists) {
      await reminderRepository.createReminderList(groupName);
      results.push(`Created list: ${groupName}`);
    }
  } catch (error) {
    const errorMsg = `Failed to create list "${groupName}": ${(error as Error).message}`;
    debugLog(errorMsg);
    results.push(`${errorMsg.split(':')[0]}: List may already exist`);
  }
};

/**
 * Moves reminders to their designated group
 */
const moveRemindersToGroup = async (
  reminders: Reminder[],
  groupName: string,
  results: string[],
): Promise<void> => {
  const remindersToMove = reminders.filter(
    (reminder) => reminder.list !== groupName,
  );

  for (const reminder of remindersToMove) {
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
};

/**
 * Deletes a reminder
 * @param args - Arguments for deleting a reminder
 * @returns Result of the operation
 */
export const handleDeleteReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(args, DeleteReminderSchema);

      await reminderRepository.deleteReminder(
        validatedArgs.title,
        validatedArgs.filterList,
      );

      return MESSAGES.SUCCESS.REMINDER_DELETED(validatedArgs.title);
    },
    'delete reminder',
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Reads all reminder lists or creates a new one with simplified logic
 * @param args - Optional arguments for creating a new list
 * @returns Result of the operation with the list of reminder lists in JSON format
 */
export const handleReadReminderLists = async (
  args?: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleJsonAsyncOperation(async () => {
    if (!args || typeof args !== 'object') {
      const lists = await reminderRepository.findAllLists();
      return createReadResponse(lists);
    }

    const { action: _, ...rest } = args;
    const validatedArgs =
      rest && Object.keys(rest).length > 0
        ? validateInput(ReadReminderListsSchema, rest)
        : undefined;

    if (validatedArgs?.createNew) {
      await reminderRepository.createReminderList(validatedArgs.createNew.name);
      return {
        message: `List "${validatedArgs.createNew.name}" created successfully`,
      };
    }

    const lists = await reminderRepository.findAllLists();
    return createReadResponse(lists);
  }, 'read reminder lists');
};

/**
 * Creates a standardized read response format
 */
const createReadResponse = (lists: { id: number; title: string }[]) => ({
  lists: lists.map(({ id, title }) => ({ id, title })),
  total: lists.length,
});

/**
 * Reads reminders from a specific list or all reminders
 * @param args - Arguments for reading reminders
 * @returns Result of the operation with the list of reminders in JSON format
 */
export const handleReadReminders = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleJsonAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, ReadRemindersSchema);

    // Handle intelligent default list selection when no filterList is provided
    // Only apply default list selection if no other filters are specified
    let effectiveFilterList = validatedArgs.filterList;

    if (
      !effectiveFilterList &&
      !validatedArgs.search &&
      !validatedArgs.dueWithin
    ) {
      // Get all reminders to determine available lists
      const allReminders = await reminderRepository.findReminders({
        showCompleted: validatedArgs.showCompleted,
      });

      // Extract unique lists from reminders
      const availableLists = [...new Set(allReminders.map((r) => r.list))];

      // Apply intelligent default list selection logic
      if (availableLists.includes('Reminders')) {
        effectiveFilterList = 'Reminders';
      } else if (availableLists.includes('提醒事项')) {
        effectiveFilterList = '提醒事项';
      } else if (availableLists.length > 0) {
        effectiveFilterList = availableLists[0]; // First available list in order found
      }
    }

    const filters = buildReadReminderFilters({
      ...validatedArgs,
      filterList: effectiveFilterList,
    });

    const reminders = await reminderRepository.findReminders(filters);
    return createReminderReadResponse(reminders, filters);
  }, 'read reminders');
};

/**
 * Alias for handleReadReminders to maintain backward compatibility
 */
export const handleListReminders = handleReadReminders;

/**
 * Moves a reminder between lists
 */
export const handleMoveReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs: MoveReminderArgs = extractAndValidateArgs(
        args,
        MoveReminderSchema,
      );

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
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Builds filter criteria from validated arguments
 */
const buildReadReminderFilters = (validatedArgs: {
  filterList?: string;
  showCompleted?: boolean;
  search?: string;
  dueWithin?: DueWithinOption;
}): ReminderFilters => ({
  list: validatedArgs.filterList,
  showCompleted: validatedArgs.showCompleted === true,
  search: validatedArgs.search,
  dueWithin: validatedArgs.dueWithin,
});

/**
 * Creates a formatted response for reminder reads
 */
const createReminderReadResponse = (
  reminders: Reminder[],
  filters: ReminderFilters,
) => {
  const mappedReminders = reminders.map((reminder) => ({
    title: reminder.title,
    list: reminder.list,
    isCompleted: reminder.isCompleted === true,
    dueDate: reminder.dueDate ?? null,
    notes: reminder.notes ?? null,
    url: reminder.url ?? null,
  }));

  return {
    reminders: mappedReminders,
    total: mappedReminders.length,
    filter: {
      list: filters.list,
      showCompleted: filters.showCompleted ?? false,
      search: filters.search ?? null,
      dueWithin: filters.dueWithin ?? null,
    },
  };
};

/**
 * Creates a new reminder list
 * @param args - Arguments for creating a reminder list
 * @returns Result of the operation
 */
export const handleCreateReminderList = async (
  args: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(
        args,
        CreateReminderListSchema,
      );
      await reminderRepository.createReminderList(validatedArgs.name);
      return MESSAGES.SUCCESS.LIST_CREATED(validatedArgs.name);
    },
    'create reminder list',
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Updates a reminder list name
 * @param args - Arguments for updating a reminder list
 * @returns Result of the operation
 */
export const handleUpdateReminderList = async (
  args: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(
        args,
        UpdateReminderListSchema,
      );
      await reminderRepository.updateReminderList(
        validatedArgs.name,
        validatedArgs.newName,
      );
      return MESSAGES.SUCCESS.LIST_UPDATED(
        validatedArgs.name,
        validatedArgs.newName,
      );
    },
    'update reminder list',
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Deletes a reminder list
 * @param args - Arguments for deleting a reminder list
 * @returns Result of the operation
 */
export const handleDeleteReminderList = async (
  args: ListsToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(
        args,
        DeleteReminderListSchema,
      );
      await reminderRepository.deleteReminderList(validatedArgs.name);
      return MESSAGES.SUCCESS.LIST_DELETED(validatedArgs.name);
    },
    'delete reminder list',
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Creates multiple reminders in bulk
 * @param args - Arguments for bulk creation
 * @returns Result of the operation
 */
export const handleBulkCreateReminders = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(
        args,
        BulkCreateRemindersSchema,
      );

      const results = await Promise.allSettled(
        validatedArgs.items.map(async (item) => {
          const reminderData: CreateReminderData = {
            title: item.title,
            dueDate: item.dueDate,
            note: item.note,
            url: item.url,
            list: item.targetList,
          };

          await reminderRepository.createReminder(reminderData);
          return `Created: ${item.title}`;
        }),
      );

      const messages = results.map((result, index) =>
        result.status === 'fulfilled'
          ? result.value
          : `Failed to create "${validatedArgs.items[index].title}": ${result.reason?.message ?? 'Unknown error'}`,
      );

      return `Bulk creation complete:\n${messages.join('\n')}`;
    },
    'bulk create reminders',
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Handles organization of reminders using specified strategy
 */
const handleReminderOrganization = async (validatedArgs: {
  organizeBy: NonNullable<BulkUpdateArgs['organizeBy']>;
  criteria: BulkUpdateCriteria;
  createLists?: BulkUpdateArgs['createLists'];
}): Promise<string> => {
  const filters = buildBulkFilters(validatedArgs.criteria);
  const reminders = await reminderRepository.findReminders(filters);

  if (reminders.length === 0) {
    return 'No reminders found matching the specified criteria for organization.';
  }

  const groups = ReminderOrganizer.organizeReminders(
    reminders,
    validatedArgs.organizeBy,
  );
  const shouldCreateLists = validatedArgs.createLists !== false;

  const results = await processBatchGroups(groups, shouldCreateLists);
  return `Organization complete using ${validatedArgs.organizeBy} strategy:\n${results.join('\n')}`;
};

/**
 * Handles regular bulk updates of reminders
 */
const handleRegularBulkUpdate = async (validatedArgs: {
  criteria: BulkUpdateCriteria;
  updates: BulkUpdateChanges;
}): Promise<string> => {
  const filters = buildBulkFilters(validatedArgs.criteria);
  const reminders = await reminderRepository.findReminders(filters);

  if (reminders.length === 0) {
    return 'No reminders found matching the specified criteria for bulk update.';
  }

  const results = await Promise.allSettled(
    reminders.map(async (reminder) => {
      const updateData: UpdateReminderData = {
        title: reminder.title,
        newTitle: validatedArgs.updates.newTitle,
        dueDate: validatedArgs.updates.dueDate,
        note: validatedArgs.updates.note,
        url: validatedArgs.updates.url,
        completed: validatedArgs.updates.completed,
        list: validatedArgs.updates.targetList,
      };

      await reminderRepository.updateReminder(updateData);
      return `Updated: ${reminder.title}`;
    }),
  );

  const messages = results.map((result, index) =>
    result.status === 'fulfilled'
      ? result.value
      : `Failed to update "${reminders[index].title}": ${result.reason?.message ?? 'Unknown error'}`,
  );

  return `Bulk update complete (${messages.length} reminders):\n${messages.join('\n')}`;
};

/**
 * Updates multiple reminders in bulk based on criteria
 * @param args - Arguments for bulk update
 * @returns Result of the operation
 */
export const handleBulkUpdateReminders = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(
        args,
        BulkUpdateRemindersSchema,
      );

      return validatedArgs.organizeBy
        ? handleReminderOrganization({
            organizeBy: validatedArgs.organizeBy,
            criteria: validatedArgs.criteria,
            createLists: validatedArgs.createLists,
          })
        : handleRegularBulkUpdate(validatedArgs);
    },
    'bulk update reminders',
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Deletes multiple reminders in bulk based on criteria
 * @param args - Arguments for bulk deletion
 * @returns Result of the operation
 */
export const handleBulkDeleteReminders = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(
    async () => {
      const validatedArgs = extractAndValidateArgs(
        args,
        BulkDeleteRemindersSchema,
      );

      const filters = buildBulkFilters(validatedArgs.criteria);
      const reminders = await reminderRepository.findReminders(filters);

      if (reminders.length === 0) {
        return 'No reminders found matching the specified criteria for bulk deletion.';
      }

      const results = await Promise.allSettled(
        reminders.map(async (reminder) => {
          await reminderRepository.deleteReminder(
            reminder.title,
            reminder.list,
          );
          return `Deleted: ${reminder.title}`;
        }),
      );

      const messages = results.map((result, index) =>
        result.status === 'fulfilled'
          ? result.value
          : `Failed to delete "${reminders[index].title}": ${result.reason?.message ?? 'Unknown error'}`,
      );

      return `Bulk deletion complete (${messages.length} reminders):\n${messages.join('\n')}`;
    },
    'bulk delete reminders',
    ErrorResponseFactory.createSuccessResponse,
  );
};

/**
 * Builds filter criteria for bulk operations
 */
const buildBulkFilters = (
  criteria: BulkOperationCriteria,
): ReminderFilters => ({
  list: criteria.sourceList,
  showCompleted: criteria.completed,
  search: criteria.search,
  dueWithin: criteria.dueWithin,
});
