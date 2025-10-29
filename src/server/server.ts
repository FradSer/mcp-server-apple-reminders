/**
 * server/server.ts
 * Server configuration and startup logic
 */

import 'exit-on-epipe';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ServerConfig } from '../types/index.js';
import { registerHandlers } from './handlers.js';

/**
 * Creates and configures an MCP server instance
 * @param config - Server configuration
 * @returns Configured server instance
 */
export function createServer(config: ServerConfig): Server {
  const server = new Server(
    {
      name: config.name,
      version: config.version,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    },
  );

  // Register request handlers
  registerHandlers(server);

  return server;
}

/**
 * Starts the MCP server
 * @param config - Server configuration
 * @returns A promise that resolves when the server starts
 */
export async function startServer(config: ServerConfig): Promise<void> {
  try {
    const server = createServer(config);
    const transport = new StdioServerTransport();

    // Handle process signals for graceful shutdown
    process.on('SIGINT', () => {
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      process.exit(0);
    });

    await server.connect(transport);
  } catch {
    process.exit(1);
  }
}
