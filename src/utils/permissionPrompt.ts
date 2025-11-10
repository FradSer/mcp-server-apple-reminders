/**
 * permissionPrompt.ts
 * Triggers macOS permission prompts via AppleScript fallbacks.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type PermissionDomain = 'reminders' | 'calendars';

const APPLESCRIPT_SNIPPETS: Record<PermissionDomain, string> = {
  reminders: 'tell application "Reminders" to get the name of every list',
  calendars: 'tell application "Calendar" to get the name of every calendar',
};

const inFlight = new Map<PermissionDomain, Promise<void>>();

/**
 * Triggers the corresponding AppleScript to surface a macOS permission dialog.
 * Uses simple memoization to avoid spawning duplicate dialogs.
 */
export async function triggerPermissionPrompt(
  domain: PermissionDomain,
): Promise<void> {
  if (inFlight.has(domain)) {
    return inFlight.get(domain)!;
  }

  const script = APPLESCRIPT_SNIPPETS[domain];
  const execution = execFileAsync('osascript', ['-e', script])
    .then(() => undefined)
    .catch((error) => {
      const message =
        error instanceof Error ? error.message : String(error ?? 'Unknown');
      throw new Error(
        `Failed to trigger ${domain} permission prompt: ${message}`,
      );
    })
    .finally(() => {
      inFlight.delete(domain);
    });

  inFlight.set(domain, execution);
  return execution;
}
