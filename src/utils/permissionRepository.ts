/**
 * permissionRepository.ts
 * Repository encapsulating permission checks and requests via EventKitCLI bridge.
 */

import type { PermissionScope, PermissionStatus } from '../types/index.js';
import { executeCli } from './cliExecutor.js';

const PERMISSION_STATUS_ACTION = 'permission-status';
const REQUEST_PERMISSION_ACTION = 'request-permission';

class PermissionRepository {
  async getPermissionStatus(scope: PermissionScope): Promise<PermissionStatus> {
    return executeCli<PermissionStatus>([
      '--action',
      PERMISSION_STATUS_ACTION,
      '--target',
      scope,
    ]);
  }

  async requestPermission(scope: PermissionScope): Promise<PermissionStatus> {
    return executeCli<PermissionStatus>([
      '--action',
      REQUEST_PERMISSION_ACTION,
      '--target',
      scope,
    ]);
  }
}

export const permissionRepository = new PermissionRepository();
