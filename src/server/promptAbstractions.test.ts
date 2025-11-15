/**
 * server/promptAbstractions.test.ts
 * Tests for shared prompt abstraction functions
 */

import {
  buildConfidenceAction,
  buildTimeFormat,
  buildToolCall,
  CONFIDENCE_THRESHOLDS,
  formatConfidenceAction,
  getConfidenceLevel,
} from './promptAbstractions.js';

describe('Confidence Level System', () => {
  it('should correctly categorize high confidence (>80%)', () => {
    expect(getConfidenceLevel(85)).toBe('HIGH');
    expect(getConfidenceLevel(90)).toBe('HIGH');
    expect(getConfidenceLevel(100)).toBe('HIGH');
  });

  it('should correctly categorize medium confidence (60-80%)', () => {
    expect(getConfidenceLevel(60)).toBe('MEDIUM');
    expect(getConfidenceLevel(70)).toBe('MEDIUM');
    expect(getConfidenceLevel(80)).toBe('MEDIUM');
  });

  it('should correctly categorize low confidence (<60%)', () => {
    expect(getConfidenceLevel(0)).toBe('LOW');
    expect(getConfidenceLevel(30)).toBe('LOW');
    expect(getConfidenceLevel(59)).toBe('LOW');
  });

  it('should use consistent threshold values', () => {
    expect(CONFIDENCE_THRESHOLDS.HIGH).toBe(80);
    expect(CONFIDENCE_THRESHOLDS.MEDIUM).toBe(60);
    expect(CONFIDENCE_THRESHOLDS.LOW).toBe(0);
  });
});

describe('Tool Call Formatting', () => {
  it('should build tool call with proper structure', () => {
    const toolCall = buildToolCall('reminders_tasks', {
      action: 'create',
      title: 'Test Reminder',
      targetList: 'Work',
    });

    expect(toolCall).toEqual({
      tool: 'reminders_tasks',
      args: {
        action: 'create',
        title: 'Test Reminder',
        targetList: 'Work',
      },
    });
  });

  it('should support calendar tool calls', () => {
    const toolCall = buildToolCall('calendar_events', {
      action: 'create',
      title: 'Deep Work Block',
      startDate: '2025-11-04 14:00:00',
      endDate: '2025-11-04 16:00:00',
    });

    expect(toolCall.tool).toBe('calendar_events');
    expect(toolCall.args.action).toBe('create');
  });
});

describe('Time Format Building', () => {
  it('should format date to YYYY-MM-DD HH:mm:ss', () => {
    const date = new Date('2025-11-04T14:30:45');
    const formatted = buildTimeFormat(date);
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('should pad single digit values with zero', () => {
    const date = new Date('2025-01-05T09:05:03');
    const formatted = buildTimeFormat(date);
    expect(formatted).toBe('2025-01-05 09:05:03');
  });
});

describe('Confidence Action Building', () => {
  it('should build high confidence action with execution', () => {
    const action = buildConfidenceAction({
      percentage: 95,
      action: 'Creating reminder for critical task',
      toolCall: buildToolCall('reminders_tasks', {
        action: 'create',
        title: 'Critical Task',
        targetList: 'Work',
        dueDate: '2025-11-04 18:00:00',
      }),
      rationale: 'Task is clearly defined and urgency is high',
    });

    expect(action.confidence).toBe('HIGH');
    expect(action.percentage).toBe(95);
    expect(action.toolCall).toBeDefined();
    expect(action.isRecommendation).toBe(false);
  });

  it('should build medium confidence action with recommendation', () => {
    const action = buildConfidenceAction({
      percentage: 70,
      action: 'Creating reminder for potential task',
      toolCall: buildToolCall('reminders_tasks', {
        action: 'create',
        title: 'Potential Task',
        targetList: 'Inbox',
      }),
      rationale: 'Task seems relevant but needs confirmation',
      isRecommendation: true,
    });

    expect(action.confidence).toBe('MEDIUM');
    expect(action.percentage).toBe(70);
    expect(action.isRecommendation).toBe(true);
  });

  it('should build low confidence action without tool call', () => {
    const action = buildConfidenceAction({
      percentage: 45,
      action: 'Consider creating reminder',
      rationale: 'Insufficient context to proceed',
    });

    expect(action.confidence).toBe('LOW');
    expect(action.percentage).toBe(45);
    expect(action.toolCall).toBeUndefined();
  });
});

describe('Confidence Action Formatting', () => {
  it('should format high confidence action for execution', () => {
    const action = buildConfidenceAction({
      percentage: 95,
      action: 'Creating reminder',
      toolCall: buildToolCall('reminders_tasks', {
        action: 'create',
        title: 'Test Task',
      }),
      rationale: 'Clear and actionable',
    });

    const formatted = formatConfidenceAction(action);
    expect(formatted).toContain('HIGH CONFIDENCE (95%)');
    expect(formatted).toContain('Tool: reminders_tasks');
    expect(formatted).toContain('Args:');
    expect(formatted).toContain('Rationale: Clear and actionable');
  });

  it('should format medium confidence action as recommendation', () => {
    const action = buildConfidenceAction({
      percentage: 70,
      action: 'Create reminder',
      toolCall: buildToolCall('reminders_tasks', { action: 'create' }),
      rationale: 'Needs verification',
      isRecommendation: true,
    });

    const formatted = formatConfidenceAction(action);
    expect(formatted).toContain('MEDIUM CONFIDENCE (70%)');
    expect(formatted).toContain('RECOMMENDATION');
    expect(formatted).toContain('Suggested tool call');
    expect(formatted).toContain('Rationale: Needs verification');
  });

  it('should format low confidence action as question', () => {
    const action = buildConfidenceAction({
      percentage: 45,
      action: 'Consider creating reminder for unclear task',
      rationale: 'Insufficient information',
    });

    const formatted = formatConfidenceAction(action);
    expect(formatted).toContain('LOW CONFIDENCE (45%)');
    expect(formatted).not.toContain('Tool:');
  });

  it('should format recommendation with tool call suggestion', () => {
    const action = buildConfidenceAction({
      percentage: 75,
      action: 'Consider creating reminder',
      toolCall: buildToolCall('reminders_tasks', {
        action: 'create',
        title: 'Suggested Task',
      }),
      rationale: 'Seems relevant but needs confirmation',
      isRecommendation: true,
    });

    const formatted = formatConfidenceAction(action);
    expect(formatted).toContain('MEDIUM CONFIDENCE (75%)');
    expect(formatted).toContain('RECOMMENDATION - Consider creating reminder');
    expect(formatted).toContain('Suggested tool call: reminders_tasks');
    expect(formatted).toContain('Rationale: Seems relevant but needs confirmation');
  });

  it('should format action with tool call and rationale', () => {
    const action = buildConfidenceAction({
      percentage: 85,
      action: 'Update existing reminder',
      toolCall: buildToolCall('reminders_tasks', {
        action: 'update',
        id: '123',
        title: 'Updated Task',
      }),
      rationale: 'Task details need correction',
    });

    const formatted = formatConfidenceAction(action);
    expect(formatted).toContain('HIGH CONFIDENCE (85%)');
    expect(formatted).toContain('Update existing reminder');
    expect(formatted).toContain('Tool: reminders_tasks');
    expect(formatted).toContain('Args:');
    expect(formatted).toContain('\nRationale: Task details need correction');
  });
});

describe('Constraint Consistency', () => {
  it('should provide confidence constraints', () => {
    const { CONFIDENCE_CONSTRAINTS } =
      require('./promptAbstractions.js') as typeof import('./promptAbstractions.js');
    expect(CONFIDENCE_CONSTRAINTS).toContain(
      'Assess confidence levels for each potential action (high >80%, medium 60-80%, low <60%).',
    );
  });

  it('should provide note formatting constraints', () => {
    const { NOTE_FORMATTING_CONSTRAINTS } =
      require('./promptAbstractions.js') as typeof import('./promptAbstractions.js');
    expect(
      NOTE_FORMATTING_CONSTRAINTS.some(
        (c: string) => c.includes('plain text') || c.includes('bullets'),
      ),
    ).toBe(true);
  });

  it('should provide batching constraints', () => {
    const { BATCHING_CONSTRAINTS } =
      require('./promptAbstractions.js') as typeof import('./promptAbstractions.js');
    expect(
      BATCHING_CONSTRAINTS.some((c: string) =>
        c.includes('idempotency checks'),
      ),
    ).toBe(true);
  });

  it('should describe focus sprint time blocks and anchoring', () => {
    const { TIME_BLOCK_CREATION_CONSTRAINTS } =
      require('./promptAbstractions.js') as typeof import('./promptAbstractions.js');
    // Focus Sprint naming has been removed in the refactoring
    // Check for anchoring guidance instead
    expect(
      TIME_BLOCK_CREATION_CONSTRAINTS.some((c: string) =>
        c.includes('Anchor calendar events to reminder due timestamps'),
      ),
    ).toBe(true);
  });

  it('should keep deep work anchoring guidance with short-burst carve out', () => {
    const { DEEP_WORK_CONSTRAINTS } =
      require('./promptAbstractions.js') as typeof import('./promptAbstractions.js');
    // Tasks <60 minutes guidance removed (moved to TIME_BLOCK_CREATION_CONSTRAINTS)
    // Check for anchoring guidance
    expect(
      DEEP_WORK_CONSTRAINTS.some((c: string) =>
        c.includes('Anchor to due times'),
      ),
    ).toBe(true);
  });

  it('should provide shallow tasks constraints', () => {
    const { SHALLOW_TASKS_CONSTRAINTS } =
      require('./promptAbstractions.js') as typeof import('./promptAbstractions.js');
    expect(SHALLOW_TASKS_CONSTRAINTS.length).toBeGreaterThan(0);
    expect(
      SHALLOW_TASKS_CONSTRAINTS.some((c: string) =>
        c.includes('Shallow tasks time block guidelines'),
      ),
    ).toBe(true);
    expect(
      SHALLOW_TASKS_CONSTRAINTS.some((c: string) =>
        c.includes('15-60 minutes for all non-deep-work activities'),
      ),
    ).toBe(true);
  });

  it('should provide daily capacity constraints with implicit buffer time', () => {
    const { DAILY_CAPACITY_CONSTRAINTS } =
      require('./promptAbstractions.js') as typeof import('./promptAbstractions.js');
    expect(DAILY_CAPACITY_CONSTRAINTS.length).toBeGreaterThan(0);
    expect(
      DAILY_CAPACITY_CONSTRAINTS.some((c: string) =>
        c.includes('Daily capacity limits and workload balancing'),
      ),
    ).toBe(true);
    expect(
      DAILY_CAPACITY_CONSTRAINTS.some((c: string) =>
        c.includes('Deep Work maximum: 4 hours per day'),
      ),
    ).toBe(true);
    expect(
      DAILY_CAPACITY_CONSTRAINTS.some((c: string) =>
        c.includes('Implicit buffer allocation'),
      ),
    ).toBe(true);
    expect(
      DAILY_CAPACITY_CONSTRAINTS.some((c: string) =>
        c.includes('~20% of working hours unscheduled'),
      ),
    ).toBe(true);
  });
});
