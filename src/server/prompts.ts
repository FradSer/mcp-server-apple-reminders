/**
 * server/prompts.ts
 * Central registry for MCP prompts and their runtime helpers
 */

import type {
  DailyTaskOrganizerArgs,
  PromptMetadata,
  PromptName,
  PromptResponse,
  PromptTemplate,
  ReminderReviewAssistantArgs,
  SmartReminderCreatorArgs,
  WeeklyPlanningWorkflowArgs,
} from '../types/prompts.js';

type PromptRegistry = {
  [K in PromptName]: PromptTemplate<K>;
};

const createMessage = (text: string): PromptResponse['messages'][number] => ({
  role: 'user',
  content: {
    type: 'text',
    text,
  },
});

interface StructuredPromptConfig {
  mission: string;
  contextInputs: string[];
  process: string[];
  outputFormat: string[];
  qualityBar: string[];
  constraints?: string[];
  calibration?: string[];
}

const createStructuredPrompt = ({
  mission,
  contextInputs,
  process,
  outputFormat,
  qualityBar,
  constraints = [],
  calibration = [],
}: StructuredPromptConfig): string => {
  const sections: string[] = [
    'You are an Apple Reminders strategist and productivity coach.',
    mission,
    'Context inputs:',
    ...contextInputs.map((input) => `- ${input}`),
    'Process:',
    ...process.map((step, index) => `${index + 1}. ${step}`),
  ];

  if (constraints.length > 0) {
    sections.push('Constraints:', ...constraints.map((line) => `- ${line}`));
  }

  sections.push('Output format:', ...outputFormat.map((line) => `- ${line}`));
  sections.push('Quality bar:', ...qualityBar.map((line) => `- ${line}`));

  if (calibration.length > 0) {
    sections.push('Calibration:', ...calibration.map((line) => `- ${line}`));
  }

  return sections.join('\n');
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const parseOptionalString = (value: unknown): string | undefined =>
  isNonEmptyString(value) ? value : undefined;

const buildDailyTaskOrganizerPrompt = (
  args: DailyTaskOrganizerArgs,
): PromptResponse => {
  const todayFocus = args.today_focus ?? '';

  return {
    description:
      'Comprehensive daily task organization workflow for Apple Reminders',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission:
            'Mission: Design a realistic today execution plan in Apple Reminders that keeps priority work flowing while balancing recovery time.',
          contextInputs: [
            `Today's focus ideas: ${todayFocus || 'none provided — analyze existing reminders and propose a balanced plan'}`,
            'Planning horizon: today',
          ],
          process: [
            'Map existing reminders, lists, and calendar obligations to surface constraints.',
            'Cluster tasks by priority and energy profile, highlighting blockers and dependencies.',
            'Sequence the day with focus blocks, recovery windows, and buffer time for surprises.',
            'Recommend reminder list placements, notes, and tagging updates for existing reminders, only flagging new reminder ideas when the user has already opted in.',
            'Define a lightweight review ritual to resync the system at the end of the day.',
          ],
          constraints: [
            'Use fuzzy time expressions when proposing schedules; invite the user to refine if exact times are required.',
            'Ask for missing critical context (capacity, deadlines, location) before finalising recommendations.',
            'Stay within capabilities of native Apple Reminders features available on iOS and macOS.',
            'Do not propose creating brand-new reminders or tasks unless the user explicitly requests them—focus on reorganising and sequencing existing work.',
            'Explicitly state the primary work scope or focus area before offering detailed guidance.',
          ],
          outputFormat: [
            '### Snapshot — bullet list summarising workload, active lists, primary work scope, and conflicts.',
            '### Daily timeline — Markdown table with columns: time window, focus, supporting reminder list.',
            '### Reminder adjustments — bullet list of existing reminders to reschedule, retag, or reprioritise with rationale. If the user explicitly asked for new reminders, mark them as opt-in suggestions.',
            '### Review cadence — single sentence describing the end-of-day reset.',
          ],
          qualityBar: [
            'Plan keeps highest-priority work front-loaded while safeguarding recovery space.',
            'Each recommendation references a concrete reminder list or note field to update.',
            'Dependencies and follow-ups include suggested fuzzy time reminders or check-ins.',
            'Every suggestion is actionable and tied to a specific reminder or list.',
            'Assumptions and risks are surfaced with mitigation ideas.',
            'Recommendations remain lightweight and sustainable to execute.',
            'Response honours the no-new-reminders rule unless the user has opted in and clearly identifies the main work scope.',
          ],
          calibration: [
            'If work exceeds available focus blocks, flag trade-offs and propose deferral logic.',
          ],
        }),
      ),
    ],
  };
};

const buildSmartReminderCreatorPrompt = (
  args: SmartReminderCreatorArgs,
): PromptResponse => {
  const taskIdea = args.task_idea ?? '';

  return {
    description:
      'Intelligent reminder creation with optimal scheduling and context',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission: `Mission: Craft a single Apple Reminder for "${
            taskIdea || "today's key task"
          }" that names the primary execution scope, avoids duplicates, and sets the user up to follow through.`,
          contextInputs: [
            `Task idea: ${taskIdea || 'none provided — propose a sensible framing and ask for confirmation'}`,
            'Existing reminder landscape to cross-check for duplicates or related work.',
          ],
          process: [
            'Identify the primary execution scope, reference any overlapping reminders, and confirm intent before building the structure.',
            'Probe for missing critical context (location, collaborators, blockers, effort) so the reminder captures everything needed to start.',
            'Shape the reminder title, list placement, and fuzzy timing so it fits the user’s schedule and priority signals.',
            'Define supporting metadata—notes, subtasks, attachments—that clarify success criteria without inflating scope.',
            'Outline optional follow-up nudges only if the user has opted in, keeping them tied to the same objective.',
          ],
          constraints: [
            'Use fuzzy time expressions for scheduling (for example, "later today" or "end of week") and clarify only when precision is mandatory.',
            'Ask for missing critical details before locking the reminder; if answers are unavailable, surface assumptions for confirmation.',
            'Only rely on capabilities shipped with Apple Reminders without assuming third-party integrations.',
            'Limit the workflow to the specific reminder the user has asked about—do not create additional tasks unless they explicitly request them.',
            'Present follow-up or escalation reminders as opt-in suggestions and only when they serve the primary execution scope.',
            'Explicitly surface the primary execution focus before detailing the reminder structure.',
          ],
          outputFormat: [
            '### Primary focus — one sentence naming the reminder objective and scope.',
            '### Core reminder — name, target reminder list, fuzzy timing window.',
            '### Support details — bullet list covering notes, subtasks, and relevant metadata.',
            '### Follow-up sequence — ordered list of optional next nudges (omit if the user declined additional reminders).',
            '### Risks — short bullet list of potential failure points, assumptions, and mitigation ideas.',
          ],
          qualityBar: [
            'Reminder timing aligns with importance and respects existing commitments.',
            'All dependencies are either satisfied or have explicit opt-in follow-up reminders.',
            'Output highlights any assumptions the user must confirm before saving the reminder.',
            'Each suggestion is actionable, tied to a specific reminder list, and anchored in the declared scope.',
            'Recommendations remain lightweight and sustainable to execute.',
            'Response honours the no-extra-reminders rule, keeps optional items clearly labelled, and reiterates the main execution scope.',
          ],
          calibration: [
            'If context is insufficient to schedule confidently, respond with targeted clarification questions before delivering the final structure.',
            'When the user has not opted into extra reminders, replace the follow-up section with a short note encouraging a future check-in instead of proposing new tasks.',
          ],
        }),
      ),
    ],
  };
};

const buildReminderReviewAssistantPrompt = (
  args: ReminderReviewAssistantArgs,
): PromptResponse => {
  const reviewFocus = args.review_focus ?? '';

  return {
    description:
      'Analyze and optimize existing reminders for better productivity',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission:
            'Mission: Audit current reminders and deliver actionable clean-up, scheduling, and habit recommendations that boost completion rates.',
          contextInputs: [
            `Review focus: ${reviewFocus || 'none provided — default to all lists and common hotspots'}`,
          ],
          process: [
            'Inventory reminders by status, list, and due window to surface hotspots.',
            'Diagnose root causes behind overdue or low-value reminders.',
            'Prioritise clean-up actions: archive, consolidate, retitle, or re-sequence reminders.',
            'Optimise scheduling with fuzzy time adjustments and batching opportunities.',
            'Recommend routines and automation that maintain a healthy reminder system.',
          ],
          constraints: [
            'Reference fuzzy time adjustments when suggesting new schedules or follow-ups.',
            'If critical context (volume, recurring tasks, shared lists) is missing, request it before final guidance.',
            'Keep recommendations grounded in Apple Reminders native functionality and settings.',
            'Do not invent brand-new reminders or tasks—limit guidance to curating and refining the existing set unless the user explicitly opts in.',
            'Call out the primary review scope or list focus before diving into detailed recommendations.',
          ],
          outputFormat: [
            '### Focus alignment — short paragraph identifying the primary review scope and headline issues.',
            '### Findings — bullet list of key insights about the current reminder landscape.',
            '### Clean-up actions — table with columns: reminder/list, action, rationale.',
          ],
          qualityBar: [
            'Every suggested action ties back to a specific reminder list or identifiable pattern.',
            'Proposed routines are lightweight enough to sustain weekly without tool fatigue.',
            'Risks or dependencies (shared ownership, mandatory notifications) are surfaced with mitigation ideas.',
            'Response adheres to the no-new-reminders rule and makes the main review scope unmistakable.',
          ],
          calibration: [
            'If the inventory reveals more work than can be actioned immediately, flag phased recommendations with prioritised batches.',
          ],
        }),
      ),
    ],
  };
};

const buildWeeklyPlanningWorkflowPrompt = (
  args: WeeklyPlanningWorkflowArgs,
): PromptResponse => {
  const userIdeas = args.user_ideas ?? '';

  return {
    description:
      'Assign due dates to existing reminders based on weekly planning ideas',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission:
            'Mission: Build a resilient weekly execution playbook by assigning appropriate due dates to existing reminders this week, aligned with user planning ideas and current priorities.',
          contextInputs: [
            `User planning ideas for this week: ${userIdeas || 'none provided - analyze existing reminders and suggest reasonable distribution'}`,
            'Existing reminders without due dates that need scheduling.',
            'Existing reminders with due dates this week (anchor events).',
            'Overdue reminders that may need rescheduling.',
            'Calendar events or fixed commitments that create time constraints.',
          ],
          process: [
            'Analyze user ideas to identify key priorities, themes, and desired outcomes for the week.',
            'Audit all existing reminders: categorize by list, priority signals, dependencies, and current due date status.',
            'Map fixed anchor events (existing due dates, calendar commitments) to create immovable time blocks.',
            'Match reminders to user priorities: assign fuzzy due dates to reminders that align with user ideas.',
            'Distribute remaining reminders across the week using intelligent scheduling: balance workload, avoid overloaded days, group similar tasks.',
            'Identify scheduling conflicts, overloaded days, or reminders that need clarification before assigning dates.',
            'Recommend review checkpoints and adjustments for maintaining the plan throughout the week.',
          ],
          constraints: [
            'DO NOT create any new reminders—only assign or update due dates for existing reminders.',
            'If user ideas suggest new work that cannot map to existing reminders, acknowledge it but do not create reminders.',
            'Use fuzzy time expressions (for example, "Monday morning", "mid-week", "Friday afternoon") when suggesting due dates.',
            'Respect existing due dates unless there is a clear conflict or the user ideas suggest reprioritization.',
            'Ensure suggested due dates are realistic and account for workload balance across days.',
            'Prioritize reminders that clearly align with user planning ideas when making scheduling decisions.',
            'Keep all recommendations achievable within Apple Reminders native functionality.',
            'If critical context (workload capacity, hard deadlines, shared lists) is missing, request it before final guidance.',
            'State the primary weekly focus or themes up front so the user sees where the plan is anchored.',
          ],
          outputFormat: [
            '### Weekly planning summary — brief paragraph interpreting user ideas, naming the primary focus/themes, and translating them into actionable planning priorities.',
            '### Due date assignments — Markdown table with columns: reminder title, current list, suggested due date (fuzzy time), priority rationale, notes.',
            '### Week timeline overview — Markdown table with columns: day, fuzzy time windows, primary themes, reminders assigned to each window.',
            '### Scheduling insights — bullet list highlighting workload distribution, potential conflicts, overloaded days, or reminders needing user input.',
            '### Review cadence — suggested checkpoints (for example, mid-week review) and contingency adjustments if priorities shift.',
          ],
          qualityBar: [
            'Due dates intelligently distribute workload, avoiding overloaded days while respecting user priorities.',
            'Every suggested due date includes clear rationale tied to user ideas or reminder dependencies.',
            'Scheduling respects existing deadlines and flags any recommended changes with justification.',
            'The plan maintains balance between focus work, administrative tasks, and recovery time.',
            'Conflicts and risks are surfaced with concrete mitigation suggestions.',
            'Each suggestion is actionable and tied to a specific reminder or list.',
            'Recommendations remain lightweight and sustainable to execute.',
            'Response reinforces the no-new-reminders rule and highlights the main weekly focus explicitly.',
          ],
          calibration: [
            'If user ideas cannot be mapped to existing reminders, summarize these as "future planning notes" without creating reminders.',
            'When workload appears excessive, propose explicit prioritization: which reminders are essential this week vs. can be deferred.',
            'If user provides no ideas, infer priorities from reminder patterns (urgency signals, list organization, dependencies) and ask for confirmation.',
          ],
        }),
      ),
    ],
  };
};

const PROMPTS: PromptRegistry = {
  'daily-task-organizer': {
    metadata: {
      name: 'daily-task-organizer',
      description:
        'Create a comprehensive daily task management workflow with Apple Reminders',
      arguments: [
        {
          name: 'today_focus',
          description:
            'Your focus ideas for today (what you most want to accomplish today)',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs: Record<string, unknown> | null | undefined) {
      const args = (rawArgs ?? {}) as Partial<DailyTaskOrganizerArgs>;
      return {
        today_focus: parseOptionalString(args.today_focus),
      };
    },
    buildPrompt: buildDailyTaskOrganizerPrompt,
  },
  'smart-reminder-creator': {
    metadata: {
      name: 'smart-reminder-creator',
      description:
        'Intelligently create reminders with optimal scheduling and context',
      arguments: [
        {
          name: 'task_idea',
          description: 'A short description of what you want to do',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs: Record<string, unknown> | null | undefined) {
      const args = (rawArgs ?? {}) as Partial<SmartReminderCreatorArgs>;
      return {
        task_idea: parseOptionalString(args.task_idea),
      };
    },
    buildPrompt: buildSmartReminderCreatorPrompt,
  },
  'reminder-review-assistant': {
    metadata: {
      name: 'reminder-review-assistant',
      description:
        'Analyze and review existing reminders for productivity optimization',
      arguments: [
        {
          name: 'review_focus',
          description:
            'A short note on what to review (e.g., overdue, a list name)',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs: Record<string, unknown> | null | undefined) {
      const args = (rawArgs ?? {}) as Partial<ReminderReviewAssistantArgs>;
      return {
        review_focus: parseOptionalString(args.review_focus),
      };
    },
    buildPrompt: buildReminderReviewAssistantPrompt,
  },
  'weekly-planning-workflow': {
    metadata: {
      name: 'weekly-planning-workflow',
      description:
        'Assign due dates to existing reminders based on your weekly planning ideas',
      arguments: [
        {
          name: 'user_ideas',
          description:
            'Your thoughts and ideas for what you want to accomplish this week',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs: Record<string, unknown> | null | undefined) {
      const args = (rawArgs ?? {}) as Partial<WeeklyPlanningWorkflowArgs>;
      return {
        user_ideas: parseOptionalString(args.user_ideas),
      };
    },
    buildPrompt: buildWeeklyPlanningWorkflowPrompt,
  },
};

export const PROMPT_LIST: PromptMetadata[] = Object.values(PROMPTS).map(
  (prompt) => prompt.metadata,
);

export const getPromptDefinition = (
  name: string,
): PromptTemplate<PromptName> | undefined =>
  (PROMPTS as Record<string, PromptTemplate<PromptName>>)[name];

export const buildPromptResponse = <Name extends PromptName>(
  template: PromptTemplate<Name>,
  rawArgs: Record<string, unknown> | null | undefined,
): PromptResponse => {
  const parsedArgs = template.parseArgs(rawArgs);
  return template.buildPrompt(parsedArgs);
};
