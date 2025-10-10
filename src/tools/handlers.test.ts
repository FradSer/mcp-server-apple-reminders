// Use global Jest functions to avoid extra dependencies
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Reminder, ReminderList } from '../types/index.js';
import type { ParsedDate } from '../utils/date.js';
import type { ReminderFilters } from '../utils/dateFiltering.js';
import type {
  CreateReminderData,
  MoveReminderData,
  UpdateReminderData,
} from '../utils/reminderRepository.js';
import { remindersManager } from '../utils/reminders.js';
import {
  handleDeleteReminder,
  handleListReminders,
  handleMoveReminder,
  handleUpdateReminder,
} from './handlers.js';

// Mock the reminders module to avoid import.meta issues
jest.mock('../utils/reminders.js');

// Define mocks before using them in jest.mock
let _mockExecuteAppleScript: jest.MockedFunction<
  (script: string) => Promise<string>
>;
let mockCreateRemindersScript: jest.MockedFunction<(script: string) => string>;
let _mockQuoteAppleScriptString: jest.MockedFunction<(str: string) => string>;
let _mockCreateReminder: jest.MockedFunction<
  (data: unknown) => Promise<unknown>
>;
let _mockUpdateReminder: jest.MockedFunction<
  (data: unknown) => Promise<unknown>
>;
let _mockDeleteReminder: jest.MockedFunction<
  (data: unknown) => Promise<unknown>
>;
let _mockMoveReminder: jest.MockedFunction<(data: unknown) => Promise<unknown>>;
let _mockFindReminders: jest.MockedFunction<
  (filters: unknown) => Promise<unknown[]>
>;
let _mockFindAllLists: jest.MockedFunction<() => Promise<unknown[]>>;
let _mockEnsurePermissions: jest.MockedFunction<() => Promise<void>>;
let mockGenerateDateProperty: jest.MockedFunction<
  (date: unknown, property: string) => string
>;
let mockParseDateWithType: jest.MockedFunction<
  (dateStr: string, type: string) => unknown
>;
let mockParseDate: jest.MockedFunction<(dateStr: string) => unknown>;

// Initialize mocks
const initializeMocks = () => {
  _mockExecuteAppleScript = jest.fn();
  mockCreateRemindersScript = jest.fn((script: string) => script);
  _mockQuoteAppleScriptString = jest.fn(
    (str: string) => `"${str.replace(/"/g, '\\"')}"`,
  );
  _mockCreateReminder = jest.fn();
  _mockUpdateReminder = jest.fn();
  _mockDeleteReminder = jest.fn();
  _mockMoveReminder = jest.fn();
  _mockFindReminders = jest.fn();
  _mockFindAllLists = jest.fn();
  _mockEnsurePermissions = jest.fn();
  mockGenerateDateProperty = jest.fn();
  mockParseDateWithType = jest.fn();
  mockParseDate = jest.fn();
};

// Mock the applescript module to test handlers without actual AppleScript execution
jest.mock('../utils/applescript.js', () => ({
  executeAppleScript: jest.fn(),
  createRemindersScript: jest.fn(),
  quoteAppleScriptString: jest.fn(),
}));

// Mock the new repository module
jest.mock('../utils/reminderRepository.js', () => ({
  reminderRepository: {
    createReminder: jest.fn(),
    updateReminder: jest.fn(),
    deleteReminder: jest.fn(),
    moveReminder: jest.fn(),
    findReminders: jest.fn(),
    findAllLists: jest.fn(),
    createReminderList: jest.fn(),
    listExists: jest.fn(),
  },
}));

// Mock organization strategies
jest.mock('../utils/organizationStrategies.js', () => ({
  ReminderOrganizer: {
    organizeReminders: jest.fn(() => ({ 'Test Category': [] })),
    categorizeByCategory: jest.fn(() => 'Test Category'),
  },
}));

// Mock date utilities
jest.mock('../utils/date.js', () => ({
  parseDate: mockParseDate,
  generateDateProperty: mockGenerateDateProperty,
  parseDateWithType: mockParseDateWithType,
}));

// Mock error handling
jest.mock('../utils/errorHandling.js', () => ({
  ErrorResponseFactory: {
    createError: jest.fn((error) => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message, isError: true }),
        },
      ],
      isError: true,
    })),
    createSuccessResponse: jest.fn((message) => ({
      content: [{ type: 'text', text: message }],
      isError: false,
    })),
  },
  handleAsyncOperation: jest.fn(async (operation) => {
    try {
      const result = await operation();
      return {
        content: [{ type: 'text', text: result }],
        isError: false,
      };
    } catch (_error) {
      return {
        content: [{ type: 'text', text: `Failed: System error occurred` }],
        isError: true,
      };
    }
  }),
  handleJsonAsyncOperation: jest.fn(async (operation) => {
    try {
      const result = await operation();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        isError: false,
      };
    } catch (_error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { error: `Failed: System error occurred`, isError: true },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  }),
}));

// Initialize mocks before tests run
beforeAll(() => {
  initializeMocks();
});

// Setup repository mocks to return successful results by default
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Setup successful repository responses
  (
    reminderRepository.createReminder as jest.MockedFunction<
      (data: CreateReminderData) => Promise<void>
    >
  ).mockImplementation(async (data: CreateReminderData) => {
    // Simulate the AppleScript execution by calling the expected mocks
    (quoteAppleScriptString as jest.MockedFunction<(str: string) => string>)(
      data.title,
    );
    if (data.list)
      (quoteAppleScriptString as jest.MockedFunction<(str: string) => string>)(
        data.list,
      );
    if (data.note)
      (quoteAppleScriptString as jest.MockedFunction<(str: string) => string>)(
        data.note,
      );
    if (data.url)
      (quoteAppleScriptString as jest.MockedFunction<(str: string) => string>)(
        data.url,
      );
    (executeAppleScript as jest.MockedFunction<(script: string) => string>)(
      'mock script',
    );
    return undefined;
  });
  (
    reminderRepository.updateReminder as jest.MockedFunction<
      (data: UpdateReminderData) => Promise<void>
    >
  ).mockResolvedValue(undefined);
  (
    reminderRepository.deleteReminder as jest.MockedFunction<
      (title: string, listName?: string) => Promise<void>
    >
  ).mockResolvedValue(undefined);
  (
    reminderRepository.moveReminder as jest.MockedFunction<
      (data: MoveReminderData) => Promise<void>
    >
  ).mockResolvedValue(undefined);
  (
    reminderRepository.findReminders as jest.MockedFunction<
      (filters?: ReminderFilters) => Promise<Reminder[]>
    >
  ).mockResolvedValue([]);
  (
    reminderRepository.findAllLists as jest.MockedFunction<
      () => Promise<ReminderList[]>
    >
  ).mockResolvedValue([]);

  // Setup date mocks
  (
    parseDate as jest.MockedFunction<(dateStr: string) => string>
  ).mockImplementation((dateStr: string) => `${dateStr} parsed`);
  (
    generateDateProperty as jest.MockedFunction<
      (dateStr: string, quoteFn: (str: string) => string) => string
    >
  ).mockReturnValue(':due date(date "string")');
  (
    parseDateWithType as jest.MockedFunction<(dateStr: string) => ParsedDate>
  ).mockReturnValue({ formatted: 'parsed date', isDateOnly: false });
});

// Mock constants
jest.mock('../utils/constants.js', () => ({
  MESSAGES: {
    SUCCESS: {
      REMINDER_CREATED: (title: string, hasNotes: boolean) =>
        `Successfully created reminder: ${title}${hasNotes ? ' with notes' : ''}`,
      REMINDER_UPDATED: (title: string) =>
        `Successfully updated reminder "${title}"`,
      REMINDER_DELETED: (title: string) =>
        `Successfully deleted reminder: ${title}`,
      REMINDER_MOVED: (title: string, from: string, to: string) =>
        `Successfully moved reminder "${title}" from ${from} to ${to}`,
      LIST_CREATED: (name: string) =>
        `Successfully created reminder list: ${name}`,
    },
    ERROR: {
      INPUT_VALIDATION_FAILED: (details: string) =>
        `Input validation failed: ${details}`,
      SYSTEM_ERROR: (operation: string) =>
        `Failed to ${operation}: System error occurred`,
    },
  },
  JSON_FORMATTING: {
    INDENT_SPACES: 2,
  },
}));

// Mock date filtering utilities
jest.mock('../utils/dateFiltering.js', () => ({
  applyReminderFilters: jest.fn((reminders, _filters) => reminders),
}));

// Mock the date parser
jest.mock('../utils/date.js', () => ({
  parseDate: jest.fn((dateStr: string) => `${dateStr} parsed`),
  isDateOnlyFormat: jest.fn((dateStr: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim()),
  ),
  parseDateWithType: jest.fn((dateStr: string) => ({
    formatted: `${dateStr} parsed`,
    isDateOnly: /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim()),
  })),
  generateDateProperty: jest.fn(
    (dateStr: string, quoteFn: (str: string) => string) => {
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
      const dateType = isDateOnly ? 'allday due date' : 'due date';
      return `, ${dateType}:date ${quoteFn(`${dateStr} parsed`)}`;
    },
  ),
}));

// Mock the logger to suppress debug output in tests
jest.mock('../utils/logger.js', () => ({
  debugLog: jest.fn(),
  logError: jest.fn(),
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// Repository mocks are handled in the mock setup above

// Import the mocked functions after mocks are set up
import {
  executeAppleScript,
  quoteAppleScriptString,
} from '../utils/applescript.js';
import {
  generateDateProperty,
  parseDate,
  parseDateWithType,
} from '../utils/date.js';
import { reminderRepository } from '../utils/reminderRepository.js';
import { handleCreateReminder } from './handlers.js';

// Use the mocks defined earlier

describe('handleListReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to validate JSON response format
  const validateJsonResponse = (result: CallToolResult) => {
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    // Verify it's valid JSON
    expect(() =>
      JSON.parse((result.content[0] as { text: string }).text),
    ).not.toThrow();
  };

  test('should return valid JSON when listing reminders', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Test Reminder 1',
        list: 'Default',
        isCompleted: false,
      },
    ];

    // Mock the repository method instead
    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockResolvedValue(mockReminders);

    const result = await handleListReminders({ action: 'list' });

    // Verify JSON structure
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    // Verify JSON schema
    expect(parsedJson).toEqual(
      expect.objectContaining({
        reminders: expect.any(Array),
        total: expect.any(Number),
        filter: expect.objectContaining({
          showCompleted: expect.any(Boolean),
          search: expect.any(Object), // can be null
          dueWithin: expect.any(Object), // can be null
        }),
      }),
    );
  });

  test('should use default list "Reminders" when only action is provided', async () => {
    const allReminders: Reminder[] = [
      {
        title: 'Default List Task',
        list: 'Reminders',
        isCompleted: false,
      },
      {
        title: 'Other List Task',
        list: 'Work',
        isCompleted: false,
      },
    ];

    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockImplementation(async (filters) => {
      // If no list filter or no filters at all, return all reminders for list discovery
      if (!filters || !filters.list) {
        return allReminders;
      }
      // If specific list filter, return only reminders from that list
      return allReminders.filter(r => r.list === filters.list);
    });

    const result = await handleListReminders({ action: 'list' });

    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0]).toEqual({
      title: 'Default List Task',
      list: 'Reminders',
      isCompleted: false,
      dueDate: null,
      notes: null,
      url: null,
    });
    expect(parsedJson.filter.list).toBe('Reminders');
    expect(parsedJson.filter.showCompleted).toBe(false);
  });

  test('should intelligently choose first available list when "Reminders" not found', async () => {
    const allReminders: Reminder[] = [
      {
        title: 'Work Task',
        list: 'Work',
        isCompleted: false,
      },
      {
        title: 'Personal Task',
        list: 'Personal',
        isCompleted: false,
      },
    ];

    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockImplementation(async (filters) => {
      // If no list filter or no filters at all, return all reminders for list discovery
      if (!filters || !filters.list) {
        return allReminders;
      }
      // If specific list filter, return only reminders from that list
      return allReminders.filter(r => r.list === filters.list);
    });

    const result = await handleListReminders({ action: 'list' });

    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0].list).toBe('Work'); // First available list
    expect(parsedJson.filter.list).toBe('Work');
  });

  test('should use Chinese default list name when available', async () => {
    const allReminders: Reminder[] = [
      {
        title: 'Chinese Task',
        list: '提醒事项',
        isCompleted: false,
      },
      {
        title: 'Other Task',
        list: 'Work',
        isCompleted: false,
      },
    ];

    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockImplementation(async (filters) => {
      // If no list filter or no filters at all, return all reminders for list discovery
      if (!filters || !filters.list) {
        return allReminders;
      }
      // If specific list filter, return only reminders from that list
      return allReminders.filter(r => r.list === filters.list);
    });

    const result = await handleListReminders({ action: 'list' });

    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0].list).toBe('提醒事项');
    expect(parsedJson.filter.list).toBe('提醒事项');
  });

  test('should return valid JSON with filtered reminders', async () => {
    const allReminders: Reminder[] = [
      {
        title: 'Test Reminder 1',
        list: 'Default',
        isCompleted: false,
      },
      {
        title: 'Test Reminder 2',
        list: 'Work',
        isCompleted: true,
      },
    ];

    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockImplementation(async (filters) => {
      let filtered = allReminders;
      
      // Filter by completion status
      if (filters?.showCompleted !== undefined) {
        filtered = filtered.filter(r => filters.showCompleted || !r.isCompleted);
      }
      
      // If no list filter, return all for list discovery
      if (!filters || !filters.list) {
        return filtered;
      }
      
      // Filter by list
      return filtered.filter(r => r.list === filters.list);
    });

    const result = await handleListReminders({
      action: 'list',
      showCompleted: false,
    });

    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0]).toEqual({
      title: 'Test Reminder 1',
      list: 'Default',
      isCompleted: false,
      dueDate: null,
      notes: null,
      url: null
    });
  });

  test('should return valid JSON with error when operation fails', async () => {
    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockRejectedValue(new Error('Test error'));

    const result = await handleListReminders({ action: 'list' });

    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    // When the operation fails, it should return an error response
    expect(parsedJson).toEqual(
      expect.objectContaining({
        error: expect.any(String),
        isError: true,
      }),
    );
  });

  test('should return valid JSON with all reminder fields', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Complete Task',
        list: 'Work',
        isCompleted: true,
        dueDate: '2024-03-12 10:00:00',
        notes: 'Test notes',
      },
    ];

    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockResolvedValue(mockReminders);

    const result = await handleListReminders({
      action: 'list',
      showCompleted: true,
    });

    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    expect(parsedJson.reminders[0]).toEqual({
      title: 'Complete Task',
      list: 'Work',
      isCompleted: true,
      dueDate: '2024-03-12 10:00:00',
      notes: 'Test notes',
      url: null
    });
  });

  test('should return valid JSON with list filtering', async () => {
    const allReminders: Reminder[] = [
      {
        title: 'Work Task',
        list: 'Work',
        isCompleted: false,
      },
      {
        title: 'Personal Task',
        list: 'Personal',
        isCompleted: false,
      },
    ];

    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockImplementation(async (filters) => {
      // If no list filter, return all for list discovery
      if (!filters || !filters.list) {
        return allReminders;
      }
      // Filter by list
      return allReminders.filter(r => r.list === filters.list);
    });

    const result = await handleListReminders({ action: 'list', filterList: 'Work' });

    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.filter.list).toBe('Work');
    expect(parsedJson.reminders[0].title).toBe('Work Task');
  });

  test('should filter reminders by search term', async () => {
    const allReminders: Reminder[] = [
      {
        title: 'Meeting with client',
        list: 'Work',
        isCompleted: false,
        notes: 'Discuss project timeline',
      },
      {
        title: 'Buy groceries',
        list: 'Personal',
        isCompleted: false,
        notes: 'Get milk and eggs',
      },
      {
        title: 'Team meeting',
        list: 'Work',
        isCompleted: false,
      },
    ];

    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockImplementation(async (filters) => {
      let filtered = allReminders;
      
      // Apply search filter first
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(r => 
          r.title.toLowerCase().includes(searchLower) ||
          r.notes?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply list filter if specified
      if (filters?.list) {
        filtered = filtered.filter(r => r.list === filters.list);
      }
      
      return filtered;
    });

    const result = await handleListReminders({
      action: 'list',
      search: 'meeting',
    });

    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    expect(parsedJson.reminders).toHaveLength(2);
    expect(parsedJson.filter.search).toBe('meeting');
  });

  test('should filter reminders by due date', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mockReminders: Reminder[] = [
      {
        title: 'Due Today',
        list: 'Work',
        isCompleted: false,
        dueDate: today.toISOString(),
      },
      {
        title: 'Due Tomorrow',
        list: 'Work',
        isCompleted: false,
        dueDate: tomorrow.toISOString(),
      },
      {
        title: 'Overdue',
        list: 'Work',
        isCompleted: false,
        dueDate: yesterday.toISOString(),
      },
      {
        title: 'No Due Date',
        list: 'Work',
        isCompleted: false,
      },
    ];

    (
      reminderRepository.findReminders as jest.MockedFunction<
        (filters?: ReminderFilters) => Promise<Reminder[]>
      >
    ).mockResolvedValue(mockReminders);

    const result = await handleListReminders({
      action: 'list',
      dueWithin: 'today',
    });

    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);

    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0].title).toBe('Due Today');
    expect(parsedJson.filter.dueWithin).toBe('today');
  });
});

describe('handleCreateReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mockReturnValue('');
    mockCreateRemindersScript.mockImplementation((script: string) => script);
    (
      quoteAppleScriptString as jest.MockedFunction<(str: string) => string>
    ).mockImplementation((str: string) => `"${str.replace(/"/g, '\\"')}"`);
    mockParseDate.mockImplementation((dateStr: string) => `${dateStr} parsed`);
  });

  test('should create reminder with title only', async () => {
    const args = { action: 'create' as const, title: 'Test Reminder' };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully created reminder: Test Reminder',
    );
    expect(executeAppleScript).toHaveBeenCalled();
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Test Reminder');
  });

  test('should create reminder with title and due date', async () => {
    const args = {
      action: 'create' as const,
      title: 'Meeting Tomorrow',
      dueDate: '2024-03-15 10:00:00',
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully created reminder: Meeting Tomorrow',
    );
    expect(generateDateProperty).toHaveBeenCalledWith(
      '2024-03-15 10:00:00',
      expect.any(Function),
    );
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should create reminder with title, note, and list', async () => {
    const args = {
      action: 'create' as const,
      title: 'Buy Groceries',
      note: 'Milk, eggs, bread',
      list: 'Shopping',
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully created reminder: Buy Groceries with notes',
    );
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Buy Groceries');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Milk, eggs, bread');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Shopping');
  });

  test('should create reminder with URL attachment', async () => {
    const args = {
      action: 'create' as const,
      title: 'Review Document',
      url: 'https://example.com/document',
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully created reminder: Review Document with notes',
    );
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should create reminder with note and URL combined', async () => {
    const args = {
      action: 'create' as const,
      title: 'Check Website',
      note: 'Important update',
      url: 'https://example.com',
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully created reminder: Check Website with notes',
    );
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should handle AppleScript execution error', async () => {
    const args = { action: 'create' as const, title: 'Test Reminder' };
    (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mockImplementation(() => {
      throw new Error('AppleScript failed');
    });

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'Failed to create reminder: System error occurred',
    );
  });

  test('should handle special characters in title safely', async () => {
    const args = {
      action: 'create' as const,
      title: 'Test "quotes" and \'apostrophes\'',
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(quoteAppleScriptString).toHaveBeenCalledWith(
      'Test "quotes" and \'apostrophes\'',
    );
  });

  test('should create reminder with date-only format using allday due date', async () => {
    const args = {
      action: 'create' as const,
      title: 'Important Meeting',
      dueDate: '2024-12-25',
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully created reminder: Important Meeting',
    );
    expect(generateDateProperty).toHaveBeenCalledWith(
      '2024-12-25',
      expect.any(Function),
    );

    // Verify the generated script contains allday due date for date-only format
    const generatedScript = mockCreateRemindersScript.mock.calls[0][0];
    expect(generatedScript).toContain('allday due date');
    expect(generatedScript).not.toContain(', due date');
  });

  test('should create reminder with datetime format using regular due date', async () => {
    const args = {
      action: 'create' as const,
      title: 'Appointment',
      dueDate: '2024-12-25 14:30:00',
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully created reminder: Appointment',
    );
    expect(generateDateProperty).toHaveBeenCalledWith(
      '2024-12-25 14:30:00',
      expect.any(Function),
    );

    // Verify the generated script contains regular due date for datetime format
    const generatedScript = mockCreateRemindersScript.mock.calls[0][0];
    expect(generatedScript).toContain(', due date');
    expect(generatedScript).not.toContain('allday due date');
  });
});

describe('handleUpdateReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mockReturnValue('');
  });

  test('should update reminder title', async () => {
    const args = {
      action: 'update' as const,
      title: 'Old Title',
      newTitle: 'New Title',
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully updated reminder "Old Title": title to "New Title"',
    );
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should update reminder due date', async () => {
    const args = {
      action: 'update' as const,
      title: 'Meeting',
      dueDate: '2024-03-20 14:00:00',
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully updated reminder "Meeting": due date',
    );
    expect(parseDateWithType).toHaveBeenCalledWith('2024-03-20 14:00:00');
  });

  test('should update reminder completion status', async () => {
    const args = {
      action: 'update' as const,
      title: 'Task',
      completed: true,
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully updated reminder "Task": completed to true',
    );
  });

  test('should update reminder with list specification', async () => {
    const args = {
      action: 'update' as const,
      title: 'Work Task',
      list: 'Work',
      note: 'Updated note',
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully updated reminder "Work Task": notes',
    );
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Work');
  });

  test('should handle update error when reminder not found', async () => {
    const args = { action: 'update' as const, title: 'Nonexistent' };
    (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mockImplementation(() => {
      throw new Error('Reminder not found: Nonexistent');
    });

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'Failed to update reminder: System error occurred',
    );
  });

  test('should update reminder with URL', async () => {
    const args = {
      action: 'update' as const,
      title: 'Research Task',
      url: 'https://research.example.com',
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully updated reminder "Research Task": notes',
    );
  });

  test('should update reminder with empty note and URL without leading newlines', async () => {
    const args = {
      action: 'update' as const,
      title: 'Test Task',
      note: '', // Empty string
      url: 'https://example.com',
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully updated reminder "Test Task": notes',
    );

    // Verify that mockExecuteAppleScript was called with the correct script
    expect(executeAppleScript).toHaveBeenCalled();
    const calledScript = (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mock.calls[0][0];

    // The script should contain "URL: https://example.com" without leading newlines
    expect(calledScript).toContain('"URL: https://example.com"');
    expect(calledScript).not.toContain('"\n\nURL: https://example.com"');
  });

  test('should update reminder with date-only format using allday due date', async () => {
    const args = {
      action: 'update' as const,
      title: 'Existing Task',
      dueDate: '2024-12-25',
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully updated reminder "Existing Task": due date',
    );
    expect(parseDateWithType).toHaveBeenCalledWith('2024-12-25');

    // Verify the generated script contains allday due date for date-only format
    const generatedScript = (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mock.calls[0][0];
    expect(generatedScript).toContain('set allday due date');
    expect(generatedScript).not.toContain('set due date');
  });

  test('should update reminder with datetime format using regular due date', async () => {
    const args = {
      action: 'update' as const,
      title: 'Scheduled Task',
      dueDate: '2024-12-25 14:30:00',
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain(
      'Successfully updated reminder "Scheduled Task": due date',
    );
    expect(parseDateWithType).toHaveBeenCalledWith('2024-12-25 14:30:00');

    // Verify the generated script contains regular due date for datetime format
    const generatedScript = (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mock.calls[0][0];
    expect(generatedScript).toContain('set due date');
    expect(generatedScript).not.toContain('set allday due date');
  });
});

describe('handleDeleteReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mockReturnValue('');
  });

  test('should delete reminder by title', async () => {
    const args = { action: 'delete' as const, title: 'Delete Me' };

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(
      'Successfully deleted reminder: Delete Me',
    );
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should delete reminder from specific list', async () => {
    const args = {
      action: 'delete' as const,
      title: 'Task to Delete',
      list: 'Work',
    };

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(
      'Successfully deleted reminder: Task to Delete',
    );
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Work');
  });

  test('should handle delete error when reminder not found', async () => {
    const args = { action: 'delete' as const, title: 'Nonexistent' };
    (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mockImplementation(() => {
      throw new Error('Reminder not found: Nonexistent');
    });

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'Failed to delete reminder: System error occurred',
    );
  });

  test('should handle special characters in title safely', async () => {
    const args = { action: 'delete' as const, title: 'Delete "this" reminder' };

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(false);
    expect(quoteAppleScriptString).toHaveBeenCalledWith(
      'Delete "this" reminder',
    );
  });
});

describe('handleMoveReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mockReturnValue('');
  });

  test('should move reminder between lists', async () => {
    const args = {
      action: 'move' as const,
      title: 'Move Me',
      fromList: 'Personal',
      toList: 'Work',
    };

    const result = await handleMoveReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe(
      'Successfully moved reminder "Move Me" from Personal to Work',
    );
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Personal');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Work');
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should handle move error when source list not found', async () => {
    const args = {
      action: 'move' as const,
      title: 'Task',
      fromList: 'Nonexistent',
      toList: 'Work',
    };
    (
      executeAppleScript as jest.MockedFunction<(script: string) => string>
    ).mockImplementation(() => {
      throw new Error('Reminder not found in list Nonexistent: Task');
    });

    const result = await handleMoveReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'Failed to move reminder: System error occurred',
    );
  });

  test('should handle special characters in list names', async () => {
    const args = {
      action: 'move' as const,
      title: 'Task',
      fromList: 'List "A"',
      toList: 'List "B"',
    };

    const result = await handleMoveReminder(args);

    expect(result.isError).toBe(false);
    expect(quoteAppleScriptString).toHaveBeenCalledWith('List "A"');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('List "B"');
  });
});
