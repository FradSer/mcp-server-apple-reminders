/**
 * types/index.ts
 * Type definitions for the Apple Reminders MCP server
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

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
 * Tool handler function signature
 */
export type ToolHandler = (args: any) => Promise<CallToolResult>;

/**
 * Resource definitions
 */
export interface Resource {
  uri: string;
  mimeType: string;
  name: string;
} 