/**
 * permissionManager.ts
 * Manages macOS permissions for Calendar and Reminders using AppleScript
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Permission request result
 */
export interface PermissionRequestResult {
  granted: boolean;
  error?: string;
  needsManualSetup?: boolean;
}

/**
 * Request Reminders permission using AppleScript
 * @returns Result indicating if permission was granted
 */
export async function requestRemindersPermission(): Promise<PermissionRequestResult> {
  try {
    // Use AppleScript to trigger Reminders permission dialog
    const script = `
      tell application "Reminders"
        activate
        set reminderLists to name of every list
      end tell
    `;

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 30000, // 30 second timeout for user to respond
    });

    return { granted: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if error is due to timeout or user cancellation
    if (
      errorMessage.includes('timed out') ||
      errorMessage.includes('timeout')
    ) {
      return {
        granted: false,
        error: 'Permission request timed out - user did not respond',
        needsManualSetup: true,
      };
    }

    // Check if permission dialog did not appear (TCC issue)
    if (
      errorMessage.includes('not authorized') ||
      errorMessage.includes('permission')
    ) {
      return {
        granted: false,
        error:
          'Permission denied or dialog did not appear due to TCC restrictions',
        needsManualSetup: true,
      };
    }

    // Other errors
    return {
      granted: false,
      error: `Permission request failed: ${errorMessage}`,
      needsManualSetup: true,
    };
  }
}

/**
 * Request Calendar permission using AppleScript
 * @returns Result indicating if permission was granted
 */
export async function requestCalendarPermission(): Promise<PermissionRequestResult> {
  try {
    // Use AppleScript to trigger Calendar permission dialog
    const script = `
      tell application "Calendar"
        activate
        set calendarList to name of every calendar
      end tell
    `;

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 30000, // 30 second timeout for user to respond
    });

    return { granted: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if error is due to timeout or user cancellation
    if (
      errorMessage.includes('timed out') ||
      errorMessage.includes('timeout')
    ) {
      return {
        granted: false,
        error: 'Permission request timed out - user did not respond',
        needsManualSetup: true,
      };
    }

    // Check if permission dialog did not appear (TCC issue)
    if (
      errorMessage.includes('not authorized') ||
      errorMessage.includes('permission')
    ) {
      return {
        granted: false,
        error:
          'Permission denied or dialog did not appear due to TCC restrictions',
        needsManualSetup: true,
      };
    }

    // Other errors
    return {
      granted: false,
      error: `Permission request failed: ${errorMessage}`,
      needsManualSetup: true,
    };
  }
}

/**
 * Format a detailed error message for permission failures
 * @param type - Type of permission (reminders or calendar)
 * @param result - Permission request result
 * @returns Formatted error message with troubleshooting steps
 */
export function formatPermissionError(
  type: 'reminders' | 'calendar',
  result: PermissionRequestResult,
): string {
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  const settingsPath = `System Settings > Privacy & Security > ${capitalizedType}`;

  let message = `❌ ${capitalizedType} Permission Required\n\n`;
  message += `${result.error}\n\n`;
  message += `Troubleshooting Steps:\n`;
  message += `1. Check ${settingsPath}\n`;
  message += `2. Ensure your terminal app (Terminal/iTerm/etc.) has permission\n`;
  message += `3. If permission was denied, manually grant it in System Settings\n\n`;

  if (result.needsManualSetup) {
    message += `Alternative: Run the permission helper script from Terminal:\n`;
    message += `   node scripts/request-permissions.mjs\n\n`;
  }

  message += `For detailed troubleshooting, see: CURSOR_PERMISSIONS.md`;

  return message;
}
