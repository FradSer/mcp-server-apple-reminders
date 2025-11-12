/**
 * Tests for tools/definitions.ts
 */

import { TOOLS } from './definitions.js';

describe('Tools Definitions', () => {
  describe('TOOLS export', () => {
    it('should export TOOLS array', () => {
      expect(TOOLS).toBeDefined();
      expect(Array.isArray(TOOLS)).toBe(true);
      expect(TOOLS.length).toBe(4);
    });

    it('should contain reminders.tasks tool definition', () => {
      const remindersTool = TOOLS.find(
        (tool) => tool.name === 'reminders.tasks',
      );
      expect(remindersTool).toBeDefined();
      expect(remindersTool?.description).toContain('Manages reminder tasks');
      expect(remindersTool?.inputSchema).toBeDefined();
      expect(remindersTool?.inputSchema.type).toBe('object');
    });

    it('should contain reminders.lists tool definition', () => {
      const listsTool = TOOLS.find((tool) => tool.name === 'reminders.lists');
      expect(listsTool).toBeDefined();
      expect(listsTool?.description).toContain('Manages reminder lists');
      expect(listsTool?.inputSchema).toBeDefined();
      expect(listsTool?.inputSchema.type).toBe('object');
    });

    it('should contain calendar.events tool definition', () => {
      const calendarTool = TOOLS.find(
        (tool) => tool.name === 'calendar.events',
      );
      expect(calendarTool).toBeDefined();
      expect(calendarTool?.description).toContain('Manages calendar events');
      expect(calendarTool?.inputSchema).toBeDefined();
      expect(calendarTool?.inputSchema.type).toBe('object');
    });

    it('should contain calendar.calendars tool definition', () => {
      const calendarsTool = TOOLS.find(
        (tool) => tool.name === 'calendar.calendars',
      );
      expect(calendarsTool).toBeDefined();
      expect(calendarsTool?.description).toContain(
        'Reads calendar collections',
      );
      expect(calendarsTool?.inputSchema).toBeDefined();
      expect(calendarsTool?.inputSchema.type).toBe('object');
    });

    it('should have correct reminder actions enum', () => {
      const remindersTool = TOOLS.find(
        (tool) => tool.name === 'reminders.tasks',
      );
      const actionEnum = (
        remindersTool?.inputSchema.properties?.action as
          | { enum?: readonly string[] }
          | undefined
      )?.enum;
      expect(actionEnum).toEqual(['read', 'create', 'update', 'delete']);
    });

    it('should have correct list actions enum', () => {
      const listsTool = TOOLS.find((tool) => tool.name === 'reminders.lists');
      const actionEnum = (
        listsTool?.inputSchema.properties?.action as
          | { enum?: readonly string[] }
          | undefined
      )?.enum;
      expect(actionEnum).toEqual(['read', 'create', 'update', 'delete']);
    });

    it('should have correct calendar event actions enum', () => {
      const calendarTool = TOOLS.find(
        (tool) => tool.name === 'calendar.events',
      );
      const actionEnum = (
        calendarTool?.inputSchema.properties?.action as
          | { enum?: readonly string[] }
          | undefined
      )?.enum;
      expect(actionEnum).toEqual(['read', 'create', 'update', 'delete']);
    });

    it('should have correct calendar list actions enum', () => {
      const calendarsTool = TOOLS.find(
        (tool) => tool.name === 'calendar.calendars',
      );
      const actionEnum = (
        calendarsTool?.inputSchema.properties?.action as
          | { enum?: readonly string[] }
          | undefined
      )?.enum;
      expect(actionEnum).toEqual(['read']);
    });

    it('should have correct dueWithin options enum', () => {
      const remindersTool = TOOLS.find(
        (tool) => tool.name === 'reminders.tasks',
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
  });
});
