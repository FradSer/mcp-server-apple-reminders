/**
 * projectUtils.ts
 * Shared utilities for project-related operations
 */

import fs from 'node:fs';
import path from 'node:path';
import { logger } from './logger.js';

/**
 * Finds the project root directory by looking for package.json
 * @param maxDepth - Maximum directory levels to traverse upward
 * @returns Project root directory path
 * @throws Error if project root cannot be found
 */
export function findProjectRoot(maxDepth = 10): string {
  const root = locateProjectRoot(process.cwd(), maxDepth);

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
      logger.debug(`Project root found at: ${currentDir}`);
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
  } catch (error) {
    logger.debug(`Failed to parse package.json at ${packageJsonPath}:`, error);
    return false;
  }
}

/**
 * Resolves a path relative to the project root
 * @param relativePath - Path relative to project root
 * @returns Absolute path
 */
export function resolveFromProjectRoot(relativePath: string): string {
  const projectRoot = findProjectRoot();
  return path.resolve(projectRoot, relativePath);
}