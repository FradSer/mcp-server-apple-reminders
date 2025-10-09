/**
 * server/handlers.ts
 * Request handlers for the MCP server
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { handleToolCall, TOOLS } from '../tools/index.js';
import type { ListsToolArgs, RemindersToolArgs } from '../types/index.js';

/**
 * Registers all request handlers for the MCP server
 * @param server - The MCP server instance
 */
export function registerHandlers(server: Server): void {
  // Handler for listing available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Handler for calling a tool
  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    handleToolCall(
      request.params.name,
      (request.params.arguments as unknown as
        | RemindersToolArgs
        | ListsToolArgs) ?? {},
    ),
  );

  // Handler for listing available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: 'daily-task-organizer',
        description:
          'Create a comprehensive daily task management workflow with Apple Reminders using natural language time expressions',
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
            description: 'Time frame for tasks (supports natural language: "today", "this week", "next Monday", "tomorrow morning", etc.)',
            required: false,
          },
        ],
      },
      {
        name: 'smart-reminder-creator',
        description:
          'Intelligently create reminders with optimal scheduling and context using natural language time expressions',
        arguments: [
          {
            name: 'task_description',
            description: 'Description of the task or reminder to create',
            required: true,
          },
          {
            name: 'due_time',
            description: 'When the reminder should be due (supports natural language: "tomorrow at 3pm", "next Friday", "in 2 hours", etc.)',
            required: false,
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
      {
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
      {
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
      {
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
      {
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
      {
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
    ],
  }));

  // Handler for getting a specific prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'daily-task-organizer': {
        const taskCategory = args?.task_category || 'all categories';
        const priorityLevel = args?.priority_level || 'mixed priorities';
        const timeFrame = args?.time_frame || 'today';
        return {
          description:
            'Comprehensive daily task organization workflow for Apple Reminders with natural language time support',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me organize my daily tasks in Apple Reminders for ${timeFrame}, focusing on ${taskCategory} with ${priorityLevel} priority level.\n\nPlease help me:\n1. Review my current reminders and lists to understand what I have\n2. Create a structured daily plan that categorizes tasks by priority and time sensitivity\n3. Suggest optimal reminder lists organization for ${taskCategory}\n4. Set up appropriate due dates and times using natural language expressions (e.g., "tomorrow at 3pm", "next Monday morning", "in 2 hours")\n5. Recommend a daily review routine to stay on track\n\nIMPORTANT: When creating reminders, use natural language time expressions that users can easily understand and modify. The system supports expressions like "tomorrow", "next Friday", "this evening", "in 3 hours", "next week", etc.\n\nStart by listing my current reminders and reminder lists, then provide a comprehensive daily organization strategy with natural language time scheduling.`,
              },
            },
          ],
        };
      }

      case 'smart-reminder-creator': {
        const taskDescription = args?.task_description || 'a new task';
        const dueTime = args?.due_time || '';
        const context = args?.context || '';
        const urgency = args?.urgency || 'medium';
        return {
          description:
            'Intelligent reminder creation with optimal scheduling and context using natural language time expressions',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me create a smart reminder for: "${taskDescription}"\n                \nDue Time: ${dueTime || 'Not specified - please suggest optimal timing'}\nContext: ${context}\nUrgency Level: ${urgency}\n\nPlease analyze this task and help me:\n1. Break down the task if it's complex or has multiple steps\n2. Determine the optimal timing and due date using natural language expressions (e.g., "tomorrow at 3pm", "next Friday morning", "in 2 hours")\n3. Suggest the most appropriate reminder list to use\n4. Recommend any additional notes or details to include\n5. Consider dependencies or prerequisites\n6. Set up follow-up reminders if needed\n\nIMPORTANT: Use natural language time expressions that are intuitive and easy to modify. Supported formats include:\n- Relative times: "tomorrow", "next week", "in 3 hours"\n- Specific times: "tomorrow at 3pm", "next Monday morning", "this evening"\n- Chinese expressions: "明天", "下周一", "后天下午"\n- Time periods: "this week", "next month", "this afternoon"\n\nCreate a comprehensive reminder that maximizes the chance of successful completion with clear, natural time scheduling.`,
              },
            },
          ],
        };
      }

      case 'reminder-review-assistant': {
        const reviewType = args?.review_type || 'all';
        const listName = args?.list_name || 'all lists';
        return {
          description:
            'Analyze and optimize existing reminders for better productivity',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me review and optimize my Apple Reminders, focusing on ${reviewType} reminders in ${listName}.\n\nPlease perform a comprehensive analysis:\n1. List and analyze my current reminders based on the review type\n2. Identify patterns in completed vs. overdue reminders\n3. Suggest improvements for reminder timing and scheduling\n4. Recommend better categorization and list organization\n5. Identify redundant or outdated reminders that can be cleaned up\n6. Propose optimization strategies for better completion rates\n7. Suggest habits and routines to improve reminder management\n\nProvide actionable insights to enhance my productivity and task completion success.`,
              },
            },
          ],
        };
      }

      case 'weekly-planning-workflow': {
        const focusAreas = args?.focus_areas || 'general productivity';
        const weekStartDate = args?.week_start_date || 'this week';
        return {
          description:
            'Structured weekly planning session using Apple Reminders',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me create a comprehensive weekly plan starting ${weekStartDate}, focusing on: ${focusAreas}\n\nGuide me through:\n1. Review current reminders and assess what needs to be carried over\n2. Set weekly goals and break them down into daily actionable tasks\n3. Create a balanced schedule that includes work, personal, and focus areas\n4. Set up recurring reminders for routine tasks and habits\n5. Plan for important deadlines and appointments\n6. Create backup plans for potential disruptions\n7. Establish a weekly review process for continuous improvement\n\nCreate reminders that support a productive and balanced week while maintaining focus on my key priorities.`,
              },
            },
          ],
        };
      }

      case 'reminder-cleanup-guide': {
        const cleanupStrategy = args?.cleanup_strategy || 'comprehensive';
        return {
          description: 'Guide for cleaning up and organizing reminder system',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me clean up and reorganize my Apple Reminders using the ${cleanupStrategy} strategy.\n\nPlease guide me through:\n1. Audit all current reminders and lists to identify what needs attention\n2. Archive or delete completed and outdated reminders\n3. Merge duplicate or similar reminders\n4. Reorganize reminders into logical, efficient lists\n5. Update reminder names and descriptions for clarity\n6. Optimize due dates and notification timing\n7. Create a maintenance routine to keep the system organized\n8. Set up best practices for future reminder creation\n\nHelp me transform my reminder system into a clean, efficient productivity tool.`,
              },
            },
          ],
        };
      }

      case 'goal-tracking-setup': {
        const goalType = args?.goal_type || 'general goals';
        const timeHorizon = args?.time_horizon || 'monthly';
        return {
          description:
            'Set up a comprehensive goal tracking system with Apple Reminders',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me set up a goal tracking system for ${goalType} with a ${timeHorizon} time horizon using Apple Reminders.\n\nPlease help me design:\n1. Break down the goal into specific, measurable milestones\n2. Create a reminder structure that tracks progress systematically\n3. Set up regular check-in reminders to review progress\n4. Design accountability reminders and motivation triggers\n5. Create celebration reminders for milestone achievements\n6. Set up course-correction reminders for when things go off track\n7. Establish a review and adjustment process for goal refinement\n\nCreate a comprehensive tracking system that keeps me motivated and on track toward achieving my ${goalType} goals.`,
              },
            },
          ],
        };
      }

      case 'context-aware-scheduling': {
        const taskType = args?.task_type || 'general task';
        const energyLevel = args?.energy_level_required || 'medium';
        const dependencies = args?.dependencies || 'none specified';
        return {
          description:
            'Create intelligently scheduled reminders based on context and optimal timing',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me create context-aware reminders for a ${taskType} that requires ${energyLevel} energy level, with dependencies: ${dependencies}\n\nPlease analyze and optimize:\n1. Determine the best time of day/week for this type of task\n2. Consider my energy patterns and when I'm most effective\n3. Account for any dependencies and prerequisite tasks\n4. Set up preparation reminders to ensure I'm ready\n5. Create buffer time for unexpected delays or complications\n6. Set up follow-up reminders to track completion and next steps\n7. Consider environmental factors that might affect task completion\n8. Design reminders that work with my natural rhythms and preferences\n\nCreate a scheduling strategy that maximizes the likelihood of successful task completion by considering all contextual factors.`,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });
}
