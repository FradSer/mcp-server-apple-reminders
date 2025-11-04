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
  const timeContext = getTimeContext();
  const fuzzyTimes = getFuzzyTimeSuggestions();

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
            'Action scope: all active reminders and potential new reminders for today',
            `Current time context: ${timeContext.timeDescription} (${timeContext.currentDate})`,
            `Fuzzy time suggestions available: later today (${fuzzyTimes.laterToday}), tomorrow morning (${fuzzyTimes.tomorrow}), end of week (${fuzzyTimes.endOfWeek})`,
          ],
          process: [
            'Analyze existing reminders: inventory by completion status, urgency signals (due dates, list assignments), energy requirements, and due dates.',
            'Identify optimization opportunities: misplaced urgency (inappropriate due dates), missing due dates, inappropriate list assignments.',
            'Detect task gaps: missing preparatory steps, follow-up tasks, or related reminders that should exist.',
            'Assess confidence levels for each potential action (high >80%, medium 60-80%, low <60%).',
            'Generate specific actions: create new reminders, adjust existing properties (due date, list), update list assignments using lists tool.',
            'For high-confidence actions (>80%), immediately call the reminders tool to create/update reminders. For medium-confidence actions, provide recommendations in tool call format. For low-confidence actions, ask for user confirmation.',
          ],
          constraints: [
            'Take initiative and make reasonable assumptions about user preferences and task urgency patterns.',
            'Create new reminders when gaps are identified and confidence is medium or higher.',
            'Adjust reminder properties (due date, list) when optimization opportunities are clear. Note: Apple Reminders does not support priority fields - use due date urgency and list importance instead.',
            'CRITICAL time consistency rules: ALWAYS align due dates with action urgency and list importance:',
            '- "RIGHT NOW", "IMMEDIATE", or "CRITICAL BLOCKER" actions → due within 2 hours of current time, assign to important/urgent list',
            '- "Quick Wins" (15-minute tasks) → due same day, ideally within 4 hours or end of work day (6PM)',
            '- "Today" actions → due before 6PM same day',
            '- "Critical blocker" tasks → urgent due dates (same day), assign to important list',
            '- NEVER set distant due dates (tomorrow or later) for time-sensitive actions described as immediate',
            'Strict note modification rules: ONLY modify reminder notes when ALL conditions are met: (a) adding CRITICAL completion information (missing resources, blocking issues, required coordination), (b) confidence >90%, (c) information is essential for task completion, (d) user has not explicitly requested to preserve notes.',
            'For note modifications, use the format: "CRITICAL: [reason] - [specific information]" at the beginning of notes. Preserve existing note content unless it conflicts with critical information.',
            'Add related reminders as deep links in notes using structured format with relationship types:',
            '  - Group reminders by relationship type: Dependencies, Follow-up tasks, Related reminders, Blocked by, Prerequisites',
            '  - Format: "Related reminders:\n[Dependencies/Follow-up tasks/etc]:\n- [Reminder Title](x-reminders://reminder?id={reminderId}) (List Name)\n- [Another Title](x-reminders://reminder?id={reminderId2})"',
            '  - Place related reminders section at the end of notes, after any CRITICAL information',
            '  - Example complete note format: "CRITICAL: Blocked by - Need approval from manager\n\nOriginal note content\n\nRelated reminders:\nDependencies:\n- [Get manager approval](x-reminders://reminder?id=abc123) (Work)"',
            'IMPORTANT: The system automatically normalizes and validates reminder deep links (x-reminders://reminder?id={id}) format. If you provide malformed links, they will be automatically corrected. However, always aim to use the correct format: x-reminders://reminder?id={reminderId} where {reminderId} is the actual reminder ID.',
            'Never modify notes for: task optimization, urgency guidance, execution suggestions, or general improvements - create new reminders instead.',
            'Only ask for confirmation when confidence is low (<60%) or when decisions significantly impact user workflow.',
            'Provide brief rationale for medium-confidence decisions before taking action.',
            'Assume standard working hours (9am-6pm) and reasonable task durations unless context suggests otherwise.',
          ],
          outputFormat: [
            '### Current state — brief overview with key metrics: total tasks, overdue items, urgent tasks (due today or soon), and main issues identified.',
            '### Gaps found — missing preparatory steps, follow-up tasks, or related reminders that should be created.',
            '### Action queue — prioritized list of actions organized by confidence level (high/medium/low) and impact. IMPORTANT: High-confidence actions (>80%) should be EXECUTED immediately using MCP tool calls, not just described. Each action should specify:',
            '  - For HIGH CONFIDENCE (>80%): Actually call the reminders tool with action="create" or action="update". Format: "HIGH CONFIDENCE (95%): Creating reminder\nTool: reminders\nArgs: {action: "create", title: "Submit report", targetList: "Work", dueDate: "2025-01-15 18:00:00", note: "CRITICAL: Blocked by - Need approval from manager first"}"',
            '  - For MEDIUM CONFIDENCE (60-80%): Provide recommendation in tool call format, marked as "RECOMMENDATION". Format: "MEDIUM CONFIDENCE (75%): RECOMMENDATION - Create reminder\nSuggested tool call: reminders with {action: "create", title: "...", targetList: "...", dueDate: "YYYY-MM-DD HH:mm:ss"}\nRationale: [brief explanation]"',
            '  - For LOW CONFIDENCE (<60%): Text description only, ask for confirmation. Format: "LOW CONFIDENCE (50%): Consider creating reminder for [task]. Should I proceed?"',
            '  - Each action must include: confidence level, action type (create/update/recommendation), exact reminder properties (title, list, dueDate in format "YYYY-MM-DD HH:mm:ss" for local time, note if applicable, url if applicable), and brief rationale',
            '  - IMPORTANT: Use local time format "YYYY-MM-DD HH:mm:ss" for dueDate (e.g., "2025-11-04 18:00:00" for today 6PM). Do NOT use UTC format with "Z" suffix unless explicitly needed - this prevents timezone conversion errors.',
            '### Quick wins — 2-3 immediately actionable tasks that can be completed within 15 minutes, each with reminder title and list name.',
          ],
          qualityBar: [
            'Current state provides clear metrics and context about the task landscape.',
            'Gaps found section identifies specific missing tasks that should be created.',
            'Action queue prioritizes actions by confidence level and impact.',
            'High-confidence actions (>80%) are ACTUALLY EXECUTED using MCP tool calls, not just described. Medium-confidence actions are provided as recommendations in tool call format.',
            'Each action includes specific reminder tool calls (create/update) with exact property settings in proper MCP tool call format.',
            'Actions are clearly labeled with confidence levels (high >80%, medium 60-80%, low <60%) and include brief rationale.',
            'Time consistency is enforced: immediate actions have urgent due dates, quick wins have same-day due dates.',
            'Due dates and list assignments align with action urgency: critical blockers = urgent due dates + important list, quick wins = same-day due dates.',
            'Quick wins are genuinely achievable within 15 minutes and immediately actionable.',
            'Response focuses on actionable organization rather than extensive analysis.',
            'Note modifications follow strict criteria: only critical completion information with >90% confidence.',
            'Related reminders are linked using x-reminders:// deep links with structured formatting: grouped by relationship type (Dependencies, Follow-up tasks, etc.) and placed at the end of notes.',
            'Note format preserves original content: CRITICAL information at the beginning, original notes in the middle, related reminders section at the end.',
            'Assumptions are clearly stated when making urgency-based or gap-filling decisions.',
          ],
          calibration: [
            'When workload appears overwhelming, prioritize critical path tasks (using urgent due dates and important lists) and suggest deferring non-essential items.',
            'If multiple similar tasks exist, recommend consolidation or batching strategies.',
            'When creating reminders for unknown tasks, use clear, descriptive titles and suggest appropriate list placement.',
            'Remember: Apple Reminders does not support priority fields. Use due date urgency and list importance to convey task importance.',
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
            "Shape the reminder title, list placement, and fuzzy timing so it fits the user's schedule and urgency signals.",
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
            'Response honors the no-extra-reminders rule, keeps optional items clearly labelled, and reiterates the main execution scope.',
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
            'Prioritize clean-up actions: archive, consolidate, retitle, or re-sequence reminders.',
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
            'If the inventory reveals more work than can be actioned immediately, flag phased recommendations with prioritized batches.',
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
  const timeContext = getTimeContext();

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
            `Current time context: ${timeContext.timeDescription} - ${timeContext.dayOfWeek}, ${timeContext.currentDate}`,
          ],
          process: [
            'Analyze user ideas to identify key priorities, themes, and desired outcomes for the week.',
            'Audit all existing reminders: categorize by list, urgency signals (due dates, list assignments), dependencies, and current due date status.',
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
            '### Weekly focus — brief summary of primary themes and priorities for the week based on user ideas.',
            '### Action plan — unified table with columns: reminder title, current list, suggested due date (fuzzy time), urgency level (based on due date), notes/conflicts.',
            '### Immediate next steps — what to do today and tomorrow to get the week started effectively.',
            '### Workload insights — key observations about task distribution, conflicts, or dependencies that need attention.',
          ],
          qualityBar: [
            'Weekly focus clearly identifies primary themes and priorities based on user input.',
            'Action plan provides a unified, scannable table with all necessary task information.',
            'Immediate next steps give clear guidance for today and tomorrow actions.',
            'Workload insights highlight important patterns, conflicts, or dependencies without being overwhelming.',
            'Each recommendation includes specific reminder titles, lists, and fuzzy due dates.',
            'Plan maintains realistic workload distribution across the week.',
            'Response focuses on execution rather than extensive analysis.',
            'Action plan consolidates all task assignments in a single, easy-to-follow table.',
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
