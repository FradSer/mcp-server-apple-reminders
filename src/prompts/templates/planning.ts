/**
 * prompts/templates/planning.ts
 * Planning-focused prompt templates
 */

import { z } from 'zod';
import type { PromptDefinition } from '../types.js';

/**
 * Weekly planning workflow prompt
 */
const weeklyPlanningSchema = z.object({
  focus_areas: z.array(z.string()).optional().default(['general productivity']),
  week_start_date: z.string().optional().default('this week'),
  planning_style: z.enum(['detailed', 'high_level', 'balanced']).optional().default('balanced'),
  include_review: z.boolean().optional().default(true),
  goal_alignment: z.boolean().optional().default(true),
});

export const weeklyPlanningWorkflow: PromptDefinition = {
  name: 'weekly-planning-workflow',
  description: 'Create a structured weekly planning session with Apple Reminders',
  category: 'planning',
  tags: ['weekly', 'planning', 'goals', 'structure', 'review'],
  arguments: [
    {
      name: 'focus_areas',
      description: 'Main areas to focus on this week (work projects, personal goals, health, etc.)',
      required: false,
      schema: z.array(z.string()),
      defaultValue: ['general productivity'],
    },
    {
      name: 'week_start_date',
      description: 'Starting date for the week in YYYY-MM-DD format or relative terms',
      required: false,
      schema: z.string(),
      defaultValue: 'this week',
    },
    {
      name: 'planning_style',
      description: 'Level of detail in planning (detailed, high_level, balanced)',
      required: false,
      schema: z.enum(['detailed', 'high_level', 'balanced']),
      defaultValue: 'balanced',
    },
    {
      name: 'include_review',
      description: 'Include review of previous week and goal alignment',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'goal_alignment',
      description: 'Align weekly plan with longer-term goals',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
  ],
  template: (args) => {
    const {
      focus_areas,
      week_start_date,
      planning_style,
      include_review,
      goal_alignment,
    } = weeklyPlanningSchema.parse(args);

    return {
      description: `Structured weekly planning for ${week_start_date} focusing on ${focus_areas.join(', ')}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me create a comprehensive weekly plan starting ${week_start_date}, focusing on: ${focus_areas.join(', ')}.

**Planning Parameters:**
- Focus Areas: ${focus_areas.join(', ')}
- Week Start: ${week_start_date}
- Planning Style: ${planning_style}
- Include Review: ${include_review ? 'Yes' : 'No'}
- Goal Alignment: ${goal_alignment ? 'Yes' : 'No'}

**Please guide me through:**

1. **Week Assessment & Review**${include_review ? `
   - Review previous week's accomplishments and challenges
   - Identify what worked well and what needs improvement
   - Assess progress toward longer-term goals
   - Extract lessons learned and insights` : ''}

2. **Goal Setting & Prioritization**
   - Set 3-5 key objectives for the week
   - Prioritize based on importance and urgency
   - Ensure alignment with ${goal_alignment ? 'longer-term goals' : 'immediate priorities'}
   - Create success metrics for each objective

3. **Daily Structure Design**
   - Plan daily themes or focus areas
   - Allocate time blocks for different types of work
   - Schedule buffer time and flexibility
   - Design morning and evening routines

4. **Task Breakdown & Scheduling**
   - Break weekly objectives into daily actionable tasks
   - Assign realistic time estimates
   - Schedule tasks based on energy levels and priorities
   - Create dependencies and sequence planning

5. **Resource & Preparation Planning**
   - Identify required resources and materials
   - Plan preparation activities
   - Schedule learning or skill development time
   - Prepare for potential obstacles

6. **Review & Adjustment Framework**
   - Set up daily check-in points
   - Create mid-week review process
   - Design end-of-week evaluation
   - Plan for course corrections

7. **Motivation & Accountability**
   - Set up progress tracking mechanisms
   - Create celebration milestones
   - Design accountability systems
   - Plan for motivation maintenance

Create a comprehensive weekly plan that balances ambition with realism, includes proper review cycles, and sets me up for a productive and fulfilling week.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'intermediate',
    estimatedTime: '20-25 minutes',
  },
};

/**
 * Monthly goal planning prompt
 */
const monthlyGoalPlanningSchema = z.object({
  goal_type: z.enum(['personal', 'professional', 'health', 'learning', 'financial', 'creative', 'mixed']).optional().default('mixed'),
  planning_depth: z.enum(['high_level', 'detailed', 'comprehensive']).optional().default('comprehensive'),
  include_habits: z.boolean().optional().default(true),
  review_frequency: z.enum(['weekly', 'bi_weekly', 'monthly']).optional().default('weekly'),
});

export const monthlyGoalPlanning: PromptDefinition = {
  name: 'monthly-goal-planning',
  description: 'Set up comprehensive monthly goal planning and tracking system',
  category: 'planning',
  tags: ['monthly', 'goals', 'tracking', 'habits', 'review'],
  arguments: [
    {
      name: 'goal_type',
      description: 'Type of goals to focus on (personal, professional, health, learning, financial, creative, mixed)',
      required: false,
      schema: z.enum(['personal', 'professional', 'health', 'learning', 'financial', 'creative', 'mixed']),
      defaultValue: 'mixed',
    },
    {
      name: 'planning_depth',
      description: 'Level of detail in planning (high_level, detailed, comprehensive)',
      required: false,
      schema: z.enum(['high_level', 'detailed', 'comprehensive']),
      defaultValue: 'comprehensive',
    },
    {
      name: 'include_habits',
      description: 'Include habit tracking and development in the plan',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'review_frequency',
      description: 'How often to review progress (weekly, bi_weekly, monthly)',
      required: false,
      schema: z.enum(['weekly', 'bi_weekly', 'monthly']),
      defaultValue: 'weekly',
    },
  ],
  template: (args) => {
    const {
      goal_type,
      planning_depth,
      include_habits,
      review_frequency,
    } = monthlyGoalPlanningSchema.parse(args);

    return {
      description: `Monthly goal planning for ${goal_type} goals with ${planning_depth} detail level`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me create a comprehensive monthly goal planning system for ${goal_type} goals with ${planning_depth} planning depth.

**Planning Parameters:**
- Goal Type: ${goal_type}
- Planning Depth: ${planning_depth}
- Include Habits: ${include_habits ? 'Yes' : 'No'}
- Review Frequency: ${review_frequency}

**Please help me design:**

1. **Goal Definition & Clarity**
   - Define 3-5 specific, measurable monthly goals
   - Ensure goals are aligned with longer-term objectives
   - Create clear success criteria and metrics
   - Establish realistic but challenging targets

2. **Strategic Breakdown**
   - Break monthly goals into weekly milestones
   - Identify key activities and deliverables
   - Create dependency mapping and sequencing
   - Plan for potential obstacles and solutions

3. **Habit Integration**${include_habits ? `
   - Design supporting habits for goal achievement
   - Create daily and weekly habit routines
   - Set up habit tracking and accountability
   - Plan habit stacking and optimization` : ''}

4. **Resource & Time Planning**
   - Allocate time blocks for goal-related activities
   - Identify required resources and skills
   - Plan learning and development needs
   - Schedule buffer time and flexibility

5. **Progress Tracking System**
   - Design ${review_frequency} review processes
   - Create progress measurement tools
   - Set up milestone celebrations
   - Plan for course corrections and adjustments

6. **Motivation & Accountability**
   - Create motivation maintenance strategies
   - Design accountability mechanisms
   - Plan for challenges and setbacks
   - Set up support systems and resources

7. **Integration with Daily Workflow**
   - Connect monthly goals to daily task management
   - Create reminder systems for goal activities
   - Design weekly planning integration
   - Ensure sustainable implementation

Create a goal planning system that is ambitious yet achievable, includes proper tracking and review mechanisms, and integrates seamlessly with my daily productivity workflow.`,
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

/**
 * Project planning prompt
 */
const projectPlanningSchema = z.object({
  project_name: z.string(),
  project_type: z.enum(['work', 'personal', 'learning', 'creative', 'health', 'other']).optional().default('personal'),
  timeline: z.enum(['short_term', 'medium_term', 'long_term']).optional().default('medium_term'),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional().default('moderate'),
  team_size: z.enum(['individual', 'small_team', 'large_team']).optional().default('individual'),
});

export const projectPlanning: PromptDefinition = {
  name: 'project-planning',
  description: 'Create comprehensive project planning and management system',
  category: 'planning',
  tags: ['project', 'management', 'timeline', 'milestones', 'tracking'],
  arguments: [
    {
      name: 'project_name',
      description: 'Name of the project to plan',
      required: true,
      schema: z.string(),
    },
    {
      name: 'project_type',
      description: 'Type of project (work, personal, learning, creative, health, other)',
      required: false,
      schema: z.enum(['work', 'personal', 'learning', 'creative', 'health', 'other']),
      defaultValue: 'personal',
    },
    {
      name: 'timeline',
      description: 'Project timeline (short_term, medium_term, long_term)',
      required: false,
      schema: z.enum(['short_term', 'medium_term', 'long_term']),
      defaultValue: 'medium_term',
    },
    {
      name: 'complexity',
      description: 'Project complexity level (simple, moderate, complex)',
      required: false,
      schema: z.enum(['simple', 'moderate', 'complex']),
      defaultValue: 'moderate',
    },
    {
      name: 'team_size',
      description: 'Team size for the project (individual, small_team, large_team)',
      required: false,
      schema: z.enum(['individual', 'small_team', 'large_team']),
      defaultValue: 'individual',
    },
  ],
  template: (args) => {
    const {
      project_name,
      project_type,
      timeline,
      complexity,
      team_size,
    } = projectPlanningSchema.parse(args);

    return {
      description: `Project planning for: ${project_name} (${project_type}, ${timeline}, ${complexity})`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me create a comprehensive project plan for: "${project_name}"

**Project Parameters:**
- Project Name: ${project_name}
- Type: ${project_type}
- Timeline: ${timeline}
- Complexity: ${complexity}
- Team Size: ${team_size}

**Please help me design:**

1. **Project Definition & Scope**
   - Define clear project objectives and deliverables
   - Establish project boundaries and constraints
   - Create success criteria and quality standards
   - Identify key stakeholders and requirements

2. **Work Breakdown Structure**
   - Break project into major phases and milestones
   - Create detailed task lists for each phase
   - Identify dependencies and critical path
   - Estimate effort and resource requirements

3. **Timeline & Scheduling**
   - Create realistic timeline based on ${timeline} duration
   - Schedule milestones and key deliverables
   - Plan for buffer time and risk mitigation
   - Design flexible scheduling for changes

4. **Resource Planning**
   - Identify required skills and knowledge
   - Plan learning and development needs
   - Allocate time and energy resources
   - Consider ${team_size === 'individual' ? 'personal capacity' : 'team coordination'}

5. **Risk Management**
   - Identify potential risks and obstacles
   - Create mitigation strategies
   - Plan for contingency scenarios
   - Design early warning systems

6. **Progress Tracking System**
   - Create milestone tracking mechanisms
   - Design progress measurement tools
   - Set up regular review cycles
   - Plan for course corrections

7. **Integration with Task Management**
   - Connect project tasks to daily workflow
   - Create reminder systems for project activities
   - Design weekly planning integration
   - Ensure sustainable project execution

Create a project plan that is comprehensive yet manageable, includes proper risk management and tracking, and integrates effectively with my existing productivity systems.`,
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