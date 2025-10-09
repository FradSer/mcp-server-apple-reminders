/**
 * prompts/index.ts
 * Central prompts system initialization and management
 */

import { promptRegistry } from './registry.js';
import type { PromptDefinition } from './types.js';

// Import all prompt templates
import {
  dailyTaskOrganizer,
  smartReminderCreator,
  productivityAnalysis,
} from './templates/productivity.js';

import {
  weeklyPlanningWorkflow,
  monthlyGoalPlanning,
  projectPlanning,
} from './templates/planning.js';

import {
  reminderCleanupGuide,
  listOrganization,
  smartCategorization,
} from './templates/organization.js';

import {
  reminderReviewAssistant,
  productivityInsights,
  habitAnalysis,
} from './templates/analysis.js';

import {
  goalTrackingSetup,
  smartGoalsCreation,
  goalReviewAndAdjustment,
} from './templates/goals.js';

import {
  contextAwareScheduling,
  automatedWorkflowCreation,
  smartNotificationSystem,
} from './templates/automation.js';

import {
  customPromptBuilder,
  advancedWorkflowDesigner,
  systemOptimization,
} from './templates/custom.js';

/**
 * All available prompt definitions
 */
const PROMPT_DEFINITIONS: PromptDefinition[] = [
  // Productivity prompts
  dailyTaskOrganizer,
  smartReminderCreator,
  productivityAnalysis,
  
  // Planning prompts
  weeklyPlanningWorkflow,
  monthlyGoalPlanning,
  projectPlanning,
  
  // Organization prompts
  reminderCleanupGuide,
  listOrganization,
  smartCategorization,
  
  // Analysis prompts
  reminderReviewAssistant,
  productivityInsights,
  habitAnalysis,
  
  // Goals prompts
  goalTrackingSetup,
  smartGoalsCreation,
  goalReviewAndAdjustment,
  
  // Automation prompts
  contextAwareScheduling,
  automatedWorkflowCreation,
  smartNotificationSystem,
  
  // Custom prompts
  customPromptBuilder,
  advancedWorkflowDesigner,
  systemOptimization,
];

/**
 * Initialize the prompts system by registering all prompts
 */
export function initializePrompts(): void {
  PROMPT_DEFINITIONS.forEach(prompt => {
    promptRegistry.register(prompt);
  });
}

/**
 * Get all registered prompts
 */
export function getAllPrompts(): PromptDefinition[] {
  return promptRegistry.list();
}

/**
 * Get prompts by category
 */
export function getPromptsByCategory(category: string): PromptDefinition[] {
  return promptRegistry.list(category as any);
}

/**
 * Search prompts by query
 */
export function searchPrompts(query: string): PromptDefinition[] {
  return promptRegistry.search(query);
}

/**
 * Get a specific prompt by name
 */
export function getPrompt(name: string): PromptDefinition | undefined {
  return promptRegistry.get(name);
}

/**
 * Get prompt categories
 */
export function getPromptCategories(): string[] {
  return promptRegistry.getCategories();
}

/**
 * Get category statistics
 */
export function getCategoryStats(): Record<string, number> {
  return promptRegistry.getCategoryStats();
}

// Re-export types and registry for external use
export { promptRegistry } from './registry.js';
export type { 
  PromptDefinition, 
  PromptCategory, 
  PromptRegistry,
  PromptExecutionContext 
} from './types.js';