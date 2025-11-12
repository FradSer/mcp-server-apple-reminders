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

    expect(text).toMatch(/idempotency checks/i);
    expect(text).toMatch(/Batch tool calls/i);
    expect(text).toMatch(/Do not modify recurrence rules/i);
    expect(text).toMatch(
      /Build due date strings with today's date/i,
    );
    expect(text).toMatch(
      /CREATE calendar time blocks immediately for tasks/i,
    );
    expect(text).toMatch(
      /Deep Work \(60-90 minutes for cognitively demanding/i,
    );
    expect(text).toMatch(/Shallow Tasks \(15-60 minutes for routine work/i);
    expect(text).toMatch(
      /automatically reserves ~20% buffer time/i,
    );
    expect(text).toMatch(
      /anchor to reminder due times/i,
    );
    expect(text).toMatch(/use.*exact format.*\d{4}-\d{2}-\d{2} HH:mm:ss/i);
    expect(text).toMatch(
      /Name deep work blocks:.*"Deep Work — \[Project/i,
    );
    expect(text).toMatch(/Time block length: 60-90 minutes/i);
    expect(text).toMatch(/Tasks <60 minutes use Focus Sprint/i);
    expect(text).toMatch(/Anchor to due times:/i);
    expect(text).toMatch(
      /Plan 2-3 blocks per day, totaling 2-4 hours/i,
    );
    expect(text).toMatch(/Break intervals: 15-20 minutes between blocks/i);
    expect(text).toMatch(/### Deep work blocks/i);
    expect(text).toMatch(/### Shallow tasks/i);
    expect(text).not.toMatch(/### Buffer time/i); // Buffer time is now implicit

    expect(text).toMatch(/Focus Sprint — \[Outcome]/i);
    expect(text).toMatch(
      /Deep Work \(60-90 minutes|Shallow Tasks \(15-60 minutes/i,
    );
    expect(text).toMatch(
      /implicit buffer time.*natural gaps/i,
    );
    expect(text).toMatch(
      /Anchor.*due times|anchor to reminder due times/i,
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
      /CREATE calendar time blocks immediately for tasks with duration/i,
    );
  });

  it('daily organizer includes work category constraints and daily capacity limits', () => {
    const template = getPromptDefinition('daily-task-organizer');
    if (!template) {
      throw new Error('daily-task-organizer prompt is not registered');
    }

    const response = buildPromptResponse(template, null);
    const text = getPromptText(response);

    // Verify Deep Work constraints
    expect(text).toMatch(/Deep Work maximum: 4 hours per day/i);
    expect(text).toMatch(/60-90 minutes for cognitively demanding/i);

    // Verify Shallow Tasks constraints
    expect(text).toMatch(/15-60 minutes for all non-deep-work activities/i);
    expect(text).toMatch(/Shallow Task — \[Task Description\]/i);

    // Verify implicit buffer time handling
    expect(text).toMatch(/Implicit buffer allocation/i);
    expect(text).toMatch(/~20% of working hours unscheduled/i);
    expect(text).toMatch(
      /Do not create explicit "Buffer Time" calendar events/i,
    );

    // Verify daily capacity balancing
    expect(text).toMatch(/Daily capacity limits and workload balancing/i);
  });
});
