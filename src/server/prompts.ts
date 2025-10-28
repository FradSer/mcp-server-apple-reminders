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

interface PromptRegistry {
  [Name in PromptName]: PromptTemplate<Name>;
}

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
  const focusAreas = args.focus_areas ?? 'general productivity';
  const weekStartDate = args.week_start_date ?? 'this week';

  return {
    description: 'Structured weekly planning session using Apple Reminders',
    messages: [
      createMessage(
        createStructuredPrompt({
          mission: `Mission: Build a resilient weekly execution playbook starting ${weekStartDate} that advances ${focusAreas} while safeguarding energy and commitments.`,
          contextInputs: [
            `Focus areas: ${focusAreas}`,
            `Week start: ${weekStartDate}`,
            'Known deadlines or anchors for the week (if provided).',
          ],
          process: [
            'Audit carry-over reminders and anchor events that define immovable blocks.',
            'Translate focus areas into measurable weekly outcomes and daily anchors.',
            'Allocate fuzzy time blocks across the week, balancing deep work, admin, and recovery.',
            'Schedule recurring reminders and habit triggers that align with the weekly goals.',
            'Design review checkpoints and contingency plans for likely disruptions.',
          ],
          constraints: [
            'Use fuzzy time expressions (for example, "early week", "Thursday afternoon") when proposing schedules.',
            'Surface clarifying questions if goal metrics, capacity, or constraints are unclear.',
            'Ensure outputs are achievable inside Apple Reminders without external tooling.',
          ],
          outputFormat: [
            '### Weekly objectives — bullet list linking focus areas to measurable outcomes.',
            '### Anchor timeline — Markdown table with columns: day, fuzzy time window, primary focus, supporting reminders.',
            '### Habit stack — bullet list of recurring reminders or automations to configure.',
            '### Contingency plan — short paragraph outlining backup moves and review cadence.',
          ],
          qualityBar: [
            'Schedule maintains a blend of focus, admin, and recharge time across the week.',
            'Every objective links to concrete reminders or routines the user can configure immediately.',
            'Risks (over-booked days, conflicting lists) are flagged with mitigation steps.',
          ],
          calibration: [
            'If workload outweighs available focus blocks, propose trade-offs or deferrals and capture them as reminders.',
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
    parseArgs(rawArgs) {
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
    parseArgs(rawArgs) {
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
    parseArgs(rawArgs) {
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
        'Create a structured weekly planning session with Apple Reminders',
      arguments: [
        {
          name: 'focus_areas',
          description:
            'Main areas to focus on this week (work projects, personal goals, health, etc.)',
          required: false,
        },
        {
          name: 'week_start_date',
          description:
            'Preferred starting point for the week (e.g., today, next Monday, upcoming sprint)',
          required: false,
        },
      ],
    },
    parseArgs(rawArgs) {
      const args = (rawArgs ?? {}) as Partial<WeeklyPlanningWorkflowArgs>;
      return {
        focus_areas: parseOptionalString(args.focus_areas),
        week_start_date: parseOptionalString(args.week_start_date),
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
    parseArgs(rawArgs) {
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
    parseArgs(rawArgs) {
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
  rawArgs: unknown,
): PromptResponse => {
  const parsedArgs = template.parseArgs(rawArgs);
  return template.buildPrompt(parsedArgs);
};
