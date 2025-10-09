/**
 * types/index.ts
 * Type definitions for the Apple Reminders MCP server
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Re-export prompt types for convenience
export type {
  PromptDefinition,
  PromptCategory,
  PromptRegistry,
  PromptExecutionContext,
  PromptArgument,
  PromptMessage,
  PromptMessageContent,
  PromptTemplate,
} from '../prompts/types.js';

/**
 * Reminder item interface
 */
export interface Reminder {
  title: string;
  dueDate?: string;
  notes?: string;
  url?: string;           // Native URL field (currently limited by EventKit API)
  list: string;
  isCompleted: boolean;
}

/**
 * Reminder list interface
 */
export interface ReminderList {
  id: number;
  title: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  name: string;
  version: string;
}

/**
 * Result of a reminder operation
 */
export interface ReminderResult {
  message: string;
  success: boolean;
}

/**
 * Shared type constants for better type safety and consistency
 */
export type ReminderAction = 'read' | 'list' | 'create' | 'update' | 'delete' | 'bulk_create' | 'bulk_update' | 'bulk_delete';
export type ListAction = 'read' | 'create' | 'update' | 'delete';
export type DueWithinOption = 'today' | 'tomorrow' | 'this-week' | 'overdue' | 'no-date';
export type OrganizeStrategy = 'priority' | 'due_date' | 'category' | 'completion_status';

/**
 * Base tool arguments interface
 */
interface BaseToolArgs {
  action: string;
}

/**
 * Tool argument types - keeping flexible for handler routing while maintaining type safety
 */
export interface RemindersToolArgs extends BaseToolArgs {
  action: ReminderAction;
  // Filtering parameters (for list action)
  filterList?: string;
  showCompleted?: boolean;
  search?: string;
  dueWithin?: DueWithinOption;
  // Single item parameters
  title?: string;
  newTitle?: string;
  dueDate?: string;
  note?: string;
  url?: string;
  completed?: boolean;
  // Target list for create/update operations
  targetList?: string;
  // Bulk operation parameters
  items?: Array<{
    title: string;
    dueDate?: string;
    note?: string;
    url?: string;
    targetList?: string;
  }>;
  criteria?: {
    search?: string;
    dueWithin?: DueWithinOption;
    completed?: boolean;
    sourceList?: string;
  };
  updates?: {
    newTitle?: string;
    dueDate?: string;
    note?: string;
    url?: string;
    completed?: boolean;
    targetList?: string;
  };
  // Organize parameters for bulk_update
  organizeBy?: OrganizeStrategy;
  createLists?: boolean;
}

export interface ListsToolArgs extends BaseToolArgs {
  action: ListAction;
  name?: string;
  newName?: string;
}

/**
 * Specific action argument types for better validation
 */
export type ReadReminderArgs = { action: 'read'; filterList?: string; showCompleted?: boolean; search?: string; dueWithin?: DueWithinOption };
export type CreateReminderArgs = { action: 'create'; title: string; dueDate?: string; note?: string; url?: string; targetList?: string };
export type UpdateReminderArgs = { action: 'update'; title: string; newTitle?: string; dueDate?: string; note?: string; url?: string; completed?: boolean; targetList?: string };
export type DeleteReminderArgs = { action: 'delete'; title: string; filterList?: string };
export type BulkCreateReminderArgs = { action: 'bulk_create'; items: Array<{ title: string; dueDate?: string; note?: string; url?: string; targetList?: string }> };
export type BulkUpdateReminderArgs = { action: 'bulk_update'; criteria: { search?: string; dueWithin?: DueWithinOption; completed?: boolean; sourceList?: string }; updates: { newTitle?: string; dueDate?: string; note?: string; url?: string; completed?: boolean; targetList?: string }; organizeBy?: OrganizeStrategy; createLists?: boolean };
export type BulkDeleteReminderArgs = { action: 'bulk_delete'; criteria: { search?: string; dueWithin?: DueWithinOption; completed?: boolean; sourceList?: string } };

export type CreateListArgs = { action: 'create'; name: string };
export type UpdateListArgs = { action: 'update'; name: string; newName: string };
export type DeleteListArgs = { action: 'delete'; name: string };
export type ReadListsArgs = { action: 'read' };


/**
 * Tool handler function signatures
 */
export type ReminderToolHandler = (args: RemindersToolArgs) => Promise<CallToolResult>;
export type ListToolHandler = (args: ListsToolArgs) => Promise<CallToolResult>;
export type ToolHandler = ReminderToolHandler | ListToolHandler;

/**
 * Resource definitions
 */
export interface Resource {
  uri: string;
  mimeType: string;
  name: string;
}
