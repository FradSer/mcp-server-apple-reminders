/**
 * prompts/registry.ts
 * Central registry for managing MCP prompts
 */

import type { 
  PromptDefinition, 
  PromptRegistry, 
  PromptCategory 
} from './types.js';
import { debugLog } from '../utils/logger.js';

/**
 * Central prompt registry implementation
 */
export class PromptRegistryImpl implements PromptRegistry {
  public prompts = new Map<string, PromptDefinition>();
  public categories = new Map<PromptCategory, PromptDefinition[]>();

  constructor() {
    // Initialize category maps
    const categories: PromptCategory[] = [
      'productivity',
      'planning', 
      'organization',
      'analysis',
      'automation',
      'goals',
      'habits',
      'workflow',
      'maintenance',
      'custom'
    ];
    
    categories.forEach(category => {
      this.categories.set(category, []);
    });
  }

  /**
   * Register a new prompt
   */
  register(prompt: PromptDefinition): void {
    if (this.prompts.has(prompt.name)) {
      debugLog(`Overriding existing prompt: ${prompt.name}`);
    }

    this.prompts.set(prompt.name, prompt);
    
    // Add to category
    const categoryPrompts = this.categories.get(prompt.category) || [];
    const existingIndex = categoryPrompts.findIndex(p => p.name === prompt.name);
    
    if (existingIndex >= 0) {
      categoryPrompts[existingIndex] = prompt;
    } else {
      categoryPrompts.push(prompt);
    }
    
    this.categories.set(prompt.category, categoryPrompts);
    debugLog(`Registered prompt: ${prompt.name} in category: ${prompt.category}`);
  }

  /**
   * Unregister a prompt
   */
  unregister(name: string): void {
    const prompt = this.prompts.get(name);
    if (!prompt) {
      debugLog(`Prompt not found for unregistration: ${name}`);
      return;
    }

    this.prompts.delete(name);
    
    // Remove from category
    const categoryPrompts = this.categories.get(prompt.category) || [];
    const filteredPrompts = categoryPrompts.filter(p => p.name !== name);
    this.categories.set(prompt.category, filteredPrompts);
    
    debugLog(`Unregistered prompt: ${name}`);
  }

  /**
   * Get a specific prompt by name
   */
  get(name: string): PromptDefinition | undefined {
    return this.prompts.get(name);
  }

  /**
   * List prompts, optionally filtered by category
   */
  list(category?: PromptCategory): PromptDefinition[] {
    if (category) {
      return this.categories.get(category) || [];
    }
    return Array.from(this.prompts.values());
  }

  /**
   * Search prompts by name, description, or tags
   */
  search(query: string): PromptDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(this.prompts.values()).filter(prompt => 
      prompt.name.toLowerCase().includes(lowercaseQuery) ||
      prompt.description.toLowerCase().includes(lowercaseQuery) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get prompts by tags
   */
  getByTags(tags: string[]): PromptDefinition[] {
    return Array.from(this.prompts.values()).filter(prompt =>
      tags.some(tag => prompt.tags.includes(tag))
    );
  }

  /**
   * Get all available categories
   */
  getCategories(): PromptCategory[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Get prompt count by category
   */
  getCategoryStats(): Record<PromptCategory, number> {
    const stats: Record<string, number> = {};
    
    this.categories.forEach((prompts, category) => {
      stats[category] = prompts.length;
    });
    
    return stats as Record<PromptCategory, number>;
  }
}

// Global registry instance
export const promptRegistry = new PromptRegistryImpl();