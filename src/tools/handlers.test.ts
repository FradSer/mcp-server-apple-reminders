import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { Reminder, ReminderList } from '../types/index.js';
import { remindersManager } from '../utils/reminders.js';
import { 
  handleListReminders,
  handleUpdateReminder,
  handleDeleteReminder,
  handleMoveReminder 
} from './handlers.js';

// Mock the reminders module to avoid import.meta issues
jest.mock('../utils/reminders.js');

// Mock the applescript module to test handlers without actual AppleScript execution
jest.mock('../utils/applescript.js', () => ({
  executeAppleScript: jest.fn(),
  createRemindersScript: jest.fn((script: string) => script),
  quoteAppleScriptString: jest.fn((str: string) => `"${str.replace(/"/g, '\\"')}"`)
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
    listExists: jest.fn()
  }
}));

// Mock organization strategies
jest.mock('../utils/organizationStrategies.js', () => ({
  OrganizationStrategyFactory: {
    createStrategy: jest.fn(() => ({
      getStrategyName: () => 'test',
      categorizeReminder: () => 'Test Category'
    }))
  },
  ReminderOrganizationService: jest.fn().mockImplementation(() => ({
    organizeReminders: jest.fn(() => ({ 'Test Category': [] })),
    getStrategyName: jest.fn(() => 'test')
  }))
}));

// Mock permissions module
jest.mock('../utils/permissions.js', () => ({
  ensurePermissions: jest.fn()
}));

// Mock error handling utilities
jest.mock('../utils/errorHandling.js', () => ({
  ErrorResponseFactory: {
    createSuccessResponse: jest.fn((message) => ({
      content: [{ type: "text", text: message }],
      isError: false
    })),
    createErrorResponse: jest.fn((operation, error) => ({
      content: [{ type: "text", text: `Failed to ${operation}` }],
      isError: true
    })),
    createJsonSuccessResponse: jest.fn((data) => ({
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      isError: false
    })),
    createJsonErrorResponse: jest.fn((operation, error) => ({
      content: [{ type: "text", text: JSON.stringify({ error: `Failed to ${operation}`, isError: true }, null, 2) }],
      isError: true
    }))
  },
  handleAsyncOperation: jest.fn(async (...args: any[]) => {
    const [operation, operationName, responseFactory] = args;
    try {
      const result = await operation();
      return responseFactory ? responseFactory(result) : { content: [{ type: "text", text: String(result) }], isError: false };
    } catch (error) {
      return { content: [{ type: "text", text: `Failed to ${operationName}` }], isError: true };
    }
  }),
  handleJsonAsyncOperation: jest.fn(async (...args: any[]) => {
    const [operation, operationName] = args;
    try {
      const result = await operation();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], isError: false };
    } catch (error) {
      return { content: [{ type: "text", text: JSON.stringify({ error: `Failed to ${operationName}`, isError: true }, null, 2) }], isError: true };
    }
  })
}));

// Mock constants
jest.mock('../utils/constants.js', () => ({
  MESSAGES: {
    SUCCESS: {
      REMINDER_CREATED: (title: string, hasNotes: boolean) => `Created ${title}${hasNotes ? ' with notes' : ''}`,
      REMINDER_UPDATED: (title: string) => `Updated ${title}`,
      REMINDER_DELETED: (title: string) => `Deleted ${title}`,
      REMINDER_MOVED: (title: string, from: string, to: string) => `Moved ${title} from ${from} to ${to}`,
      LIST_CREATED: (name: string) => `Created list ${name}`
    }
  },
  JSON_FORMATTING: {
    INDENT_SPACES: 2
  }
}));

// Mock date filtering utilities
jest.mock('../utils/dateFiltering.js', () => ({
  applyReminderFilters: jest.fn((reminders, filters) => reminders)
}));

// Mock the date parser
jest.mock('../utils/date.js', () => ({
  parseDate: jest.fn((dateStr: string) => `${dateStr} parsed`),
  isDateOnlyFormat: jest.fn((dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())),
  parseDateWithType: jest.fn((dateStr: string) => ({
    formatted: `${dateStr} parsed`,
    isDateOnly: /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())
  })),
  generateDateProperty: jest.fn((dateStr: string, quoteFn: Function) => {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
    const dateType = isDateOnly ? 'allday due date' : 'due date';
    return `, ${dateType}:date ${quoteFn(`${dateStr} parsed`)}`;
  })
}));

// Mock the logger to suppress debug output in tests
jest.mock('../utils/logger.js', () => ({
  debugLog: jest.fn(),
  logError: jest.fn(),
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the reminders manager with correct return type
const mockGetReminders = jest.fn(async (showCompleted: boolean = false) => ({
  reminders: [] as Reminder[],
  lists: [] as ReminderList[]
}));
remindersManager.getReminders = mockGetReminders as unknown as typeof remindersManager.getReminders;

describe('handleListReminders', () => {
  beforeEach(() => {
    mockGetReminders.mockClear();
  });

  // Helper function to validate JSON response format
  const validateJsonResponse = (result: any) => {
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    // Verify it's valid JSON
    expect(() => JSON.parse(result.content[0].text)).not.toThrow();
  };

  test('should return valid JSON when listing reminders', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Test Reminder 1',
        list: 'Default',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({});
    
    // Verify JSON structure
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    // Verify JSON schema
    expect(parsedJson).toEqual(expect.objectContaining({
      reminders: expect.any(Array),
      total: expect.any(Number),
      filter: expect.objectContaining({
        list: expect.any(String),
        showCompleted: expect.any(Boolean)
      })
    }));
  });

  test('should use default list "Reminders" when only action is provided', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Default List Task',
        list: 'Reminders',
        isCompleted: false
      },
      {
        title: 'Other List Task',
        list: 'Work',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({});
    
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
    const mockReminders: Reminder[] = [
      {
        title: 'Work Task',
        list: 'Work',
        isCompleted: false
      },
      {
        title: 'Personal Task',
        list: 'Personal',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({});
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0].list).toBe('Work'); // First available list
    expect(parsedJson.filter.list).toBe('Work');
  });

  test('should use Chinese default list name when available', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Chinese Task',
        list: '提醒事项',
        isCompleted: false
      },
      {
        title: 'Other Task',
        list: 'Work',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({});
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0].list).toBe('提醒事项');
    expect(parsedJson.filter.list).toBe('提醒事项');
  });

  test('should return valid JSON with filtered reminders', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Test Reminder 1',
        list: 'Default',
        isCompleted: false
      },
      {
        title: 'Test Reminder 2',
        list: 'Work',
        isCompleted: true
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ showCompleted: false });
    
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
    mockGetReminders.mockRejectedValue(new Error('Test error'));

    const result = await handleListReminders({});
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson).toEqual(expect.objectContaining({
      error: expect.any(String),
      isError: true
    }));
  });

  test('should return valid JSON with all reminder fields', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Complete Task',
        list: 'Work',
        isCompleted: true,
        dueDate: '2024-03-12 10:00:00',
        notes: 'Test notes'
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ showCompleted: true });
    
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
    const mockReminders: Reminder[] = [
      {
        title: 'Work Task',
        list: 'Work',
        isCompleted: false
      },
      {
        title: 'Personal Task',
        list: 'Personal',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ list: 'Work' });
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.filter.list).toBe('Work');
    expect(parsedJson.reminders[0].title).toBe('Work Task');
  });

  test('should filter reminders by search term', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Meeting with client',
        list: 'Work',
        isCompleted: false,
        notes: 'Discuss project timeline'
      },
      {
        title: 'Buy groceries',
        list: 'Personal',
        isCompleted: false,
        notes: 'Get milk and eggs'
      },
      {
        title: 'Team meeting',
        list: 'Work',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ search: 'meeting' });
    
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
        dueDate: today.toISOString()
      },
      {
        title: 'Due Tomorrow',
        list: 'Work',
        isCompleted: false,
        dueDate: tomorrow.toISOString()
      },
      {
        title: 'Overdue',
        list: 'Work',
        isCompleted: false,
        dueDate: yesterday.toISOString()
      },
      {
        title: 'No Due Date',
        list: 'Work',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ dueWithin: 'today' });
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0].title).toBe('Due Today');
    expect(parsedJson.filter.dueWithin).toBe('today');
  });
});

// Import mocked functions
import { executeAppleScript, createRemindersScript, quoteAppleScriptString } from '../utils/applescript.js';
import { parseDate, parseDateWithType, generateDateProperty } from '../utils/date.js';
import { handleCreateReminder } from './handlers.js';

const mockExecuteAppleScript = executeAppleScript as jest.MockedFunction<typeof executeAppleScript>;
const mockCreateRemindersScript = createRemindersScript as jest.MockedFunction<typeof createRemindersScript>;
const mockQuoteAppleScriptString = quoteAppleScriptString as jest.MockedFunction<typeof quoteAppleScriptString>;
const mockParseDate = parseDate as jest.MockedFunction<typeof parseDate>;
const mockParseDateWithType = parseDateWithType as jest.MockedFunction<typeof parseDateWithType>;
const mockGenerateDateProperty = generateDateProperty as jest.MockedFunction<typeof generateDateProperty>;

describe('handleCreateReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteAppleScript.mockReturnValue('');
    mockCreateRemindersScript.mockImplementation((script: string) => script);
    mockQuoteAppleScriptString.mockImplementation((str: string) => `"${str.replace(/"/g, '\\"')}"`);
    mockParseDate.mockImplementation((dateStr: string) => `${dateStr} parsed`);
  });

  test('should create reminder with title only', async () => {
    const args = { title: 'Test Reminder' };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Test Reminder');
    expect(mockExecuteAppleScript).toHaveBeenCalled();
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Test Reminder');
  });

  test('should create reminder with title and due date', async () => {
    const args = { 
      title: 'Meeting Tomorrow', 
      dueDate: '2024-03-15 10:00:00' 
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Meeting Tomorrow');
    expect(mockGenerateDateProperty).toHaveBeenCalledWith('2024-03-15 10:00:00', expect.any(Function));
    expect(mockExecuteAppleScript).toHaveBeenCalled();
  });

  test('should create reminder with title, note, and list', async () => {
    const args = { 
      title: 'Buy Groceries', 
      note: 'Milk, eggs, bread',
      list: 'Shopping'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Buy Groceries with notes');
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Buy Groceries');
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Milk, eggs, bread');
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Shopping');
  });

  test('should create reminder with URL attachment', async () => {
    const args = { 
      title: 'Review Document', 
      url: 'https://example.com/document'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Review Document with notes');
    expect(mockExecuteAppleScript).toHaveBeenCalled();
  });

  test('should create reminder with note and URL combined', async () => {
    const args = { 
      title: 'Check Website', 
      note: 'Important update',
      url: 'https://example.com'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Check Website with notes');
    expect(mockExecuteAppleScript).toHaveBeenCalled();
  });

  test('should handle AppleScript execution error', async () => {
    const args = { title: 'Test Reminder' };
    mockExecuteAppleScript.mockImplementation(() => {
      throw new Error('AppleScript failed');
    });

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create reminder: System error occurred');
  });

  test('should handle special characters in title safely', async () => {
    const args = { title: 'Test "quotes" and \'apostrophes\'' };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Test "quotes" and \'apostrophes\'');
  });

  test('should create reminder with date-only format using allday due date', async () => {
    const args = { 
      title: 'Important Meeting', 
      dueDate: '2024-12-25'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Important Meeting');
    expect(mockGenerateDateProperty).toHaveBeenCalledWith('2024-12-25', expect.any(Function));
    
    // Verify the generated script contains allday due date for date-only format
    const generatedScript = mockCreateRemindersScript.mock.calls[0][0];
    expect(generatedScript).toContain('allday due date');
    expect(generatedScript).not.toContain(', due date');
  });

  test('should create reminder with datetime format using regular due date', async () => {
    const args = { 
      title: 'Appointment', 
      dueDate: '2024-12-25 14:30:00'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Appointment');
    expect(mockGenerateDateProperty).toHaveBeenCalledWith('2024-12-25 14:30:00', expect.any(Function));
    
    // Verify the generated script contains regular due date for datetime format
    const generatedScript = mockCreateRemindersScript.mock.calls[0][0];
    expect(generatedScript).toContain(', due date');
    expect(generatedScript).not.toContain('allday due date');
  });
});

describe('handleUpdateReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteAppleScript.mockReturnValue('');
  });

  test('should update reminder title', async () => {
    const args = { 
      title: 'Old Title',
      newTitle: 'New Title'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Old Title": title to "New Title"');
    expect(mockExecuteAppleScript).toHaveBeenCalled();
  });

  test('should update reminder due date', async () => {
    const args = { 
      title: 'Meeting',
      dueDate: '2024-03-20 14:00:00'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Meeting": due date');
    expect(mockParseDateWithType).toHaveBeenCalledWith('2024-03-20 14:00:00');
  });

  test('should update reminder completion status', async () => {
    const args = { 
      title: 'Task',
      completed: true
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Task": completed to true');
  });

  test('should update reminder with list specification', async () => {
    const args = { 
      title: 'Work Task',
      list: 'Work',
      note: 'Updated note'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Work Task": notes');
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Work');
  });

  test('should handle update error when reminder not found', async () => {
    const args = { title: 'Nonexistent' };
    mockExecuteAppleScript.mockImplementation(() => {
      throw new Error('Reminder not found: Nonexistent');
    });

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to update reminder: System error occurred');
  });

  test('should update reminder with URL', async () => {
    const args = { 
      title: 'Research Task',
      url: 'https://research.example.com'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Research Task": notes');
  });

  test('should update reminder with empty note and URL without leading newlines', async () => {
    const args = { 
      title: 'Test Task',
      note: '',  // Empty string
      url: 'https://example.com'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Test Task": notes');
    
    // Verify that mockExecuteAppleScript was called with the correct script
    expect(mockExecuteAppleScript).toHaveBeenCalled();
    const calledScript = mockExecuteAppleScript.mock.calls[0][0];
    
    // The script should contain "URL: https://example.com" without leading newlines
    expect(calledScript).toContain('"URL: https://example.com"');
    expect(calledScript).not.toContain('"\n\nURL: https://example.com"');
  });

  test('should update reminder with date-only format using allday due date', async () => {
    const args = { 
      title: 'Existing Task', 
      dueDate: '2024-12-25'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Existing Task": due date');
    expect(mockParseDateWithType).toHaveBeenCalledWith('2024-12-25');
    
    // Verify the generated script contains allday due date for date-only format
    const generatedScript = mockExecuteAppleScript.mock.calls[0][0];
    expect(generatedScript).toContain('set allday due date');
    expect(generatedScript).not.toContain('set due date');
  });

  test('should update reminder with datetime format using regular due date', async () => {
    const args = { 
      title: 'Scheduled Task', 
      dueDate: '2024-12-25 14:30:00'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Scheduled Task": due date');
    expect(mockParseDateWithType).toHaveBeenCalledWith('2024-12-25 14:30:00');
    
    // Verify the generated script contains regular due date for datetime format
    const generatedScript = mockExecuteAppleScript.mock.calls[0][0];
    expect(generatedScript).toContain('set due date');
    expect(generatedScript).not.toContain('set allday due date');
  });
});

describe('handleDeleteReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteAppleScript.mockReturnValue('');
  });

  test('should delete reminder by title', async () => {
    const args = { title: 'Delete Me' };

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('Successfully deleted reminder: Delete Me');
    expect(mockExecuteAppleScript).toHaveBeenCalled();
  });

  test('should delete reminder from specific list', async () => {
    const args = { 
      title: 'Task to Delete',
      list: 'Work'
    };

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('Successfully deleted reminder: Task to Delete');
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Work');
  });

  test('should handle delete error when reminder not found', async () => {
    const args = { title: 'Nonexistent' };
    mockExecuteAppleScript.mockImplementation(() => {
      throw new Error('Reminder not found: Nonexistent');
    });

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to delete reminder: System error occurred');
  });

  test('should handle special characters in title safely', async () => {
    const args = { title: 'Delete "this" reminder' };

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(false);
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Delete "this" reminder');
  });
});

describe('handleMoveReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteAppleScript.mockReturnValue('');
  });

  test('should move reminder between lists', async () => {
    const args = { 
      title: 'Move Me',
      fromList: 'Personal',
      toList: 'Work'
    };

    const result = await handleMoveReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('Successfully moved reminder "Move Me" from Personal to Work');
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Personal');
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('Work');
    expect(mockExecuteAppleScript).toHaveBeenCalled();
  });

  test('should handle move error when source list not found', async () => {
    const args = { 
      title: 'Task',
      fromList: 'Nonexistent',
      toList: 'Work'
    };
    mockExecuteAppleScript.mockImplementation(() => {
      throw new Error('Reminder not found in list Nonexistent: Task');
    });

    const result = await handleMoveReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to move reminder: System error occurred');
  });

  test('should handle special characters in list names', async () => {
    const args = { 
      title: 'Task',
      fromList: 'List "A"',
      toList: 'List "B"'
    };

    const result = await handleMoveReminder(args);

    expect(result.isError).toBe(false);
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('List "A"');
    expect(mockQuoteAppleScriptString).toHaveBeenCalledWith('List "B"');
  });
});