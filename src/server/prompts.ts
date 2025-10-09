/**
 * server/prompts.ts
 * Centralized prompt definitions including metadata, defaults, and message builders
 */

export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface PromptMetadata {
  name: string;
  description: string;
  arguments: PromptArgument[];
}

export interface PromptDefinition {
  metadata: PromptMetadata;
  defaults: Record<string, string>;
  buildMessages: (
    args: Record<string, string>,
  ) => Array<{
    role: 'user';
    content: { type: 'text'; text: string };
  }>;
}

export const PROMPT_DEFINITIONS: Record<string, PromptDefinition> = {
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
          description: 'Time frame for tasks (today, this_week, this_month)',
          required: false,
        },
      ],
    },
    defaults: {
      task_category: 'all categories',
      priority_level: 'mixed priorities',
      time_frame: 'today',
    },
    buildMessages: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Help me organize my daily tasks in Apple Reminders for ${args.time_frame}, focusing on ${args.task_category} with ${args.priority_level} priority level.\n\nPlease help me:\n1. Review my current reminders and lists to understand what I have\n2. Create a structured daily plan that categorizes tasks by priority and time sensitivity\n3. Suggest optimal reminder lists organization for ${args.task_category}\n4. Set up appropriate due dates and times for maximum productivity\n5. Recommend a daily review routine to stay on track\n\nStart by listing my current reminders and reminder lists, then provide a comprehensive daily organization strategy.`,
        },
      },
    ],
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
          description:
            'How urgent this task is (low, medium, high, critical)',
          required: false,
        },
      ],
    },
    defaults: {
      task_description: 'a new task',
      context: '',
      urgency: 'medium',
    },
    buildMessages: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Help me create a smart reminder for: "${args.task_description}"\n\nContext: ${args.context}\nUrgency Level: ${args.urgency}\n\nPlease analyze this task and help me:\n1. Break down the task if it's complex or has multiple steps\n2. Determine the optimal timing and due date based on urgency and context\n3. Suggest the most appropriate reminder list to use\n4. Recommend any additional notes or details to include\n5. Consider dependencies or prerequisites\n6. Set up follow-up reminders if needed\n\nCreate a comprehensive reminder that maximizes the chance of successful completion.`,
        },
      },
    ],
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
    defaults: {
      review_type: 'all',
      list_name: 'all lists',
    },
    buildMessages: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Help me review and optimize my Apple Reminders, focusing on ${args.review_type} reminders in ${args.list_name}.\n\nPlease perform a comprehensive analysis:\n1. List and analyze my current reminders based on the review type\n2. Identify patterns in completed vs. overdue reminders\n3. Suggest improvements for reminder timing and scheduling\n4. Recommend better categorization and list organization\n5. Identify redundant or outdated reminders that can be cleaned up\n6. Propose optimization strategies for better completion rates\n7. Suggest habits and routines to improve reminder management\n\nProvide actionable insights to enhance my productivity and task completion success.`,
        },
      },
    ],
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
          description: 'Starting date for the week in YYYY-MM-DD format',
          required: false,
        },
      ],
    },
    defaults: {
      focus_areas: 'general productivity',
      week_start_date: 'this week',
    },
    buildMessages: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Help me create a comprehensive weekly plan starting ${args.week_start_date}, focusing on: ${args.focus_areas}\n\nGuide me through:\n1. Review current reminders and assess what needs to be carried over\n2. Set weekly goals and break them down into daily actionable tasks\n3. Create a balanced schedule that includes work, personal, and focus areas\n4. Set up recurring reminders for routine tasks and habits\n5. Plan for important deadlines and appointments\n6. Create backup plans for potential disruptions\n7. Establish a weekly review process for continuous improvement\n\nCreate reminders that support a productive and balanced week while maintaining focus on my key priorities.`,
        },
      },
    ],
  },
  'reminder-cleanup-guide': {
    metadata: {
      name: 'reminder-cleanup-guide',
      description:
        'Guide for cleaning up and organizing existing reminders',
      arguments: [
        {
          name: 'cleanup_strategy',
          description:
            'Strategy for cleanup (archive_completed, delete_old, reorganize_lists, merge_duplicates)',
          required: false,
        },
      ],
    },
    defaults: {
      cleanup_strategy: 'comprehensive',
    },
    buildMessages: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Help me clean up and reorganize my Apple Reminders using the ${args.cleanup_strategy} strategy.\n\nPlease guide me through:\n1. Audit all current reminders and lists to identify what needs attention\n2. Archive or delete completed and outdated reminders\n3. Merge duplicate or similar reminders\n4. Reorganize reminders into logical, efficient lists\n5. Update reminder names and descriptions for clarity\n6. Optimize due dates and notification timing\n7. Create a maintenance routine to keep the system organized\n8. Set up best practices for future reminder creation\n\nHelp me transform my reminder system into a clean, efficient productivity tool.`,
        },
      },
    ],
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
    defaults: {
      goal_type: 'general goals',
      time_horizon: 'monthly',
    },
    buildMessages: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Help me set up a goal tracking system for ${args.goal_type} with a ${args.time_horizon} time horizon using Apple Reminders.\n\nPlease help me design:\n1. Break down the goal into specific, measurable milestones\n2. Create a reminder structure that tracks progress systematically\n3. Set up regular check-in reminders to review progress\n4. Design accountability reminders and motivation triggers\n5. Create celebration reminders for milestone achievements\n6. Set up course-correction reminders for when things go off track\n7. Establish a review and adjustment process for goal refinement\n\nCreate a comprehensive tracking system that keeps me motivated and on track toward achieving my ${args.goal_type} goals.`,
        },
      },
    ],
  },
  'context-aware-scheduling': {
    metadata: {
      name: 'context-aware-scheduling',
      description:
        'Create reminders with intelligent scheduling based on context and optimal timing',
      arguments: [
        {
          name: 'task_type',
          description:
            'Type of task to schedule (meeting, deadline, habit, follow_up, creative_work)',
          required: true,
        },
        {
          name: 'energy_level_required',
          description:
            'Energy level required for the task (low, medium, high)',
          required: false,
        },
        {
          name: 'dependencies',
          description: 'Other tasks or conditions this reminder depends on',
          required: false,
        },
      ],
    },
    defaults: {
      task_type: 'general task',
      energy_level_required: 'medium',
      dependencies: 'none specified',
    },
    buildMessages: (args) => [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Help me create context-aware reminders for a ${args.task_type} that requires ${args.energy_level_required} energy level, with dependencies: ${args.dependencies}\n\nPlease analyze and optimize:\n1. Determine the best time of day/week for this type of task\n2. Consider my energy patterns and when I'm most effective\n3. Account for any dependencies and prerequisite tasks\n4. Set up preparation reminders to ensure I'm ready\n5. Create buffer time for unexpected delays or complications\n6. Set up follow-up reminders to track completion and next steps\n7. Consider environmental factors that might affect task completion\n8. Design reminders that work with my natural rhythms and preferences\n\nCreate a scheduling strategy that maximizes the likelihood of successful task completion by considering all contextual factors.`,
        },
      },
    ],
  },
};

export const PROMPT_METADATA_LIST: PromptMetadata[] = Object.values(
  PROMPT_DEFINITIONS,
).map((definition) => definition.metadata);

export function buildPromptResponse(
  name: string,
  args: Record<string, unknown> = {},
):
  | {
      description: string;
      messages: Array<{
        role: 'user';
        content: { type: 'text'; text: string };
      }>;
    }
  | undefined {
  const definition = PROMPT_DEFINITIONS[name];

  if (!definition) {
    return undefined;
  }

  const normalizedArgs = Object.fromEntries(
    Object.entries(args)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );

  const mergedArgs = {
    ...definition.defaults,
    ...normalizedArgs,
  } as Record<string, string>;

  return {
    description: definition.metadata.description,
    messages: definition.buildMessages(mergedArgs),
  };
}
