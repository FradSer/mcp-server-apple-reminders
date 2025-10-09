/**
 * server/prompts.ts
 * Central registry for MCP prompts and their runtime helpers
 */

import {
  type DailyTaskOrganizerArgs,
  type GoalTrackingSetupArgs,
  type PromptMetadata,
  type PromptName,
  type PromptResponse,
  type PromptTemplate,
  type ReminderCleanupGuideArgs,
  type ReminderReviewAssistantArgs,
  type SmartReminderCreatorArgs,
  type WeeklyPlanningWorkflowArgs,
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
        `Help me organize my daily tasks in Apple Reminders for ${timeFrame}, focusing on ${taskCategory} with ${priorityLevel} priority level.\n\nPlease help me:\n1. Thoroughly review my existing reminders and lists to understand current commitments\n2. Create a structured daily plan that categorizes tasks by priority and time sensitivity\n3. Suggest optimal reminder lists organization for ${taskCategory}\n4. Set up appropriate due dates and times for maximum productivity\n5. Recommend a daily review routine to stay on track\n\nStart by listing my current reminders and reminder lists, then provide a comprehensive daily organization strategy. When proposing schedules, prefer flexible time expressions such as "later today" or "next week" instead of exact timestamps unless truly necessary.`,
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
    description: 'Intelligent reminder creation with optimal scheduling and context',
    messages: [
      createMessage(
        `Help me create a smart reminder for: "${args.task_description}"\n                \nContext: ${context}\nUrgency Level: ${urgency}\n\nPlease analyze this task and help me:\n1. Review my existing reminders and commitments so the new reminder fits smoothly\n2. Break down the task if it's complex or has multiple steps\n3. Determine the optimal timing and due date based on urgency and context\n4. Suggest the most appropriate reminder list to use\n5. Recommend any additional notes or details to include\n6. Consider dependencies or prerequisites\n7. Set up follow-up reminders if needed\n\nWhen you need time input from me, invite fuzzy phrases like "later today" or "next week" rather than precise timestamps. Create a comprehensive reminder that maximizes the chance of successful completion.`,
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
    description: 'Analyze and optimize existing reminders for better productivity',
    messages: [
      createMessage(
        `Help me review and optimize my Apple Reminders, focusing on ${reviewType} reminders in ${listName}.\n\nPlease perform a comprehensive analysis:\n1. List and analyze my current reminders based on the review type\n2. Identify patterns in completed vs. overdue reminders\n3. Suggest improvements for reminder timing and scheduling\n4. Recommend better categorization and list organization\n5. Identify redundant or outdated reminders that can be cleaned up\n6. Propose optimization strategies for better completion rates\n7. Suggest habits and routines to improve reminder management\n\nProvide actionable insights to enhance my productivity and task completion success.`,
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
        `Help me create a comprehensive weekly plan starting ${weekStartDate}, focusing on: ${focusAreas}\n\nGuide me through:\n1. Review current reminders and assess what needs to be carried over\n2. Set weekly goals and break them down into daily actionable tasks\n3. Create a balanced schedule that includes work, personal, and focus areas\n4. Set up recurring reminders for routine tasks and habits\n5. Plan for important deadlines and appointments\n6. Create backup plans for potential disruptions\n7. Establish a weekly review process for continuous improvement\n\nPlease stick to flexible time ranges—terms like "this weekend" or "mid-week" are preferred over exact timestamps unless unavoidable. Create reminders that support a productive and balanced week while maintaining focus on my key priorities.`,
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
        `Help me clean up and reorganize my Apple Reminders using the ${cleanupStrategy} strategy.\n\nPlease guide me through:\n1. Audit all current reminders and lists to identify what needs attention\n2. Archive or delete completed and outdated reminders\n3. Merge duplicate or similar reminders\n4. Reorganize reminders into logical, efficient lists\n5. Update reminder names and descriptions for clarity\n6. Optimize due dates and notification timing\n7. Create a maintenance routine to keep the system organized\n8. Set up best practices for future reminder creation\n\nWhen timing adjustments are needed, lean on fuzzy expressions like "later this month" rather than rigid timestamps. Help me transform my reminder system into a clean, efficient productivity tool.`,
      ),
    ],
  };
};

const buildGoalTrackingSetupPrompt = (
  args: GoalTrackingSetupArgs,
): PromptResponse => {
  const timeHorizon = args.time_horizon ?? 'monthly';

  return {
    description: 'Set up a comprehensive goal tracking system with Apple Reminders',
    messages: [
      createMessage(
        `Help me set up a goal tracking system for ${args.goal_type} with a ${timeHorizon} time horizon using Apple Reminders.\n\nPlease help me design:\n1. Review existing reminders and commitments related to this goal so we start with full context\n2. Break down the goal into specific, measurable milestones\n3. Create a reminder structure that tracks progress systematically\n4. Set up regular check-in reminders to review progress\n5. Design accountability reminders and motivation triggers\n6. Create celebration reminders for milestone achievements\n7. Set up course-correction reminders for when things go off track\n8. Establish a review and adjustment process for goal refinement\n\nFavor flexible time descriptors such as "every weekend" or "early next month" over exact timestamps. Create a comprehensive tracking system that keeps me motivated and on track toward achieving my ${args.goal_type} goals.`,
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
          description: 'Time frame for tasks (e.g., today, this week, later this month)',
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
          description: 'Additional context or background information for the task',
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
          description: 'Preferred starting point for the week (e.g., today, next Monday, upcoming sprint)',
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
