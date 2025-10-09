/**
 * prompts/templates/goals.ts
 * Goal-focused prompt templates
 */

import { z } from 'zod';
import type { PromptDefinition } from '../types.js';

/**
 * Goal tracking setup prompt
 */
const goalTrackingSetupSchema = z.object({
  goal_type: z.enum(['habit', 'project', 'learning', 'health', 'financial', 'creative', 'career', 'personal']).optional().default('personal'),
  time_horizon: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional().default('monthly'),
  tracking_method: z.enum(['simple', 'detailed', 'comprehensive']).optional().default('detailed'),
  include_milestones: z.boolean().optional().default(true),
  accountability_system: z.boolean().optional().default(true),
});

export const goalTrackingSetup: PromptDefinition = {
  name: 'goal-tracking-setup',
  description: 'Set up a comprehensive goal tracking system using Apple Reminders',
  category: 'goals',
  tags: ['goals', 'tracking', 'milestones', 'accountability', 'progress'],
  arguments: [
    {
      name: 'goal_type',
      description: 'Type of goal to track (habit, project, learning, health, financial, creative, career, personal)',
      required: false,
      schema: z.enum(['habit', 'project', 'learning', 'health', 'financial', 'creative', 'career', 'personal']),
      defaultValue: 'personal',
    },
    {
      name: 'time_horizon',
      description: 'Time horizon for the goal (daily, weekly, monthly, quarterly, yearly)',
      required: false,
      schema: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
      defaultValue: 'monthly',
    },
    {
      name: 'tracking_method',
      description: 'Level of detail in tracking (simple, detailed, comprehensive)',
      required: false,
      schema: z.enum(['simple', 'detailed', 'comprehensive']),
      defaultValue: 'detailed',
    },
    {
      name: 'include_milestones',
      description: 'Include milestone tracking and celebration',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'accountability_system',
      description: 'Include accountability and motivation systems',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
  ],
  template: (args) => {
    const {
      goal_type,
      time_horizon,
      tracking_method,
      include_milestones,
      accountability_system,
    } = goalTrackingSetupSchema.parse(args);

    return {
      description: `Goal tracking setup for ${goal_type} goals with ${time_horizon} horizon using ${tracking_method} tracking`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me set up a comprehensive goal tracking system for ${goal_type} goals with a ${time_horizon} time horizon using ${tracking_method} tracking.

**Goal Tracking Parameters:**
- Goal Type: ${goal_type}
- Time Horizon: ${time_horizon}
- Tracking Method: ${tracking_method}
- Include Milestones: ${include_milestones ? 'Yes' : 'No'}
- Accountability System: ${accountability_system ? 'Yes' : 'No'}

**Please help me design:**

1. **Goal Definition & Clarity**
   - Define specific, measurable ${goal_type} goals
   - Create clear success criteria and metrics
   - Establish realistic but challenging targets
   - Ensure goals are aligned with my values and priorities

2. **Milestone & Progress Tracking**${include_milestones ? `
   - Break down goals into measurable milestones
   - Create progress tracking mechanisms
   - Design milestone celebration system
   - Set up progress visualization methods` : ''}

3. **Reminder System Design**
   - Create goal-related reminder structure
   - Design daily, weekly, and ${time_horizon} check-ins
   - Set up progress review reminders
   - Plan for goal adjustment and course correction

4. **Tracking & Measurement System**
   - Design ${tracking_method} tracking approach
   - Create data collection methods
   - Set up progress measurement tools
   - Plan for trend analysis and insights

5. **Accountability & Motivation**${accountability_system ? `
   - Design accountability mechanisms
   - Create motivation maintenance strategies
   - Set up progress sharing systems
   - Plan for challenge and setback handling` : ''}

6. **Review & Adjustment Framework**
   - Create regular review cycles
   - Design goal adjustment procedures
   - Plan for celebration and recognition
   - Set up continuous improvement processes

7. **Integration & Workflow**
   - Connect goal tracking to daily task management
   - Integrate with existing productivity systems
   - Design seamless workflow integration
   - Ensure sustainable long-term implementation

8. **Success Optimization**
   - Create strategies for goal achievement
   - Design obstacle prevention and handling
   - Plan for habit formation and maintenance
   - Set up success amplification systems

Create a goal tracking system that keeps me motivated, accountable, and on track toward achieving my ${goal_type} goals while providing clear visibility into my progress and areas for improvement.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'intermediate',
    estimatedTime: '25-35 minutes',
  },
};

/**
 * SMART goals creation prompt
 */
const smartGoalsCreationSchema = z.object({
  goal_domain: z.enum(['personal', 'professional', 'health', 'financial', 'learning', 'creative', 'relationships', 'spiritual']).optional().default('personal'),
  goal_quantity: z.number().min(1).max(10).optional().default(3),
  time_frame: z.enum(['short_term', 'medium_term', 'long_term']).optional().default('medium_term'),
  include_action_plan: z.boolean().optional().default(true),
  include_obstacle_planning: z.boolean().optional().default(true),
});

export const smartGoalsCreation: PromptDefinition = {
  name: 'smart-goals-creation',
  description: 'Create SMART goals with comprehensive action planning',
  category: 'goals',
  tags: ['smart_goals', 'planning', 'action_plan', 'obstacles', 'success'],
  arguments: [
    {
      name: 'goal_domain',
      description: 'Domain for goals (personal, professional, health, financial, learning, creative, relationships, spiritual)',
      required: false,
      schema: z.enum(['personal', 'professional', 'health', 'financial', 'learning', 'creative', 'relationships', 'spiritual']),
      defaultValue: 'personal',
    },
    {
      name: 'goal_quantity',
      description: 'Number of goals to create (1-10)',
      required: false,
      schema: z.number().min(1).max(10),
      defaultValue: 3,
    },
    {
      name: 'time_frame',
      description: 'Time frame for goals (short_term, medium_term, long_term)',
      required: false,
      schema: z.enum(['short_term', 'medium_term', 'long_term']),
      defaultValue: 'medium_term',
    },
    {
      name: 'include_action_plan',
      description: 'Include detailed action planning for each goal',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'include_obstacle_planning',
      description: 'Include obstacle identification and planning',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
  ],
  template: (args) => {
    const {
      goal_domain,
      goal_quantity,
      time_frame,
      include_action_plan,
      include_obstacle_planning,
    } = smartGoalsCreationSchema.parse(args);

    return {
      description: `SMART goals creation for ${goal_quantity} ${goal_domain} goals with ${time_frame} timeframe`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me create ${goal_quantity} SMART goals in the ${goal_domain} domain with a ${time_frame} timeframe.

**Goal Creation Parameters:**
- Domain: ${goal_domain}
- Quantity: ${goal_quantity} goals
- Time Frame: ${time_frame}
- Include Action Plan: ${include_action_plan ? 'Yes' : 'No'}
- Include Obstacle Planning: ${include_obstacle_planning ? 'Yes' : 'No'}

**Please help me create:**

1. **Goal Brainstorming & Selection**
   - Brainstorm potential ${goal_domain} goals
   - Evaluate and prioritize goal ideas
   - Select the most impactful ${goal_quantity} goals
   - Ensure goals align with my values and priorities

2. **SMART Goal Development**
   - Make each goal **Specific** with clear definitions
   - Ensure goals are **Measurable** with concrete metrics
   - Verify goals are **Achievable** and realistic
   - Confirm goals are **Relevant** to my ${goal_domain} focus
   - Set **Time-bound** deadlines for ${time_frame} completion

3. **Goal Clarity & Definition**
   - Write clear, compelling goal statements
   - Define success criteria and completion metrics
   - Establish baseline measurements
   - Create goal visualization and motivation elements

4. **Action Planning**${include_action_plan ? `
   - Break each goal into actionable steps
   - Create detailed implementation roadmap
   - Assign realistic timeframes to each step
   - Identify required resources and support` : ''}

5. **Obstacle Planning**${include_obstacle_planning ? `
   - Identify potential obstacles and challenges
   - Create prevention and mitigation strategies
   - Plan for setback recovery
   - Design contingency plans` : ''}

6. **Progress Tracking Design**
   - Create progress measurement systems
   - Design regular check-in schedules
   - Set up milestone tracking
   - Plan for goal adjustment and refinement

7. **Motivation & Accountability**
   - Design motivation maintenance strategies
   - Create accountability mechanisms
   - Plan for celebration and recognition
   - Set up support systems and resources

8. **Integration & Implementation**
   - Connect goals to daily task management
   - Integrate with existing productivity systems
   - Create reminder and tracking systems
   - Plan for sustainable long-term execution

Create ${goal_quantity} powerful, achievable ${goal_domain} goals that will drive meaningful progress and transformation in my life.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'intermediate',
    estimatedTime: '30-40 minutes',
  },
};

/**
 * Goal review and adjustment prompt
 */
const goalReviewSchema = z.object({
  review_period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional().default('monthly'),
  review_depth: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed'),
  include_celebration: z.boolean().optional().default(true),
  include_adjustment: z.boolean().optional().default(true),
  goal_focus: z.array(z.string()).optional().default([]),
});

export const goalReviewAndAdjustment: PromptDefinition = {
  name: 'goal-review-adjustment',
  description: 'Comprehensive goal review and adjustment process',
  category: 'goals',
  tags: ['review', 'adjustment', 'celebration', 'optimization', 'progress'],
  arguments: [
    {
      name: 'review_period',
      description: 'Period for goal review (weekly, monthly, quarterly, yearly)',
      required: false,
      schema: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
      defaultValue: 'monthly',
    },
    {
      name: 'review_depth',
      description: 'Depth of review analysis (basic, detailed, comprehensive)',
      required: false,
      schema: z.enum(['basic', 'detailed', 'comprehensive']),
      defaultValue: 'detailed',
    },
    {
      name: 'include_celebration',
      description: 'Include celebration of achievements and progress',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'include_adjustment',
      description: 'Include goal adjustment and optimization recommendations',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'goal_focus',
      description: 'Specific goals to focus on (leave empty for all goals)',
      required: false,
      schema: z.array(z.string()),
      defaultValue: [],
    },
  ],
  template: (args) => {
    const {
      review_period,
      review_depth,
      include_celebration,
      include_adjustment,
      goal_focus,
    } = goalReviewSchema.parse(args);

    return {
      description: `${review_period} goal review with ${review_depth} analysis${goal_focus.length > 0 ? ` focusing on ${goal_focus.join(', ')}` : ''}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me conduct a comprehensive ${review_period} goal review with ${review_depth} analysis${goal_focus.length > 0 ? ` focusing on: ${goal_focus.join(', ')}` : ''}.

**Review Parameters:**
- Review Period: ${review_period}
- Review Depth: ${review_depth}
- Include Celebration: ${include_celebration ? 'Yes' : 'No'}
- Include Adjustment: ${include_adjustment ? 'Yes' : 'No'}
- Goal Focus: ${goal_focus.length > 0 ? goal_focus.join(', ') : 'All goals'}

**Please guide me through:**

1. **Progress Assessment**
   - Review progress on all goals${goal_focus.length > 0 ? ` with special focus on: ${goal_focus.join(', ')}` : ''}
   - Measure actual progress against planned milestones
   - Calculate completion percentages and trends
   - Assess quality of progress and goal alignment

2. **Achievement Recognition**${include_celebration ? `
   - Identify and celebrate completed goals and milestones
   - Recognize significant progress and improvements
   - Acknowledge effort and consistency
   - Plan appropriate rewards and recognition` : ''}

3. **Challenge & Obstacle Analysis**
   - Identify obstacles and challenges encountered
   - Analyze root causes of difficulties
   - Assess impact on goal achievement
   - Review effectiveness of obstacle-handling strategies

4. **Strategy Effectiveness Review**
   - Evaluate current strategies and approaches
   - Identify what's working well and what isn't
   - Assess resource allocation and utilization
   - Review time management and prioritization

5. **Goal Relevance & Alignment**
   - Evaluate ongoing relevance of each goal
   - Assess alignment with current priorities and values
   - Identify goals that may need modification or elimination
   - Review goal relationships and dependencies

6. **Adjustment & Optimization**${include_adjustment ? `
   - Recommend specific goal adjustments and modifications
   - Suggest strategy improvements and changes
   - Propose timeline adjustments if needed
   - Design new approaches for challenging goals` : ''}

7. **Learning & Insights**
   - Extract key lessons learned
   - Identify patterns in success and failure
   - Generate insights for future goal setting
   - Create knowledge for continuous improvement

8. **Next Period Planning**
   - Set priorities for the next ${review_period}
   - Plan specific actions and strategies
   - Adjust timelines and milestones as needed
   - Create motivation and accountability systems

Conduct a thorough review that celebrates my achievements, identifies areas for improvement, and sets me up for even greater success in the next ${review_period}.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'intermediate',
    estimatedTime: '20-30 minutes',
  },
};