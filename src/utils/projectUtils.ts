/**
 * projectUtils.ts
 * Shared utilities for project-related operations
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Finds the project root directory by looking for package.json
 * @param maxDepth - Maximum directory levels to traverse upward
 * @returns Project root directory path
 * @throws Error if project root cannot be found
 */
export function findProjectRoot(maxDepth = 10): string {
  // Derive the starting directory from the current module's location for robustness.
  const currentDir = getCurrentModuleDir();
  const root = locateProjectRoot(currentDir, maxDepth);

  if (root) {
    return root;
  }

  throw new Error(`Project root not found within ${maxDepth} directory levels`);
}

/**
 * Attempts to find the project root starting from the provided directory.
 * @param startDir - Directory to begin the search from
 * @param maxDepth - Maximum directory levels to traverse upward
 * @returns The project root when found, otherwise `undefined`
 */
export function locateProjectRoot(
  startDir: string,
  maxDepth = 10,
): string | undefined {
  let currentDir = startDir;
  let depth = 0;

  while (depth < maxDepth) {
    if (isCorrectProjectRoot(currentDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached filesystem root
    }

    currentDir = parentDir;
    depth++;
  }

  return undefined;
}

/**
 * Checks if a directory contains the correct package.json for this project
 */
export function isCorrectProjectRoot(dir: string): boolean {
  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageData = JSON.parse(packageContent);
    return packageData.name === 'mcp-server-apple-reminders';
  } catch {
    return false;
  }
}

/**
 * Get the current module's directory
 * Handles both production and test environments
 */
function getCurrentModuleDir(): string {
  if (process.env.NODE_ENV === 'test') {
    return path.join(process.cwd(), 'src', 'utils');
  }

  // In production, use import.meta.url
  return path.dirname(fileURLToPath(import.meta.url));
}
