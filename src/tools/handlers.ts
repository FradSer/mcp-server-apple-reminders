/**
 * tools/handlers.ts
 * Implementation of tool handlers for Apple Reminders operations
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createRemindersScript, executeAppleScript, quoteAppleScriptString } from "../utils/applescript.js";
import { parseDate } from "../utils/date.js";
import { debugLog } from "../utils/logger.js";
import { remindersManager } from "../utils/reminders.js";

/**
 * Creates a new reminder
 * @param args - Arguments for creating a reminder
 * @returns Result of the operation
 */
export async function handleCreateReminder(args: any): Promise<CallToolResult> {
  try {
    // Prepare note content by combining note and URL if provided
    let finalNote = args.note || "";
    if (args.url) {
      if (finalNote) {
        finalNote = `${finalNote}\n\nURL: ${args.url}`;
      } else {
        finalNote = `URL: ${args.url}`;
      }
    }

    // Build the script body
    let scriptBody = '';

    // If list is specified, target that list
    if (args.list) {
      scriptBody += `set targetList to list ${quoteAppleScriptString(args.list)}\n`;
    } else {
      scriptBody += "set targetList to default list\n";
    }

    // Build properties object for the reminder
    scriptBody += `set reminderProps to {name:${quoteAppleScriptString(args.title)}`;
    
    // Add due date if specified
    if (args.dueDate) {
      const parsedDate = parseDate(args.dueDate);
      debugLog("Parsed date:", parsedDate);
      
      // Check if this is a date-only format (YYYY-MM-DD without time)
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(args.dueDate.trim());
      
      if (isDateOnly) {
        // Use allday due date for date-only reminders
        scriptBody += `, allday due date:date ${quoteAppleScriptString(parsedDate)}`;
      } else {
        // Use regular due date for datetime reminders
        scriptBody += `, due date:date ${quoteAppleScriptString(parsedDate)}`;
      }
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

    return {
      content: [
        {
          type: "text",
          text: `Successfully created reminder: ${args.title}${finalNote ? ' with notes' : ''}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to create reminder: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Updates an existing reminder
 * @param args - Arguments for updating a reminder
 * @returns Result of the operation
 */
export async function handleUpdateReminder(args: any): Promise<CallToolResult> {
  try {
    // Prepare note content by combining note and URL if provided
    let finalNote = args.note;
    if (args.url) {
      if (finalNote) {
        finalNote = `${finalNote}\n\nURL: ${args.url}`;
      } else if (finalNote !== undefined) {
        // If note is defined but falsy (e.g., empty string), set it to just the URL
        finalNote = `URL: ${args.url}`;
      } else {
        // We'll handle this differently - append to existing body
        finalNote = undefined;
      }
    }

    // Build the script body
    let scriptBody = '';
    
    // Find the reminder by title
    if (args.list) {
      scriptBody += `set targetList to list ${quoteAppleScriptString(args.list)}\n`;
      scriptBody += `set targetReminders to reminders of targetList whose name is ${quoteAppleScriptString(args.title)}\n`;
    } else {
      scriptBody += `set targetReminders to every reminder whose name is ${quoteAppleScriptString(args.title)}\n`;
    }
    
    scriptBody += `if (count of targetReminders) is 0 then\n`;
    scriptBody += `  error ${quoteAppleScriptString(`Reminder not found: ${args.title}`)}\n`;
    scriptBody += `else\n`;
    scriptBody += `  set targetReminder to first item of targetReminders\n`;
    
    // Update properties
    if (args.newTitle) {
      scriptBody += `  set name of targetReminder to ${quoteAppleScriptString(args.newTitle)}\n`;
    }
    
    if (args.dueDate) {
      const parsedDate = parseDate(args.dueDate);
      
      // Check if this is a date-only format (YYYY-MM-DD without time)
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(args.dueDate.trim());
      
      if (isDateOnly) {
        // Use allday due date for date-only reminders
        scriptBody += `  set allday due date of targetReminder to date ${quoteAppleScriptString(parsedDate)}\n`;
      } else {
        // Use regular due date for datetime reminders
        scriptBody += `  set due date of targetReminder to date ${quoteAppleScriptString(parsedDate)}\n`;
      }
    }
    
    if (finalNote !== undefined) {
      scriptBody += `  set body of targetReminder to ${quoteAppleScriptString(finalNote)}\n`;
    } else if (args.url && args.note === undefined) {
      // Special case: append URL to existing body
      scriptBody += `  set currentBody to body of targetReminder\n`;
      scriptBody += `  if currentBody is missing value then set currentBody to ""\n`;
      scriptBody += `  set body of targetReminder to currentBody & ${quoteAppleScriptString(`\n\nURL: ${args.url}`)}\n`;
    }
    
    if (args.completed !== undefined) {
      scriptBody += `  set completed of targetReminder to ${args.completed}\n`;
    }
    
    scriptBody += `end if\n`;
    
    // Execute the script
    const script = createRemindersScript(scriptBody);
    debugLog("Running AppleScript:", script);
    executeAppleScript(script);

    const updates = [];
    if (args.newTitle) updates.push(`title to "${args.newTitle}"`);
    if (args.dueDate) updates.push(`due date`);
    if (args.note !== undefined || args.url) updates.push(`notes`);
    if (args.completed !== undefined) updates.push(`completed to ${args.completed}`);

    return {
      content: [
        {
          type: "text",
          text: `Successfully updated reminder "${args.title}"${updates.length > 0 ? `: ${updates.join(', ')}` : ''}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to update reminder: ${(error as Error).message}`,
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
    let scriptBody = '';
    
    // Find the reminder by title
    if (args.list) {
      scriptBody += `set targetList to list ${quoteAppleScriptString(args.list)}\n`;
      scriptBody += `set targetReminders to reminders of targetList whose name is ${quoteAppleScriptString(args.title)}\n`;
    } else {
      scriptBody += `set targetReminders to every reminder whose name is ${quoteAppleScriptString(args.title)}\n`;
    }
    
    scriptBody += `if (count of targetReminders) is 0 then\n`;
    scriptBody += `  error ${quoteAppleScriptString(`Reminder not found: ${args.title}`)}\n`;
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
          text: `Successfully deleted reminder: ${args.title}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to delete reminder: ${(error as Error).message}`,
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
    let scriptBody = '';
    
    // Find the reminder in the source list
    scriptBody += `set sourceList to list ${quoteAppleScriptString(args.fromList)}\n`;
    scriptBody += `set destList to list ${quoteAppleScriptString(args.toList)}\n`;
    scriptBody += `set targetReminders to reminders of sourceList whose name is ${quoteAppleScriptString(args.title)}\n`;
    
    scriptBody += `if (count of targetReminders) is 0 then\n`;
    scriptBody += `  error ${quoteAppleScriptString(`Reminder not found in list ${args.fromList}: ${args.title}`)}\n`;
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
          text: `Successfully moved reminder "${args.title}" from ${args.fromList} to ${args.toList}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to move reminder: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Lists all reminder lists
 * @returns Result of the operation with the list of reminder lists in JSON format
 */
export async function handleListReminderLists(): Promise<CallToolResult> {
  try {
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
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: `Failed to list reminder lists: ${(error as Error).message}`,
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
    const showCompleted = args.showCompleted === true;
    const { reminders } = await remindersManager.getReminders(showCompleted);
    
    // Filter reminders
    let filteredReminders = reminders
      .filter(r => showCompleted || !r.isCompleted)
      .filter(r => !args.list || r.list === args.list);
    
    // Search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filteredReminders = filteredReminders.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        (r.notes && r.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Due date filter
    if (args.dueWithin) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      filteredReminders = filteredReminders.filter(r => {
        if (args.dueWithin === "no-date") return !r.dueDate;
        if (!r.dueDate) return false;
        
        const dueDate = new Date(r.dueDate);
        switch (args.dueWithin) {
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
      notes: r.notes || null
    }));

    // Create response object
    const response = {
      reminders: mappedReminders,
      total: mappedReminders.length,
      filter: {
        list: args.list || 'all',
        showCompleted,
        search: args.search || null,
        dueWithin: args.dueWithin || null
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
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: `Failed to list reminders: ${(error as Error).message}`,
          isError: true
        })
      }],
      isError: true
    };
  }
}