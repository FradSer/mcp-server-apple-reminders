#!/usr/bin/env node

/**
 * index.ts
 * Entry point for the Apple Reminders MCP server
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from './server/server.js';
import { findProjectRoot } from './utils/projectUtils.js';

// Find project root and load package.json
const projectRoot = findProjectRoot();
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
