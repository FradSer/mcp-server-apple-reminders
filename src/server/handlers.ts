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
import {
  buildPromptResponse,
  PROMPT_DEFINITIONS,
  PROMPT_METADATA_LIST,
} from './prompts.js';
import type { ListsToolArgs, RemindersToolArgs } from '../types/index.js';

/**
 * Registers all request handlers for the MCP server
 * @param server - The MCP server instance
 */
export function registerHandlers(server: Server): void {
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
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPT_METADATA_LIST,
  }));

  // Handler for getting a specific prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!PROMPT_DEFINITIONS[name]) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    const prompt = buildPromptResponse(name, args ?? {});

    if (!prompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    return prompt;
  });
}
