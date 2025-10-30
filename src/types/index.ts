/**
 * types/index.ts
 * Type definitions for the Apple Reminders MCP server
 */

/**
 * Reminder item interface
 */
export interface Reminder {
  id: string;
  title: string;
  dueDate?: string;
  notes?: string;
  url?: string; // Native URL field (currently limited by EventKit API)
  list: string;
  isCompleted: boolean;
}

/**
 * Reminder list interface
 */
export interface ReminderList {
  id: string;
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
 * Shared type constants for better type safety and consistency
 */
export type ReminderAction = 'read' | 'list' | 'create' | 'update' | 'delete';
export type ListAction = 'read' | 'create' | 'update' | 'delete';
export type DueWithinOption =
  | 'today'
  | 'tomorrow'
  | 'this-week'
  | 'overdue'
  | 'no-date';

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
  // ID parameter
  id?: string;
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
}

export interface ListsToolArgs extends BaseToolArgs {
  action: ListAction;
  name?: string;
  newName?: string;
}

/**
 * Prompt-related type exports for consumers that need to interact with the
 * structured MCP prompt registry.
 */
export type {
  DailyTaskOrganizerArgs,
  PromptArgsByName,
  PromptArgumentDefinition,
  PromptMessage,
  PromptMessageContent,
  PromptMetadata,
  PromptName,
  PromptResponse,
  PromptTemplate,
  ReminderReviewAssistantArgs,
  SmartReminderCreatorArgs,
  WeeklyPlanningWorkflowArgs,
} from './prompts.js';
