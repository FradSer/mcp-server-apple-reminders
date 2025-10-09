/**
 * prompts/templates/automation.ts
 * Automation-focused prompt templates
 */

import { z } from 'zod';
import type { PromptDefinition } from '../types.js';

/**
 * Context-aware scheduling prompt
 */
const contextAwareSchedulingSchema = z.object({
  task_type: z.enum(['meeting', 'deadline', 'habit', 'follow_up', 'creative_work', 'routine', 'learning', 'exercise']).optional().default('routine'),
  energy_level_required: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dependencies: z.string().optional().default('none specified'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  duration_estimate: z.string().optional().default('not specified'),
  optimal_conditions: z.array(z.string()).optional().default([]),
});

export const contextAwareScheduling: PromptDefinition = {
  name: 'context-aware-scheduling',
  description: 'Create reminders with intelligent scheduling based on context and optimal timing',
  category: 'automation',
  tags: ['scheduling', 'intelligence', 'context', 'optimization', 'timing'],
  arguments: [
    {
      name: 'task_type',
      description: 'Type of task to schedule (meeting, deadline, habit, follow_up, creative_work, routine, learning, exercise)',
      required: false,
      schema: z.enum(['meeting', 'deadline', 'habit', 'follow_up', 'creative_work', 'routine', 'learning', 'exercise']),
      defaultValue: 'routine',
    },
    {
      name: 'energy_level_required',
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
    {
      name: 'urgency',
      description: 'Urgency level of the task (low, medium, high, critical)',
      required: false,
      schema: z.enum(['low', 'medium', 'high', 'critical']),
      defaultValue: 'medium',
    },
    {
      name: 'duration_estimate',
      description: 'Estimated duration for the task',
      required: false,
      schema: z.string(),
      defaultValue: 'not specified',
    },
    {
      name: 'optimal_conditions',
      description: 'Optimal conditions for task execution (quiet environment, specific location, etc.)',
      required: false,
      schema: z.array(z.string()),
      defaultValue: [],
    },
  ],
  template: (args) => {
    const {
      task_type,
      energy_level_required,
      dependencies,
      urgency,
      duration_estimate,
      optimal_conditions,
    } = contextAwareSchedulingSchema.parse(args);

    return {
      description: `Context-aware scheduling for ${task_type} task requiring ${energy_level_required} energy`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me create context-aware reminders for a ${task_type} task that requires ${energy_level_required} energy level.

**Task Context:**
- Task Type: ${task_type}
- Energy Required: ${energy_level_required}
- Dependencies: ${dependencies}
- Urgency: ${urgency}
- Duration: ${duration_estimate}
- Optimal Conditions: ${optimal_conditions.length > 0 ? optimal_conditions.join(', ') : 'Standard conditions'}

**Please analyze and optimize:**

1. **Context Analysis**
   - Analyze the ${task_type} task requirements and characteristics
   - Consider energy patterns and optimal timing for ${energy_level_required} energy tasks
   - Account for dependencies: ${dependencies}
   - Evaluate urgency level and deadline pressure

2. **Optimal Timing Determination**
   - Determine the best time of day/week for this type of task
   - Consider my natural energy patterns and peak performance times
   - Account for external factors and environmental conditions
   - Plan for optimal conditions: ${optimal_conditions.length > 0 ? optimal_conditions.join(', ') : 'Standard conditions'}

3. **Preparation & Setup**
   - Create preparation reminders to ensure readiness
   - Plan for required resources and materials
   - Set up environmental conditions for success
   - Schedule buffer time for unexpected delays

4. **Dependency Management**
   - Account for dependencies: ${dependencies}
   - Create prerequisite task reminders if needed
   - Plan for sequential task execution
   - Set up dependency tracking and monitoring

5. **Intelligent Scheduling Features**
   - Create adaptive scheduling based on context
   - Set up automatic rescheduling for conflicts
   - Design flexible timing windows
   - Plan for context changes and adjustments

6. **Follow-up & Completion Tracking**
   - Set up completion verification reminders
   - Create follow-up task triggers
   - Plan for next-step automation
   - Design progress tracking and reporting

7. **Success Optimization**
   - Add elements that increase completion likelihood
   - Create motivation and accountability triggers
   - Design celebration and recognition systems
   - Plan for continuous improvement and learning

Create a scheduling strategy that maximizes the likelihood of successful task completion by considering all contextual factors and optimizing for my natural patterns and preferences.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'intermediate',
    estimatedTime: '10-15 minutes',
  },
};

/**
 * Automated workflow creation prompt
 */
const automatedWorkflowSchema = z.object({
  workflow_type: z.enum(['daily_routine', 'weekly_planning', 'project_management', 'habit_tracking', 'goal_review', 'maintenance']).optional().default('daily_routine'),
  automation_level: z.enum(['basic', 'intermediate', 'advanced']).optional().default('intermediate'),
  trigger_frequency: z.enum(['daily', 'weekly', 'monthly', 'on_demand']).optional().default('daily'),
  include_adaptation: z.boolean().optional().default(true),
  include_monitoring: z.boolean().optional().default(true),
});

export const automatedWorkflowCreation: PromptDefinition = {
  name: 'automated-workflow-creation',
  description: 'Create automated workflows for recurring tasks and processes',
  category: 'automation',
  tags: ['workflow', 'automation', 'recurring', 'efficiency', 'optimization'],
  arguments: [
    {
      name: 'workflow_type',
      description: 'Type of workflow to create (daily_routine, weekly_planning, project_management, habit_tracking, goal_review, maintenance)',
      required: false,
      schema: z.enum(['daily_routine', 'weekly_planning', 'project_management', 'habit_tracking', 'goal_review', 'maintenance']),
      defaultValue: 'daily_routine',
    },
    {
      name: 'automation_level',
      description: 'Level of automation (basic, intermediate, advanced)',
      required: false,
      schema: z.enum(['basic', 'intermediate', 'advanced']),
      defaultValue: 'intermediate',
    },
    {
      name: 'trigger_frequency',
      description: 'How often the workflow should trigger (daily, weekly, monthly, on_demand)',
      required: false,
      schema: z.enum(['daily', 'weekly', 'monthly', 'on_demand']),
      defaultValue: 'daily',
    },
    {
      name: 'include_adaptation',
      description: 'Include adaptive learning and improvement mechanisms',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'include_monitoring',
      description: 'Include monitoring and performance tracking',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
  ],
  template: (args) => {
    const {
      workflow_type,
      automation_level,
      trigger_frequency,
      include_adaptation,
      include_monitoring,
    } = automatedWorkflowSchema.parse(args);

    return {
      description: `Automated ${workflow_type} workflow with ${automation_level} automation level triggering ${trigger_frequency}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me create an automated ${workflow_type} workflow with ${automation_level} automation level that triggers ${trigger_frequency}.

**Workflow Parameters:**
- Workflow Type: ${workflow_type}
- Automation Level: ${automation_level}
- Trigger Frequency: ${trigger_frequency}
- Include Adaptation: ${include_adaptation ? 'Yes' : 'No'}
- Include Monitoring: ${include_monitoring ? 'Yes' : 'No'}

**Please help me design:**

1. **Workflow Analysis & Design**
   - Analyze the ${workflow_type} process and requirements
   - Identify repetitive tasks and decision points
   - Design efficient workflow structure and flow
   - Plan for ${automation_level} automation implementation

2. **Trigger & Timing System**
   - Design ${trigger_frequency} trigger mechanisms
   - Create optimal timing and scheduling
   - Plan for context-aware triggering
   - Set up flexible and adaptive timing

3. **Automation Implementation**
   - Create automated task generation and assignment
   - Design decision-making automation rules
   - Implement ${automation_level} level automation features
   - Plan for human oversight and intervention points

4. **Adaptation & Learning**${include_adaptation ? `
   - Design adaptive learning mechanisms
   - Create feedback collection and processing
   - Plan for workflow optimization and improvement
   - Set up continuous adaptation systems` : ''}

5. **Monitoring & Performance**${include_monitoring ? `
   - Create performance tracking and measurement
   - Design workflow effectiveness monitoring
   - Plan for bottleneck identification and resolution
   - Set up success metrics and reporting` : ''}

6. **Integration & Coordination**
   - Integrate with existing productivity systems
   - Plan for workflow coordination and dependencies
   - Design seamless user experience
   - Ensure compatibility with current tools and processes

7. **Quality Assurance & Maintenance**
   - Create quality control mechanisms
   - Plan for regular maintenance and updates
   - Design error handling and recovery
   - Set up continuous improvement processes

8. **User Experience & Control**
   - Design intuitive user interface and controls
   - Plan for manual override and customization
   - Create user feedback and adjustment mechanisms
   - Ensure transparency and user understanding

Create an automated workflow that streamlines my ${workflow_type} process while maintaining flexibility, adaptability, and user control.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'advanced',
    estimatedTime: '25-35 minutes',
  },
};

/**
 * Smart notification system prompt
 */
const smartNotificationSchema = z.object({
  notification_type: z.enum(['reminders', 'deadlines', 'habits', 'goals', 'maintenance', 'all']).optional().default('all'),
  intelligence_level: z.enum(['basic', 'smart', 'adaptive']).optional().default('smart'),
  user_preferences: z.array(z.string()).optional().default([]),
  context_awareness: z.boolean().optional().default(true),
  learning_enabled: z.boolean().optional().default(true),
});

export const smartNotificationSystem: PromptDefinition = {
  name: 'smart-notification-system',
  description: 'Design intelligent notification system for optimal user experience',
  category: 'automation',
  tags: ['notifications', 'intelligence', 'context', 'learning', 'optimization'],
  arguments: [
    {
      name: 'notification_type',
      description: 'Types of notifications to optimize (reminders, deadlines, habits, goals, maintenance, all)',
      required: false,
      schema: z.enum(['reminders', 'deadlines', 'habits', 'goals', 'maintenance', 'all']),
      defaultValue: 'all',
    },
    {
      name: 'intelligence_level',
      description: 'Level of intelligence in notification system (basic, smart, adaptive)',
      required: false,
      schema: z.enum(['basic', 'smart', 'adaptive']),
      defaultValue: 'smart',
    },
    {
      name: 'user_preferences',
      description: 'User preferences for notifications (quiet_hours, work_focus, personal_time, etc.)',
      required: false,
      schema: z.array(z.string()),
      defaultValue: [],
    },
    {
      name: 'context_awareness',
      description: 'Enable context-aware notification timing and content',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'learning_enabled',
      description: 'Enable learning from user behavior and preferences',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
  ],
  template: (args) => {
    const {
      notification_type,
      intelligence_level,
      user_preferences,
      context_awareness,
      learning_enabled,
    } = smartNotificationSchema.parse(args);

    return {
      description: `Smart notification system for ${notification_type} with ${intelligence_level} intelligence`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me design an intelligent notification system for ${notification_type} with ${intelligence_level} intelligence level.

**Notification System Parameters:**
- Notification Type: ${notification_type}
- Intelligence Level: ${intelligence_level}
- User Preferences: ${user_preferences.length > 0 ? user_preferences.join(', ') : 'Standard preferences'}
- Context Awareness: ${context_awareness ? 'Enabled' : 'Disabled'}
- Learning Enabled: ${learning_enabled ? 'Enabled' : 'Disabled'}

**Please help me design:**

1. **Notification Strategy & Philosophy**
   - Design notification philosophy and principles
   - Balance information with user attention and focus
   - Create notification hierarchy and prioritization
   - Plan for user control and customization

2. **Intelligent Timing System**
   - Design ${intelligence_level} timing algorithms
   - Create context-aware scheduling${context_awareness ? ' based on user context and activity' : ''}
   - Plan for optimal notification timing
   - Set up adaptive timing based on user behavior

3. **Content & Messaging Optimization**
   - Design clear, actionable notification content
   - Create personalized messaging based on context
   - Plan for urgency and importance communication
   - Design engaging and motivating notification styles

4. **User Preference Integration**
   - Incorporate user preferences: ${user_preferences.length > 0 ? user_preferences.join(', ') : 'Standard preferences'}
   - Create preference learning and adaptation${learning_enabled ? ' mechanisms' : ''}
   - Plan for user feedback and adjustment
   - Design preference conflict resolution

5. **Context Awareness & Adaptation**${context_awareness ? `
   - Design context detection and analysis
   - Create adaptive notification behavior
   - Plan for environmental and situational awareness
   - Set up context-based notification filtering` : ''}

6. **Learning & Optimization**${learning_enabled ? `
   - Design learning algorithms for user behavior
   - Create feedback collection and processing
   - Plan for continuous optimization and improvement
   - Set up A/B testing and experimentation` : ''}

7. **Integration & Coordination**
   - Integrate with existing productivity systems
   - Plan for cross-platform notification coordination
   - Design seamless user experience
   - Ensure consistency across different contexts

8. **Performance & Reliability**
   - Design reliable notification delivery
   - Plan for error handling and recovery
   - Create performance monitoring and optimization
   - Set up quality assurance and testing

Create a notification system that provides timely, relevant, and helpful information while respecting my attention and preferences, and continuously improving through learning and adaptation.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'advanced',
    estimatedTime: '30-40 minutes',
  },
};