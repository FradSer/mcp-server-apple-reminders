/**
 * cliExecutor.test.ts
 * Tests for CLI executor utilities
 */

import type {
  ChildProcess,
  ExecFileException,
  ExecFileOptions,
} from 'node:child_process';
import { execFile } from 'node:child_process';
import { executeCli } from './cliExecutor.js';
import { findProjectRoot } from './projectUtils.js';

type ExecFileCallback =
  | ((
      error: ExecFileException | null,
      stdout: string | Buffer,
      stderr: string | Buffer,
    ) => void)
  | null
  | undefined;

jest.mock('node:child_process');
jest.mock('./projectUtils.js', () => ({
  findProjectRoot: jest.fn(),
}));

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
const mockFindProjectRoot = findProjectRoot as jest.MockedFunction<
  typeof findProjectRoot
>;

describe('cliExecutor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindProjectRoot.mockReturnValue('/test/project');
  });

  describe('executeCli', () => {
    it('should execute CLI and return parsed result on success', async () => {
      const mockStdout = JSON.stringify({
        status: 'success',
        result: { id: '123', title: 'Test reminder' },
      });

      mockExecFile.mockImplementation(
        (
          _cliPath: string,
          _args: readonly string[] | null | undefined,
          optionsOrCallback?:
            | ExecFileOptions
            | null
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void),
          callback?:
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void)
            | null
            | undefined,
        ) => {
          const cb = (
            typeof optionsOrCallback === 'function'
              ? optionsOrCallback
              : callback
          ) as ExecFileCallback | undefined;
          if (cb) {
            cb(null, { stdout: mockStdout } as unknown as Buffer, '');
          }
          return {} as ChildProcess;
        },
      );

      const result = await executeCli(['--action', 'read', '--id', '123']);

      expect(result).toEqual({ id: '123', title: 'Test reminder' });
      expect(mockFindProjectRoot).toHaveBeenCalled();
      expect(mockExecFile).toHaveBeenCalledWith(
        '/test/project/bin/RemindersCLI',
        ['--action', 'read', '--id', '123'],
        expect.any(Function),
      );
    });

    it('should throw error when CLI returns error status', async () => {
      const mockStdout = JSON.stringify({
        status: 'error',
        message: 'Failed to read reminder',
      });

      mockExecFile.mockImplementation(
        (
          _cliPath: string,
          _args: readonly string[] | null | undefined,
          optionsOrCallback?:
            | ExecFileOptions
            | null
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void),
          callback?:
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void)
            | null
            | undefined,
        ) => {
          const cb = (
            typeof optionsOrCallback === 'function'
              ? optionsOrCallback
              : callback
          ) as ExecFileCallback | undefined;
          if (cb) {
            cb(null, { stdout: mockStdout } as unknown as Buffer, '');
          }
          return {} as ChildProcess;
        },
      );

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('Failed to read reminder');
    });

    it('should throw error when CLI execution fails', async () => {
      const error = new Error('Command failed');

      mockExecFile.mockImplementation(
        (
          _cliPath: string,
          _args: readonly string[] | null | undefined,
          optionsOrCallback?:
            | ExecFileOptions
            | null
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void),
          callback?:
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void)
            | null
            | undefined,
        ) => {
          const cb = (
            typeof optionsOrCallback === 'function'
              ? optionsOrCallback
              : callback
          ) as ExecFileCallback | undefined;
          if (cb) {
            cb(error, null as unknown as Buffer, '');
          }
          return {} as ChildProcess;
        },
      );

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('RemindersCLI execution failed: Command failed');
    });

    it('should throw error when stdout is invalid JSON', async () => {
      mockExecFile.mockImplementation(
        (
          _cliPath: string,
          _args: readonly string[] | null | undefined,
          optionsOrCallback?:
            | ExecFileOptions
            | null
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void),
          callback?:
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void)
            | null
            | undefined,
        ) => {
          const cb = (
            typeof optionsOrCallback === 'function'
              ? optionsOrCallback
              : callback
          ) as ExecFileCallback | undefined;
          if (cb) {
            cb(null, { stdout: 'invalid json' } as unknown as Buffer, '');
          }
          return {} as ChildProcess;
        },
      );

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('RemindersCLI execution failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockExecFile.mockImplementation(
        (
          _cliPath: string,
          _args: readonly string[] | null | undefined,
          optionsOrCallback?:
            | ExecFileOptions
            | null
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void),
          callback?:
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void)
            | null
            | undefined,
        ) => {
          const cb = (
            typeof optionsOrCallback === 'function'
              ? optionsOrCallback
              : callback
          ) as ExecFileCallback | undefined;
          if (cb) {
            cb(
              'string error' as unknown as ExecFileException,
              null as unknown as Buffer,
              '',
            );
          }
          return {} as ChildProcess;
        },
      );

      await expect(
        executeCli(['--action', 'read', '--id', '123']),
      ).rejects.toThrow('RemindersCLI execution failed: string error');
    });

    it('should compute CLI path using findProjectRoot', async () => {
      mockFindProjectRoot.mockReturnValue('/custom/project/path');
      const mockStdout = JSON.stringify({
        status: 'success',
        result: { success: true },
      });

      mockExecFile.mockImplementation(
        (
          _cliPath: string,
          _args: readonly string[] | null | undefined,
          optionsOrCallback?:
            | ExecFileOptions
            | null
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void),
          callback?:
            | ((
                error: ExecFileException | null,
                stdout: string | Buffer,
                stderr: string | Buffer,
              ) => void)
            | null
            | undefined,
        ) => {
          const cb = (
            typeof optionsOrCallback === 'function'
              ? optionsOrCallback
              : callback
          ) as ExecFileCallback | undefined;
          if (cb) {
            cb(null, { stdout: mockStdout } as unknown as Buffer, '');
          }
          return {} as ChildProcess;
        },
      );

      await executeCli(['--action', 'read']);

      expect(mockExecFile).toHaveBeenCalledWith(
        '/custom/project/path/bin/RemindersCLI',
        ['--action', 'read'],
        expect.any(Function),
      );
    });
  });
});
