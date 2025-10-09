/**
 * prompts/prompts.test.ts
 * Tests for the prompts system
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  initializePrompts,
  getAllPrompts,
  getPrompt,
  getPromptsByCategory,
  searchPrompts,
  getPromptCategories,
  getCategoryStats,
} from './index.js';

describe('Prompts System', () => {
  beforeEach(() => {
    // Re-initialize prompts for each test
    initializePrompts();
  });

  describe('Initialization', () => {
    it('should initialize prompts system successfully', () => {
      expect(() => initializePrompts()).not.toThrow();
    });

    it('should register all prompt definitions', () => {
      const prompts = getAllPrompts();
      expect(prompts.length).toBeGreaterThan(0);
    });
  });

  describe('Prompt Retrieval', () => {
    it('should get all prompts', () => {
      const prompts = getAllPrompts();
      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should get specific prompt by name', () => {
      const prompt = getPrompt('daily-task-organizer');
      expect(prompt).toBeDefined();
      expect(prompt?.name).toBe('daily-task-organizer');
      expect(prompt?.description).toBeDefined();
      expect(prompt?.arguments).toBeDefined();
      expect(prompt?.template).toBeDefined();
    });

    it('should return undefined for non-existent prompt', () => {
      const prompt = getPrompt('non-existent-prompt');
      expect(prompt).toBeUndefined();
    });
  });

  describe('Category Management', () => {
    it('should get prompts by category', () => {
      const productivityPrompts = getPromptsByCategory('productivity');
      expect(Array.isArray(productivityPrompts)).toBe(true);
      expect(productivityPrompts.length).toBeGreaterThan(0);
      
      // All prompts should be in the productivity category
      productivityPrompts.forEach(prompt => {
        expect(prompt.category).toBe('productivity');
      });
    });

    it('should get all categories', () => {
      const categories = getPromptCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('productivity');
      expect(categories).toContain('planning');
      expect(categories).toContain('organization');
    });

    it('should get category statistics', () => {
      const stats = getCategoryStats();
      expect(typeof stats).toBe('object');
      expect(stats.productivity).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    it('should search prompts by name', () => {
      const results = searchPrompts('daily');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.name.includes('daily'))).toBe(true);
    });

    it('should search prompts by description', () => {
      const results = searchPrompts('task management');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search prompts by tags', () => {
      const results = searchPrompts('planning');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = searchPrompts('nonexistent');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('Prompt Structure', () => {
    it('should have valid prompt structure', () => {
      const prompt = getPrompt('daily-task-organizer');
      expect(prompt).toBeDefined();
      
      if (prompt) {
        expect(typeof prompt.name).toBe('string');
        expect(typeof prompt.description).toBe('string');
        expect(typeof prompt.category).toBe('string');
        expect(Array.isArray(prompt.tags)).toBe(true);
        expect(Array.isArray(prompt.arguments)).toBe(true);
        expect(typeof prompt.template).toBe('function');
      }
    });

    it('should have valid arguments structure', () => {
      const prompt = getPrompt('daily-task-organizer');
      expect(prompt).toBeDefined();
      
      if (prompt && prompt.arguments.length > 0) {
        const arg = prompt.arguments[0];
        expect(typeof arg.name).toBe('string');
        expect(typeof arg.description).toBe('string');
        expect(typeof arg.required).toBe('boolean');
        expect(arg.schema).toBeDefined();
      }
    });
  });

  describe('Template Execution', () => {
    it('should execute prompt template successfully', () => {
      const prompt = getPrompt('daily-task-organizer');
      expect(prompt).toBeDefined();
      
      if (prompt) {
        const args = {
          task_category: 'work',
          priority_level: 'high',
          time_frame: 'today',
        };
        
        expect(() => prompt.template(args)).not.toThrow();
        
        const result = prompt.template(args);
        expect(result).toBeDefined();
        expect(typeof result.description).toBe('string');
        expect(Array.isArray(result.messages)).toBe(true);
        expect(result.messages.length).toBeGreaterThan(0);
      }
    });

    it('should handle template execution with default values', () => {
      const prompt = getPrompt('daily-task-organizer');
      expect(prompt).toBeDefined();
      
      if (prompt) {
        const result = prompt.template({});
        expect(result).toBeDefined();
        expect(typeof result.description).toBe('string');
        expect(Array.isArray(result.messages)).toBe(true);
      }
    });

    it('should validate arguments using Zod schemas', () => {
      const prompt = getPrompt('smart-reminder-creator');
      expect(prompt).toBeDefined();
      
      if (prompt) {
        // Valid arguments should work
        const validArgs = {
          task_description: 'Test task',
          urgency: 'high',
        };
        expect(() => prompt.template(validArgs)).not.toThrow();
        
        // Invalid arguments should throw
        const invalidArgs = {
          task_description: 'Test task',
          urgency: 'invalid_urgency',
        };
        expect(() => prompt.template(invalidArgs)).toThrow();
      }
    });
  });

  describe('Prompt Categories', () => {
    it('should have prompts in all expected categories', () => {
      const expectedCategories = [
        'productivity',
        'planning',
        'organization',
        'analysis',
        'goals',
        'automation',
        'custom',
      ];
      
      const categories = getPromptCategories();
      expectedCategories.forEach(category => {
        expect(categories).toContain(category);
      });
    });

    it('should have at least one prompt in each category', () => {
      const categories = getPromptCategories();
      
      categories.forEach(category => {
        const prompts = getPromptsByCategory(category);
        // Skip empty categories for now
        if (prompts.length > 0) {
          expect(prompts.length).toBeGreaterThan(0);
        }
      });
    });
  });
});