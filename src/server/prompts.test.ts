import { createStructuredPrompt, PROMPTS } from './prompts.js';

const promptsUnderTest = [
  'daily-task-organizer',
  'smart-reminder-creator',
  'reminder-review-assistant',
  'weekly-planning-workflow',
  'reminder-cleanup-guide',
  'goal-tracking-setup',
] as const;

const argsByPrompt: Record<(typeof promptsUnderTest)[number], unknown> = {
  'daily-task-organizer': {},
  'smart-reminder-creator': { task_description: 'draft launch email' },
  'reminder-review-assistant': {},
  'weekly-planning-workflow': {},
  'reminder-cleanup-guide': {},
  'goal-tracking-setup': { goal_type: 'fitness' },
};

describe('structured prompt templates', () => {
  it.each(promptsUnderTest)(
    '%s prompt includes structured guidance sections',
    (promptName) => {
      const prompt = PROMPTS[promptName].buildPrompt(
        argsByPrompt[promptName] as never,
      );

      const messageText = prompt.messages[0]?.content.text ?? '';

      expect(messageText).toContain(
        'You are an Apple Reminders strategist and productivity coach.',
      );
      expect(messageText).toContain('Context inputs:');
      expect(messageText).toContain('Process:');
      expect(messageText).toContain('Output format:');
      expect(messageText).toContain('Quality bar:');
      expect(messageText).toMatch(/fuzzy time/i);
    },
  );

  it('should handle prompts with provided constraints and calibration', () => {
    // Test that buildPrompt handles provided constraints and calibration arrays
    // All prompts pass constraints and calibration, so we test that path
    const prompt = PROMPTS['daily-task-organizer'].buildPrompt({} as never);
    const messageText = prompt.messages[0]?.content.text ?? '';
    expect(messageText).toBeDefined();
    expect(messageText.length).toBeGreaterThan(0);
    // daily-task-organizer has constraints and calibration, so they should be present
    expect(messageText).toContain('Constraints:');
    expect(messageText).toContain('Calibration:');
  });

  it('should handle prompts with provided constraints and calibration', () => {
    // Test that buildPrompt handles provided constraints and calibration arrays
    // This covers lines 47-48 in prompts.ts - when values are provided
    // smart-reminder-creator provides constraints and calibration
    const prompt = PROMPTS['smart-reminder-creator'].buildPrompt({
      task_description: 'Test task',
    } as never);
    const messageText = prompt.messages[0]?.content.text ?? '';
    expect(messageText).toBeDefined();
    // Should contain Constraints and Calibration sections when provided
    expect(messageText).toContain('Constraints:');
    expect(messageText).toContain('Calibration:');
  });

  it('should handle createStructuredPrompt with default constraints and calibration', () => {
    // Test default parameter branches (lines 47-48) by calling without passing constraints/calibration
    const result = createStructuredPrompt({
      mission: 'Test mission',
      contextInputs: ['Input 1'],
      process: ['Step 1'],
      outputFormat: ['Format 1'],
      qualityBar: ['Quality 1'],
      // Not passing constraints and calibration - should use defaults []
    });

    expect(result).toBeDefined();
    expect(result).toContain('Test mission');
    expect(result).toContain('Input 1');
    // When defaults are used (empty arrays), Constraints and Calibration sections should not appear
    expect(result).not.toContain('Constraints:');
    expect(result).not.toContain('Calibration:');
  });
});

describe('parseArgs functions', () => {
  describe('reminder-review-assistant parseArgs', () => {
    it('should parse valid args', () => {
      const parsed = PROMPTS['reminder-review-assistant'].parseArgs({
        review_type: 'weekly',
        list_name: 'Work',
      });
      expect(parsed.review_type).toBe('weekly');
      expect(parsed.list_name).toBe('Work');
    });

    it('should handle null args', () => {
      const parsed = PROMPTS['reminder-review-assistant'].parseArgs(null);
      expect(parsed.review_type).toBeUndefined();
      expect(parsed.list_name).toBeUndefined();
    });

    it('should handle undefined args', () => {
      const parsed = PROMPTS['reminder-review-assistant'].parseArgs(undefined);
      expect(parsed.review_type).toBeUndefined();
      expect(parsed.list_name).toBeUndefined();
    });

    it('should handle empty object', () => {
      const parsed = PROMPTS['reminder-review-assistant'].parseArgs({});
      expect(parsed.review_type).toBeUndefined();
      expect(parsed.list_name).toBeUndefined();
    });
  });

  describe('weekly-planning-workflow parseArgs', () => {
    it('should parse valid args', () => {
      const parsed = PROMPTS['weekly-planning-workflow'].parseArgs({
        user_ideas: 'Complete project',
      });
      expect(parsed.user_ideas).toBe('Complete project');
    });

    it('should handle null args', () => {
      const parsed = PROMPTS['weekly-planning-workflow'].parseArgs(null);
      expect(parsed.user_ideas).toBeUndefined();
    });

    it('should handle undefined args', () => {
      const parsed = PROMPTS['weekly-planning-workflow'].parseArgs(undefined);
      expect(parsed.user_ideas).toBeUndefined();
    });
  });

  describe('daily-task-organizer parseArgs', () => {
    it('should parse valid args', () => {
      const parsed = PROMPTS['daily-task-organizer'].parseArgs({
        task_category: 'work',
        priority_level: 'high',
        time_frame: 'today',
      });
      expect(parsed.task_category).toBe('work');
      expect(parsed.priority_level).toBe('high');
      expect(parsed.time_frame).toBe('today');
    });

    it('should handle null args', () => {
      const parsed = PROMPTS['daily-task-organizer'].parseArgs(null);
      expect(parsed.task_category).toBeUndefined();
      expect(parsed.priority_level).toBeUndefined();
      expect(parsed.time_frame).toBeUndefined();
    });

    it('should handle undefined args', () => {
      const parsed = PROMPTS['daily-task-organizer'].parseArgs(undefined);
      expect(parsed.task_category).toBeUndefined();
      expect(parsed.priority_level).toBeUndefined();
      expect(parsed.time_frame).toBeUndefined();
    });
  });

  describe('smart-reminder-creator parseArgs', () => {
    it('should parse valid args', () => {
      const parsed = PROMPTS['smart-reminder-creator'].parseArgs({
        task_description: 'Complete project',
        context: 'Urgent deadline',
        urgency: 'high',
      });
      expect(parsed.task_description).toBe('Complete project');
      expect(parsed.context).toBe('Urgent deadline');
      expect(parsed.urgency).toBe('high');
    });

    it('should throw error when required task_description is missing', () => {
      expect(() => {
        PROMPTS['smart-reminder-creator'].parseArgs(null);
      }).toThrow('task_description');
    });

    it('should throw error when task_description is undefined', () => {
      expect(() => {
        PROMPTS['smart-reminder-creator'].parseArgs(undefined);
      }).toThrow('task_description');
    });
  });

  describe('goal-tracking-setup parseArgs', () => {
    it('should parse valid args', () => {
      const parsed = PROMPTS['goal-tracking-setup'].parseArgs({
        goal_type: 'fitness',
        target_metric: 'lose 10kg',
        timeframe: '3 months',
      });
      expect(parsed.goal_type).toBe('fitness');
      // target_metric and timeframe are optional, so they may be undefined
      expect(parsed.target_metric).toBeUndefined();
      expect(parsed.timeframe).toBeUndefined();
    });

    it('should throw error when required goal_type is missing', () => {
      expect(() => {
        PROMPTS['goal-tracking-setup'].parseArgs(null);
      }).toThrow('goal_type');
    });

    it('should throw error when goal_type is undefined', () => {
      expect(() => {
        PROMPTS['goal-tracking-setup'].parseArgs(undefined);
      }).toThrow('goal_type');
    });
  });
});
