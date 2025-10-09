/**
 * prompts/types.ts
 * Type definitions for the MCP prompts system
 */

import type { z } from 'zod';

/**
 * Prompt argument schema type
 */
export type PromptArgumentSchema = z.ZodTypeAny;

/**
 * Prompt argument definition
 */
export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
  schema: PromptArgumentSchema;
  defaultValue?: unknown;
}

/**
 * Prompt message content
 */
export interface PromptMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

/**
 * Prompt message
 */
export interface PromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: PromptMessageContent;
}

/**
 * Prompt template function
 */
export type PromptTemplate = (args: Record<string, unknown>) => {
  description: string;
  messages: PromptMessage[];
};

/**
 * Prompt definition
 */
export interface PromptDefinition {
  name: string;
  description: string;
  category: PromptCategory;
  tags: string[];
  arguments: PromptArgument[];
  template: PromptTemplate;
  metadata?: {
    version?: string;
    author?: string;
    lastUpdated?: string;
    complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedTime?: string;
  };
}

/**
 * Prompt categories
 */
export type PromptCategory = 
  | 'productivity'
  | 'planning'
  | 'organization'
  | 'analysis'
  | 'automation'
  | 'goals'
  | 'habits'
  | 'workflow'
  | 'maintenance'
  | 'custom';

/**
 * Prompt registry interface
 */
export interface PromptRegistry {
  prompts: Map<string, PromptDefinition>;
  categories: Map<PromptCategory, PromptDefinition[]>;
  register(prompt: PromptDefinition): void;
  unregister(name: string): void;
  get(name: string): PromptDefinition | undefined;
  list(category?: PromptCategory): PromptDefinition[];
  search(query: string): PromptDefinition[];
}

/**
 * Prompt execution context
 */
export interface PromptExecutionContext {
  promptName: string;
  arguments: Record<string, unknown>;
  userContext?: {
    timezone?: string;
    language?: string;
    preferences?: Record<string, unknown>;
  };
  systemContext?: {
    currentTime?: string;
    remindersCount?: number;
    listsCount?: number;
  };
}