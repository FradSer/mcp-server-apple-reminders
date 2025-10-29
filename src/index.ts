#!/usr/bin/env node

/**
 * index.ts
 * Entry point for the Apple Reminders MCP server
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server/server.js';

// Find project root by locating package.json
const __filename = fileURLToPath(import.meta.url);
let projectRoot = dirname(__filename);
for (let i = 0; i < 10 && !existsSync(join(projectRoot, 'package.json')); i++) {
  projectRoot = dirname(projectRoot);
}

const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf-8'),
);

// Server configuration
const SERVER_CONFIG = {
  name: packageJson.name,
  version: packageJson.version,
};

// Start the application
startServer(SERVER_CONFIG).catch(() => {
  process.exit(1);
});
