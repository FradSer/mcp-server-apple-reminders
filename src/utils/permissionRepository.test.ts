/**
 * permissionRepository.test.ts
 * Tests for permission repository to ensure CLI access patterns.
 */

import { executeCli } from './cliExecutor.js';
import { permissionRepository } from './permissionRepository.js';

jest.mock('./cliExecutor.js');

const mockExecuteCli = executeCli as jest.MockedFunction<typeof executeCli>;

describe('permissionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPermissionStatus', () => {
    it('should request status for calendar scope', async () => {
      mockExecuteCli.mockResolvedValue({
        scope: 'calendar',
        status: 'notDetermined',
        promptAllowed: true,
        instructions: 'Grant access in Settings.',
      });

      const result = await permissionRepository.getPermissionStatus('calendar');

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'permission-status',
        '--target',
        'calendar',
      ]);

      expect(result).toEqual({
        scope: 'calendar',
        status: 'notDetermined',
        promptAllowed: true,
        instructions: 'Grant access in Settings.',
      });
    });
  });

  describe('requestPermission', () => {
    it('should request permission for reminders', async () => {
      mockExecuteCli.mockResolvedValue({
        scope: 'reminders',
        status: 'authorized',
        promptAllowed: false,
        instructions: 'Reminders access granted.',
      });

      const result = await permissionRepository.requestPermission('reminders');

      expect(mockExecuteCli).toHaveBeenCalledWith([
        '--action',
        'request-permission',
        '--target',
        'reminders',
      ]);

      expect(result).toEqual({
        scope: 'reminders',
        status: 'authorized',
        promptAllowed: false,
        instructions: 'Reminders access granted.',
      });
    });
  });
});
