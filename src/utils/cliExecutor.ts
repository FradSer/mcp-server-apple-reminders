/**
 * utils/cliExecutor.ts
 * Executes the EventKitCLI binary and parses the JSON output.
 */

import type { ExecFileException } from 'node:child_process';
import { execFile } from 'node:child_process';
import path from 'node:path';
import {
  findSecureBinaryPath,
  getEnvironmentBinaryConfig,
} from './binaryValidator.js';
import { FILE_SYSTEM } from './constants.js';
import {
  type PermissionDomain,
  triggerPermissionPrompt,
} from './permissionPrompt.js';
import { findProjectRoot } from './projectUtils.js';

const execFilePromise = (
  cliPath: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    execFile(cliPath, args, (error, stdout, stderr) => {
      if (error) {
        const execError = error as ExecFileException & {
          stdout?: string | Buffer;
          stderr?: string | Buffer;
        };
        execError.stdout = stdout;
        execError.stderr = stderr;
        reject(execError);
        return;
      }
      resolve({ stdout, stderr });
    });
  });

interface CliSuccessResponse<T> {
  status: 'success';
  result: T;
}

interface CliErrorResponse {
  status: 'error';
  message: string;
}

type CliResponse<T> = CliSuccessResponse<T> | CliErrorResponse;

const CALENDAR_ACTIONS = new Set([
  'read-events',
  'read-calendars',
  'create-event',
  'update-event',
  'delete-event',
]);

class CliPermissionError extends Error {
  constructor(
    message: string,
    public readonly domain: PermissionDomain,
  ) {
    super(message);
    this.name = 'CliPermissionError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const PERMISSION_KEYWORDS = ['permission', 'authoriz'];

const bufferToString = (data?: string | Buffer | null): string | null => {
  if (typeof data === 'string') return data;
  if (Buffer.isBuffer(data)) return data.toString('utf8');
  return data == null ? null : String(data);
};

const extractAction = (args: string[]): string | undefined => {
  const actionIndex = args.indexOf('--action');
  if (actionIndex >= 0 && actionIndex + 1 < args.length) {
    return args[actionIndex + 1];
  }
  return undefined;
};

const inferDomainFromArgs = (args: string[]): PermissionDomain => {
  const action = extractAction(args);
  if (action && CALENDAR_ACTIONS.has(action)) {
    return 'calendars';
  }
  return 'reminders';
};

const detectPermissionDomain = (
  message: string,
  args: string[],
): PermissionDomain | null => {
  const lower = message.toLowerCase();
  const mentionsPermission = PERMISSION_KEYWORDS.some((keyword) =>
    lower.includes(keyword),
  );
  if (!mentionsPermission) {
    return null;
  }
  if (lower.includes('reminder')) return 'reminders';
  if (lower.includes('calendar')) return 'calendars';
  return inferDomainFromArgs(args);
};

const parseCliOutput = <T>(output: string, args: string[]): T => {
  let parsed: CliResponse<T>;
  try {
    parsed = JSON.parse(output) as CliResponse<T>;
  } catch (_error) {
    throw new Error('EventKitCLI execution failed: Invalid CLI output');
  }

  if (parsed.status === 'success') {
    return parsed.result;
  }

  const domain = detectPermissionDomain(parsed.message, args);
  if (domain) {
    throw new CliPermissionError(parsed.message, domain);
  }
  throw new Error(parsed.message);
};

const runCli = async <T>(cliPath: string, args: string[]): Promise<T> => {
  try {
    const { stdout } = await execFilePromise(cliPath, args);
    const normalized = bufferToString(stdout);
    if (!normalized) {
      throw new Error('EventKitCLI execution failed: Empty CLI output');
    }
    return parseCliOutput(normalized, args);
  } catch (error) {
    const execError = error as ExecFileException & {
      stdout?: string | Buffer;
    };
    const normalized = bufferToString(execError?.stdout);
    if (normalized) {
      return parseCliOutput(normalized, args);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`EventKitCLI execution failed: ${errorMessage}`);
  }
};

/**
 * Executes the EventKitCLI binary with the given arguments.
 * @param args - An array of arguments to pass to the CLI.
 * @returns The parsed JSON result from the CLI.
 * @throws An error if the CLI execution fails or returns an error status.
 */
export async function executeCli<T>(args: string[]): Promise<T> {
  const projectRoot = findProjectRoot();
  const binaryName = FILE_SYSTEM.SWIFT_BINARY_NAME;
  const possiblePaths = [path.join(projectRoot, 'bin', binaryName)];

  const config = {
    ...getEnvironmentBinaryConfig(),
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

  let retried = false;
  while (true) {
    try {
      return await runCli<T>(cliPath, args);
    } catch (error) {
      if (!retried && error instanceof CliPermissionError) {
        retried = true;
        await triggerPermissionPrompt(error.domain);
        continue;
      }
      throw error;
    }
  }
}
