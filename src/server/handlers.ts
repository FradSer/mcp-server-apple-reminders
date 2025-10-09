/**
 * server/handlers.ts
 * Request handlers for the MCP server
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { handleToolCall, TOOLS } from '../tools/index.js';
import type { ListsToolArgs, RemindersToolArgs } from '../types/index.js';
import { 
  initializePrompts, 
  getAllPrompts, 
  getPrompt 
} from '../prompts/index.js';
import { debugLog } from '../utils/logger.js';

/**
 * Registers all request handlers for the MCP server
 * @param server - The MCP server instance
 */
export function registerHandlers(server: Server): void {
  // Initialize prompts system
  initializePrompts();
  debugLog('Prompts system initialized');

  // Handler for listing available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Handler for calling a tool
  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    handleToolCall(
      request.params.name,
      (request.params.arguments as unknown as
        | RemindersToolArgs
        | ListsToolArgs) ?? {},
    ),
  );

  // Handler for listing available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const allPrompts = getAllPrompts();
    
    return {
      prompts: allPrompts.map(prompt => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments.map(arg => ({
          name: arg.name,
          description: arg.description,
          required: arg.required,
        })),
      })),
    };
  });

  // Handler for getting a specific prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    const prompt = getPrompt(name);
    if (!prompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    try {
      // Execute the prompt template with the provided arguments
      const result = prompt.template(args || {});
      debugLog(`Executed prompt: ${name} with args:`, args);
      return result;
    } catch (error) {
      debugLog(`Error executing prompt ${name}:`, error);
      throw new Error(`Failed to execute prompt: ${name}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}
