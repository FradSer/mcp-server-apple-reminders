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
import {
  getFuzzyTimeSuggestions,
  getTimeContext,
} from '../utils/timeHelpers.js';
import {
  APPLE_REMINDERS_LIMITATIONS,
  BATCHING_CONSTRAINTS,
  buildStandardOutputFormat,
  CALENDAR_INTEGRATION_CONSTRAINTS,
  CALENDAR_PERMISSION_CONSTRAINTS,
  CONFIDENCE_CONSTRAINTS,
  CONTEXT_CALIBRATION,
  DEEP_WORK_CONSTRAINTS,
  NOTE_FORMATTING_CONSTRAINTS,
  TIME_BLOCK_CREATION_CONSTRAINTS,
  TIME_CONSISTENCY_CONSTRAINTS,
  WORKLOAD_CALIBRATION,
} from './promptAbstractions.js';

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

/**
 * Build daily task organizer prompt for same-day task management
 *
 * Creates an intelligent daily task organization prompt that analyzes existing
 * reminders, identifies gaps, and proactively creates or optimizes reminders
 * with appropriate time-based properties.
 *
 * @param args - Organization arguments
 * @param args.today_focus - Optional focus area (e.g., "urgency-based", "gap filling")
 * @returns Structured prompt response with executable action queue
 *
 * @example
 * ```typescript
 * // Comprehensive organization
 * const prompt = buildDailyTaskOrganizerPrompt({});
 *
 * // Focused on urgent tasks
 * const urgentPrompt = buildDailyTaskOrganizerPrompt({
 *   today_focus: 'urgency-based organization'
 * });
 * ```
 */
const buildDailyTaskOrganizerPrompt = (
  args: DailyTaskOrganizerArgs,
): PromptResponse => {
  const todayFocus = args.today_focus ?? '';
  const timeContext = getTimeContext();
  const fuzzyTimes = getFuzzyTimeSuggestions();
  const standardOutput = buildStandardOutputFormat(timeContext.currentDate);

  return {
    description:
      'Proactive daily task organization with intelligent reminder creation and optimization',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission:
            'Mission: Transform daily tasks into organized, actionable reminders by analyzing urgency patterns, identifying gaps, and taking initiative to create or optimize reminders with appropriate properties.',
          contextInputs: [
            `Organization focus: ${todayFocus || 'comprehensive task organization including urgency-based organization, gap filling, and reminder setup'}`,
            `Time horizon: today's schedule only — operate within ${timeContext.currentDate}.`,
            "Action scope: existing reminders and potential gaps tied to today's calendar commitments",
            `Current time context: ${timeContext.timeDescription} (${timeContext.currentDate})`,
            `Same-day fuzzy windows: later today (${fuzzyTimes.laterToday}).`,
          ],
          process: [
            'Analyze existing reminders: inventory by completion status, urgency signals (due dates, list assignments), energy requirements, and due dates.',
            'Identify optimization opportunities: misplaced urgency (inappropriate due dates), missing due dates, inappropriate list assignments.',
            'Detect task gaps: missing preparatory steps, follow-up tasks, or related reminders that should exist.',
            'Estimate effort for each actionable reminder: classify as Quick Win (5-15 minutes, schedule as 15-minute calendar holds when time blocking is required) or Standard Task (30-60 minutes, schedule as 30-, 45-, or 60-minute holds). Flag anything above 60 minutes for task splitting suggestions.',
            'Run idempotency checks before creating anything: search for likely duplicates by normalized title (lowercase, trimmed, punctuation removed). Prefer updating an existing reminder over creating a duplicate.',
            'Group actions for efficiency: Batch tool calls (creates/updates) in logical chunks to minimize the number of calls.',
            'When adjusting or creating multiple reminders due today with explicit due times, schedule matching calendar.events time blocks aligned to those due windows to protect focus capacity. Anchor each start time by subtracting the mapped duration so the block finishes at or slightly before the reminder due timestamp.',
            `Build due date strings explicitly with today's date (${timeContext.currentDate}) to prevent accidental back-dating, especially for morning commitments.`,
            'Assess confidence levels for each potential action (high >80%, medium 60-80%, low <60%).',
            'Generate specific actions: create new reminders, adjust existing properties (due date, list), update list assignments using lists tool.',
            'For high-confidence actions (>80%), immediately call the reminders.tasks tool to create/update reminders. For medium-confidence actions, provide recommendations in tool call format. For low-confidence actions, ask for user confirmation.',
          ],
          constraints: [
            // Daily-task-organizer specific constraints
            'Take initiative and make reasonable assumptions about user preferences and task urgency patterns.',
            'Create new reminders when gaps are identified and confidence is medium or higher.',
            'Adjust reminder properties (due date, list) when optimization opportunities are clear. Note: Apple Reminders does not support priority fields - use due date urgency and list importance instead.',
            'Keep all scheduling decisions within today unless the user explicitly authorizes deferring beyond the current day.',
            'Redirect multi-day planning needs to the weekly planning workflow instead of stretching this prompt beyond today.',
            'Do not modify recurrence rules, attachments, or sub-tasks unless explicitly requested by the user.',
            'Never schedule past times: if the target time is earlier than now, push it forward to the next viable slot and explain the adjustment.',
            `When labeling an action as "today" or "this morning", use the exact format "${timeContext.currentDate} HH:mm:ss" (local time) in tool arguments and verify the saved value matches.`,
            'Reminder duration estimates are for workload assessment only—do NOT create calendar events solely because a duration was recorded.',
            'When effort exceeds 60 minutes, recommend splitting into multiple subtasks that each fit within Quick Win or Standard Task bounds; highlight how related subtasks can share a deep work block.',
            'When calendar blocking is warranted, convert Quick Win clusters into 15-minute events and Standard Task clusters into 30-, 45-, or 60-minute events, starting each block so it ends at or immediately before the reminder due timestamp.',
            'Assume standard working hours (9am-6pm) and reasonable task durations unless context suggests otherwise.',
            // Shared constraint patterns
            ...CONFIDENCE_CONSTRAINTS,
            ...TIME_CONSISTENCY_CONSTRAINTS,
            ...NOTE_FORMATTING_CONSTRAINTS,
            ...TIME_BLOCK_CREATION_CONSTRAINTS,
            ...DEEP_WORK_CONSTRAINTS,
            ...CALENDAR_PERMISSION_CONSTRAINTS,
            ...CALENDAR_INTEGRATION_CONSTRAINTS,
            ...BATCHING_CONSTRAINTS,
          ],
          outputFormat: [
            '### Current state — brief overview with key metrics: total tasks, overdue items, urgent tasks (due today or soon), and main issues identified.',
            '### Gaps found — missing preparatory steps, follow-up tasks, or related reminders that should be created.',
            ...standardOutput.actionQueue,
            "### Questions — concise list of missing context (capacity, hard stop times, list preferences) needed to safely finalize today's plan when confidence is below 60%.",
            standardOutput.verificationLog,
            '### Quick wins — 2-3 immediately actionable tasks that can be completed within 15 minutes, each with reminder title, list name, and duration annotation when helpful.',
            '### Standard tasks — highlight 30-60 minute commitments, grouped by project when possible, and note when task splitting or deep work batching is required.',
          ],
          qualityBar: [
            'Current state provides clear metrics and context about the task landscape.',
            'Gaps found section identifies specific missing tasks that should be created.',
            'Action queue prioritizes actions by confidence level and impact.',
            'High-confidence actions (>80%) are ACTUALLY EXECUTED using MCP tool calls (reminders.tasks or calendar.events tools), not just described. Medium-confidence actions are provided as recommendations in tool call format.',
            'Each action includes specific tool calls (reminders.tasks or calendar.events) with exact property settings in proper MCP tool call format.',
            'Calendar tool is ONLY used when explicitly creating time blocks identified in the output. Regular tasks use reminders.tasks tool.',
            'When multiple due-today reminders require fixed scheduling, calendar.events time blocks are created using each reminder due time as the anchor.',
            'Actions are clearly labeled with confidence levels (high >80%, medium 60-80%, low <60%) and include brief rationale.',
            'Time consistency is enforced: immediate actions have urgent due dates, quick wins have same-day due dates.',
            'Due dates and list assignments align with action urgency: critical blockers = urgent due dates + important list, quick wins = same-day due dates.',
            'Quick wins are genuinely achievable within 15 minutes, map to 15-minute calendar blocks when scheduled, and remain immediately actionable.',
            'Standard tasks are scoped to 30-60 minutes, map to 30-, 45-, or 60-minute calendar blocks when scheduled, and are grouped for potential deep work batching.',
            'Calendar events show start/end times that are anchored to each reminder due timestamp by subtracting the mapped duration so the block ends at or just before the deadline.',
            'Response focuses on actionable organization rather than extensive analysis.',
            'Note modifications follow strict criteria: only critical completion information with >90% confidence, using concise keyword annotations without IDs or bracketed titles.',
            'Notes preserve original user content after any brief annotations and avoid markdown checkboxes or decorative formatting.',
            'Assumptions are clearly stated when making urgency-based or gap-filling decisions.',
            'No duplicate reminders are created; similar items are merged or updated.',
            'Tool calls are batched sensibly; the number of calls is minimized while keeping actions atomic.',
            `Any due date labeled as "today" uses ${timeContext.currentDate} in both the tool call arguments and the persisted reminder record.`,
          ],
          calibration: [
            ...WORKLOAD_CALIBRATION,
            ...CONTEXT_CALIBRATION,
            ...APPLE_REMINDERS_LIMITATIONS,
          ],
        }),
      ),
    ],
  };
};

/**
 * Build smart reminder creator prompt for single reminder creation
 *
 * Creates a focused prompt for crafting a single Apple Reminder with optimal
 * scheduling, context, and metadata based on a task idea.
 *
 * @param args - Reminder creation arguments
 * @param args.task_idea - Optional task description to convert into reminder
 * @returns Structured prompt response for creating a single reminder
 *
 * @example
 * ```typescript
 * // Create reminder from task idea
 * const prompt = buildSmartReminderCreatorPrompt({
 *   task_idea: 'Submit quarterly report by Friday'
 * });
 * ```
 */
const buildSmartReminderCreatorPrompt = (
  args: SmartReminderCreatorArgs,
): PromptResponse => {
  const taskIdea = args.task_idea ?? '';
  const timeContext = getTimeContext();
  const standardOutput = buildStandardOutputFormat(timeContext.currentDate);

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
            `Current time context: ${timeContext.timeDescription} (${timeContext.currentDate})`,
          ],
          process: [
            'Identify the primary execution scope, reference any overlapping reminders, and confirm intent before building the structure.',
            'Probe for missing critical context (location, collaborators, blockers, effort) so the reminder captures everything needed to start.',
            "Shape the reminder title, list placement, and fuzzy timing so it fits the user's schedule and urgency signals.",
            'Define supporting metadata—notes, subtasks, attachments—that clarify success criteria without inflating scope.',
            'Run idempotency checks: search for likely duplicates by normalized title before creating.',
            'Assess confidence level for the creation action (high >80%, medium 60-80%, low <60%).',
            'For high-confidence actions (>80%), immediately call the reminders.tasks tool to create the reminder. For medium-confidence, provide recommendation in tool call format. For low-confidence, ask for confirmation.',
            'Outline optional follow-up nudges only if the user has opted in, keeping them tied to the same objective.',
          ],
          constraints: [
            'Use fuzzy time expressions for scheduling (for example, "later today" or "end of week") and clarify only when precision is mandatory.',
            'Ask for missing critical details before locking the reminder; if answers are unavailable, surface assumptions for confirmation.',
            'Only rely on capabilities shipped with Apple Reminders without assuming third-party integrations.',
            'Limit the workflow to the specific reminder the user has asked about—do not create additional tasks unless they explicitly request them.',
            'Present follow-up or escalation reminders as opt-in suggestions and only when they serve the primary execution scope.',
            'Explicitly surface the primary execution focus before detailing the reminder structure.',
            ...CONFIDENCE_CONSTRAINTS,
            ...NOTE_FORMATTING_CONSTRAINTS,
            ...BATCHING_CONSTRAINTS,
          ],
          outputFormat: [
            '### Primary focus — one sentence naming the reminder objective and scope.',
            ...standardOutput.actionQueue,
            '### Support details — bullet list covering notes, subtasks, and relevant metadata.',
            '### Follow-up sequence — ordered list of optional next nudges (omit if the user declined additional reminders).',
            standardOutput.verificationLog,
            '### Risks — short bullet list of potential failure points, assumptions, and mitigation ideas.',
          ],
          qualityBar: [
            'Reminder timing aligns with importance and respects existing commitments.',
            'All dependencies are either satisfied or have explicit opt-in follow-up reminders.',
            'Output highlights any assumptions the user must confirm before saving the reminder.',
            'Each suggestion is actionable, tied to a specific reminder list, and anchored in the declared scope.',
            'High-confidence actions (>80%) are ACTUALLY EXECUTED using MCP tool calls. Medium-confidence actions are provided as recommendations in tool call format.',
            'Actions are clearly labeled with confidence levels (high >80%, medium 60-80%, low <60%) and include brief rationale.',
            'Recommendations remain lightweight and sustainable to execute.',
            'Response honors the no-extra-reminders rule, keeps optional items clearly labelled, and reiterates the main execution scope.',
            'No duplicate reminders are created; similar items are merged or updated.',
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

/**
 * Build reminder review assistant prompt for cleanup and optimization
 *
 * Creates a prompt that audits current reminders and delivers actionable
 * clean-up, scheduling, and habit recommendations to boost completion rates.
 *
 * @param args - Review arguments
 * @param args.review_focus - Optional focus area (e.g., "overdue", list name)
 * @returns Structured prompt response with cleanup recommendations
 *
 * @example
 * ```typescript
 * // Review all reminders
 * const prompt = buildReminderReviewAssistantPrompt({});
 *
 * // Focus on overdue items
 * const overduePrompt = buildReminderReviewAssistantPrompt({
 *   review_focus: 'overdue reminders'
 * });
 * ```
 */
const buildReminderReviewAssistantPrompt = (
  args: ReminderReviewAssistantArgs,
): PromptResponse => {
  const reviewFocus = args.review_focus ?? '';
  const timeContext = getTimeContext();
  const standardOutput = buildStandardOutputFormat(timeContext.currentDate);

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
            `Current time context: ${timeContext.timeDescription} (${timeContext.currentDate})`,
          ],
          process: [
            'Inventory reminders by status, list, and due window to surface hotspots.',
            'Diagnose root causes behind overdue or low-value reminders.',
            'Prioritize clean-up actions: archive, consolidate, retitle, or re-sequence reminders.',
            'Assess confidence levels for each cleanup action (high >80%, medium 60-80%, low <60%).',
            'For high-confidence cleanup actions (>80%), immediately execute using reminders.tasks tool. For medium-confidence, provide recommendations in tool call format. For low-confidence, ask for confirmation.',
            'Optimise scheduling with fuzzy time adjustments and batching opportunities.',
            'Recommend routines and automation that maintain a healthy reminder system.',
          ],
          constraints: [
            'Reference fuzzy time adjustments when suggesting new schedules or follow-ups.',
            'If critical context (volume, recurring tasks, shared lists) is missing, request it before final guidance.',
            'Keep recommendations grounded in Apple Reminders native functionality and settings.',
            'Do not invent brand-new reminders or tasks—limit guidance to curating and refining the existing set unless the user explicitly opts in.',
            'Call out the primary review scope or list focus before diving into detailed recommendations.',
            ...CONFIDENCE_CONSTRAINTS,
            ...NOTE_FORMATTING_CONSTRAINTS,
            ...BATCHING_CONSTRAINTS,
          ],
          outputFormat: [
            '### Focus alignment — short paragraph identifying the primary review scope and headline issues.',
            '### Current state — brief overview with key metrics: total reminders reviewed, overdue items, stale reminders, main issues identified.',
            '### Findings — bullet list of key insights about the current reminder landscape.',
            ...standardOutput.actionQueue,
            standardOutput.verificationLog,
          ],
          qualityBar: [
            'Every suggested action ties back to a specific reminder list or identifiable pattern.',
            'High-confidence cleanup actions (>80%) are ACTUALLY EXECUTED using MCP tool calls. Medium-confidence actions are provided as recommendations.',
            'Actions are clearly labeled with confidence levels (high >80%, medium 60-80%, low <60%) and include brief rationale.',
            'Proposed routines are lightweight enough to sustain weekly without tool fatigue.',
            'Risks or dependencies (shared ownership, mandatory notifications) are surfaced with mitigation ideas.',
            'Response adheres to the no-new-reminders rule and makes the main review scope unmistakable.',
            'No duplicate reminders are created; similar items are merged or updated.',
          ],
          calibration: [
            'If the inventory reveals more work than can be actioned immediately, flag phased recommendations with prioritized batches.',
          ],
        }),
      ),
    ],
  };
};

/**
 * Build weekly planning workflow prompt for scheduling reminders
 *
 * Creates a prompt for building a resilient weekly execution playbook by
 * assigning appropriate due dates to existing reminders, aligned with user
 * planning ideas and current priorities.
 *
 * @param args - Weekly planning arguments
 * @param args.user_ideas - Optional planning thoughts for the week
 * @returns Structured prompt response with weekly scheduling plan
 *
 * @example
 * ```typescript
 * // Plan week with user ideas
 * const prompt = buildWeeklyPlanningWorkflowPrompt({
 *   user_ideas: 'Focus on project launch and client presentations'
 * });
 *
 * // Auto-plan based on existing reminders
 * const autoPrompt = buildWeeklyPlanningWorkflowPrompt({});
 * ```
 */
const buildWeeklyPlanningWorkflowPrompt = (
  args: WeeklyPlanningWorkflowArgs,
): PromptResponse => {
  const userIdeas = args.user_ideas ?? '';
  const timeContext = getTimeContext();
  const standardOutput = buildStandardOutputFormat(timeContext.currentDate);

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
            'Time horizon: current calendar week — keep scheduling inside this range and surface overflow separately.',
            'Existing reminders without due dates that need scheduling.',
            'Existing reminders with due dates this week (anchor events).',
            'Overdue reminders that may need rescheduling.',
            'Calendar events or fixed commitments that create time constraints.',
            `Current time context: ${timeContext.timeDescription} - ${timeContext.dayOfWeek}, ${timeContext.currentDate}`,
          ],
          process: [
            'Analyze user ideas to identify key priorities, themes, and desired outcomes for the week.',
            'Audit all existing reminders: categorize by list, urgency signals (due dates, list assignments), dependencies, and current due date status.',
            'Map fixed anchor events (existing due dates, calendar commitments) to create immovable time blocks.',
            'Match reminders to user priorities: assign fuzzy due dates to reminders that align with user ideas.',
            'Distribute remaining reminders across the week using intelligent scheduling: balance workload, avoid overloaded days, group similar tasks.',
            'Assess confidence levels for each scheduling decision (high >80%, medium 60-80%, low <60%).',
            'For high-confidence scheduling actions (>80%), immediately execute updates using reminders.tasks tool. For medium-confidence, provide recommendations in tool call format. For low-confidence, ask for confirmation.',
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
            'Keep scheduling decisions inside the current week and flag anything that must move beyond it for separate follow-up.',
            'Do not assign due dates beyond this week unless the user explicitly directs it.',
            ...CONFIDENCE_CONSTRAINTS,
            ...NOTE_FORMATTING_CONSTRAINTS,
            ...BATCHING_CONSTRAINTS,
          ],
          outputFormat: [
            '### Weekly focus — brief summary of primary themes and priorities for the week based on user ideas.',
            '### Current state — overview with metrics: total reminders to schedule, already scheduled, overdue items.',
            ...standardOutput.actionQueue,
            '### Immediate next steps — what to do today and tomorrow to get the week started effectively.',
            '### Workload insights — key observations about task distribution, conflicts, or dependencies that need attention.',
            standardOutput.verificationLog,
          ],
          qualityBar: [
            'Weekly focus clearly identifies primary themes and priorities based on user input.',
            'Current state provides clear metrics about the scheduling landscape.',
            'High-confidence scheduling actions (>80%) are ACTUALLY EXECUTED using MCP tool calls. Medium-confidence actions are provided as recommendations.',
            'Actions are clearly labeled with confidence levels (high >80%, medium 60-80%, low <60%) and include brief rationale.',
            'Each action includes specific reminder titles, lists, and fuzzy due dates.',
            'Immediate next steps give clear guidance for today and tomorrow actions.',
            'Workload insights highlight important patterns, conflicts, or dependencies without being overwhelming.',
            'Plan maintains realistic workload distribution across the week.',
            'Response focuses on execution rather than extensive analysis.',
            'No duplicate reminders are created; similar items are merged or updated.',
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
        'Proactive daily task organization with intelligent reminder creation and optimization',
      arguments: [
        {
          name: 'today_focus',
          description:
            'Organization focus area (e.g., urgency-based organization, gap filling, reminder setup, or comprehensive organization)',
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
