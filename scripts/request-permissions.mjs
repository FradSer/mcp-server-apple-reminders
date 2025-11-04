#!/usr/bin/env node

/**
 * Helper script to trigger macOS permission dialogs for EventKit CLI
 * This script uses AppleScript to automatically trigger permission dialogs
 * This should be run BEFORE configuring the MCP server in Cursor/Claude Desktop
 */

import { exec } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔐 EventKit Permission Helper\n');
console.log(
  'This script will trigger macOS permission dialogs for Calendar and Reminders access.',
);
console.log('Please ALLOW the permissions when the system dialogs appear.\n');

const applescriptPath = join(__dirname, 'request-permissions.applescript');

try {
  console.log('📅 Requesting Calendar and Reminders permissions...');
  console.log(
    'Please respond to the macOS permission dialogs if they appear.\n',
  );

  // Run AppleScript to trigger permission dialogs
  const { stdout } = await execAsync(`osascript "${applescriptPath}"`);

  if (stdout) {
    console.log(stdout);
  }

  console.log('\n✅ Permission request complete!');
  console.log('\nNext steps:');
  console.log('1. Check System Settings > Privacy & Security > Calendars');
  console.log('2. Check System Settings > Privacy & Security > Reminders');
  console.log(
    '3. Ensure "Terminal" or your terminal app appears in the allowed apps',
  );
  console.log(
    '4. If permissions were denied, you can manually grant them in System Settings',
  );
  console.log(
    '5. After permissions are granted, you can use the MCP server in Cursor\n',
  );
} catch (error) {
  console.error('❌ Permission request failed:', error.message);
  process.exit(1);
}
