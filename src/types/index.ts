/**
 * types/index.ts
 * Type definitions for the Apple Reminders MCP server
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

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
export type ReminderAction = 'list' | 'create' | 'update' | 'delete' | 'move' | 'organize';
export type ListAction = 'list' | 'create';
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
  // Common optional fields that may be present across different actions
  list?: string;
  showCompleted?: boolean;
  search?: string;
  dueWithin?: DueWithinOption;
  title?: string;
  newTitle?: string;
  dueDate?: string;
  note?: string;
  url?: string;
  completed?: boolean;
  fromList?: string;
  toList?: string;
  strategy?: OrganizeStrategy;
  sourceList?: string;
  createLists?: boolean;
  batchOperation?: BatchOperation;
}

export interface ListsToolArgs extends BaseToolArgs {
  action: ListAction;
  name?: string;
}

/**
 * Specific action argument types for better validation
 */
export type ListReminderArgs = { action: 'list'; list?: string; showCompleted?: boolean; search?: string; dueWithin?: DueWithinOption };
export type CreateReminderArgs = { action: 'create'; title: string; dueDate?: string; note?: string; url?: string; list?: string };
export type UpdateReminderArgs = { action: 'update'; title?: string; newTitle?: string; dueDate?: string; note?: string; url?: string; completed?: boolean; list?: string; batchOperation?: BatchOperation };
export type DeleteReminderArgs = { action: 'delete'; title: string; list?: string };
export type MoveReminderArgs = { action: 'move'; title: string; fromList: string; toList: string };
export type OrganizeReminderArgs = { action: 'organize'; strategy: OrganizeStrategy; sourceList?: string; createLists?: boolean };

export type CreateListArgs = { action: 'create'; name: string };
export type ListListsArgs = { action: 'list' };

/**
 * Batch operation interface for complex update operations
 */
export interface BatchOperation {
  enabled: boolean;
  strategy?: OrganizeStrategy;
  sourceList?: string;
  createLists?: boolean;
  filter?: {
    completed?: boolean;
    search?: string;
    dueWithin?: DueWithinOption;
  };
}

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
