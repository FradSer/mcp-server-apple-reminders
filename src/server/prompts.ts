/**
 * server/prompts.ts
 * Central registry for MCP prompts and their runtime helpers
 */

import type {
  DailyTaskOrganizerArgs,
  GoalTrackingSetupArgs,
  PromptMetadata,
  PromptName,
  PromptResponse,
  PromptTemplate,
  ReminderCleanupGuideArgs,
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

const parseRequiredString = (
  value: unknown,
  promptName: PromptName,
  field: string,
): string => {
  if (!isNonEmptyString(value)) {
    throw new Error(
      `Prompt "${promptName}" requires the "${String(field)}" argument to be provided as a non-empty string.`,
    );
  }
  return value;
};

const buildDailyTaskOrganizerPrompt = (
  args: DailyTaskOrganizerArgs,
): PromptResponse => {
  const taskCategory = args.task_category ?? 'all categories';
  const priorityLevel = args.priority_level ?? 'mixed priorities';
  const timeFrame = args.time_frame ?? 'today';

  return {
    description:
      'Comprehensive daily task organization workflow for Apple Reminders',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission: `Mission: Design a realistic ${timeFrame} execution plan in Apple Reminders that keeps ${taskCategory} work flowing while balancing ${priorityLevel} priorities.`,
          contextInputs: [
            `Task category focus: ${taskCategory}`,
            `Priority emphasis: ${priorityLevel}`,
            `Planning horizon: ${timeFrame}`,
          ],
          process: [
            'Map existing reminders, lists, and calendar obligations to surface constraints.',
            'Cluster tasks by priority and energy profile, highlighting blockers and dependencies.',
            'Sequence the day with focus blocks, recovery windows, and buffer time for surprises.',
            'Recommend reminder list placements, notes, and tagging that reinforce the plan.',
            'Define a lightweight review ritual to resync the system at the end of the day.',
          ],
          constraints: [
            'Use fuzzy time expressions when proposing schedules; invite the user to refine if exact times are required.',
            'Ask for missing critical context (capacity, deadlines, location) before finalising recommendations.',
            'Stay within capabilities of native Apple Reminders features available on iOS and macOS.',
          ],
          outputFormat: [
            '### Snapshot — bullet list summarising workload, active lists, and conflicts.',
            '### Daily timeline — Markdown table with columns: time window, focus, supporting reminder list.',
            '### Reminder programming — bullet list of reminders to create or adjust with rationale.',
            '### Review cadence — single sentence describing the end-of-day reset.',
          ],
          qualityBar: [
            'Plan keeps highest-priority work front-loaded while safeguarding recovery space.',
            'Each recommendation references a concrete reminder list or note field to update.',
            'Dependencies and follow-ups include suggested fuzzy time reminders or check-ins.',
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
  const context = args.context ?? '';
  const urgency = args.urgency ?? 'medium';

  return {
    description:
      'Intelligent reminder creation with optimal scheduling and context',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission: `Mission: Produce an Apple Reminders entry for "${args.task_description}" that respects context and ${urgency} urgency while preventing follow-through failures.`,
          contextInputs: [
            `Task description: ${args.task_description}`,
            `User-provided context: ${context || 'none supplied'}`,
            `Urgency rating: ${urgency}`,
          ],
          process: [
            'Scan existing reminders and commitments to avoid duplicates or collisions.',
            'Break the task into atomic outcomes and note any prerequisites or dependencies.',
            'Select an appropriate reminder list and schedule fuzzy time checkpoints aligned to urgency.',
            'Recommend supportive notes, attachments, or subtasks that remove ambiguity.',
            'Propose follow-up or escalation reminders that keep momentum after the initial task fires.',
          ],
          constraints: [
            'Use fuzzy time expressions for scheduling (for example, "later today" or "end of week") and clarify only when precision is mandatory.',
            'Question missing critical details (location, collaborators, blockers) before locking the reminder.',
            'Only rely on capabilities shipped with Apple Reminders without assuming third-party integrations.',
          ],
          outputFormat: [
            '### Core reminder — name, target reminder list, fuzzy timing window, and urgency note.',
            '### Support details — bullet list covering notes, subtasks, and relevant metadata.',
            '### Follow-up sequence — ordered list of subsequent reminders or check-ins.',
            '### Risks — short bullet list of potential failure points and mitigation ideas.',
          ],
          qualityBar: [
            'Reminder timing aligns with user urgency and respects existing commitments.',
            'All dependencies are either satisfied or have explicit follow-up reminders.',
            'Output highlights any assumptions the user must confirm before saving the reminder.',
          ],
          calibration: [
            'If context is insufficient to schedule confidently, respond with targeted clarification questions before delivering the final structure.',
          ],
        }),
      ),
    ],
  };
};

const buildReminderReviewAssistantPrompt = (
  args: ReminderReviewAssistantArgs,
): PromptResponse => {
  const reviewType = args.review_type ?? 'all';
  const listName = args.list_name ?? 'all lists';

  return {
    description:
      'Analyze and optimize existing reminders for better productivity',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission: `Mission: Audit ${reviewType} reminders in ${listName} and deliver actionable clean-up, scheduling, and habit recommendations that boost completion rates.`,
          contextInputs: [
            `Review scope: ${reviewType}`,
            `Focus list: ${listName}`,
            'Recent completion vs. overdue ratios (if available).',
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
          ],
          outputFormat: [
            '### Findings — bullet list of key insights about the current reminder landscape.',
            '### Clean-up actions — table with columns: reminder/list, action, rationale.',
            '### Scheduling tweaks — bullet list of fuzzy time adjustments and batching suggestions.',
            '### Habit playbook — numbered steps for ongoing review cadence.',
          ],
          qualityBar: [
            'Every suggested action ties back to a specific reminder list or identifiable pattern.',
            'Proposed routines are lightweight enough to sustain weekly without tool fatigue.',
            'Risks or dependencies (shared ownership, mandatory notifications) are surfaced with mitigation ideas.',
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
          ],
          outputFormat: [
            '### Weekly planning summary — brief paragraph interpreting user ideas and translating them into actionable planning priorities.',
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

const buildReminderCleanupGuidePrompt = (
  args: ReminderCleanupGuideArgs,
): PromptResponse => {
  const cleanupStrategy = args.cleanup_strategy ?? 'comprehensive';

  return {
    description: 'Guide for cleaning up and organizing reminder system',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission: `Mission: Execute a ${cleanupStrategy} clean-up that restores clarity, reduces reminder noise, and establishes sustainable upkeep habits.`,
          contextInputs: [
            `Selected clean-up strategy: ${cleanupStrategy}`,
            'Number of active lists and notable shared lists (if known).',
            'Any compliance or archival requirements to respect.',
          ],
          process: [
            'Audit reminders by list, status, and age to detect clutter patterns.',
            'Batch archive, delete, or merge items while preserving essential history.',
            'Refactor list architecture, naming, and tagging for quicker retrieval.',
            'Optimise due dates and fuzzy time nudges so important items resurface naturally.',
            'Author a maintenance routine that keeps the system lean month over month.',
          ],
          constraints: [
            'When adjusting schedules, lean on fuzzy time phrasing and prompt the user before committing to exact timestamps.',
            'Highlight any manual effort the user must complete in Apple Reminders to execute the plan.',
            'Validate assumptions about shared lists or delegated reminders before removal recommendations.',
          ],
          outputFormat: [
            '### Audit highlights — bullet list summarising clutter sources and impact.',
            '### Clean-up actions — Markdown table with columns: item/list, action, reason, follow-up.',
            '### Structure redesign — bullet list of new or renamed lists and their intent.',
            '### Maintenance loop — numbered steps for recurring clean-up checkpoints.',
          ],
          qualityBar: [
            'No essential reminders are deleted without an archival or replacement strategy.',
            'List architecture supports quick capture, review, and execution flows.',
            'Maintenance loop fits inside a realistic time budget and uses fuzzy time reminders.',
          ],
          calibration: [
            'If clean-up actions risk information loss, provide a lightweight backup approach before proceeding.',
          ],
        }),
      ),
    ],
  };
};

const buildGoalTrackingSetupPrompt = (
  args: GoalTrackingSetupArgs,
): PromptResponse => {
  const timeHorizon = args.time_horizon ?? 'monthly';

  return {
    description:
      'Set up a comprehensive goal tracking system with Apple Reminders',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission: `Mission: Build an Apple Reminders based tracking system that keeps ${args.goal_type} goals progressing within a ${timeHorizon} horizon.`,
          contextInputs: [
            `Goal domain: ${args.goal_type}`,
            `Primary time horizon: ${timeHorizon}`,
            'Existing related reminders or rituals (if available).',
          ],
          process: [
            'Surface the current state: milestones achieved, blockers, supporting reminders.',
            'Break the goal into measurable milestones and leading indicators.',
            'Design reminder lists, subtasks, and notes that reinforce progress tracking.',
            'Schedule fuzzy time check-ins, accountability nudges, and celebration triggers.',
            'Plan course-correction routines that react when progress slips.',
          ],
          constraints: [
            'When recommending schedules, use fuzzy time expressions and escalate for clarification if precision is critical.',
            'Ensure the system remains manageable inside Apple Reminders without external dashboards.',
            'Request missing metrics or success criteria before finalising the structure.',
          ],
          outputFormat: [
            '### Goal map — bullet list of milestones and success metrics.',
            '### Reminder architecture — Markdown table with columns: list, reminder name, cadence, purpose.',
            '### Check-in rhythm — bullet list describing fuzzy time review cadences and accountability loops.',
            '### Course correction — numbered playbook for handling stalled progress.',
          ],
          qualityBar: [
            'Every milestone includes an associated reminder or tracking mechanism.',
            'Motivational and celebration prompts are balanced with accountability structures.',
            'System highlights early warning signs and suggests immediate response actions.',
          ],
          calibration: [
            'If the time horizon conflicts with milestone granularity, recommend an adjusted cadence and capture it in the plan.',
          ],
        }),
      ),
    ],
  };
};

export const PROMPTS: PromptRegistry = {
  'daily-task-organizer': {
    metadata: {
      name: 'daily-task-organizer',
      description:
        'Create a comprehensive daily task management workflow with Apple Reminders',
      arguments: [
        {
          name: 'task_category',
          description:
            'Category of tasks to organize (work, personal, health, shopping, etc.)',
          required: false,
        },
        {
          name: 'priority_level',
          description:
            'Priority level for task organization (low, medium, high, urgent)',
          required: false,
        },
        {
          name: 'time_frame',
          description:
            'Time frame for tasks (e.g., today, this week, later this month)',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs: Record<string, unknown> | null | undefined) {
      const args = (rawArgs ?? {}) as Partial<DailyTaskOrganizerArgs>;
      return {
        task_category: parseOptionalString(args.task_category),
        priority_level: parseOptionalString(args.priority_level),
        time_frame: parseOptionalString(args.time_frame),
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
          name: 'task_description',
          description: 'Description of the task or reminder to create',
          required: true,
        },
        {
          name: 'context',
          description:
            'Additional context or background information for the task',
          required: false,
        },
        {
          name: 'urgency',
          description: 'How urgent this task is (low, medium, high, critical)',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs: Record<string, unknown> | null | undefined) {
      const args = (rawArgs ?? {}) as Partial<SmartReminderCreatorArgs>;
      return {
        task_description: parseRequiredString(
          args.task_description,
          'smart-reminder-creator',
          'task_description',
        ),
        context: parseOptionalString(args.context),
        urgency: parseOptionalString(args.urgency),
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
          name: 'review_type',
          description:
            'Type of review to perform (overdue, completed, upcoming, all)',
          required: false,
        },
        {
          name: 'list_name',
          description:
            'Specific reminder list to review (leave empty for all lists)',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs: Record<string, unknown> | null | undefined) {
      const args = (rawArgs ?? {}) as Partial<ReminderReviewAssistantArgs>;
      return {
        review_type: parseOptionalString(args.review_type),
        list_name: parseOptionalString(args.list_name),
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
  'reminder-cleanup-guide': {
    metadata: {
      name: 'reminder-cleanup-guide',
      description: 'Guide for cleaning up and organizing existing reminders',
      arguments: [
        {
          name: 'cleanup_strategy',
          description:
            'Strategy for cleanup (archive_completed, delete_old, reorganize_lists, merge_duplicates)',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs: Record<string, unknown> | null | undefined) {
      const args = (rawArgs ?? {}) as Partial<ReminderCleanupGuideArgs>;
      return {
        cleanup_strategy: parseOptionalString(args.cleanup_strategy),
      };
    },
    buildPrompt: buildReminderCleanupGuidePrompt,
  },
  'goal-tracking-setup': {
    metadata: {
      name: 'goal-tracking-setup',
      description: 'Set up a goal tracking system using Apple Reminders',
      arguments: [
        {
          name: 'goal_type',
          description:
            'Type of goal to track (habit, project, learning, health, financial)',
          required: true,
        },
        {
          name: 'time_horizon',
          description:
            'Time horizon for the goal (daily, weekly, monthly, quarterly, yearly)',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs: Record<string, unknown> | null | undefined) {
      const args = (rawArgs ?? {}) as Partial<GoalTrackingSetupArgs>;
      return {
        goal_type: parseRequiredString(
          args.goal_type,
          'goal-tracking-setup',
          'goal_type',
        ),
        time_horizon: parseOptionalString(args.time_horizon),
      };
    },
    buildPrompt: buildGoalTrackingSetupPrompt,
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
