/**
 * permissions.ts
 * Consolidated macOS permissions management for Apple Reminders MCP Server
 *
 * Handles EventKit and AppleScript permissions with proactive checks and user guidance
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  BinaryValidationError,
  findSecureBinaryPath,
  getEnvironmentBinaryConfig,
} from './binaryValidator.js';
import {
  APPLESCRIPT,
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
  appleScript: PermissionStatus;
  allGranted: boolean;
}

// Binary path management - simplified
let cachedBinaryPath: string | null = null;

/**
 * Gets cached binary path or resolves it
 */
function getBinaryPath(): string | null {
  if (cachedBinaryPath !== null) return cachedBinaryPath;

  if (process.env[ENVIRONMENT_VARS.NODE_ENV] === ENVIRONMENTS.TEST) {
    cachedBinaryPath = BINARY_PATHS.MOCK_PATH;
    return cachedBinaryPath;
  }

  try {
    const projectRoot = findProjectRoot();
    const binaryName = FILE_SYSTEM.SWIFT_BINARY_NAME;
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

    // Fallback to default path - same logic as reminders.ts
    const defaultPath = path.resolve(
      projectRoot,
      BINARY_PATHS.DIST_PATH,
      binaryName,
    );
    logger.warn(`⚠️  Using fallback binary path: ${defaultPath}`);
    cachedBinaryPath = defaultPath;
    return defaultPath;
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
 * Checks AppleScript automation permissions
 */
export async function checkAppleScriptPermissions(): Promise<PermissionStatus> {
  return executePermissionCheck(
    APPLESCRIPT.EXECUTABLE,
    [APPLESCRIPT.EXECUTE_FLAG, APPLESCRIPT.PERMISSION_TEST_SCRIPT],
    TIMEOUTS.APPLESCRIPT_PERMISSION_CHECK,
    'AppleScript',
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

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      resolve(handleProcessClose(code, stdout, stderr, permissionType));
    });

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

/**
 * Handles process close event
 */
function handleProcessClose(
  code: number | null,
  stdout: string,
  stderr: string,
  permissionType: string,
): PermissionStatus {
  if (code === 0 && (permissionType === 'EventKit' || stdout.trim())) {
    return { granted: true, error: undefined, requiresUserAction: false };
  }

  return analyzePermissionError(stderr, permissionType);
}

/**
 * Analyzes permission error and provides guidance
 */
function analyzePermissionError(
  stderr: string,
  permissionType: string,
): PermissionStatus {
  const errorText = stderr.toLowerCase();
  const isPermissionError = PERMISSIONS.PERMISSION_ERROR_KEYWORDS.some(
    (keyword) => errorText.includes(keyword),
  );

  if (isPermissionError) {
    const guidance = getPermissionGuidance(permissionType);
    return createPermissionFailure(guidance, true);
  }

  return createPermissionFailure(
    `${permissionType} check failed: ${stderr}`,
    false,
  );
}

/**
 * Gets permission guidance for specific types
 */
function getPermissionGuidance(permissionType: string): string {
  switch (permissionType) {
    case 'EventKit':
      return 'EventKit permission denied. Please grant access in System Settings > Privacy & Security > Reminders';
    case 'AppleScript':
      return 'AppleScript automation permission denied. Please grant access in System Settings > Privacy & Security > Automation';
    default:
      return `${permissionType} permission denied. Please check system settings.`;
  }
}

/**
 * Creates standardized permission failure response
 */
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
/**
 * Checks all required permissions
 */
export async function checkAllPermissions(): Promise<SystemPermissions> {
  const [eventKit, appleScript] = await Promise.all([
    checkEventKitPermissions(),
    checkAppleScriptPermissions(),
  ]);

  const allGranted = eventKit.granted && appleScript.granted;

  logger.debug('Permission check results:', {
    eventKit: eventKit.granted,
    appleScript: appleScript.granted,
    allGranted,
  });

  return { eventKit, appleScript, allGranted };
}

// User guidance generation
/**
 * Generates comprehensive permission guidance
 */
export function generatePermissionGuidance(
  permissions: SystemPermissions,
): string {
  if (permissions.allGranted) {
    return '✅ All permissions granted successfully';
  }

  const sections = [
    createHeader(),
    ...createPermissionSections(permissions),
    ...createActionSections(permissions),
  ];

  return sections.join('\n');
}

/**
 * Creates guidance header
 */
function createHeader(): string {
  return '🔐 Apple Reminders MCP Server requires the following permissions:\n';
}

/**
 * Creates permission status sections
 */
function createPermissionSections(permissions: SystemPermissions): string[] {
  return [
    createEventKitSection(permissions.eventKit),
    createAppleScriptSection(permissions.appleScript),
  ];
}

/**
 * Creates EventKit permission section
 */
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

/**
 * Creates AppleScript permission section
 */
function createAppleScriptSection(appleScript: PermissionStatus): string {
  if (appleScript.granted) {
    return '✅ AppleScript Automation: Granted\n';
  }

  return [
    '❌ AppleScript Automation:',
    '   • Open System Settings > Privacy & Security > Automation',
    '   • Find your terminal or application in the list',
    '   • Expand it and enable "Reminders" access',
    '   • You may also need to allow "System Events" if prompted',
    '',
  ].join('\n');
}

/**
 * Creates action guidance sections
 */
function createActionSections(permissions: SystemPermissions): string[] {
  if (permissions.allGranted) {
    return [];
  }

  return [createPostPermissionActions(), createTroubleshootingTips()];
}

/**
 * Creates post-permission action guidance
 */
function createPostPermissionActions(): string {
  return [
    '📋 After granting permissions:',
    '   1. Restart your terminal or application',
    '   2. Run the MCP server again',
    '   3. The system may prompt you to confirm access - click "Allow"',
    '',
  ].join('\n');
}

/**
 * Creates troubleshooting tips
 */
function createTroubleshootingTips(): string {
  return [
    '💡 If you continue having issues, try:',
    '   • Logging out and back in to macOS',
    '   • Restarting your Mac',
    '   • Checking Console.app for permission-related errors',
  ].join('\n');
}

/**
 * Creates error details for MCP client consumption
 */
export function createPermissionErrorDetails(
  permissions: SystemPermissions,
): string[] {
  const errorDetails: string[] = [];

  if (!permissions.eventKit.granted) {
    errorDetails.push(`EventKit: ${permissions.eventKit.error}`);
  }

  if (!permissions.appleScript.granted) {
    errorDetails.push(`AppleScript: ${permissions.appleScript.error}`);
  }

  return errorDetails;
}

/**
 * Requests EventKit permissions by triggering the Swift binary
 * This will show system permission dialog if permissions aren't granted
 */
export async function requestEventKitPermissions(): Promise<PermissionStatus> {
  const binaryPath = getBinaryPath();
  if (!binaryPath) {
    return createPermissionFailure(MESSAGES.ERROR.BINARY_NOT_AVAILABLE, true);
  }

  logger.debug('Attempting to request EventKit permissions...');

  return new Promise((resolve) => {
    const process = spawn(binaryPath, []);

    let _stdout = '';
    let stderr = '';

    process.stdout.on('data', (data: Buffer) => {
      _stdout += data.toString();
    });

    process.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    process.on('close', (code: number | null) => {
      // If the Swift binary succeeds (code 0), it means permissions were granted
      if (code === 0) {
        logger.debug('EventKit permissions granted via Swift binary');
        resolve({ granted: true, error: undefined, requiresUserAction: false });
      } else {
        // Permission was denied or there was an error
        const errorMessage = stderr || 'EventKit permission request failed';
        logger.debug('EventKit permission request failed:', errorMessage);
        resolve(createPermissionFailure(errorMessage, true));
      }
    });

    process.on('error', (error: Error) => {
      logger.error(
        'Failed to execute Swift binary for permission request:',
        error,
      );
      resolve(
        createPermissionFailure(
          `Failed to request EventKit permissions: ${error.message}`,
          true,
        ),
      );
    });

    // Extended timeout for user interaction with permission dialog
    setTimeout(() => {
      if (!process.killed) {
        process.kill();
        resolve(
          createPermissionFailure(
            'Permission request timed out - user may have dismissed the dialog',
            true,
          ),
        );
      }
    }, TIMEOUTS.EVENTKIT_PERMISSION_CHECK * 3); // Triple timeout for user interaction
  });
}

// Main API function
/**
 * Proactively checks and handles permission issues before operations
 * Attempts to request permissions if they are denied
 */
export async function ensurePermissions(): Promise<void> {
  let permissions = await checkAllPermissions();

  // If permissions aren't granted, try to request them
  if (!permissions.allGranted) {
    logger.debug('Permissions not granted, attempting to request them...');

    // Attempt to request EventKit permissions if they're the issue
    if (!permissions.eventKit.granted) {
      logger.debug('Requesting EventKit permissions...');
      const requestResult = await requestEventKitPermissions();

      if (requestResult.granted) {
        logger.debug('EventKit permissions granted after request');
        // Re-check all permissions after successful request
        permissions = await checkAllPermissions();
      } else {
        logger.debug(
          'EventKit permission request failed:',
          requestResult.error,
        );
      }
    }
  }

  // Final check - if still not granted, provide guidance and fail
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
