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

    it('should contain reminders tool definition', () => {
      const remindersTool = TOOLS.find((tool) => tool.name === 'reminders');
      expect(remindersTool).toBeDefined();
      expect(remindersTool?.description).toContain('Manages reminders');
      expect(remindersTool?.inputSchema).toBeDefined();
      expect(remindersTool?.inputSchema.type).toBe('object');
    });

    it('should contain lists tool definition', () => {
      const listsTool = TOOLS.find((tool) => tool.name === 'lists');
      expect(listsTool).toBeDefined();
      expect(listsTool?.description).toContain('Manages reminder lists');
      expect(listsTool?.inputSchema).toBeDefined();
      expect(listsTool?.inputSchema.type).toBe('object');
    });

    it('should contain calendar tool definition', () => {
      const calendarTool = TOOLS.find((tool) => tool.name === 'calendar');
      expect(calendarTool).toBeDefined();
      expect(calendarTool?.description).toContain('Manages calendar events');
      expect(calendarTool?.inputSchema).toBeDefined();
      expect(calendarTool?.inputSchema.type).toBe('object');
    });

    it('should contain permissions tool definition', () => {
      const permissionsTool = TOOLS.find((tool) => tool.name === 'permissions');
      expect(permissionsTool).toBeDefined();
      expect(permissionsTool?.description).toContain(
        'Checks and requests calendar or reminders access',
      );
      expect(permissionsTool?.inputSchema?.type).toBe('object');
    });

    it('should have correct reminder actions enum', () => {
      const remindersTool = TOOLS.find((tool) => tool.name === 'reminders');
      const actionEnum = (
        remindersTool?.inputSchema.properties?.action as
          | { enum?: readonly string[] }
          | undefined
      )?.enum;
      expect(actionEnum).toEqual(['read', 'create', 'update', 'delete']);
    });

    it('should have correct list actions enum', () => {
      const listsTool = TOOLS.find((tool) => tool.name === 'lists');
      const actionEnum = (
        listsTool?.inputSchema.properties?.action as
          | { enum?: readonly string[] }
          | undefined
      )?.enum;
      expect(actionEnum).toEqual(['read', 'create', 'update', 'delete']);
    });

    it('should have correct calendar actions enum', () => {
      const calendarTool = TOOLS.find((tool) => tool.name === 'calendar');
      const actionEnum = (
        calendarTool?.inputSchema.properties?.action as
          | { enum?: readonly string[] }
          | undefined
      )?.enum;
      expect(actionEnum).toEqual(['read', 'create', 'update', 'delete']);
    });

    it('should have correct permission actions enum', () => {
      const permissionsTool = TOOLS.find((tool) => tool.name === 'permissions');
      const actionEnum = (
        permissionsTool?.inputSchema.properties?.action as
          | { enum?: readonly string[] }
          | undefined
      )?.enum;
      expect(actionEnum).toEqual(['status', 'request']);
    });

    it('should require target scope for permissions tool', () => {
      const permissionsTool = TOOLS.find((tool) => tool.name === 'permissions');
      const target = permissionsTool?.inputSchema.properties?.target as
        | { enum?: readonly string[] }
        | undefined;
      expect(target?.enum).toEqual(['reminders', 'calendar']);
    });

    it('should have correct dueWithin options enum', () => {
      const remindersTool = TOOLS.find((tool) => tool.name === 'reminders');
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
