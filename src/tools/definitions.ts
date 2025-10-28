/**
 * tools/definitions.ts
 * MCP tool definitions for Apple Reminders server with comprehensive type safety and validation
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import type {
  DueWithinOption,
  ListAction,
  OrganizeStrategy,
  ReminderAction,
} from '../types/index.js';

/**
 * Const assertions for tool schema validation
 */
const REMINDER_ACTIONS: readonly ReminderAction[] = [
  'read',
  'create',
  'update',
  'delete',
  'bulk_create',
  'bulk_update',
  'bulk_delete',
] as const;

const LIST_ACTIONS: readonly ListAction[] = [
  'read',
  'create',
  'update',
  'delete',
] as const;

const DUE_WITHIN_OPTIONS: readonly DueWithinOption[] = [
  'today',
  'tomorrow',
  'this-week',
  'overdue',
  'no-date',
] as const;

const ORGANIZE_STRATEGIES: readonly OrganizeStrategy[] = [
  'priority',
  'due_date',
  'category',
  'completion_status',
] as const;

/**
 * Optimized tool definitions following MCP best practices
 */
export const TOOLS: Tool[] = [
  {
    name: 'reminders',
    description:
      'Comprehensive reminder management tool with action-based operations. Supports listing, creating, updating, deleting, moving, and organizing reminders across different lists.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: REMINDER_ACTIONS,
          description: 'Operation to perform on reminders',
        },

        // List operation parameters
        filterList: {
          type: 'string',
          description:
            "Name of the reminder list to filter by. Examples: 'Reminders', 'Work', 'Personal', 'Shopping'",
          minLength: 1,
          maxLength: 100,
        },
        showCompleted: {
          type: 'boolean',
          description:
            'Include completed reminders in results (list action only)',
          default: false,
        },
        search: {
          type: 'string',
          description: 'Search term to filter reminders by title or content',
          maxLength: 100,
        },
        dueWithin: {
          type: 'string',
          enum: DUE_WITHIN_OPTIONS,
          description: 'Filter reminders by due date range',
        },

        // Single item operation parameters
        title: {
          type: 'string',
          description:
            'Reminder title (REQUIRED for create, update, delete, move actions)',
          minLength: 1,
          maxLength: 200,
        },
        newTitle: {
          type: 'string',
          description: 'New title for reminder (update action only)',
          minLength: 1,
          maxLength: 200,
        },
        dueDate: {
          type: 'string',
          description:
            "Due date in format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'",
          pattern: '^\\d{4}-\\d{2}-\\d{2}(\\s\\d{2}:\\d{2}:\\d{2})?$',
        },
        note: {
          type: 'string',
          description: 'Additional notes or description for the reminder',
          maxLength: 2000,
        },
        url: {
          type: 'string',
          description: 'URL to associate with the reminder',
          format: 'uri',
          maxLength: 500,
        },
        completed: {
          type: 'boolean',
          description: 'Mark reminder as completed (update action only)',
        },
        targetList: {
          type: 'string',
          description: 'Target list for create/update operations',
          minLength: 1,
          maxLength: 100,
        },

        // Bulk operation parameters
        items: {
          type: 'array',
          description: 'Array of items for bulk operations',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                minLength: 1,
                maxLength: 200,
              },
              dueDate: {
                type: 'string',
                pattern: '^\\d{4}-\\d{2}-\\d{2}(\\s\\d{2}:\\d{2}:\\d{2})?$',
              },
              note: {
                type: 'string',
                maxLength: 2000,
              },
              url: {
                type: 'string',
                format: 'uri',
                maxLength: 500,
              },
              targetList: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
              },
            },
            required: ['title'],
          },
        },
        criteria: {
          type: 'object',
          description: 'Criteria for bulk operations',
          properties: {
            search: {
              type: 'string',
              maxLength: 100,
            },
            dueWithin: {
              type: 'string',
              enum: DUE_WITHIN_OPTIONS,
            },
            completed: {
              type: 'boolean',
            },
            sourceList: {
              type: 'string',
              maxLength: 100,
            },
          },
        },
        updates: {
          type: 'object',
          description: 'Updates to apply in bulk operations',
          properties: {
            newTitle: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
            },
            dueDate: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}(\\s\\d{2}:\\d{2}:\\d{2})?$',
            },
            note: {
              type: 'string',
              maxLength: 2000,
            },
            url: {
              type: 'string',
              format: 'uri',
              maxLength: 500,
            },
            completed: {
              type: 'boolean',
            },
            targetList: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
            },
          },
        },
        organizeBy: {
          type: 'string',
          enum: ORGANIZE_STRATEGIES,
          description:
            'Strategy for organizing reminders in bulk_update operations',
        },
        createLists: {
          type: 'boolean',
          description:
            'Create new lists automatically during bulk organization',
          default: true,
        },
      },
      required: ['action'],
      additionalProperties: false,
      dependentSchemas: {
        action: {
          oneOf: [
            // Read action - no additional requirements
            {
              properties: {
                action: { const: 'read' },
              },
            },
            // Create action requirements
            {
              properties: {
                action: { const: 'create' },
              },
              required: ['title'],
            },
            // Update action requirements
            {
              properties: {
                action: { const: 'update' },
              },
              required: ['title'],
            },
            // Delete action requirements
            {
              properties: {
                action: { const: 'delete' },
              },
              required: ['title'],
            },
            // Bulk create action requirements
            {
              properties: {
                action: { const: 'bulk_create' },
              },
              required: ['items'],
            },
            // Bulk update action requirements
            {
              properties: {
                action: { const: 'bulk_update' },
              },
              required: ['criteria', 'updates'],
            },
            // Bulk delete action requirements
            {
              properties: {
                action: { const: 'bulk_delete' },
              },
              required: ['criteria'],
            },
          ],
        },
      },
    },
  },
  {
    name: 'lists',
    description:
      'Manage reminder lists - view existing lists or create new ones for organizing reminders',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: LIST_ACTIONS,
          description: 'Operation to perform on reminder lists',
        },
        name: {
          type: 'string',
          description:
            'Name for new reminder list (REQUIRED for create action) or current name for update/delete actions',
          minLength: 1,
          maxLength: 100,
        },
        newName: {
          type: 'string',
          description:
            'New name for reminder list (REQUIRED for update action)',
          minLength: 1,
          maxLength: 100,
        },
      },
      required: ['action'],
      additionalProperties: false,
      oneOf: [
        // Read action - no additional requirements
        {
          properties: {
            action: { const: 'read' },
          },
          additionalProperties: true,
        },
        // Create action requirements for lists
        {
          properties: {
            action: { const: 'create' },
          },
          required: ['name'],
        },
        // Update action requirements for lists
        {
          properties: {
            action: { const: 'update' },
          },
          required: ['name', 'newName'],
        },
        // Delete action requirements for lists
        {
          properties: {
            action: { const: 'delete' },
          },
          required: ['name'],
        },
      ],
    },
  },
];
