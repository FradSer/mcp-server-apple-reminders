import { PROMPTS } from './prompts.js';

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
});
