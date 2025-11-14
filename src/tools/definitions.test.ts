/**
 * Tests for tools/definitions.ts
 */

import { TOOLS } from './definitions.js';

describe('Tools Definitions', () => {
  describe('TOOLS export', () => {
    it.each([
      {
        name: 'reminders_tasks',
        description: 'Manages reminder tasks',
        actions: ['read', 'create', 'update', 'delete'],
      },
      {
        name: 'reminders_lists',
        description: 'Manages reminder lists',
        actions: ['read', 'create', 'update', 'delete'],
      },
      {
        name: 'calendar_events',
        description: 'Manages calendar events',
        actions: ['read', 'create', 'update', 'delete'],
      },
      {
        name: 'calendar_calendars',
        description: 'Reads calendar collections',
        actions: ['read'],
      },
    ])(
      'should define $name tool with correct schema and actions',
      ({ name, description, actions }) => {
        const tool = TOOLS.find((t) => t.name === name);
        expect(tool).toBeDefined();
        expect(tool?.description).toContain(description);
        expect(tool?.inputSchema).toBeDefined();
        expect(tool?.inputSchema.type).toBe('object');

        const actionEnum = (
          tool?.inputSchema.properties?.action as
            | { enum?: readonly string[] }
            | undefined
        )?.enum;
        expect(actionEnum).toEqual(actions);
      },
    );

    it('should have correct dueWithin options enum', () => {
      const remindersTool = TOOLS.find(
        (tool) => tool.name === 'reminders_tasks',
      );
      const dueWithinEnum = (
        remindersTool?.inputSchema.properties?.dueWithin as
          | { enum?: readonly string[] }
          | undefined
      )?.enum;
      expect(dueWithinEnum).toEqual([
        'today',
        'tomorrow',
        'this-week',
        'overdue',
        'no-date',
      ]);
    });

    it('should enforce tool name pattern compliance', () => {
      const pattern = /^[a-zA-Z0-9_-]+$/;
      const invalidTool = TOOLS.find((tool) => !pattern.test(tool.name));
      expect(invalidTool).toBeUndefined();
    });
  });
});
