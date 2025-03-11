/**
 * setup.ts
 * Setup script for configuring the Claude desktop app to use this MCP server
 */

import { homedir } from "os";
import { join } from "path";

// Configuration path for Claude desktop app
const CONFIG_PATH = join(
  homedir(),
  "Library/Application Support/Claude/claude_desktop_config.json"
);

// Load existing config or create empty config
let config = { mcpServers: {} };

try {
  config = await Bun.file(CONFIG_PATH).json();
} catch {
  // Config doesn't exist yet, use default empty config
}

// Get absolute paths
const bunPath = process.argv[0]; // Current bun executable
const serverPath = join(import.meta.dir, "./src/index.ts");

// Update configuration
config.mcpServers = {
  ...config.mcpServers,
  "mcp-server-apple-reminders": {
    command: bunPath,
    args: [serverPath],
  },
};

// Write updated configuration to file
await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2));

console.log("\x1b[32m✨ Successfully added mcp-server-apple-reminders server to Claude MCP config! 🎉\x1b[0m");
console.log(CONFIG_PATH.replace(homedir(), "~"));
