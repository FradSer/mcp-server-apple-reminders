import type { PromptResponse } from '../types/prompts.js';
import { buildPromptResponse, getPromptDefinition } from './prompts.js';

function getPromptText(response: PromptResponse): string {
  const [message] = response.messages;
  if (!message) {
    throw new Error('Prompt did not return any messages');
  }

  if (message.content.type !== 'text') {
    throw new Error('Prompt message content must be text');
  }

  return message.content.text;
}

describe('prompt time horizons', () => {
  it('keeps the daily organizer focused on today', () => {
    const template = getPromptDefinition('daily-task-organizer');
    if (!template) {
      throw new Error('daily-task-organizer prompt is not registered');
    }

    const response = buildPromptResponse(template, null);
    const text = getPromptText(response);

    expect(text).toContain("Time horizon: today's schedule only");
    expect(text).toMatch(/Keep all scheduling decisions within today/i);
  });

  it('keeps the weekly workflow focused on the current week', () => {
    const template = getPromptDefinition('weekly-planning-workflow');
    if (!template) {
      throw new Error('weekly-planning-workflow prompt is not registered');
    }

    const response = buildPromptResponse(template, null);
    const text = getPromptText(response);

    expect(text).toMatch(/Time horizon: current calendar week/i);
    expect(text).toMatch(/Keep scheduling decisions inside the current week/i);
  });

  it('daily organizer applies dedupe, batching, and recurrence safety', () => {
    const template = getPromptDefinition('daily-task-organizer');
    if (!template) {
      throw new Error('daily-task-organizer prompt is not registered');
    }

    const response = buildPromptResponse(template, null);
    const text = getPromptText(response);

    expect(text).toMatch(/Avoid duplicate reminders/i);
    expect(text).toMatch(/Batch tool calls/i);
    expect(text).toMatch(/Do not modify recurrence rules/i);
    expect(text).toMatch(
      /Build due date strings explicitly with today's date/i,
    );
    expect(text).toMatch(/use the exact format "\d{4}-\d{2}-\d{2} HH:mm:ss"/i);
    expect(text).toMatch(
      /Name deep work blocks using the pattern "Deep Work — \[Reminder Title]/i,
    );
    expect(text).toMatch(/Deep work blocks should last 90 minutes by default/i);
    expect(text).toMatch(/Ensure the block spans the reminder's due time/i);
    expect(text).toMatch(
      /Plan no more than (two|2) or (three|3) deep work blocks per day with 15-30 minute breaks/i,
    );
  });

  it('daily organizer provides a questions section for missing info', () => {
    const template = getPromptDefinition('daily-task-organizer');
    if (!template) {
      throw new Error('daily-task-organizer prompt is not registered');
    }

    const response = buildPromptResponse(template, null);
    const text = getPromptText(response);

    expect(text).toMatch(/### Questions/i);
    expect(text).toMatch(/### Verification log/i);
  });
});
