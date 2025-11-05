/**
 * utils/cliExecutor.ts
 * Executes the EventKitCLI binary and parses the JSON output.
 */

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  findSecureBinaryPath,
  getEnvironmentBinaryConfig,
} from './binaryValidator.js';
import { FILE_SYSTEM } from './constants.js';
import { findProjectRoot } from './projectUtils.js';

const execFileAsync = promisify(execFile);

/**
 * Represents the successful output from the CLI.
 */
interface CliSuccessResponse<T> {
  status: 'success';
  result: T;
}

/**
 * Represents the error output from the CLI.
 */
interface CliErrorResponse {
  status: 'error';
  message: string;
}

type CliResponse<T> = CliSuccessResponse<T> | CliErrorResponse;

/**
 * Executes the EventKitCLI binary with the given arguments.
 * @param args - An array of arguments to pass to the CLI.
 * @returns The parsed JSON result from the CLI.
 * @throws An error if the CLI execution fails or returns an error status.
 */
export async function executeCli<T>(args: string[]): Promise<T> {
  // Compute CLI path lazily to ensure proper environment context
  const projectRoot = findProjectRoot();
  const binaryName = FILE_SYSTEM.SWIFT_BINARY_NAME;
  const possiblePaths = [path.join(projectRoot, 'bin', binaryName)];

  // Use secure binary path finder with environment-specific config
  const config = {
    ...getEnvironmentBinaryConfig(),
    // Allow bin directory in addition to default allowed paths
    allowedPaths: [
      '/bin/',
      '/dist/swift/bin/',
      '/src/swift/bin/',
      '/swift/bin/',
    ],
  };

  const { path: cliPath } = findSecureBinaryPath(possiblePaths, config);

  if (!cliPath) {
    throw new Error(
      `EventKitCLI binary not found or validation failed. Searched: ${possiblePaths.join(', ')}`,
    );
  }

  try {
    const { stdout } = await execFileAsync(cliPath, args);
    const parsed = JSON.parse(stdout) as CliResponse<T>;

    if (parsed.status === 'success') {
      return parsed.result;
    } else {
      // Return error from Swift CLI
      // Note: Permission errors are now handled at the handlers layer with auto-request
      throw new Error(parsed.message);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`EventKitCLI execution failed: ${errorMessage}`);
  }
}
