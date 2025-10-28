#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const projectRoot = path.resolve(__dirname, '..');
const distEntry = path.join(projectRoot, 'dist', 'index.js');

async function run() {
  if (fs.existsSync(distEntry)) {
    try {
      await import(pathToFileURL(distEntry).href);
      return;
    } catch (error) {
      console.warn(
        `Failed to load compiled entry at ${distEntry}: ${error?.message || error}. Falling back to TypeScript runtime.`,
      );
    }
  }

  const { register } = require('tsx/cjs/api');
  register();
  require('../src/index.ts');

  console.log('[DEBUG] SCRIPT EXECUTION FINISHED');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
