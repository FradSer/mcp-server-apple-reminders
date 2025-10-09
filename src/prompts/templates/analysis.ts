/**
 * prompts/templates/analysis.ts
 * Analysis-focused prompt templates
 */

import { z } from 'zod';
import type { PromptDefinition } from '../types.js';

/**
 * Reminder review assistant prompt
 */
const reminderReviewSchema = z.object({
  review_type: z.enum(['overdue', 'completed', 'upcoming', 'all', 'patterns']).optional().default('all'),
  list_name: z.string().optional().default('all lists'),
  analysis_depth: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed'),
  include_recommendations: z.boolean().optional().default(true),
  time_period: z.enum(['last_week', 'last_month', 'last_3_months', 'last_6_months', 'last_year']).optional().default('last_month'),
});

export const reminderReviewAssistant: PromptDefinition = {
  name: 'reminder-review-assistant',
  description: 'Analyze and review existing reminders for productivity optimization',
  category: 'analysis',
  tags: ['review', 'analysis', 'optimization', 'insights', 'patterns'],
  arguments: [
    {
      name: 'review_type',
      description: 'Type of review to perform (overdue, completed, upcoming, all, patterns)',
      required: false,
      schema: z.enum(['overdue', 'completed', 'upcoming', 'all', 'patterns']),
      defaultValue: 'all',
    },
    {
      name: 'list_name',
      description: 'Specific reminder list to review (leave empty for all lists)',
      required: false,
      schema: z.string(),
      defaultValue: 'all lists',
    },
    {
      name: 'analysis_depth',
      description: 'Depth of analysis (basic, detailed, comprehensive)',
      required: false,
      schema: z.enum(['basic', 'detailed', 'comprehensive']),
      defaultValue: 'detailed',
    },
    {
      name: 'include_recommendations',
      description: 'Include actionable recommendations for improvement',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'time_period',
      description: 'Time period to analyze for patterns and trends',
      required: false,
      schema: z.enum(['last_week', 'last_month', 'last_3_months', 'last_6_months', 'last_year']),
      defaultValue: 'last_month',
    },
  ],
  template: (args) => {
    const {
      review_type,
      list_name,
      analysis_depth,
      include_recommendations,
      time_period,
    } = reminderReviewSchema.parse(args);

    return {
      description: `Reminder review analysis for ${review_type} reminders in ${list_name} with ${analysis_depth} depth`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me perform a comprehensive review and analysis of my Apple Reminders, focusing on ${review_type} reminders in ${list_name} with ${analysis_depth} analysis depth.

**Review Parameters:**
- Review Type: ${review_type}
- List Focus: ${list_name}
- Analysis Depth: ${analysis_depth}
- Include Recommendations: ${include_recommendations ? 'Yes' : 'No'}
- Time Period: ${time_period}

**Please perform a comprehensive analysis:**

1. **Current State Assessment**
   - List and categorize all ${review_type} reminders
   - Analyze reminder distribution across lists
   - Assess completion rates and patterns
   - Identify immediate issues and opportunities

2. **Pattern Recognition & Analysis**
   - Identify recurring themes and patterns
   - Analyze timing and scheduling effectiveness
   - Recognize successful strategies and approaches
   - Find correlation patterns between different factors

3. **Performance Metrics & Trends**
   - Calculate completion rates and trends over ${time_period}
   - Measure time estimation accuracy
   - Assess goal achievement progress
   - Analyze productivity patterns and cycles

4. **Problem Identification**
   - Identify recurring obstacles and challenges
   - Find systemic issues in reminder management
   - Recognize areas of inefficiency
   - Spot opportunities for improvement

5. **Success Analysis**
   - Identify what's working well
   - Recognize successful strategies and habits
   - Find high-performing reminder patterns
   - Analyze factors contributing to success

6. **Comparative Analysis**
   - Compare performance across different time periods
   - Analyze changes in productivity patterns
   - Identify improvement or decline trends
   - Assess the impact of recent changes

7. **Actionable Recommendations**${include_recommendations ? `
   - Provide specific, actionable improvement suggestions
   - Recommend workflow optimizations
   - Suggest new strategies and techniques
   - Create implementation roadmap` : ''}

8. **Future Planning**
   - Design prevention strategies for identified problems
   - Plan for building on successful patterns
   - Create monitoring and tracking systems
   - Establish regular review cycles

Provide insights that help me understand my reminder management patterns and make data-driven improvements to enhance my productivity and goal achievement.`,
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
 * Productivity insights prompt
 */
const productivityInsightsSchema = z.object({
  insight_focus: z.array(z.enum(['time_management', 'goal_achievement', 'habit_formation', 'energy_optimization', 'workflow_efficiency', 'stress_management'])).optional().default(['time_management', 'goal_achievement']),
  analysis_period: z.enum(['last_week', 'last_month', 'last_3_months', 'last_6_months', 'last_year']).optional().default('last_month'),
  include_predictions: z.boolean().optional().default(true),
  visualization_level: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed'),
});

export const productivityInsights: PromptDefinition = {
  name: 'productivity-insights',
  description: 'Generate deep insights into productivity patterns and optimization opportunities',
  category: 'analysis',
  tags: ['insights', 'productivity', 'patterns', 'optimization', 'predictions'],
  arguments: [
    {
      name: 'insight_focus',
      description: 'Areas to focus insights on (time_management, goal_achievement, habit_formation, energy_optimization, workflow_efficiency, stress_management)',
      required: false,
      schema: z.array(z.enum(['time_management', 'goal_achievement', 'habit_formation', 'energy_optimization', 'workflow_efficiency', 'stress_management'])),
      defaultValue: ['time_management', 'goal_achievement'],
    },
    {
      name: 'analysis_period',
      description: 'Time period for analysis (last_week, last_month, last_3_months, last_6_months, last_year)',
      required: false,
      schema: z.enum(['last_week', 'last_month', 'last_3_months', 'last_6_months', 'last_year']),
      defaultValue: 'last_month',
    },
    {
      name: 'include_predictions',
      description: 'Include predictions and forecasting based on current patterns',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'visualization_level',
      description: 'Level of detail in data visualization and reporting (basic, detailed, comprehensive)',
      required: false,
      schema: z.enum(['basic', 'detailed', 'comprehensive']),
      defaultValue: 'detailed',
    },
  ],
  template: (args) => {
    const {
      insight_focus,
      analysis_period,
      include_predictions,
      visualization_level,
    } = productivityInsightsSchema.parse(args);

    return {
      description: `Productivity insights focusing on ${insight_focus.join(', ')} over ${analysis_period}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me generate deep insights into my productivity patterns focusing on: ${insight_focus.join(', ')} over ${analysis_period}.

**Analysis Parameters:**
- Focus Areas: ${insight_focus.join(', ')}
- Analysis Period: ${analysis_period}
- Include Predictions: ${include_predictions ? 'Yes' : 'No'}
- Visualization Level: ${visualization_level}

**Please provide comprehensive insights:**

1. **Data Collection & Processing**
   - Gather comprehensive data from my reminder system
   - Process and clean data for analysis
   - Identify key metrics and indicators
   - Prepare data for ${visualization_level} visualization

2. **Pattern Recognition & Analysis**
   - Identify deep patterns in my productivity behavior
   - Analyze correlations between different factors
   - Recognize cyclical patterns and trends
   - Find hidden insights in the data

3. **Focus Area Deep Dives**
   ${insight_focus.map(focus => `- **${focus.replace('_', ' ').toUpperCase()}**: Analyze patterns, effectiveness, and optimization opportunities`).join('\n   ')}

4. **Performance Benchmarking**
   - Compare current performance to historical data
   - Identify improvement trends and areas of decline
   - Benchmark against productivity best practices
   - Assess goal achievement effectiveness

5. **Root Cause Analysis**
   - Identify underlying causes of productivity patterns
   - Analyze environmental and behavioral factors
   - Find systemic issues and opportunities
   - Understand the "why" behind the patterns

6. **Predictive Analysis**${include_predictions ? `
   - Forecast future productivity trends
   - Predict potential challenges and opportunities
   - Model different scenarios and outcomes
   - Create early warning systems` : ''}

7. **Optimization Opportunities**
   - Identify specific areas for improvement
   - Recommend targeted interventions
   - Suggest system and process optimizations
   - Design experiments for testing improvements

8. **Actionable Recommendations**
   - Create prioritized improvement roadmap
   - Design implementation strategies
   - Set up monitoring and measurement systems
   - Plan for continuous optimization

Provide insights that transform my understanding of my productivity patterns and give me clear direction for meaningful improvements.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'advanced',
    estimatedTime: '30-45 minutes',
  },
};

/**
 * Habit analysis prompt
 */
const habitAnalysisSchema = z.object({
  habit_focus: z.array(z.enum(['morning_routine', 'evening_routine', 'work_habits', 'health_habits', 'learning_habits', 'social_habits'])).optional().default(['morning_routine', 'work_habits']),
  analysis_depth: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed'),
  include_environment: z.boolean().optional().default(true),
  tracking_period: z.enum(['last_week', 'last_month', 'last_3_months', 'last_6_months']).optional().default('last_month'),
});

export const habitAnalysis: PromptDefinition = {
  name: 'habit-analysis',
  description: 'Analyze habit patterns and effectiveness for optimization',
  category: 'analysis',
  tags: ['habits', 'patterns', 'behavior', 'optimization', 'tracking'],
  arguments: [
    {
      name: 'habit_focus',
      description: 'Types of habits to analyze (morning_routine, evening_routine, work_habits, health_habits, learning_habits, social_habits)',
      required: false,
      schema: z.array(z.enum(['morning_routine', 'evening_routine', 'work_habits', 'health_habits', 'learning_habits', 'social_habits'])),
      defaultValue: ['morning_routine', 'work_habits'],
    },
    {
      name: 'analysis_depth',
      description: 'Depth of habit analysis (basic, detailed, comprehensive)',
      required: false,
      schema: z.enum(['basic', 'detailed', 'comprehensive']),
      defaultValue: 'detailed',
    },
    {
      name: 'include_environment',
      description: 'Include environmental factors in habit analysis',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'tracking_period',
      description: 'Period for habit tracking analysis',
      required: false,
      schema: z.enum(['last_week', 'last_month', 'last_3_months', 'last_6_months']),
      defaultValue: 'last_month',
    },
  ],
  template: (args) => {
    const {
      habit_focus,
      analysis_depth,
      include_environment,
      tracking_period,
    } = habitAnalysisSchema.parse(args);

    return {
      description: `Habit analysis for ${habit_focus.join(', ')} with ${analysis_depth} depth over ${tracking_period}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me analyze my habit patterns and effectiveness focusing on: ${habit_focus.join(', ')} with ${analysis_depth} analysis depth over ${tracking_period}.

**Analysis Parameters:**
- Habit Focus: ${habit_focus.join(', ')}
- Analysis Depth: ${analysis_depth}
- Include Environment: ${include_environment ? 'Yes' : 'No'}
- Tracking Period: ${tracking_period}

**Please provide comprehensive habit analysis:**

1. **Habit Identification & Mapping**
   - Identify all habits in focus areas
   - Map habit frequency and consistency
   - Analyze habit triggers and cues
   - Assess habit strength and automation level

2. **Consistency & Performance Analysis**
   - Measure habit completion rates
   - Analyze consistency patterns over time
   - Identify peak and low performance periods
   - Assess habit stability and reliability

3. **Habit Stacking & Dependencies**
   - Analyze habit relationships and dependencies
   - Identify successful habit stacking patterns
   - Find habit conflicts and interference
   - Map habit chains and sequences

4. **Environmental Factor Analysis**${include_environment ? `
   - Analyze environmental impact on habits
   - Identify supportive and disruptive factors
   - Assess context and location effects
   - Find optimal conditions for habit execution` : ''}

5. **Habit Effectiveness Assessment**
   - Measure habit impact on goals
   - Analyze habit value and ROI
   - Identify high-impact vs low-impact habits
   - Assess habit alignment with objectives

6. **Pattern Recognition & Insights**
   - Identify successful habit patterns
   - Recognize failure patterns and obstacles
   - Find correlation patterns between habits
   - Discover hidden habit dynamics

7. **Optimization Opportunities**
   - Identify habits for improvement or elimination
   - Suggest habit modification strategies
   - Recommend new habit formation approaches
   - Design habit optimization experiments

8. **Implementation Recommendations**
   - Create habit improvement action plan
   - Design habit tracking and monitoring systems
   - Suggest environmental modifications
   - Plan for habit maintenance and evolution

Provide insights that help me understand my habit patterns and optimize my daily routines for maximum effectiveness and goal achievement.`,
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