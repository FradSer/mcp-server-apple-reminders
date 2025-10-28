/**
 * utils/cliExecutor.ts
 * Executes the RemindersCLI binary and parses the JSON output.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
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
 * Executes the RemindersCLI binary with the given arguments.
 * @param args - An array of arguments to pass to the CLI.
 * @returns The parsed JSON result from the CLI.
 * @throws An error if the CLI execution fails or returns an error status.
 */
export async function executeCli<T>(args: string[]): Promise<T> {
  // Compute CLI path lazily to ensure proper environment context
  const cliPath = `${findProjectRoot()}/bin/RemindersCLI`;

  try {
    const { stdout } = await execFileAsync(cliPath, args);
    const parsed = JSON.parse(stdout) as CliResponse<T>;

    if (parsed.status === 'success') {
      return parsed.result;
    } else {
      throw new Error(parsed.message);
    }
  } catch (error) {
    // Improve error message for better debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`RemindersCLI execution failed: ${errorMessage}`);
  }
}
