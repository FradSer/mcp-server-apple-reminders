/**
 * permissions.ts
 * Consolidated macOS permissions management for Apple Reminders MCP Server
 *
 * Handles EventKit permissions with proactive checks and user guidance
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  BinaryValidationError,
  findSecureBinaryPath,
  getEnvironmentBinaryConfig,
} from './binaryValidator.js';
import {
  BINARY_PATHS,
  ENVIRONMENT_VARS,
  ENVIRONMENTS,
  FILE_SYSTEM,
  MESSAGES,
  PERMISSIONS,
  TIMEOUTS,
} from './constants.js';
import { logger } from './logger.js';
import { findProjectRoot } from './projectUtils.js';

// Consolidated interfaces
export interface PermissionStatus {
  granted: boolean;
  error?: string;
  requiresUserAction?: boolean;
}

export interface SystemPermissions {
  eventKit: PermissionStatus;
  allGranted: boolean;
}

// Binary path management
let cachedBinaryPath: string | null = null;

function getBinaryPath(): string | null {
  if (cachedBinaryPath !== null) return cachedBinaryPath;

  if (process.env[ENVIRONMENT_VARS.NODE_ENV] === ENVIRONMENTS.TEST) {
    cachedBinaryPath = BINARY_PATHS.MOCK_PATH;
    return cachedBinaryPath;
  }

  try {
    const projectRoot = findProjectRoot();
    // The binary name is now RemindersCLI
    const binaryName = 'RemindersCLI';
    const possiblePaths = [
      path.resolve(projectRoot, BINARY_PATHS.DIST_PATH, binaryName),
      path.resolve(projectRoot, BINARY_PATHS.SRC_PATH, binaryName),
    ];

    const { path: securePath } = findSecureBinaryPath(
      possiblePaths,
      getEnvironmentBinaryConfig(),
    );

    if (securePath) {
      logger.debug(`✅ Swift binary found at: ${securePath}`);
      cachedBinaryPath = securePath;
      return securePath;
    }
    return null;
  } catch (error) {
    logger.error(`Failed to initialize binary path: ${error}`);
    return null;
  }
}

// Permission checking functions
/**
 * Checks EventKit permissions using Swift binary
 */
export async function checkEventKitPermissions(): Promise<PermissionStatus> {
  const binaryPath = getBinaryPath();
  if (!binaryPath) {
    return createPermissionFailure(MESSAGES.ERROR.BINARY_NOT_AVAILABLE, true);
  }

  return executePermissionCheck(
    binaryPath,
    [PERMISSIONS.CHECK_PERMISSIONS_ARG],
    TIMEOUTS.EVENTKIT_PERMISSION_CHECK,
    'EventKit',
  );
}

/**
 * Executes permission check process
 */
async function executePermissionCheck(
  command: string,
  args: string[],
  timeout: number,
  permissionType: string,
): Promise<PermissionStatus> {
  return new Promise((resolve) => {
    const process = spawn(command, args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => (stdout += data.toString()));
    process.stderr.on('data', (data) => (stderr += data.toString()));
    process.on('close', (code) =>
      resolve(handleProcessClose(code, stdout, stderr, permissionType)),
    );
    process.on('error', (error) => {
      resolve(
        createPermissionFailure(
          MESSAGES.ERROR.PERMISSION_CHECK_FAILED(permissionType, error.message),
          true,
        ),
      );
    });

    setTimeout(() => {
      if (!process.killed) {
        process.kill();
        resolve(
          createPermissionFailure(
            MESSAGES.ERROR.PERMISSION_CHECK_TIMEOUT(permissionType),
            true,
          ),
        );
      }
    }, timeout);
  });
}

function handleProcessClose(
  code: number | null,
  stdout: string,
  _stderr: string,
  _permissionType: string,
): PermissionStatus {
  // The Swift CLI now exits with code 0 and prints a specific message on success
  if (code === 0 && stdout.includes('✅ EventKit permissions granted')) {
    return { granted: true, error: undefined, requiresUserAction: false };
  }
  return createPermissionFailure(stdout, true);
}

function createPermissionFailure(
  error: string,
  requiresUserAction: boolean,
): PermissionStatus {
  return {
    granted: false,
    error,
    requiresUserAction,
  };
}

// Combined operations
export async function checkAllPermissions(): Promise<SystemPermissions> {
  const eventKit = await checkEventKitPermissions();
  const allGranted = eventKit.granted;

  logger.debug('Permission check results:', {
    eventKit: eventKit.granted,
    allGranted,
  });

  return { eventKit, allGranted };
}

// User guidance generation
export function generatePermissionGuidance(
  permissions: SystemPermissions,
): string {
  if (permissions.allGranted) {
    return MESSAGES.SUCCESS.ALL_PERMISSIONS_GRANTED;
  }

  const sections = [
    '🔐 Apple Reminders MCP Server requires the following permissions:\n',
    createEventKitSection(permissions.eventKit),
    createPostPermissionActions(),
  ];

  return sections.join('\n');
}

function createEventKitSection(eventKit: PermissionStatus): string {
  if (eventKit.granted) {
    return '✅ EventKit (Reminders) Access: Granted\n';
  }
  return [
    '❌ EventKit (Reminders) Access:',
    '   • Open System Settings > Privacy & Security > Reminders',
    '   • Find your terminal or application in the list',
    '   • Enable access by toggling the switch',
    '',
  ].join('\n');
}

function createPostPermissionActions(): string {
  return [
    '📋 After granting permissions:',
    '   1. Restart your terminal or application',
    '   2. Run the MCP server again',
    '',
  ].join('\n');
}

export function createPermissionErrorDetails(
  permissions: SystemPermissions,
): string[] {
  const errorDetails: string[] = [];
  if (!permissions.eventKit.granted) {
    errorDetails.push(`EventKit: ${permissions.eventKit.error}`);
  }
  return errorDetails;
}

// Main API function
export async function ensurePermissions(): Promise<void> {
  const permissions = await checkAllPermissions();

  if (!permissions.allGranted) {
    const guidance = generatePermissionGuidance(permissions);
    const errorDetails = createPermissionErrorDetails(permissions);

    logger.error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
    logger.error(guidance);

    throw new BinaryValidationError(
      `Permission verification failed:\n${errorDetails.join('\n')}\n\n${guidance}`,
      'PERMISSION_DENIED',
    );
  }

  logger.debug(MESSAGES.SUCCESS.PERMISSIONS_VERIFIED);
}
