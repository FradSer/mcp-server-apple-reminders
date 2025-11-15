/**
 * permissionPrompt.test.ts
 * Tests for permission prompt utilities
 */

import type {
  ChildProcess,
  ExecFileException,
  ExecFileOptions,
} from 'node:child_process';
import { execFile } from 'node:child_process';
import { triggerPermissionPrompt } from './permissionPrompt.js';

type ExecFileCallback =
  | ((
      error: ExecFileException | null,
      stdout: string | Buffer,
      stderr: string | Buffer,
    ) => void)
  | null
  | undefined;

jest.mock('node:child_process');

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;

describe('permissionPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const invokeCallback = (
    optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
    callback?: ExecFileCallback,
  ): ExecFileCallback | undefined =>
    (typeof optionsOrCallback === 'function' ? optionsOrCallback : callback) as
      | ExecFileCallback
      | undefined;

  describe('triggerPermissionPrompt', () => {
    it('should trigger reminders permission prompt successfully', async () => {
      mockExecFile.mockImplementation(((
        _command: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        setTimeout(() => cb?.(null, '', ''), 0);
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(
        triggerPermissionPrompt('reminders'),
      ).resolves.toBeUndefined();

      expect(mockExecFile).toHaveBeenCalledWith(
        'osascript',
        ['-e', 'tell application "Reminders" to get the name of every list'],
        expect.any(Function),
      );
    });

    it('should trigger calendars permission prompt successfully', async () => {
      mockExecFile.mockImplementation(((
        _command: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        setTimeout(() => cb?.(null, '', ''), 0);
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(
        triggerPermissionPrompt('calendars'),
      ).resolves.toBeUndefined();

      expect(mockExecFile).toHaveBeenCalledWith(
        'osascript',
        ['-e', 'tell application "Calendar" to get the name of every calendar'],
        expect.any(Function),
      );
    });

    it('should throw error when AppleScript execution fails', async () => {
      const execError = new Error('osascript failed') as ExecFileException;

      mockExecFile.mockImplementation(((
        _command: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        setTimeout(() => cb?.(execError, '', ''), 0);
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(triggerPermissionPrompt('reminders')).rejects.toThrow(
        'Failed to trigger reminders permission prompt',
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockExecFile.mockImplementation(((
        _command: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        setTimeout(
          () => cb?.('string error' as unknown as ExecFileException, '', ''),
          0,
        );
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(triggerPermissionPrompt('reminders')).rejects.toThrow(
        'Failed to trigger reminders permission prompt: string error',
      );
    });

    it('should handle error that is not Error instance', async () => {
      mockExecFile.mockImplementation(((
        _command: string,
        _args: readonly string[] | null | undefined,
        optionsOrCallback?: ExecFileOptions | null | ExecFileCallback,
        callback?: ExecFileCallback,
      ) => {
        const cb = invokeCallback(optionsOrCallback, callback);
        setTimeout(
          () =>
            cb?.('simple string error' as unknown as ExecFileException, '', ''),
          0,
        );
        return {} as ChildProcess;
      }) as unknown as typeof execFile);

      await expect(triggerPermissionPrompt('reminders')).rejects.toThrow(
        'Failed to trigger reminders permission prompt: simple string error',
      );
    });
  });
});
