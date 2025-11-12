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
    expect(text).toMatch(
      /schedule matching calendar\.events time blocks aligned to those due windows/i,
    );
    expect(text).toMatch(/use the exact format "\d{4}-\d{2}-\d{2} HH:mm:ss"/i);
    expect(text).toMatch(
      /Name deep work blocks using the pattern "Deep Work — \[Project Name]/i,
    );
    expect(text).toMatch(/Time block length: 60-90 minutes recommended/i);
    expect(text).toMatch(/Ensure the block spans the reminder's due time/i);
    expect(text).toMatch(
      /Daily deep work capacity: Plan (two|2)-(three|3) deep work blocks per day/i,
    );
    expect(text).toMatch(/Break intervals: Schedule 15-20 minute breaks/i);
    expect(text).toMatch(
      /Standard tasks — highlight 30-60 minute commitments/i,
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
    expect(text).toMatch(
      /calendar\.events time blocks are created using each reminder due time as the anchor/i,
    );
  });
});
