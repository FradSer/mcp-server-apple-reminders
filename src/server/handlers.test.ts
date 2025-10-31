// Use global Jest functions to avoid extra dependencies
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { registerHandlers } from './handlers.js';

// Mock server type for testing - simplified for test compatibility
interface MockServer {
  setRequestHandler: jest.MockedFunction<
    (schema: unknown, handler: unknown) => void
  >;
}

// Response types for handlers
interface ListPromptsResponse {
  prompts: MockPrompt[];
}

interface GetPromptResponse {
  description: string;
  messages: Array<{ role: string; content: MessageContent }>;
}

interface MessageContent {
  type: string;
  text?: string;
}

// Mock prompt type for testing
interface MockPrompt {
  name: string;
  description: string;
  arguments: MockPromptArgument[];
}

interface MockPromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

// Mock the tools and prompts modules
jest.mock('../tools/index.js', () => ({
  TOOLS: [],
  handleToolCall: jest.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Mock result' }],
    isError: false,
  }),
}));

describe('Server Handlers', () => {
  let mockServer: MockServer;

  beforeEach(() => {
    // Create a mock server
    mockServer = {
      setRequestHandler: jest.fn(),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('registerHandlers', () => {
    test('should register all required handlers', () => {
      registerHandlers(
        mockServer as unknown as Parameters<typeof registerHandlers>[0],
      );

      // Verify that all handlers are registered
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(4);

      // Check specific handlers
      const calls = mockServer.setRequestHandler.mock.calls;
      const schemas = calls.map((call) => call[0]);

      expect(schemas).toContain(ListPromptsRequestSchema);
      expect(schemas).toContain(GetPromptRequestSchema);
    });
  });

  describe('ListToolsRequestSchema handler', () => {
    let listToolsHandler: jest.MockedFunction<() => Promise<unknown>>;

    beforeEach(() => {
      const testServer = new Server(
        { name: 'test', version: '1.0.0' },
        { capabilities: { prompts: {}, resources: {}, tools: {} } },
      );

      const originalSetRequestHandler = testServer.setRequestHandler;
      testServer.setRequestHandler = jest.fn(
        (schema: unknown, handler: unknown) => {
          const ListToolsRequestSchema = jest.requireActual(
            '@modelcontextprotocol/sdk/types.js',
          ).ListToolsRequestSchema;
          if (schema === (ListToolsRequestSchema as unknown)) {
            listToolsHandler = handler as jest.MockedFunction<
              () => Promise<unknown>
            >;
          }
          return originalSetRequestHandler.call(
            testServer,
            schema as unknown as Parameters<
              typeof originalSetRequestHandler
            >[0],
            handler as unknown as Parameters<
              typeof originalSetRequestHandler
            >[1],
          );
        },
      );

      registerHandlers(testServer);
    });

    it('should return list of tools', async () => {
      const result = await listToolsHandler();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('tools');
    });
  });

  describe('Prompts Handlers', () => {
    let listPromptsHandler: jest.MockedFunction<
      () => Promise<ListPromptsResponse>
    >;
    let getPromptHandler: jest.MockedFunction<
      (args: unknown) => Promise<GetPromptResponse>
    >;

    beforeEach(() => {
      registerHandlers(
        mockServer as unknown as Parameters<typeof registerHandlers>[0],
      );

      // Extract handlers from mock calls
      const calls = mockServer.setRequestHandler.mock.calls;

      const listPromptsCall = calls.find(
        (call) => call[0] === ListPromptsRequestSchema,
      );
      const getPromptCall = calls.find(
        (call) => call[0] === GetPromptRequestSchema,
      );

      listPromptsHandler = listPromptsCall?.[1] as jest.MockedFunction<
        () => Promise<ListPromptsResponse>
      >;
      getPromptHandler = getPromptCall?.[1] as jest.MockedFunction<
        (args: unknown) => Promise<GetPromptResponse>
      >;
    });

    describe('List Prompts Handler', () => {
      test('should return available prompts', async () => {
        const result = await listPromptsHandler();

        expect(result).toHaveProperty('prompts');
        expect(Array.isArray(result.prompts)).toBe(true);
        expect(result.prompts.length).toBe(4);

        // Check if all expected prompts are present
        const promptNames = result.prompts.map((p: MockPrompt) => p.name);
        expect(promptNames).toContain('daily-task-organizer');
        expect(promptNames).toContain('smart-reminder-creator');
        expect(promptNames).toContain('reminder-review-assistant');
        expect(promptNames).toContain('weekly-planning-workflow');
        // reminder-cleanup-guide removed
        // goal-tracking-setup removed
      });
    });

    describe('Get Prompt Handler', () => {
      test('should return daily-task-organizer prompt', async () => {
        const request = {
          params: {
            name: 'daily-task-organizer',
            arguments: {
              today_focus: 'finish quarterly report and prepare slides',
            },
          },
        };

        const result = await getPromptHandler(request);

        expect(result.description).toContain(
          'Comprehensive daily task organization',
        );
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0].role).toBe('user');
        expect(result.messages[0].content.type).toBe('text');
        expect((result.messages[0].content as MessageContent).text).toContain(
          'finish quarterly report and prepare slides',
        );
        expect((result.messages[0].content as MessageContent).text).toContain(
          'Planning horizon: today',
        );
      });

      test('should return smart-reminder-creator prompt', async () => {
        const request = {
          params: {
            name: 'smart-reminder-creator',
            arguments: {
              task_idea: 'Complete project proposal',
            },
          },
        };

        const result = await getPromptHandler(request);

        expect(result.description).toContain('Intelligent reminder creation');
        expect(result.messages).toHaveLength(1);
        expect((result.messages[0].content as MessageContent).text).toContain(
          'Complete project proposal',
        );
      });

      // goal-tracking-setup tests removed

      test('should handle default values for optional arguments', async () => {
        const request = {
          params: {
            name: 'daily-task-organizer',
            arguments: {},
          },
        };

        const result = await getPromptHandler(request);

        expect((result.messages[0].content as MessageContent).text).toContain(
          "Today's focus ideas: none provided",
        );
        expect((result.messages[0].content as MessageContent).text).toContain(
          'Planning horizon: today',
        );
      });

      test('should handle smart-reminder-creator with empty arguments', async () => {
        const request = {
          params: {
            name: 'smart-reminder-creator',
            arguments: {},
          },
        };

        const result = await getPromptHandler(request);
        expect(result).toBeDefined();
        expect(result.messages[0].content.type).toBe('text');
        expect((result.messages[0].content as MessageContent).text).toContain(
          'Task idea:',
        );
      });

      test('should throw error for unknown prompt', async () => {
        const request = {
          params: {
            name: 'unknown-prompt',
            arguments: {},
          },
        };

        await expect(getPromptHandler(request)).rejects.toThrow(
          'Unknown prompt: unknown-prompt',
        );
      });

      test('should throw error when name is not a string', async () => {
        const request = {
          params: {
            name: 123 as unknown,
            arguments: {},
          },
        };

        await expect(getPromptHandler(request)).rejects.toThrow(
          'Prompt name must be a string.',
        );
      });
    });
  });

  describe('CallToolRequestSchema handler', () => {
    let callToolHandler: jest.MockedFunction<
      (args: unknown) => Promise<unknown>
    >;

    beforeEach(() => {
      const testServer = new Server(
        { name: 'test', version: '1.0.0' },
        { capabilities: { prompts: {}, resources: {}, tools: {} } },
      );

      const originalSetRequestHandler = testServer.setRequestHandler;
      testServer.setRequestHandler = jest.fn(
        (schema: unknown, handler: unknown) => {
          const CallToolRequestSchema = jest.requireActual(
            '@modelcontextprotocol/sdk/types.js',
          ).CallToolRequestSchema;
          if (schema === (CallToolRequestSchema as unknown)) {
            callToolHandler = handler as jest.MockedFunction<
              (args: unknown) => Promise<unknown>
            >;
          }
          return originalSetRequestHandler.call(
            testServer,
            schema as unknown as Parameters<
              typeof originalSetRequestHandler
            >[0],
            handler as unknown as Parameters<
              typeof originalSetRequestHandler
            >[1],
          );
        },
      );

      registerHandlers(testServer);
    });

    it('should handle null arguments', async () => {
      const request = {
        params: {
          name: 'reminders',
          arguments: null,
        },
      };

      const result = await callToolHandler(request);
      expect(result).toBeDefined();
    });
  });
});

describe('Server Handlers - Prompts', () => {
  describe('ListPromptsRequestSchema', () => {
    it('should return all available prompts', async () => {
      const testServer = new Server(
        { name: 'test', version: '1.0.0' },
        { capabilities: { prompts: {}, resources: {}, tools: {} } },
      );

      let listPromptsHandler:
        | jest.MockedFunction<() => Promise<ListPromptsResponse>>
        | undefined;

      // Mock setRequestHandler to capture the handler
      const originalSetRequestHandler = testServer.setRequestHandler;
      testServer.setRequestHandler = jest.fn(
        (schema: unknown, handler: unknown) => {
          if (schema === (ListPromptsRequestSchema as unknown)) {
            listPromptsHandler = handler as jest.MockedFunction<
              () => Promise<ListPromptsResponse>
            >;
          }
          return originalSetRequestHandler.call(
            testServer,
            schema as unknown as Parameters<
              typeof originalSetRequestHandler
            >[0],
            handler as unknown as Parameters<
              typeof originalSetRequestHandler
            >[1],
          );
        },
      );

      registerHandlers(testServer);

      expect(listPromptsHandler).toBeDefined();
      const response = await listPromptsHandler?.();

      expect(response).toBeDefined();
      expect(response as ListPromptsResponse).toHaveProperty('prompts');
      expect(Array.isArray(response?.prompts)).toBe(true);
      expect(response?.prompts.length).toBe(4);

      // Check if all expected prompts are present
      const promptNames = response?.prompts.map((p: MockPrompt) => p.name);
      expect(promptNames).toContain('daily-task-organizer');
      expect(promptNames).toContain('smart-reminder-creator');
      expect(promptNames).toContain('reminder-review-assistant');
      expect(promptNames).toContain('weekly-planning-workflow');
      // reminder-cleanup-guide removed
      // goal-tracking-setup removed
    });

    it('should have proper prompt structure', async () => {
      const testServer = new Server(
        { name: 'test', version: '1.0.0' },
        { capabilities: { prompts: {}, resources: {}, tools: {} } },
      );

      let listPromptsHandler:
        | jest.MockedFunction<() => Promise<ListPromptsResponse>>
        | undefined;

      const originalSetRequestHandler = testServer.setRequestHandler;
      testServer.setRequestHandler = jest.fn(
        (schema: unknown, handler: unknown) => {
          if (schema === (ListPromptsRequestSchema as unknown)) {
            listPromptsHandler = handler as jest.MockedFunction<
              () => Promise<ListPromptsResponse>
            >;
          }
          return originalSetRequestHandler.call(
            testServer,
            schema as unknown as Parameters<
              typeof originalSetRequestHandler
            >[0],
            handler as unknown as Parameters<
              typeof originalSetRequestHandler
            >[1],
          );
        },
      );

      registerHandlers(testServer);
      expect(listPromptsHandler).toBeDefined();
      const response = await listPromptsHandler?.();

      expect(response).toBeDefined();
      response?.prompts.forEach((prompt: MockPrompt) => {
        expect(prompt).toHaveProperty('name');
        expect(prompt).toHaveProperty('description');
        expect(prompt).toHaveProperty('arguments');
        expect(Array.isArray(prompt.arguments)).toBe(true);

        // Check argument structure
        prompt.arguments.forEach((arg: MockPromptArgument) => {
          expect(arg).toHaveProperty('name');
          expect(arg).toHaveProperty('description');
          expect(arg).toHaveProperty('required');
          expect(typeof arg.required).toBe('boolean');
        });
      });
    });
  });

  describe('GetPromptRequestSchema', () => {
    let getPromptHandler: jest.MockedFunction<
      (args: unknown) => Promise<GetPromptResponse>
    >;

    beforeEach(() => {
      const testServer = new Server(
        { name: 'test', version: '1.0.0' },
        { capabilities: { prompts: {}, resources: {}, tools: {} } },
      );

      const originalSetRequestHandler = testServer.setRequestHandler;
      testServer.setRequestHandler = jest.fn(
        (schema: unknown, handler: unknown) => {
          if (schema === (GetPromptRequestSchema as unknown)) {
            getPromptHandler = handler as jest.MockedFunction<
              (args: unknown) => Promise<GetPromptResponse>
            >;
          }
          return originalSetRequestHandler.call(
            testServer,
            schema as unknown as Parameters<
              typeof originalSetRequestHandler
            >[0],
            handler as unknown as Parameters<
              typeof originalSetRequestHandler
            >[1],
          );
        },
      );

      registerHandlers(testServer);
    });

    it('should return daily-task-organizer prompt with default arguments', async () => {
      const request = {
        params: {
          name: 'daily-task-organizer',
          arguments: {},
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
      expect(message.content.text).toContain(
        'Mission: Design a realistic today execution plan in Apple Reminders',
      );
      expect(message.content.text).toContain(
        "Today's focus ideas: none provided",
      );
      expect(message.content.text).toContain('Planning horizon: today');
      expect(message.content.text).toContain('### Snapshot');
    });

    it('should return smart-reminder-creator prompt with custom arguments', async () => {
      const request = {
        params: {
          name: 'smart-reminder-creator',
          arguments: {
            task_idea: 'Complete project proposal',
          },
        },
      };

      const response = await getPromptHandler(request);

      expect(response.description).toContain('Intelligent reminder creation');
      const message = response.messages[0];
      expect(message.content.text).toContain('Complete project proposal');
    });

    // goal-tracking-setup tests removed

    it('should throw error for unknown prompt', async () => {
      const request = {
        params: {
          name: 'unknown-prompt',
          arguments: {},
        },
      };

      await expect(getPromptHandler(request)).rejects.toThrow(
        'Unknown prompt: unknown-prompt',
      );
    });

    // reminder-cleanup-guide optional args test removed

    // goal-tracking-setup handler test removed
  });
});
