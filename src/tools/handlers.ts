/**
 * tools/handlers.ts
 * Implementation of tool handlers for Apple Reminders operations
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createRemindersScript, executeAppleScript, quoteAppleScriptString } from "../utils/applescript.js";
import { generateDateProperty, parseDateWithType, parseDate } from "../utils/date.js";
import { debugLog } from "../utils/logger.js";
import { remindersManager } from "../utils/reminders.js";
import { 
  validateInput, 
  ValidationError,
  CreateReminderSchema,
  ListRemindersSchema,
  UpdateReminderSchema,
  DeleteReminderSchema,
  MoveReminderSchema,
  ListReminderListsSchema,
  CreateReminderListSchema
} from "../validation/schemas.js";

/**
 * Utility class for handling note and URL combinations
 */
class NoteHandler {
  /**
   * Combines note and URL into a single note string
   */
  static combine(note?: string, url?: string): string {
    if (!note && !url) return "";
    if (!note) return url!;
    if (!url) return note;
    return `${note}\n\n${url}`;
  }

  /**
   * Determines update strategy for notes
   */
  static getUpdateStrategy(note?: string, url?: string) {
    if (!url && note === undefined) {
      return { shouldReplace: false, shouldAppendUrl: false };
    }
    
    if (note !== undefined) {
      return { 
        shouldReplace: true, 
        shouldAppendUrl: false, 
        finalNote: this.combine(note, url) 
      };
    }
    
    return { shouldReplace: false, shouldAppendUrl: true };
  }
}

/**
 * Creates a new reminder
 * @param args - Arguments for creating a reminder
 * @returns Result of the operation
 */

export async function handleCreateReminder(args: any): Promise<CallToolResult> {
  try {
    // Validate input for security
    // Support unified 'reminders' tool: ignore non-create fields like action
    const { action: _ignored, ...rest } = args ?? {};
    const validatedArgs = validateInput(CreateReminderSchema, rest);
    // Prepare note content by combining note and URL if provided
    let finalNote = validatedArgs.note || "";
    if (validatedArgs.url) {
      if (finalNote) {
        finalNote = `${finalNote}\n\n${validatedArgs.url}`;
      } else {
        finalNote = validatedArgs.url;
      }
    }

    // Build the script body
    let scriptBody = '';

    // If list is specified, target that list
    if (validatedArgs.list) {
      scriptBody += `set targetList to list ${quoteAppleScriptString(validatedArgs.list)}\n`;
    } else {
      scriptBody += "set targetList to default list\n";
    }

    // Build properties object for the reminder
    scriptBody += `set reminderProps to {name:${quoteAppleScriptString(validatedArgs.title)}`;
    
    // Add due date if specified (supports date-only vs datetime)
    if (validatedArgs.dueDate) {
      const dateProperty = generateDateProperty(validatedArgs.dueDate, quoteAppleScriptString);
      scriptBody += dateProperty;
    }
    
    // Add note if specified (including URL if provided)
    if (finalNote) {
      scriptBody += `, body:${quoteAppleScriptString(finalNote)}`;
    }
    
    scriptBody += "}\n";
    
    // Create reminder with all properties at once
    scriptBody += "set newReminder to make new reminder at end of targetList with properties reminderProps\n";

    // Execute the script
    const script = createRemindersScript(scriptBody);
    debugLog("Running AppleScript:", script);
    executeAppleScript(script);

    const successMessage = `Successfully created reminder: ${validatedArgs.title}${finalNote ? ' with notes' : ''}`;
    
    return {
      content: [
        {
          type: "text",
          text: successMessage,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return ErrorHandler.createErrorResponse('create reminder', error);
  }
}

/**
 * Updates an existing reminder or performs batch operations
 * @param args - Arguments for updating a reminder or batch operations
 * @returns Result of the operation
 */
export async function handleUpdateReminder(args: any): Promise<CallToolResult> {
  try {
    const { action: _ignored, ...rest } = args ?? {};
    const validatedArgs = validateInput(UpdateReminderSchema, rest);
    
    // Check if this is a batch operation
    if (validatedArgs.batchOperation?.enabled) {
      return handleBatchOrganization(validatedArgs.batchOperation);
    }

    // Use builder pattern for cleaner script construction
    const updateBuilder = new ReminderUpdateBuilder(validatedArgs);
    const script = updateBuilder.buildScript();
    
    debugLog("Running AppleScript:", script);
    executeAppleScript(script);

    return updateBuilder.createSuccessResponse();
    
  } catch (error) {
    return ErrorHandler.createErrorResponse("update reminder", error);
  }
}

/**
 * Builder for AppleScript reminder update operations
 */
class ReminderUpdateBuilder {
  constructor(private args: any) {}
  
  buildScript(): string {
    const scriptParts = [
      this.buildTargetSelector(),
      this.buildValidationCheck(),
      this.buildPropertyUpdates(),
      'end if'
    ];
    
    return createRemindersScript(scriptParts.join('\n'));
  }
  
  private buildTargetSelector(): string {
    const listSelector = this.args.list 
      ? `set targetList to list ${quoteAppleScriptString(this.args.list)}\nset targetReminders to reminders of targetList`
      : 'set targetReminders to every reminder';
      
    return `${listSelector} whose name is ${quoteAppleScriptString(this.args.title)}`;
  }
  
  private buildValidationCheck(): string {
    return [
      'if (count of targetReminders) is 0 then',
      `  error ${quoteAppleScriptString(`Reminder not found: ${this.args.title}`)}`,
      'else',
      '  set targetReminder to first item of targetReminders'
    ].join('\n');
  }
  
  private buildPropertyUpdates(): string {
    const updates: string[] = [];
    
    if (this.args.newTitle) {
      updates.push(`  set name of targetReminder to ${quoteAppleScriptString(this.args.newTitle)}`);
    }
    
    if (this.args.dueDate) {
      const { formatted, isDateOnly } = parseDateWithType(this.args.dueDate);
      const dateType = isDateOnly ? 'allday due date' : 'due date';
      updates.push(`  set ${dateType} of targetReminder to date ${quoteAppleScriptString(formatted)}`);
    }
    
    if (this.shouldUpdateNotes()) {
      updates.push(this.buildNotesUpdate());
    }
    
    if (this.args.completed !== undefined) {
      updates.push(`  set completed of targetReminder to ${this.args.completed}`);
    }
    
    return updates.join('\n');
  }
  
  private shouldUpdateNotes(): boolean {
    return this.args.note !== undefined || this.args.url !== undefined;
  }
  
  private buildNotesUpdate(): string {
    const finalNote = this.combineNoteAndUrl();
    
    if (finalNote !== undefined) {
      return `  set body of targetReminder to ${quoteAppleScriptString(finalNote)}`;
    }
    
    // Special case: append URL to existing body
    if (this.args.url && this.args.note === undefined) {
      return [
        '  set currentBody to body of targetReminder',
        '  if currentBody is missing value then set currentBody to ""',
        `  set body of targetReminder to currentBody & ${quoteAppleScriptString(`URL: ${this.args.url}`)}`
      ].join('\n');
    }
    
    return '';
  }
  
  private combineNoteAndUrl(): string | undefined {
    if (!this.args.url && this.args.note === undefined) return undefined;
    if (!this.args.url) return this.args.note;
    if (this.args.note === undefined) return undefined; // Special case for URL append
    // If an empty note string is provided, replace with a labeled URL without leading newlines
    if (this.args.note === '') return `URL: ${this.args.url}`;
    if (!this.args.note) return this.args.url;
    return `${this.args.note}\n\n${this.args.url}`;
  }
  
  createSuccessResponse(): CallToolResult {
    const updates = this.getUpdateSummary();
    
    return {
      content: [
        {
          type: "text",
          text: `Successfully updated reminder "${this.args.title}"${updates.length > 0 ? `: ${updates.join(', ')}` : ''}`,
        },
      ],
      isError: false,
    };
  }
  
  private getUpdateSummary(): string[] {
    const updates: string[] = [];
    
    if (this.args.newTitle) updates.push(`title to "${this.args.newTitle}"`);
    if (this.args.dueDate) updates.push('due date');
    if (this.shouldUpdateNotes()) updates.push('notes');
    if (this.args.completed !== undefined) updates.push(`completed to ${this.args.completed}`);
    
    return updates;
  }
}

/**
 * Centralized error handling for all tool operations
 */
class ErrorHandler {
  static createErrorResponse(operation: string, error: any): CallToolResult {
    const message = error instanceof ValidationError 
      ? `Input validation failed: ${error.message}`
      : `Failed to ${operation}: System error occurred`;
    
    return {
      content: [{ type: "text", text: message }],
      isError: true,
    };
  }

  static createSuccessResponse(message: string): CallToolResult {
    return {
      content: [{ type: "text", text: message }],
      isError: false,
    };
  }
}

/**
 * Handles batch organization operations
 */
async function handleBatchOrganization(batchOperation: any): Promise<CallToolResult> {
  try {
    // Get current reminders to analyze
    const { reminders } = await remindersManager.getReminders(false);
    
    let filteredReminders = reminders;
    if (batchOperation.sourceList) {
      filteredReminders = reminders.filter(r => r.list === batchOperation.sourceList);
    }

    // Apply additional filters if specified
    if (batchOperation.filter) {
      if (batchOperation.filter.completed !== undefined) {
        filteredReminders = filteredReminders.filter(r => r.isCompleted === batchOperation.filter.completed);
      }
      
      if (batchOperation.filter.search) {
        const searchLower = batchOperation.filter.search.toLowerCase();
        filteredReminders = filteredReminders.filter(r => 
          r.title.toLowerCase().includes(searchLower) ||
          (r.notes && r.notes.toLowerCase().includes(searchLower))
        );
      }
      
      if (batchOperation.filter.dueWithin) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        filteredReminders = filteredReminders.filter(r => {
          if (batchOperation.filter.dueWithin === "no-date") return !r.dueDate;
          if (!r.dueDate) return false;
          
          const dueDate = new Date(r.dueDate);
          switch (batchOperation.filter.dueWithin) {
            case "overdue":
              return dueDate < today;
            case "today":
              return dueDate >= today && dueDate < tomorrow;
            case "tomorrow":
              return dueDate >= tomorrow && dueDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
            case "this-week":
              return dueDate >= today && dueDate <= weekEnd;
            default:
              return true;
          }
        });
      }
    }

    const organizationStrategy = batchOperation.strategy || "category";
    const createLists = batchOperation.createLists !== false;
    
    // Group reminders by the organization strategy
    const groups: Record<string, any[]> = {};
    
    for (const reminder of filteredReminders) {
      let groupKey = "Uncategorized";
      
      switch (organizationStrategy) {
        case "priority":
          if (reminder.title.toLowerCase().includes("urgent") || reminder.title.toLowerCase().includes("important")) {
            groupKey = "High Priority";
          } else if (reminder.title.toLowerCase().includes("later") || reminder.title.toLowerCase().includes("someday")) {
            groupKey = "Low Priority";
          } else {
            groupKey = "Medium Priority";
          }
          break;
        
        case "due_date":
          if (!reminder.dueDate) {
            groupKey = "No Due Date";
          } else {
            const dueDate = new Date(reminder.dueDate);
            const now = new Date();
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            
            if (diffDays < 0) {
              groupKey = "Overdue";
            } else if (diffDays === 0) {
              groupKey = "Due Today";
            } else if (diffDays <= 7) {
              groupKey = "Due This Week";
            } else {
              groupKey = "Due Later";
            }
          }
          break;
          
        case "completion_status":
          groupKey = reminder.isCompleted ? "Completed" : "Active";
          break;
          
        case "category":
        default:
          // Extract category from title or notes using common keywords
          const text = `${reminder.title} ${reminder.notes || ""}`.toLowerCase();
          if (text.includes("work") || text.includes("meeting") || text.includes("project")) {
            groupKey = "Work";
          } else if (text.includes("personal") || text.includes("home") || text.includes("family")) {
            groupKey = "Personal";
          } else if (text.includes("shopping") || text.includes("buy") || text.includes("store")) {
            groupKey = "Shopping";
          } else if (text.includes("health") || text.includes("doctor") || text.includes("exercise")) {
            groupKey = "Health";
          } else if (text.includes("bill") || text.includes("payment") || text.includes("finance")) {
            groupKey = "Finance";
          }
          break;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(reminder);
    }

    const results = [];
    
    // Create lists and move reminders
    for (const [groupName, groupReminders] of Object.entries(groups)) {
      if (createLists) {
        try {
          // Try to create the list (will fail silently if it already exists)
          const createResult = await handleCreateReminderList({ name: groupName });
          if (!createResult.isError) {
            results.push(`Created list: ${groupName}`);
          }
        } catch (error) {
          // List might already exist, continue
        }
      }
      
      // Move reminders to the appropriate list
      for (const reminder of groupReminders) {
        if (reminder.list !== groupName) {
          try {
            await handleMoveReminder({
              title: reminder.title,
              fromList: reminder.list,
              toList: groupName
            });
            results.push(`Moved "${reminder.title}" to ${groupName}`);
          } catch (error) {
            results.push(`Failed to move "${reminder.title}": ${(error as Error).message}`);
          }
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Batch organization complete using ${organizationStrategy} strategy:\n${results.join('\n')}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to organize reminders: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Deletes a reminder
 * @param args - Arguments for deleting a reminder
 * @returns Result of the operation
 */
export async function handleDeleteReminder(args: any): Promise<CallToolResult> {
  try {
    // Validate input for security
    const { action: _ignored, ...rest } = args ?? {};
    const validatedArgs = validateInput(DeleteReminderSchema, rest);
    let scriptBody = '';
    
    // Find the reminder by title
    if (validatedArgs.list) {
      scriptBody += `set targetList to list ${quoteAppleScriptString(validatedArgs.list)}\n`;
      scriptBody += `set targetReminders to reminders of targetList whose name is ${quoteAppleScriptString(validatedArgs.title)}\n`;
    } else {
      scriptBody += `set targetReminders to every reminder whose name is ${quoteAppleScriptString(validatedArgs.title)}\n`;
    }
    
    scriptBody += `if (count of targetReminders) is 0 then\n`;
    scriptBody += `  error ${quoteAppleScriptString(`Reminder not found: ${validatedArgs.title}`)}\n`;
    scriptBody += `else\n`;
    scriptBody += `  delete first item of targetReminders\n`;
    scriptBody += `end if\n`;
    
    const script = createRemindersScript(scriptBody);
    debugLog("Running AppleScript:", script);
    executeAppleScript(script);

    return {
      content: [
        {
          type: "text",
          text: `Successfully deleted reminder: ${validatedArgs.title}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    // Handle validation errors with sanitized messages
    if (error instanceof ValidationError) {
      return {
        content: [
          {
            type: "text",
            text: `Input validation failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Failed to delete reminder: System error occurred`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Moves a reminder between lists
 * @param args - Arguments for moving a reminder
 * @returns Result of the operation
 */
export async function handleMoveReminder(args: any): Promise<CallToolResult> {
  try {
    // Validate input for security
    const { action: _ignored, ...rest } = args ?? {};
    const validatedArgs = validateInput(MoveReminderSchema, rest);
    let scriptBody = '';
    
    // Find the reminder in the source list
    scriptBody += `set sourceList to list ${quoteAppleScriptString(validatedArgs.fromList)}\n`;
    scriptBody += `set destList to list ${quoteAppleScriptString(validatedArgs.toList)}\n`;
    scriptBody += `set targetReminders to reminders of sourceList whose name is ${quoteAppleScriptString(validatedArgs.title)}\n`;
    
    scriptBody += `if (count of targetReminders) is 0 then\n`;
    scriptBody += `  error ${quoteAppleScriptString(`Reminder not found in list ${validatedArgs.fromList}: ${validatedArgs.title}`)}\n`;
    scriptBody += `else\n`;
    scriptBody += `  set targetReminder to first item of targetReminders\n`;
    scriptBody += `  move targetReminder to destList\n`;
    scriptBody += `end if\n`;
    
    const script = createRemindersScript(scriptBody);
    debugLog("Running AppleScript:", script);
    executeAppleScript(script);

    return {
      content: [
        {
          type: "text",
          text: `Successfully moved reminder "${validatedArgs.title}" from ${validatedArgs.fromList} to ${validatedArgs.toList}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    // Handle validation errors with sanitized messages
    if (error instanceof ValidationError) {
      return {
        content: [
          {
            type: "text",
            text: `Input validation failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Failed to move reminder: System error occurred`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Lists all reminder lists or creates a new one
 * @param args - Optional arguments for creating a new list
 * @returns Result of the operation with the list of reminder lists in JSON format
 */
export async function handleListReminderLists(args?: any): Promise<CallToolResult> {
  try {
    // Validate input for security if args provided
    const cleaned = args && typeof args === 'object' ? (() => { const { action: _ignored, ...rest } = args; return rest; })() : undefined;
    const validatedArgs = cleaned ? validateInput(ListReminderListsSchema, cleaned) : undefined;
    
    // Check if this is a request to create a new list
    if (validatedArgs?.createNew) {
      return handleCreateReminderList({ name: validatedArgs.createNew.name });
    }

    // Regular list operation
    // Use the Swift-based reminders manager
    const { lists } = await remindersManager.getReminders();
    
    // Format the lists as JSON
    const listsJson = JSON.stringify({
      lists: lists.map(list => ({
        id: list.id,
        title: list.title
      })),
      total: lists.length
    }, null, 2);
    
    return {
      content: [
        {
          type: "text",
          text: listsJson,
        },
      ],
      isError: false,
    };
  } catch (error) {
    // Handle validation errors with sanitized messages
    if (error instanceof ValidationError) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Input validation failed: ${error.message}`,
              isError: true
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: "Failed to list reminder lists: System error occurred",
            isError: true
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Lists reminders from a specific list or all reminders
 * @param args - Arguments for listing reminders
 * @returns Result of the operation with the list of reminders in JSON format
 */
export async function handleListReminders(args: any): Promise<CallToolResult> {
  try {
    // Validate input for security
    const { action: _ignored, ...rest } = args ?? {};
    const validatedArgs = validateInput(ListRemindersSchema, rest);
    
    const showCompleted = validatedArgs.showCompleted === true;
    const { reminders } = await remindersManager.getReminders(showCompleted);
    
    // Filter reminders
    let filteredReminders = reminders
      .filter(r => showCompleted || !r.isCompleted)
      .filter(r => !validatedArgs.list || r.list === validatedArgs.list);
    
    // Search filter
    if (validatedArgs.search) {
      const searchLower = validatedArgs.search.toLowerCase();
      filteredReminders = filteredReminders.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        (r.notes && r.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Due date filter
    if (validatedArgs.dueWithin) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      filteredReminders = filteredReminders.filter(r => {
        if (validatedArgs.dueWithin === "no-date") return !r.dueDate;
        if (!r.dueDate) return false;
        
        const dueDate = new Date(r.dueDate);
        switch (validatedArgs.dueWithin) {
          case "overdue":
            return dueDate < today;
          case "today":
            return dueDate >= today && dueDate < tomorrow;
          case "tomorrow":
            return dueDate >= tomorrow && dueDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
          case "this-week":
            return dueDate >= today && dueDate <= weekEnd;
          default:
            return true;
        }
      });
    }
    
    // Map to response format
    const mappedReminders = filteredReminders.map(r => ({
      title: r.title,
      list: r.list,
      isCompleted: r.isCompleted === true,
      dueDate: r.dueDate || null,
      notes: r.notes || null,
    }));

    // Create response object
    const response = {
      reminders: mappedReminders,
      total: mappedReminders.length,
      filter: {
        list: validatedArgs.list || 'all',
        showCompleted,
        search: validatedArgs.search || null,
        dueWithin: validatedArgs.dueWithin || null
      }
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(response, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    // Handle validation errors with sanitized messages
    if (error instanceof ValidationError) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: `Input validation failed: ${error.message}`,
            isError: true
          })
        }],
        isError: true
      };
    }
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: "Failed to list reminders: System error occurred",
          isError: true
        })
      }],
      isError: true
    };
  }
}


/**
 * Creates a new reminder list
 * @param args - Arguments for creating a reminder list
 * @returns Result of the operation
 */
export async function handleCreateReminderList(args: any): Promise<CallToolResult> {
  try {
    // Validate input for security
    const validatedArgs = validateInput(CreateReminderListSchema, args);
    
    let scriptBody = '';
    
    // Create a new list
    scriptBody += `set newList to make new list with properties {name:${quoteAppleScriptString(validatedArgs.name)}}\n`;
    
    const script = createRemindersScript(scriptBody);
    debugLog("Running AppleScript:", script);
    executeAppleScript(script);

    return {
      content: [
        {
          type: "text",
          text: `Successfully created reminder list: ${validatedArgs.name}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    // Handle validation errors with sanitized messages
    if (error instanceof ValidationError) {
      return {
        content: [
          {
            type: "text",
            text: `Input validation failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Failed to create reminder list: System error occurred`,
        },
      ],
      isError: true,
    };
  }
}
