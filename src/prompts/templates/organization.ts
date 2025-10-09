/**
 * prompts/templates/organization.ts
 * Organization-focused prompt templates
 */

import { z } from 'zod';
import type { PromptDefinition } from '../types.js';

/**
 * Reminder cleanup guide prompt
 */
const reminderCleanupSchema = z.object({
  cleanup_strategy: z.enum(['archive_completed', 'delete_old', 'reorganize_lists', 'merge_duplicates', 'comprehensive']).optional().default('comprehensive'),
  time_threshold: z.enum(['1_week', '1_month', '3_months', '6_months', '1_year']).optional().default('3_months'),
  include_analysis: z.boolean().optional().default(true),
  create_backup: z.boolean().optional().default(true),
});

export const reminderCleanupGuide: PromptDefinition = {
  name: 'reminder-cleanup-guide',
  description: 'Guide for cleaning up and organizing existing reminders',
  category: 'organization',
  tags: ['cleanup', 'organization', 'maintenance', 'optimization'],
  arguments: [
    {
      name: 'cleanup_strategy',
      description: 'Strategy for cleanup (archive_completed, delete_old, reorganize_lists, merge_duplicates, comprehensive)',
      required: false,
      schema: z.enum(['archive_completed', 'delete_old', 'reorganize_lists', 'merge_duplicates', 'comprehensive']),
      defaultValue: 'comprehensive',
    },
    {
      name: 'time_threshold',
      description: 'Time threshold for considering reminders as old',
      required: false,
      schema: z.enum(['1_week', '1_month', '3_months', '6_months', '1_year']),
      defaultValue: '3_months',
    },
    {
      name: 'include_analysis',
      description: 'Include analysis of current state before cleanup',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'create_backup',
      description: 'Create backup before making changes',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
  ],
  template: (args) => {
    const {
      cleanup_strategy,
      time_threshold,
      include_analysis,
      create_backup,
    } = reminderCleanupSchema.parse(args);

    return {
      description: `Reminder cleanup guide using ${cleanup_strategy} strategy with ${time_threshold} threshold`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me clean up and reorganize my Apple Reminders using the ${cleanup_strategy} strategy with a ${time_threshold} time threshold.

**Cleanup Parameters:**
- Strategy: ${cleanup_strategy}
- Time Threshold: ${time_threshold}
- Include Analysis: ${include_analysis ? 'Yes' : 'No'}
- Create Backup: ${create_backup ? 'Yes' : 'No'}

**Please guide me through:**

1. **Current State Analysis**${include_analysis ? `
   - Audit all current reminders and lists
   - Identify patterns in completion rates
   - Assess list organization effectiveness
   - Find duplicate or redundant reminders
   - Analyze overdue and stale reminders` : ''}

2. **Backup & Safety**${create_backup ? `
   - Create a backup of current reminder state
   - Document current list structure
   - Save important reminder details
   - Set up rollback procedures` : ''}

3. **Cleanup Execution**
   - Archive completed reminders older than ${time_threshold}
   - Delete outdated or irrelevant reminders
   - Merge duplicate or similar reminders
   - Update stale or unclear reminder titles

4. **List Reorganization**
   - Consolidate similar or overlapping lists
   - Create logical list hierarchy
   - Rename lists for clarity and consistency
   - Optimize list structure for efficiency

5. **Content Optimization**
   - Improve reminder titles and descriptions
   - Standardize naming conventions
   - Add helpful tags or categories
   - Optimize due dates and scheduling

6. **System Maintenance**
   - Create maintenance routines
   - Set up regular cleanup schedules
   - Establish best practices for new reminders
   - Design prevention strategies

7. **Quality Assurance**
   - Verify all changes are correct
   - Test new organization structure
   - Ensure no important reminders were lost
   - Validate improved workflow efficiency

Help me transform my reminder system into a clean, efficient, and well-organized productivity tool that supports my goals and reduces cognitive load.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'intermediate',
    estimatedTime: '15-25 minutes',
  },
};

/**
 * List organization prompt
 */
const listOrganizationSchema = z.object({
  organization_strategy: z.enum(['by_category', 'by_priority', 'by_project', 'by_time', 'hybrid']).optional().default('hybrid'),
  max_lists: z.number().min(3).max(20).optional().default(10),
  include_archives: z.boolean().optional().default(true),
  naming_convention: z.enum(['descriptive', 'short', 'coded', 'hierarchical']).optional().default('descriptive'),
});

export const listOrganization: PromptDefinition = {
  name: 'list-organization',
  description: 'Design optimal list organization structure for reminders',
  category: 'organization',
  tags: ['lists', 'structure', 'categorization', 'optimization'],
  arguments: [
    {
      name: 'organization_strategy',
      description: 'Strategy for organizing lists (by_category, by_priority, by_project, by_time, hybrid)',
      required: false,
      schema: z.enum(['by_category', 'by_priority', 'by_project', 'by_time', 'hybrid']),
      defaultValue: 'hybrid',
    },
    {
      name: 'max_lists',
      description: 'Maximum number of lists to maintain (3-20)',
      required: false,
      schema: z.number().min(3).max(20),
      defaultValue: 10,
    },
    {
      name: 'include_archives',
      description: 'Include archive lists for completed items',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'naming_convention',
      description: 'Naming convention for lists (descriptive, short, coded, hierarchical)',
      required: false,
      schema: z.enum(['descriptive', 'short', 'coded', 'hierarchical']),
      defaultValue: 'descriptive',
    },
  ],
  template: (args) => {
    const {
      organization_strategy,
      max_lists,
      include_archives,
      naming_convention,
    } = listOrganizationSchema.parse(args);

    return {
      description: `List organization using ${organization_strategy} strategy with max ${max_lists} lists`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me design an optimal list organization structure using the ${organization_strategy} strategy with a maximum of ${max_lists} lists.

**Organization Parameters:**
- Strategy: ${organization_strategy}
- Max Lists: ${max_lists}
- Include Archives: ${include_archives ? 'Yes' : 'No'}
- Naming Convention: ${naming_convention}

**Please help me design:**

1. **Current State Assessment**
   - Analyze existing lists and their purposes
   - Identify overlapping or redundant lists
   - Assess current organization effectiveness
   - Find patterns in reminder distribution

2. **Strategic List Design**
   - Design core list structure based on ${organization_strategy}
   - Create logical hierarchy and relationships
   - Ensure lists serve distinct purposes
   - Optimize for easy navigation and filtering

3. **Naming & Categorization**
   - Establish ${naming_convention} naming conventions
   - Create clear, consistent list names
   - Design category system for easy identification
   - Plan for future expansion and flexibility

4. **List Hierarchy & Relationships**
   - Design parent-child list relationships if needed
   - Create cross-list reference system
   - Plan for list dependencies and workflows
   - Ensure logical grouping and separation

5. **Archive & Maintenance Strategy**${include_archives ? `
   - Design archive system for completed items
   - Create maintenance and cleanup procedures
   - Plan for list lifecycle management
   - Set up regular organization reviews` : ''}

6. **Integration & Workflow**
   - Connect list structure to daily workflow
   - Design reminder creation guidelines
   - Plan for list switching and management
   - Ensure seamless user experience

7. **Optimization & Testing**
   - Test new organization structure
   - Validate ease of use and efficiency
   - Plan for iterative improvements
   - Create adoption and transition strategy

Create a list organization system that is intuitive, scalable, and perfectly suited to my workflow and productivity needs.`,
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
 * Smart categorization prompt
 */
const smartCategorizationSchema = z.object({
  categorization_method: z.enum(['automatic', 'semi_automatic', 'manual']).optional().default('semi_automatic'),
  categories: z.array(z.string()).optional().default([]),
  learning_enabled: z.boolean().optional().default(true),
  confidence_threshold: z.number().min(0.5).max(1.0).optional().default(0.8),
});

export const smartCategorization: PromptDefinition = {
  name: 'smart-categorization',
  description: 'Set up intelligent categorization system for reminders',
  category: 'organization',
  tags: ['categorization', 'intelligence', 'automation', 'learning'],
  arguments: [
    {
      name: 'categorization_method',
      description: 'Method for categorization (automatic, semi_automatic, manual)',
      required: false,
      schema: z.enum(['automatic', 'semi_automatic', 'manual']),
      defaultValue: 'semi_automatic',
    },
    {
      name: 'categories',
      description: 'Predefined categories to use (leave empty for auto-discovery)',
      required: false,
      schema: z.array(z.string()),
      defaultValue: [],
    },
    {
      name: 'learning_enabled',
      description: 'Enable learning from user corrections and preferences',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'confidence_threshold',
      description: 'Confidence threshold for automatic categorization (0.5-1.0)',
      required: false,
      schema: z.number().min(0.5).max(1.0),
      defaultValue: 0.8,
    },
  ],
  template: (args) => {
    const {
      categorization_method,
      categories,
      learning_enabled,
      confidence_threshold,
    } = smartCategorizationSchema.parse(args);

    return {
      description: `Smart categorization system using ${categorization_method} method with ${categories.length > 0 ? 'predefined' : 'auto-discovered'} categories`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me set up an intelligent categorization system for my reminders using the ${categorization_method} method.

**Categorization Parameters:**
- Method: ${categorization_method}
- Categories: ${categories.length > 0 ? categories.join(', ') : 'Auto-discover from content'}
- Learning Enabled: ${learning_enabled ? 'Yes' : 'No'}
- Confidence Threshold: ${confidence_threshold}

**Please help me design:**

1. **Category Discovery & Design**
   - ${categories.length > 0 ? `Use predefined categories: ${categories.join(', ')}` : 'Analyze existing reminders to discover natural categories'}
   - Create logical category hierarchy
   - Design category naming conventions
   - Plan for category expansion and flexibility

2. **Intelligent Classification Rules**
   - Design pattern recognition for automatic categorization
   - Create keyword and context-based rules
   - Plan for handling ambiguous cases
   - Set up confidence scoring system

3. **Learning & Adaptation System**${learning_enabled ? `
   - Design feedback collection mechanisms
   - Create learning algorithms for improvement
   - Plan for user preference adaptation
   - Set up continuous optimization processes` : ''}

4. **Categorization Workflow**
   - Design ${categorization_method} categorization process
   - Create user interface for manual review
   - Plan for batch categorization operations
   - Set up quality assurance procedures

5. **Integration & Automation**
   - Connect categorization to reminder creation
   - Design automatic list assignment
   - Plan for bulk categorization operations
   - Ensure seamless workflow integration

6. **Quality & Accuracy**
   - Design accuracy measurement systems
   - Create validation and testing procedures
   - Plan for error correction and feedback
   - Set up performance monitoring

7. **Maintenance & Evolution**
   - Plan for category system maintenance
   - Design evolution and adaptation strategies
   - Create user training and documentation
   - Set up regular system reviews

Create a categorization system that intelligently organizes my reminders while learning and adapting to my preferences and workflow patterns.`,
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