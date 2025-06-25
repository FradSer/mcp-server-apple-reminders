import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { registerHandlers } from './handlers.js';

// Mock the tools and applescript modules
jest.mock('../tools/index.js', () => ({
  TOOLS: [],
  handleToolCall: jest.fn()
}));

jest.mock('../utils/applescript.js', () => ({
  createRemindersScript: jest.fn((script: string) => script),
  executeAppleScript: jest.fn((script: string) => 'Default,Work,Personal')
}));

describe('Server Handlers', () => {
  let mockServer: jest.Mocked<Server>;

  beforeEach(() => {
    // Create a mock server
    mockServer = {
      setRequestHandler: jest.fn(),
    } as any;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('registerHandlers', () => {
    test('should register all required handlers', () => {
      registerHandlers(mockServer);

      // Verify that all handlers are registered
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(4);
      
      // Check specific handlers
      const calls = mockServer.setRequestHandler.mock.calls;
      const schemas = calls.map(call => call[0]);
      
      expect(schemas).toContain(ListPromptsRequestSchema);
      expect(schemas).toContain(GetPromptRequestSchema);
    });
  });

      describe('Prompts Handlers', () => {
    let listPromptsHandler: any;
    let getPromptHandler: any;

    beforeEach(() => {
      registerHandlers(mockServer);
      
      // Extract handlers from mock calls
      const calls = mockServer.setRequestHandler.mock.calls;
      
      const listPromptsCall = calls.find(call => call[0] === ListPromptsRequestSchema);
      const getPromptCall = calls.find(call => call[0] === GetPromptRequestSchema);
      
      listPromptsHandler = listPromptsCall?.[1];
      getPromptHandler = getPromptCall?.[1];
    });

    describe('List Prompts Handler', () => {
      test('should return available prompts', async () => {
        const result = await listPromptsHandler();

        expect(result).toHaveProperty('prompts');
        expect(Array.isArray(result.prompts)).toBe(true);
        expect(result.prompts.length).toBe(7);

        // Check if all expected prompts are present
        const promptNames = result.prompts.map((p: any) => p.name);
        expect(promptNames).toContain('daily-task-organizer');
        expect(promptNames).toContain('smart-reminder-creator');
        expect(promptNames).toContain('reminder-review-assistant');
        expect(promptNames).toContain('weekly-planning-workflow');
        expect(promptNames).toContain('reminder-cleanup-guide');
        expect(promptNames).toContain('goal-tracking-setup');
        expect(promptNames).toContain('context-aware-scheduling');
      });
    });

    describe('Get Prompt Handler', () => {
      test('should return daily-task-organizer prompt', async () => {
        const request = {
          params: {
            name: "daily-task-organizer",
            arguments: {
              task_category: "work",
              priority_level: "high",
              time_frame: "today"
            }
          }
        };

        const result = await getPromptHandler(request);

        expect(result.description).toContain("Comprehensive daily task organization");
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0].role).toBe("user");
        expect(result.messages[0].content.type).toBe("text");
        expect(result.messages[0].content.text).toContain("work");
        expect(result.messages[0].content.text).toContain("high");
        expect(result.messages[0].content.text).toContain("today");
      });

      test('should return smart-reminder-creator prompt', async () => {
        const request = {
          params: {
            name: "smart-reminder-creator",
            arguments: {
              task_description: "Complete project proposal",
              context: "For client meeting",
              urgency: "high"
            }
          }
        };

        const result = await getPromptHandler(request);

        expect(result.description).toContain("Intelligent reminder creation");
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0].content.text).toContain("Complete project proposal");
        expect(result.messages[0].content.text).toContain("For client meeting");
        expect(result.messages[0].content.text).toContain("high");
      });

      test('should return goal-tracking-setup prompt', async () => {
        const request = {
          params: {
            name: "goal-tracking-setup",
            arguments: {
              goal_type: "health",
              time_horizon: "weekly"
            }
          }
        };

        const result = await getPromptHandler(request);

        expect(result.description).toContain("goal tracking system");
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0].content.text).toContain("health");
        expect(result.messages[0].content.text).toContain("weekly");
      });

      test('should handle default values for optional arguments', async () => {
        const request = {
          params: {
            name: "daily-task-organizer",
            arguments: {}
          }
        };

        const result = await getPromptHandler(request);

        expect(result.messages[0].content.text).toContain("all categories");
        expect(result.messages[0].content.text).toContain("today");
        expect(result.messages[0].content.text).toContain("mixed priorities");
      });

      test('should handle missing arguments', async () => {
        const request = {
          params: {
            name: "reminder-cleanup-guide",
            arguments: {}
          }
        };

        const result = await getPromptHandler(request);

        expect(result.messages[0].content.text).toContain("comprehensive");
      });

      test('should throw error for unknown prompt', async () => {
        const request = {
          params: {
            name: "unknown-prompt",
            arguments: {}
          }
        };

        await expect(getPromptHandler(request)).rejects.toThrow("Unknown prompt: unknown-prompt");
      });
    });
  });
});

describe('Server Handlers - Prompts', () => {
  describe('ListPromptsRequestSchema', () => {
    it('should return all available prompts', async () => {
      const testServer = new Server(
        { name: "test", version: "1.0.0" },
        { capabilities: { prompts: {}, resources: {}, tools: {} } }
      );
      
      let listPromptsHandler: any;
      
      // Mock setRequestHandler to capture the handler
      const originalSetRequestHandler = testServer.setRequestHandler;
      testServer.setRequestHandler = jest.fn((schema: any, handler: any) => {
        if (schema === ListPromptsRequestSchema) {
          listPromptsHandler = handler;
        }
        return originalSetRequestHandler.call(testServer, schema, handler);
      });
      
      registerHandlers(testServer);
      
      expect(listPromptsHandler).toBeDefined();
      const response = await listPromptsHandler();
      
      expect(response).toHaveProperty('prompts');
      expect(Array.isArray(response.prompts)).toBe(true);
      expect(response.prompts.length).toBe(7);

      // Check if all expected prompts are present
      const promptNames = response.prompts.map((p: any) => p.name);
      expect(promptNames).toContain('daily-task-organizer');
      expect(promptNames).toContain('smart-reminder-creator');
      expect(promptNames).toContain('reminder-review-assistant');
      expect(promptNames).toContain('weekly-planning-workflow');
      expect(promptNames).toContain('reminder-cleanup-guide');
      expect(promptNames).toContain('goal-tracking-setup');
      expect(promptNames).toContain('context-aware-scheduling');
    });

    it('should have proper prompt structure', async () => {
      const testServer = new Server(
        { name: "test", version: "1.0.0" },
        { capabilities: { prompts: {}, resources: {}, tools: {} } }
      );
      
      let listPromptsHandler: any;
      
      const originalSetRequestHandler = testServer.setRequestHandler;
      testServer.setRequestHandler = jest.fn((schema: any, handler: any) => {
        if (schema === ListPromptsRequestSchema) {
          listPromptsHandler = handler;
        }
        return originalSetRequestHandler.call(testServer, schema, handler);
      });
      
      registerHandlers(testServer);
      const response = await listPromptsHandler();

      response.prompts.forEach((prompt: any) => {
        expect(prompt).toHaveProperty('name');
        expect(prompt).toHaveProperty('description');
        expect(prompt).toHaveProperty('arguments');
        expect(Array.isArray(prompt.arguments)).toBe(true);
        
        // Check argument structure
        prompt.arguments.forEach((arg: any) => {
          expect(arg).toHaveProperty('name');
          expect(arg).toHaveProperty('description');
          expect(arg).toHaveProperty('required');
          expect(typeof arg.required).toBe('boolean');
        });
      });
    });
  });

  describe('GetPromptRequestSchema', () => {
    let getPromptHandler: any;

    beforeEach(() => {
      const testServer = new Server(
        { name: "test", version: "1.0.0" },
        { capabilities: { prompts: {}, resources: {}, tools: {} } }
      );
      
      const originalSetRequestHandler = testServer.setRequestHandler;
      testServer.setRequestHandler = jest.fn((schema: any, handler: any) => {
        if (schema === GetPromptRequestSchema) {
          getPromptHandler = handler;
        }
        return originalSetRequestHandler.call(testServer, schema, handler);
      });
      
      registerHandlers(testServer);
    });

    it('should return daily-task-organizer prompt with default arguments', async () => {
      const request = {
        params: {
          name: 'daily-task-organizer',
          arguments: {}
        },
      };

      const response = await getPromptHandler(request);
      
      expect(response).toHaveProperty('description');
      expect(response).toHaveProperty('messages');
      expect(Array.isArray(response.messages)).toBe(true);
      expect(response.messages.length).toBe(1);
      
      const message = response.messages[0];
      expect(message.role).toBe('user');
      expect(message.content.type).toBe('text');
      expect(message.content.text).toContain('Help me organize my daily tasks');
      expect(message.content.text).toContain('all categories');
      expect(message.content.text).toContain('today');
    });

    it('should return smart-reminder-creator prompt with custom arguments', async () => {
      const request = {
        params: {
          name: 'smart-reminder-creator',
          arguments: {
            task_description: 'Complete project proposal',
            context: 'Need to prepare for client meeting',
            urgency: 'high'
          }
        },
      };

      const response = await getPromptHandler(request);
      
      expect(response.description).toContain('Intelligent reminder creation');
      const message = response.messages[0];
      expect(message.content.text).toContain('Complete project proposal');
      expect(message.content.text).toContain('Need to prepare for client meeting');
      expect(message.content.text).toContain('high');
    });

    it('should return goal-tracking-setup prompt', async () => {
      const request = {
        params: {
          name: 'goal-tracking-setup',
          arguments: {
            goal_type: 'health',
            time_horizon: 'weekly'
          }
        },
      };

      const response = await getPromptHandler(request);
      
      expect(response.description).toContain('goal tracking system');
      const message = response.messages[0];
      expect(message.content.text).toContain('health');
      expect(message.content.text).toContain('weekly');
      expect(message.content.text).toContain('milestones');
    });

    it('should throw error for unknown prompt', async () => {
      const request = {
        params: {
          name: 'unknown-prompt',
          arguments: {}
        },
      };

      await expect(getPromptHandler(request)).rejects.toThrow('Unknown prompt: unknown-prompt');
    });

    it('should handle prompts with optional arguments', async () => {
      const request = {
        params: {
          name: 'reminder-cleanup-guide',
          arguments: {}
        },
      };

      const response = await getPromptHandler(request);
      
      expect(response.description).toContain('cleaning up and organizing');
      const message = response.messages[0];
      expect(message.content.text).toContain('comprehensive');
      expect(message.content.text).toContain('Audit all current reminders');
    });
  });
}); 