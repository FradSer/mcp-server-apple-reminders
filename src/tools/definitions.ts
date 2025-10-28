/**
 * tools/definitions.ts
 * MCP tool definitions for Apple Reminders server, adhering to standard JSON Schema.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

const REMINDER_ACTIONS = ['read', 'create', 'update', 'delete'] as const;
const LIST_ACTIONS = ['read', 'create', 'update', 'delete'] as const;
const DUE_WITHIN_OPTIONS = [
  'today',
  'tomorrow',
  'this-week',
  'overdue',
  'no-date',
] as const;

export const TOOLS: Tool[] = [
  {
    name: 'reminders',
    description:
      'Manages reminders. Supports reading, creating, updating, deleting, and moving reminders.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: REMINDER_ACTIONS,
          description: 'The operation to perform.',
        },
        // ID-based operations
        id: {
          type: 'string',
          description:
            'The unique identifier of the reminder (REQUIRED for update, delete, move; optional for read to get single reminder).',
        },
        // Creation/Update properties
        title: {
          type: 'string',
          description:
            'The title of the reminder (REQUIRED for create, optional for update).',
        },
        dueDate: {
          type: 'string',
          description:
            "Due date. Supported formats: 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', or ISO 8601 (e.g., '2025-10-30T04:00:00Z'). Timezone is optional.",
        },
        note: {
          type: 'string',
          description: 'Additional notes for the reminder.',
        },
        url: {
          type: 'string',
          description: 'A URL to associate with the reminder.',
          format: 'uri',
        },
        completed: {
          type: 'boolean',
          description: 'The completion status of the reminder (for update).',
        },
        targetList: {
          type: 'string',
          description: 'The name of the list for create or update operations.',
        },
        // Read filters
        filterList: {
          type: 'string',
          description: 'Filter reminders by a specific list name.',
        },
        showCompleted: {
          type: 'boolean',
          description: 'Include completed reminders in the results.',
          default: false,
        },
        search: {
          type: 'string',
          description: 'A search term to filter reminders by title or notes.',
        },
        dueWithin: {
          type: 'string',
          enum: DUE_WITHIN_OPTIONS,
          description: 'Filter reminders by a due date range.',
        },
      },
      required: ['action'],
      dependentSchemas: {
        action: {
          oneOf: [
            { properties: { action: { const: 'read' } } },
            {
              properties: { action: { const: 'create' } },
              required: ['title'],
            },
            { properties: { action: { const: 'update' } }, required: ['id'] },
            { properties: { action: { const: 'delete' } }, required: ['id'] },
          ],
        },
      },
    },
  },
  {
    name: 'lists',
    description:
      'Manages reminder lists. Supports reading, creating, updating, and deleting lists.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: LIST_ACTIONS,
          description: 'The operation to perform on a list.',
        },
        name: {
          type: 'string',
          description:
            'The current name of the list (for update, delete) or the name of the new list (for create).',
        },
        newName: {
          type: 'string',
          description: 'The new name for the list (for update).',
        },
      },
      required: ['action'],
      dependentSchemas: {
        action: {
          oneOf: [
            { properties: { action: { const: 'read' } } },
            { properties: { action: { const: 'create' } }, required: ['name'] },
            {
              properties: { action: { const: 'update' } },
              required: ['name', 'newName'],
            },
            { properties: { action: { const: 'delete' } }, required: ['name'] },
          ],
        },
      },
    },
  },
];
