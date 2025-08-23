import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { Reminder, ReminderList } from '../types/index.js';
import { logger } from './logger.js';
import { getModulePaths } from './moduleHelpers.js';
import { 
  findSecureBinaryPath, 
  validateBinarySecurity, 
  getEnvironmentBinaryConfig,
  BinaryValidationError 
} from './binaryValidator.js';

/**
 * Class to interact with Apple Reminders using the Swift binary
 */
export class RemindersManager {
  private binaryPath: string;
  
  constructor() {
    // Skip binary initialization in test environment
    if (process.env.NODE_ENV === 'test') {
      this.binaryPath = '/mock/path/to/binary';
      return;
    }

    this.binaryPath = this.findBinaryPath();
    this.validateBinary();
  }

  private findBinaryPath(): string {
    // Auto-discover project root by searching for package.json
    const { __filename, __dirname } = getModulePaths();
    let projectRoot = path.dirname(__filename);
    const pathToPkg = 'package.json';
    const maxDepth = 10; // Prevent infinite loops
    let depth = 0;
    while (!fs.existsSync(path.join(projectRoot, pathToPkg)) && depth < maxDepth) {
      const parent = path.dirname(projectRoot);
      if (parent === projectRoot) break;
      projectRoot = parent;
      depth++;
    }

    // Try multiple possible binary locations with absolute paths
    const possiblePaths = [
      path.resolve(projectRoot, 'dist', 'swift', 'bin', 'GetReminders'),
      path.resolve(projectRoot, 'src', 'swift', 'bin', 'GetReminders'),
      path.resolve(projectRoot, 'swift', 'bin', 'GetReminders'),
      path.resolve(__dirname, '..', '..', 'dist', 'swift', 'bin', 'GetReminders'),
      path.resolve(__dirname, '..', '..', 'src', 'swift', 'bin', 'GetReminders')
    ];

    // Use secure binary path finder with environment-specific config
    const securityConfig = getEnvironmentBinaryConfig();
    const { path: securePath, validationResult } = findSecureBinaryPath(possiblePaths, securityConfig);

    if (securePath && validationResult?.isValid) {
      logger.debug(`✅ Secure Swift binary found at: ${securePath}`);
      if (validationResult.hash) {
        logger.debug(`Binary hash: ${validationResult.hash}`);
      }
      return securePath;
    }

    // If no secure path found, throw security error
    const errorDetails = validationResult?.errors.join('; ') || 'No valid binary found';
    logger.error(`❌ Binary security validation failed: ${errorDetails}`);
    
    // For backward compatibility, return default path but log security warning
    const defaultPath = path.resolve(projectRoot, 'dist', 'swift', 'bin', 'GetReminders');
    logger.warn(`⚠️  Using unvalidated binary path for backward compatibility: ${defaultPath}`);
    logger.warn(`⚠️  SECURITY WARNING: Binary integrity could not be verified`);
    
    return defaultPath;
  }

  private validateBinary(): void {
    logger.debug(`Binary path resolved to: ${this.binaryPath}`);
    logger.debug(`Running from compiled code: true`);
    
    // Perform comprehensive security validation
    const securityConfig = getEnvironmentBinaryConfig();
    const validationResult = validateBinarySecurity(this.binaryPath, securityConfig);
    
    if (!validationResult.isValid) {
      const errorMessage = validationResult.errors.join('\n  - ');
      logger.error(`Swift binary security validation failed:\n  - ${errorMessage}`);
      
      // Provide helpful error message based on validation failure
      if (validationResult.errors.some(e => e.includes('FILE_NOT_FOUND'))) {
        throw new BinaryValidationError(`Swift binary not found. Please run the build script first:
        
  npm run build:swift
  
Or build the complete project:
  
  npm run build

Binary should be located at: ${this.binaryPath}`, 'BINARY_NOT_FOUND');
      }
      
      if (validationResult.errors.some(e => e.includes('NOT_EXECUTABLE'))) {
        throw new BinaryValidationError(`Swift binary is not executable. Please check permissions:
        
  chmod +x "${this.binaryPath}"
  
Or rebuild the binary:
  
  npm run build:swift`, 'BINARY_NOT_EXECUTABLE');
      }
      
      // Generic security error
      throw new BinaryValidationError(`Binary security validation failed: ${errorMessage}`, 'SECURITY_VALIDATION_FAILED');
    }
    
    logger.debug(`✅ Binary security validation passed`);
    if (validationResult.hash) {
      logger.debug(`Binary integrity hash: ${validationResult.hash}`);
    }
  }
  
  /**
   * Execute the Swift binary and parse its output
   * @returns Promise with parsed reminders data
   */
  public async getReminders(showCompleted: boolean = false): Promise<{
    lists: ReminderList[];
    reminders: Reminder[];
  }> {
    return new Promise((resolve, reject) => {
      // Convert boolean to string argument
      const args = [];
      if (showCompleted) {
        args.push('--show-completed');
      }
      
      logger.debug(`Spawning Swift binary with showCompleted=${showCompleted}, args:`, args);
      const process = spawn(this.binaryPath, args);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        const chunk = data.toString();
        logger.debug('Received stdout chunk:', chunk);
        stdout += chunk;
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.error(`Swift binary stderr: ${stderr}`);
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          logger.error(`Swift process exited with code ${code}`);
          logger.error(`Error: ${stderr}`);
          return reject(new Error(`Failed to get reminders: ${stderr}`));
        }
        
        try {
          // Parse the output
          const result = this.parseSwiftOutput(stdout);
          resolve(result);
        } catch (error) {
          logger.error(`Failed to parse Swift output: ${error}`);
          reject(error);
        }
      });
    });
  }
  
  /**
   * Ensures the isCompleted value is a proper boolean
   */
  private normalizeIsCompleted(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }
  
  /**
   * Parse the output from the Swift binary
   * @param output The raw output from the Swift binary
   * @returns Parsed reminders data
   */
  private parseSwiftOutput(output: string): {
    lists: ReminderList[];
    reminders: Reminder[];
  } {
    logger.debug(`Starting to parse Swift output, ${output.split('\n').length} lines`);
    
    const sections = this.splitIntoSections(output);
    const lists = this.parseLists(sections.lists);
    const reminders = this.parseReminders(sections.reminders);
    
    logger.debug(`Finished parsing: ${lists.length} lists, ${reminders.length} reminders`);
    
    return {
      lists,
      reminders: reminders.map(reminder => ({
        ...reminder,
        isCompleted: this.normalizeIsCompleted(reminder.isCompleted),
      }))
    };
  }

  /**
   * Split output into lists and reminders sections
   */
  private splitIntoSections(output: string): { lists: string[]; reminders: string[]; } {
    const lines = output.split('\n');
    const sections = { lists: [] as string[], reminders: [] as string[] };
    let currentSection: 'lists' | 'reminders' | null = null;
    
    for (const line of lines) {
      if (line.includes('=== REMINDER LISTS ===')) {
        currentSection = 'lists';
      } else if (line.includes('=== ALL REMINDERS ===')) {
        currentSection = 'reminders';
      } else if (currentSection && line.trim()) {
        sections[currentSection].push(line);
      }
    }
    
    return sections;
  }

  /**
   * Parse reminder lists from lines
   */
  private parseLists(lines: string[]): ReminderList[] {
    return lines
      .map(line => line.match(/^(\d+)\.\s(.+)$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map(match => ({ 
        id: parseInt(match[1], 10), 
        title: match[2] 
      }));
  }

  /**
   * Parse reminders from lines
   */
  private parseReminders(lines: string[]): Reminder[] {
    const reminderBlocks = this.groupReminderLines(lines);
    return reminderBlocks
      .map(block => this.parseReminderBlock(block))
      .filter((reminder): reminder is Reminder => reminder !== null);
  }

  /**
   * Group reminder lines into blocks separated by separators
   */
  private groupReminderLines(lines: string[]): string[][] {
    const blocks: string[][] = [];
    let currentBlock: string[] = [];
    
    for (const line of lines) {
      if (line === '-------------------') {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock);
          currentBlock = [];
        }
      } else {
        currentBlock.push(line);
      }
    }
    
    // Add final block if exists
    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }
    
    return blocks;
  }

  /**
   * Parse a single reminder block
   */
  private parseReminderBlock(lines: string[]): Reminder | null {
    const reminder: Partial<Reminder> = { isCompleted: false };
    
    const fieldParsers: Record<string, (value: string) => void> = {
      'Title:': (value) => reminder.title = value.trim(),
      'Due Date:': (value) => reminder.dueDate = value.trim(),
      'Notes:': (value) => reminder.notes = value.trim(),
      'URL:': (value) => reminder.url = value.trim(),
      'List:': (value) => reminder.list = value.trim(),
      'Status:': (value) => reminder.isCompleted = value.trim() === 'Status: Completed',
      'Raw isCompleted value:': (value) => reminder.isCompleted = value.trim().toLowerCase() === 'true'
    };
    
    for (const line of lines) {
      const parser = Object.entries(fieldParsers)
        .find(([prefix]) => line.startsWith(prefix));
      
      if (parser) {
        parser[1](line.replace(parser[0], ''));
      }
    }
    
    return this.validateReminderFields(reminder);
  }

  /**
   * Validate reminder has required fields
   */
  private validateReminderFields(reminder: Partial<Reminder>): Reminder | null {
    if (!reminder.title || !reminder.list) {
      logger.warn('Skipping reminder with missing required fields:', reminder);
      return null;
    }
    
    // Ensure isCompleted is boolean
    if (typeof reminder.isCompleted !== 'boolean') {
      logger.warn(`Reminder ${reminder.title} has non-boolean isCompleted: ${reminder.isCompleted} (${typeof reminder.isCompleted})`);
      reminder.isCompleted = false;
    }
    
    logger.debug(`Validated reminder: ${reminder.title}, isCompleted=${reminder.isCompleted}`);
    return reminder as Reminder;
  }



}

// Export a singleton instance
export const remindersManager = new RemindersManager(); 