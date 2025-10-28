/**
 * appleScriptBuilders.ts
 * Simplified AppleScript builders for reminder operations
 */

import {
  createRemindersScript,
  quoteAppleScriptString,
} from './applescript.js';
import { generateDateProperty, parseDateWithType } from './date.js';
import { combineNoteWithUrl, formatNoteWithUrls } from './urlHelpers.js';

interface ReminderProperties {
  title: string;
  dueDate?: string;
  note?: string;
  url?: string;
  list?: string;
}

interface ReminderUpdateProperties {
  title: string;
  newTitle?: string;
  dueDate?: string;
  note?: string;
  url?: string;
  completed?: boolean;
  list?: string;
}

interface ReminderTarget {
  title: string;
  list?: string;
}

/**
 * Builder for AppleScript reminder creation commands
 */
export class ReminderCreationBuilder {
  constructor(private properties: ReminderProperties) {}

  build(): string {
    const listSelector = this.properties.list
      ? `set targetList to list ${quoteAppleScriptString(this.properties.list)}`
      : 'set targetList to default list';

    const props = [`name:${quoteAppleScriptString(this.properties.title)}`];

    if (this.properties.dueDate) {
      props.push(
        generateDateProperty(
          this.properties.dueDate,
          quoteAppleScriptString,
        ).slice(1),
      );
    }

    const combinedNote = this.combineNoteAndUrl();
    if (combinedNote) {
      props.push(`body:${quoteAppleScriptString(combinedNote)}`);
    }

    const reminderProps = `set reminderProps to {${props.join(', ')}}`;
    const creationCommand =
      'set newReminder to make new reminder at end of targetList with properties reminderProps';

    return createRemindersScript(
      [listSelector, reminderProps, creationCommand].join('\n'),
    );
  }

  private combineNoteAndUrl(): string {
    const { note, url } = this.properties;
    return combineNoteWithUrl(note, url);
  }
}

/**
 * Builder for AppleScript reminder targeting commands
 */
export class ReminderTargetBuilder {
  private target: ReminderTarget;

  constructor(target: ReminderTarget) {
    this.target = target;
  }

  /**
   * Builds the script to find and select a reminder
   */
  buildTargetSelector(): string {
    const listSelector = this.target.list
      ? `set targetList to list ${quoteAppleScriptString(this.target.list)}\nset targetReminders to reminders of targetList`
      : 'set targetReminders to every reminder';

    return `${listSelector} whose name is ${quoteAppleScriptString(this.target.title)}`;
  }

  /**
   * Builds validation check for reminder existence
   */
  buildValidationCheck(customErrorMessage?: string): string {
    const errorMessage =
      customErrorMessage || `Reminder not found: ${this.target.title}`;

    return [
      'if (count of targetReminders) is 0 then',
      `  error ${quoteAppleScriptString(errorMessage)}`,
      'else',
      '  set targetReminder to first item of targetReminders',
    ].join('\n');
  }
}

/**
 * Builder for AppleScript reminder update commands
 */
export class ReminderUpdateScriptBuilder {
  private properties: ReminderUpdateProperties;
  private targetBuilder: ReminderTargetBuilder;

  constructor(properties: ReminderUpdateProperties) {
    this.properties = properties;
    this.targetBuilder = new ReminderTargetBuilder({
      title: properties.title,
      list: properties.list,
    });
  }

  /**
   * Builds the complete update script
   */
  build(): string {
    const scriptParts = [
      this.targetBuilder.buildTargetSelector(),
      this.targetBuilder.buildValidationCheck(),
      this.buildPropertyUpdates(),
      'end if',
    ];

    return createRemindersScript(scriptParts.join('\n'));
  }

  private buildPropertyUpdates(): string {
    const updates: string[] = [];

    if (this.properties.newTitle) {
      updates.push(
        `  set name of targetReminder to ${quoteAppleScriptString(this.properties.newTitle)}`,
      );
    }

    if (this.properties.dueDate) {
      updates.push(this.buildDateUpdate());
    }

    if (this.shouldUpdateNotes()) {
      updates.push(this.buildNotesUpdate());
    }

    if (this.properties.completed !== undefined) {
      updates.push(
        `  set completed of targetReminder to ${this.properties.completed}`,
      );
    }

    return updates.join('\n');
  }

  private buildDateUpdate(): string {
    if (!this.properties.dueDate) return '';

    const { formatted, isDateOnly } = parseDateWithType(
      this.properties.dueDate,
    );
    const dateType = isDateOnly ? 'allday due date' : 'due date';
    return `  set ${dateType} of targetReminder to date ${quoteAppleScriptString(formatted)}`;
  }

  private shouldUpdateNotes(): boolean {
    return (
      this.properties.note !== undefined || this.properties.url !== undefined
    );
  }

  private buildNotesUpdate(): string {
    const finalNote = this.combineNoteAndUrl();

    if (finalNote !== undefined) {
      return `  set body of targetReminder to ${quoteAppleScriptString(finalNote)}`;
    }

    // Special case: append URL to existing body using structured format
    if (this.properties.url && this.properties.note === undefined) {
      // We need to handle this case by reading current body and combining it
      // For now, we'll use a simpler approach with the URL helper
      const structuredUrl = formatNoteWithUrls('', [this.properties.url]);
      return [
        '  set currentBody to body of targetReminder',
        '  if currentBody is missing value then set currentBody to ""',
        `  set body of targetReminder to currentBody & ${quoteAppleScriptString(`\n\n${structuredUrl}`)}`,
      ].join('\n');
    }

    return '';
  }

  private combineNoteAndUrl(): string | undefined {
    const { note, url } = this.properties;

    if (!url && note === undefined) return undefined;
    if (note === undefined) return undefined; // Special case for URL append

    return combineNoteWithUrl(note, url);
  }
}

/**
 * Builder for AppleScript reminder deletion commands
 */
export class ReminderDeletionBuilder {
  private targetBuilder: ReminderTargetBuilder;

  constructor(target: ReminderTarget) {
    this.targetBuilder = new ReminderTargetBuilder(target);
  }

  build(): string {
    const scriptParts = [
      this.targetBuilder.buildTargetSelector(),
      this.targetBuilder.buildValidationCheck(),
      '  delete first item of targetReminders',
      'end if',
    ];

    return createRemindersScript(scriptParts.join('\n'));
  }
}

/**
 * Builder for AppleScript reminder move commands
 */
export class ReminderMoveBuilder {
  private title: string;
  private fromList: string;
  private toList: string;

  constructor(title: string, fromList: string, toList: string) {
    this.title = title;
    this.fromList = fromList;
    this.toList = toList;
  }

  build(): string {
    const scriptParts = [
      `set sourceList to list ${quoteAppleScriptString(this.fromList)}`,
      `set destList to list ${quoteAppleScriptString(this.toList)}`,
      `set targetReminders to reminders of sourceList whose name is ${quoteAppleScriptString(this.title)}`,
      'if (count of targetReminders) is 0 then',
      `  error ${quoteAppleScriptString(`Reminder not found in list ${this.fromList}: ${this.title}`)}`,
      'else',
      '  set targetReminder to first item of targetReminders',
      '  move targetReminder to destList',
      'end if',
    ];

    return createRemindersScript(scriptParts.join('\n'));
  }
}

/**
 * Builder for AppleScript reminder list creation commands
 */
export class ReminderListCreationBuilder {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  build(): string {
    const scriptBody = `set newList to make new list with properties {name:${quoteAppleScriptString(this.name)}}`;
    return createRemindersScript(scriptBody);
  }
}

/**
 * Builder for AppleScript reminder list update commands
 */
export class ReminderListUpdateBuilder {
  private currentName: string;
  private newName: string;

  constructor(currentName: string, newName: string) {
    this.currentName = currentName;
    this.newName = newName;
  }

  build(): string {
    const scriptParts = [
      `set targetList to list ${quoteAppleScriptString(this.currentName)}`,
      'if targetList exists then',
      `  set name of targetList to ${quoteAppleScriptString(this.newName)}`,
      'else',
      `  error ${quoteAppleScriptString(`List not found: ${this.currentName}`)}`,
      'end if',
    ];

    return createRemindersScript(scriptParts.join('\n'));
  }
}

/**
 * Builder for AppleScript reminder list deletion commands
 */
export class ReminderListDeletionBuilder {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  build(): string {
    const scriptParts = [
      `set targetList to list ${quoteAppleScriptString(this.name)}`,
      'if targetList exists then',
      '  delete targetList',
      'else',
      `  error ${quoteAppleScriptString(`List not found: ${this.name}`)}`,
      'end if',
    ];

    return createRemindersScript(scriptParts.join('\n'));
  }
}
