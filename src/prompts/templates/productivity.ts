/**
 * prompts/templates/productivity.ts
 * Productivity-focused prompt templates
 */

import { z } from 'zod';
import type { PromptDefinition } from '../types.js';

/**
 * Daily task organizer prompt
 */
const dailyTaskOrganizerSchema = z.object({
  task_category: z.string().optional().default('all categories'),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  time_frame: z.enum(['today', 'this_week', 'this_month']).optional().default('today'),
  focus_area: z.string().optional().default('general productivity'),
  energy_level: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

export const dailyTaskOrganizer: PromptDefinition = {
  name: 'daily-task-organizer',
  description: 'Create a comprehensive daily task management workflow with Apple Reminders',
  category: 'productivity',
  tags: ['daily', 'tasks', 'organization', 'planning'],
  arguments: [
    {
      name: 'task_category',
      description: 'Category of tasks to organize (work, personal, health, shopping, etc.)',
      required: false,
      schema: z.string(),
      defaultValue: 'all categories',
    },
    {
      name: 'priority_level',
      description: 'Priority level for task organization (low, medium, high, urgent)',
      required: false,
      schema: z.enum(['low', 'medium', 'high', 'urgent']),
      defaultValue: 'medium',
    },
    {
      name: 'time_frame',
      description: 'Time frame for tasks (today, this_week, this_month)',
      required: false,
      schema: z.enum(['today', 'this_week', 'this_month']),
      defaultValue: 'today',
    },
    {
      name: 'focus_area',
      description: 'Main focus area for productivity (work, personal, health, learning, etc.)',
      required: false,
      schema: z.string(),
      defaultValue: 'general productivity',
    },
    {
      name: 'energy_level',
      description: 'Current energy level to optimize task scheduling (low, medium, high)',
      required: false,
      schema: z.enum(['low', 'medium', 'high']),
      defaultValue: 'medium',
    },
  ],
  template: (args) => {
    const {
      task_category,
      priority_level,
      time_frame,
      focus_area,
      energy_level,
    } = dailyTaskOrganizerSchema.parse(args);

    return {
      description: `Comprehensive daily task organization workflow for ${time_frame} focusing on ${task_category} with ${priority_level} priority level`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me create an optimized daily task management system for ${time_frame}, focusing on ${task_category} with ${priority_level} priority level and ${energy_level} energy level.

**Context:**
- Focus Area: ${focus_area}
- Time Frame: ${time_frame}
- Task Category: ${task_category}
- Priority Level: ${priority_level}
- Energy Level: ${energy_level}

**Please help me:**

1. **Audit Current State**
   - Review my existing reminders and lists
   - Identify what's working and what needs improvement
   - Assess current task distribution and completion patterns

2. **Create Strategic Organization**
   - Design an optimal reminder list structure for ${task_category}
   - Categorize tasks by priority and energy requirements
   - Set up logical groupings and dependencies

3. **Optimize Scheduling**
   - Suggest optimal timing based on my ${energy_level} energy level
   - Create time blocks for different types of tasks
   - Set up buffer time and contingency planning

4. **Establish Workflow**
   - Create a daily review routine
   - Set up progress tracking mechanisms
   - Design a system for handling interruptions and changes

5. **Enhance Productivity**
   - Recommend productivity techniques for ${focus_area}
   - Suggest habit stacking opportunities
   - Create motivation and accountability systems

Start by analyzing my current reminder setup, then provide a comprehensive strategy that maximizes productivity while maintaining balance and sustainability.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'intermediate',
    estimatedTime: '15-20 minutes',
  },
};

/**
 * Smart reminder creator prompt
 */
const smartReminderCreatorSchema = z.object({
  task_description: z.string(),
  context: z.string().optional().default(''),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  task_type: z.enum(['meeting', 'deadline', 'habit', 'follow_up', 'creative_work', 'routine']).optional().default('routine'),
  energy_required: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dependencies: z.string().optional().default('none specified'),
});

export const smartReminderCreator: PromptDefinition = {
  name: 'smart-reminder-creator',
  description: 'Intelligently create reminders with optimal scheduling and context',
  category: 'productivity',
  tags: ['creation', 'scheduling', 'optimization', 'intelligence'],
  arguments: [
    {
      name: 'task_description',
      description: 'Description of the task or reminder to create',
      required: true,
      schema: z.string(),
    },
    {
      name: 'context',
      description: 'Additional context or background information for the task',
      required: false,
      schema: z.string(),
      defaultValue: '',
    },
    {
      name: 'urgency',
      description: 'How urgent this task is (low, medium, high, critical)',
      required: false,
      schema: z.enum(['low', 'medium', 'high', 'critical']),
      defaultValue: 'medium',
    },
    {
      name: 'task_type',
      description: 'Type of task (meeting, deadline, habit, follow_up, creative_work, routine)',
      required: false,
      schema: z.enum(['meeting', 'deadline', 'habit', 'follow_up', 'creative_work', 'routine']),
      defaultValue: 'routine',
    },
    {
      name: 'energy_required',
      description: 'Energy level required for the task (low, medium, high)',
      required: false,
      schema: z.enum(['low', 'medium', 'high']),
      defaultValue: 'medium',
    },
    {
      name: 'dependencies',
      description: 'Other tasks or conditions this reminder depends on',
      required: false,
      schema: z.string(),
      defaultValue: 'none specified',
    },
  ],
  template: (args) => {
    const {
      task_description,
      context,
      urgency,
      task_type,
      energy_required,
      dependencies,
    } = smartReminderCreatorSchema.parse(args);

    return {
      description: `Intelligent reminder creation for: ${task_description}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me create a smart, optimized reminder for: "${task_description}"

**Task Details:**
- Description: ${task_description}
- Context: ${context || 'No additional context provided'}
- Urgency: ${urgency}
- Task Type: ${task_type}
- Energy Required: ${energy_required}
- Dependencies: ${dependencies}

**Please analyze and optimize:**

1. **Task Breakdown**
   - Break down complex tasks into actionable steps
   - Identify potential obstacles and solutions
   - Create sub-tasks if needed for better tracking

2. **Optimal Scheduling**
   - Determine the best time based on urgency and energy requirements
   - Consider my natural energy patterns and peak performance times
   - Account for dependencies and prerequisite tasks

3. **Context Enhancement**
   - Suggest relevant notes and details to include
   - Recommend helpful URLs or resources
   - Add motivational or accountability elements

4. **Smart Features**
   - Set up appropriate follow-up reminders
   - Create preparation reminders if needed
   - Design completion celebration or next-step triggers

5. **List Organization**
   - Choose the most appropriate reminder list
   - Suggest list structure improvements if needed
   - Consider task categorization and filtering

6. **Success Optimization**
   - Add elements that increase completion likelihood
   - Include time estimates and buffer time
   - Create accountability mechanisms

Create a comprehensive reminder system that maximizes the chance of successful completion while fitting naturally into my workflow.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'beginner',
    estimatedTime: '5-10 minutes',
  },
};

/**
 * Productivity analysis prompt
 */
const productivityAnalysisSchema = z.object({
  analysis_period: z.enum(['today', 'this_week', 'this_month', 'last_week', 'last_month']).optional().default('this_week'),
  focus_metrics: z.array(z.enum(['completion_rate', 'time_management', 'priority_handling', 'energy_optimization', 'goal_progress'])).optional().default(['completion_rate', 'time_management']),
  comparison_period: z.enum(['previous_period', 'same_period_last_month', 'none']).optional().default('previous_period'),
});

export const productivityAnalysis: PromptDefinition = {
  name: 'productivity-analysis',
  description: 'Analyze productivity patterns and provide optimization recommendations',
  category: 'productivity',
  tags: ['analysis', 'optimization', 'metrics', 'insights'],
  arguments: [
    {
      name: 'analysis_period',
      description: 'Time period to analyze (today, this_week, this_month, last_week, last_month)',
      required: false,
      schema: z.enum(['today', 'this_week', 'this_month', 'last_week', 'last_month']),
      defaultValue: 'this_week',
    },
    {
      name: 'focus_metrics',
      description: 'Specific metrics to focus on in the analysis',
      required: false,
      schema: z.array(z.enum(['completion_rate', 'time_management', 'priority_handling', 'energy_optimization', 'goal_progress'])),
      defaultValue: ['completion_rate', 'time_management'],
    },
    {
      name: 'comparison_period',
      description: 'Period to compare against for trend analysis',
      required: false,
      schema: z.enum(['previous_period', 'same_period_last_month', 'none']),
      defaultValue: 'previous_period',
    },
  ],
  template: (args) => {
    const {
      analysis_period,
      focus_metrics,
      comparison_period,
    } = productivityAnalysisSchema.parse(args);

    return {
      description: `Productivity analysis for ${analysis_period} focusing on ${focus_metrics.join(', ')}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me analyze my productivity patterns for ${analysis_period} with a focus on: ${focus_metrics.join(', ')}.

**Analysis Parameters:**
- Period: ${analysis_period}
- Focus Metrics: ${focus_metrics.join(', ')}
- Comparison: ${comparison_period}

**Please provide a comprehensive analysis:**

1. **Data Collection & Review**
   - Analyze my reminder completion patterns
   - Review time management effectiveness
   - Assess priority handling and decision-making
   - Evaluate energy optimization strategies

2. **Pattern Identification**
   - Identify peak productivity times and conditions
   - Spot recurring obstacles and inefficiencies
   - Recognize successful strategies and habits
   - Find correlation patterns between different factors

3. **Performance Metrics**
   - Calculate completion rates and trends
   - Measure time estimation accuracy
   - Assess goal achievement progress
   - Evaluate system effectiveness

4. **Comparative Analysis**
   - Compare with ${comparison_period} performance
   - Identify improvement or decline trends
   - Highlight significant changes or patterns
   - Assess the impact of recent changes

5. **Optimization Recommendations**
   - Suggest specific improvements for each focus metric
   - Recommend workflow adjustments
   - Propose new strategies or techniques
   - Identify areas for skill development

6. **Action Plan**
   - Create specific, actionable next steps
   - Set measurable goals for improvement
   - Design experiments to test new approaches
   - Establish regular review cycles

Provide insights that help me understand my productivity patterns and make data-driven improvements to my task management system.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'advanced',
    estimatedTime: '20-30 minutes',
  },
};