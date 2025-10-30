/**
 * tools/index.ts
 * Exports tool definitions and handler functions
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ListsToolArgs, RemindersToolArgs } from '../types/index.js';
import { MESSAGES } from '../utils/constants.js';
import { TOOLS } from './definitions.js';
import {
  handleCreateReminder,
  handleCreateReminderList,
  handleDeleteReminder,
  handleDeleteReminderList,
  handleReadReminderLists,
  handleReadReminders,
  handleUpdateReminder,
  handleUpdateReminderList,
} from './handlers.js';

/**
 * Routes tool calls to the appropriate handler based on the tool name
 * @param name - Name of the tool to call
 * @param args - Arguments for the tool
 * @returns Result of the tool call
 */
export async function handleToolCall(
  name: string,
  args?: RemindersToolArgs | ListsToolArgs,
): Promise<CallToolResult> {
  switch (name) {
    case 'reminders': {
      const action = args?.action;
      if (!args) {
        return {
          content: [
            {
              type: 'text',
              text: 'No arguments provided',
            },
          ],
          isError: true,
        };
      }
      switch (action) {
        case 'read':
          return handleReadReminders(args);
        case 'create':
          return handleCreateReminder(args);
        case 'update':
          return handleUpdateReminder(args);
        case 'delete':
          return handleDeleteReminder(args);
        default:
          return {
            content: [
              {
                type: 'text',
                text: MESSAGES.ERROR.UNKNOWN_ACTION(
                  'reminders',
                  String(action),
                ),
              },
            ],
            isError: true,
          };
      }
    }
    case 'lists': {
      const action = args?.action;
      switch (action) {
        case 'read':
          return handleReadReminderLists();
        case 'create': {
          const listArgs = args as ListsToolArgs;
          if (!listArgs.name) {
            return {
              content: [
                {
                  type: 'text',
                  text: MESSAGES.ERROR.INPUT_VALIDATION_FAILED(
                    'Name is required for list creation',
                  ),
                },
              ],
              isError: true,
            };
          }
          return handleCreateReminderList({
            action: 'create',
            name: listArgs.name,
          });
        }
        case 'update': {
          const listArgs = args as ListsToolArgs;
          if (!listArgs.name || !listArgs.newName) {
            return {
              content: [
                {
                  type: 'text',
                  text: MESSAGES.ERROR.INPUT_VALIDATION_FAILED(
                    'Name and newName are required for list update',
                  ),
                },
              ],
              isError: true,
            };
          }
          return handleUpdateReminderList({
            action: 'update',
            name: listArgs.name,
            newName: listArgs.newName,
          });
        }
        case 'delete': {
          const listArgs = args as ListsToolArgs;
          if (!listArgs.name) {
            return {
              content: [
                {
                  type: 'text',
                  text: MESSAGES.ERROR.INPUT_VALIDATION_FAILED(
                    'Name is required for list deletion',
                  ),
                },
              ],
              isError: true,
            };
          }
          return handleDeleteReminderList({
            action: 'delete',
            name: listArgs.name,
          });
        }
        default:
          return {
            content: [
              {
                type: 'text',
                text: MESSAGES.ERROR.UNKNOWN_ACTION('lists', String(action)),
              },
            ],
            isError: true,
          };
      }
    }
    default:
      return {
        content: [
          {
            type: 'text',
            text: MESSAGES.ERROR.UNKNOWN_TOOL(name),
          },
        ],
        isError: true,
      };
  }
}

export { TOOLS };
