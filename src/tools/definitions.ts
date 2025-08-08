/**
 * tools/definitions.ts
 * Defines the MCP tools available in the Apple Reminders server
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Minimal tool surface: two tools with action-based operations
 */
export const TOOLS: Tool[] = [
  {
    name: "reminders",
    description: "Unified reminders tool: list/create/update/delete/move/organize via an action field",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "create", "update", "delete", "move", "organize"],
          description: "Operation to perform",
        },
        // Common fields used by underlying actions (kept permissive for simplicity)
        // List filters
        list: { type: "string" },
        showCompleted: { type: "boolean", default: false },
        search: { type: "string" },
        dueWithin: { type: "string", enum: ["today", "tomorrow", "this-week", "overdue", "no-date"] },
        // Create / Update fields
        title: { type: "string" },
        newTitle: { type: "string" },
        dueDate: { type: "string" },
        note: { type: "string" },
        url: { type: "string" },
        completed: { type: "boolean" },
        // Move specific
        fromList: { type: "string" },
        toList: { type: "string" },
        // Organize specific (batch)
        strategy: { type: "string", enum: ["priority", "due_date", "category", "completion_status"] },
        sourceList: { type: "string" },
        createLists: { type: "boolean", default: true },
      },
      required: ["action"],
    },
  },
  {
    name: "lists",
    description: "Reminder lists tool: list or create via an action field",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list", "create"] },
        name: { type: "string", description: "New list name (for action=create)" },
      },
      required: ["action"],
    },
  },
];