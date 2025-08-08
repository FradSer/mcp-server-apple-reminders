/**
 * tools/index.ts
 * Exports tool definitions and handler functions
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { debugLog } from "../utils/logger.js";
import { TOOLS } from "./definitions.js";
import {
  handleCreateReminder,
  handleListReminderLists,
  handleListReminders,
  handleUpdateReminder,
  handleDeleteReminder,
  handleMoveReminder,
  handleCreateReminderList
} from "./handlers.js";

/**
 * Routes tool calls to the appropriate handler based on the tool name
 * @param name - Name of the tool to call
 * @param args - Arguments for the tool
 * @returns Result of the tool call
 */
export async function handleToolCall(name: string, args: any): Promise<CallToolResult> {
  debugLog(`Handling tool call: ${name} with args:`, args);

  switch (name) {
    case "reminders": {
      const action = args?.action;
      switch (action) {
        case "list":
          return handleListReminders(args);
        case "create":
          return handleCreateReminder(args);
        case "update":
          return handleUpdateReminder(args);
        case "delete":
          return handleDeleteReminder(args);
        case "move":
          return handleMoveReminder(args);
        case "organize": {
          // Translate to batch operation for the update handler
          const batchArgs = {
            batchOperation: {
              enabled: true,
              strategy: args?.strategy,
              sourceList: args?.sourceList,
              createLists: args?.createLists,
              filter: {
                completed: args?.completed,
                search: args?.search,
                dueWithin: args?.dueWithin
              }
            }
          };
          return handleUpdateReminder(batchArgs);
        }
        default:
          return {
            content: [
              { type: "text", text: `Unknown reminders action: ${String(action)}` }
            ],
            isError: true
          };
      }
    }
    case "lists": {
      const action = args?.action;
      switch (action) {
        case "list":
          return handleListReminderLists({});
        case "create":
          return handleCreateReminderList({ name: args?.name });
        default:
          return {
            content: [
              { type: "text", text: `Unknown lists action: ${String(action)}` }
            ],
            isError: true
          };
      }
    }
    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
}

export { TOOLS };
