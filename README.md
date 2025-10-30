# Apple Reminders MCP Server ![Version 1.0.0](https://img.shields.io/badge/version-1.0.0-blue) ![License: MIT](https://img.shields.io/badge/license-MIT-green)

[![Twitter Follow](https://img.shields.io/twitter/follow/FradSer?style=social)](https://twitter.com/FradSer)

English | [简体中文](README.zh-CN.md)

A Model Context Protocol (MCP) server that provides native integration with Apple Reminders on macOS. This server allows you to interact with Apple Reminders through a standardized interface with comprehensive management capabilities.

[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/fradser-mcp-server-apple-reminders-badge.png)](https://mseep.ai/app/fradser-mcp-server-apple-reminders)

## Features

### Core Functionality
- **List Management**: View all reminders and reminder lists with advanced filtering options
- **Reminder Operations**: Full CRUD operations (Create, Read, Update, Delete) for reminders across lists
- **Rich Content Support**: Complete support for titles, notes, due dates, URLs, and completion status
- **Native macOS Integration**: Direct integration with Apple Reminders using EventKit framework

### Advanced Features
- **Smart Organization**: Automatic categorization and intelligent filtering by priority, due date, category, or completion status
- **Powerful Search**: Multi-criteria filtering including completion status, due date ranges, and full-text search
- **Batch Operations**: Efficient handling of multiple reminders with optimized data access patterns
- **Permission Management**: Automatic validation and request for required macOS system permissions
- **Flexible Date Handling**: Support for multiple date formats (YYYY-MM-DD, ISO 8601) with timezone awareness
- **Unicode Support**: Full international character support with comprehensive input validation

### Technical Excellence
- **Clean Architecture**: 4-layer architecture following Clean Architecture principles with dependency injection
- **Type Safety**: Complete TypeScript coverage with Zod schema validation for runtime type checking
- **High Performance**: Swift-compiled binaries for performance-critical Apple Reminders operations
- **Robust Error Handling**: Consistent error responses with detailed diagnostic information
- **Repository Pattern**: Data access abstraction with standardized CRUD operations
- **Functional Programming**: Pure functions with immutable data structures where appropriate

## Prerequisites

- **Node.js 18 or later**
- **macOS** (required for Apple Reminders integration)
- **Xcode Command Line Tools** (required for compiling Swift code)
- **pnpm** (recommended for package management)

## Quick Start

Install globally via npm:

```bash
npm install -g mcp-server-apple-reminders
```

## Configuration

### Configure Cursor

1. Open Cursor
2. Open Cursor settings
3. Click on "MCP" in the sidebar
4. Click "Add new global MCP server"
5. Configure the server with the following settings:
    ```json
    {
      "mcpServers": {
        "apple-reminders": {
          "command": "mcp-server-apple-reminders",
          "args": []
        }
      }
    }
    ```

### Configure ChatWise

1. Open ChatWise
2. Go to Settings
3. Navigate to the Tools section
4. Click the "+" button
5. Configure the tool with the following settings:
   - Type: `stdio`
   - ID: `apple-reminders`
   - Command: `mcp-server-apple-reminders`
   - Args: (leave empty)

### Configure Claude Desktop

You need to configure Claude Desktop to recognize the Apple Reminders MCP server. There are two ways to access the configuration:

#### Option 1: Through Claude Desktop UI

1. Open Claude Desktop app
2. Enable Developer Mode from the top-left menu bar
3. Open Settings and navigate to the Developer Option
4. Click the Edit Config button to open `claude_desktop_config.json`

#### Option 2: Direct File Access

For macOS:
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

For Windows:
```bash
code %APPDATA%\Claude\claude_desktop_config.json
```

### 2. Add Server Configuration

Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apple-reminders": {
      "command": "mcp-server-apple-reminders",
      "args": []
    }
  }
}
```

### 3. Restart Claude Desktop

For the changes to take effect:

1. Completely quit Claude Desktop (not just close the window)
2. Start Claude Desktop again
3. Look for the tool icon to verify the Apple Reminders server is connected

## Usage Examples

Once configured, you can ask Claude to interact with your Apple Reminders. Here are some example prompts:

### Creating Reminders
```
Create a reminder to "Buy groceries" for tomorrow at 5 PM.
Add a reminder to "Call mom" with a note "Ask about weekend plans".
Create a reminder in my "Work" list to "Submit report" due next Friday.
Create a reminder with URL "Check this website: https://google.com".
```


### Update Reminders
```
Update the reminder "Buy groceries" with a new title "Buy organic groceries".
Update "Call mom" reminder to be due today at 6 PM.
Update the reminder "Submit report" and mark it as completed.
Change the notes on "Buy groceries" to "Don't forget milk and eggs".
```

### Managing Reminders
```
Show me all my reminders.
List all reminders in my "Shopping" list.
Show my completed reminders.
```

### Working with Lists
```
Show all my reminder lists.
Show reminders from my "Work" list.
```

The server will:
- Process your natural language requests
- Interact with Apple's native Reminders app
- Return formatted results to Claude
- Maintain native integration with macOS

## Structured Prompt Library

The server ships with a consolidated prompt registry exposed via the MCP `ListPrompts` and `GetPrompt` endpoints. Each template shares a mission, context inputs, numbered process, constraints, output format, and quality bar so downstream assistants receive predictable scaffolding instead of brittle free-form examples.

- **daily-task-organizer** — optional `task_category` (work, personal, health, shopping, etc.), `priority_level` (low, medium, high, urgent), and `time_frame` (today, this week, later this month) inputs produce a same-day execution blueprint that keeps priority work balanced with recovery time. Supports intelligent task clustering, focus block scheduling, and automatic reminder list organization.
- **smart-reminder-creator** — requires `task_description`, optionally `context` and `urgency` (low, medium, high, critical), yielding a reminder draft that mitigates follow-through gaps by mapping metadata explicitly.
- **reminder-review-assistant** — optional `review_type` (overdue, completed, upcoming, all) and `list_name` drive inbox triage scripts that surface stale reminders while avoiding destructive edits.
- **weekly-planning-workflow** — optional `user_ideas` (your thoughts and ideas for what you want to accomplish this week) guides a Monday-through-Sunday reset with time blocks tied to existing lists.
- **reminder-cleanup-guide** — optional `cleanup_strategy` (archive_completed, delete_old, reorganize_lists, merge_duplicates) lists guardrails and sequencing for stress-free list pruning.
- **goal-tracking-setup** — required `goal_type` (habit, project, learning, health, financial) plus optional `time_horizon` (daily, weekly, monthly, quarterly, yearly) assemble recurring reminders and reflection cadences.

### Design constraints and validation

- Prompts are intentionally constrained to native Apple Reminders capabilities (no third-party automations) and ask for missing context before committing to irreversible actions.
- Shared formatting keeps outputs renderable as Markdown sections or tables without extra parsing glue in client applications.
- Run `pnpm test -- src/server/prompts.test.ts` to assert metadata, schema compatibility, and narrative assembly each time you amend prompt copy.

## Available MCP Tools

This server provides two unified MCP tools for comprehensive Apple Reminders management:

### Reminders Tool

**Tool Name**: `reminders`

A comprehensive tool for managing Apple Reminders with action-based operations. Supports all reminder operations through a single unified interface.

**Actions**: `read`, `create`, `update`, `delete`

**Main Handler Functions**:
- `handleReadReminders()` - Read reminders with filtering options
- `handleCreateReminder()` - Create new reminders
- `handleUpdateReminder()` - Update existing reminders
- `handleDeleteReminder()` - Delete reminders

#### Parameters by Action

**Read Action** (`action: "read"`):
- `id` *(optional)*: Unique identifier of a specific reminder to read
- `filterList` *(optional)*: Name of the reminder list to show
- `showCompleted` *(optional)*: Include completed reminders (default: false)
- `search` *(optional)*: Search term to filter reminders by title or content
- `dueWithin` *(optional)*: Filter by due date range ("today", "tomorrow", "this-week", "overdue", "no-date")

**Create Action** (`action: "create"`):
- `title` *(required)*: Title of the reminder
- `dueDate` *(optional)*: Due date in format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'
- `targetList` *(optional)*: Name of the reminders list to add to
- `note` *(optional)*: Note text to attach to the reminder
- `url` *(optional)*: URL to associate with the reminder

**Update Action** (`action: "update"`):
- `id` *(required)*: Unique identifier of the reminder to update
- `title` *(optional)*: New title for the reminder
- `dueDate` *(optional)*: New due date in format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'
- `note` *(optional)*: New note text
- `url` *(optional)*: New URL to attach to the reminder
- `completed` *(optional)*: Mark reminder as completed/uncompleted
- `targetList` *(optional)*: Name of the list containing the reminder

**Delete Action** (`action: "delete"`):
- `id` *(required)*: Unique identifier of the reminder to delete

#### Example Usage

```json
{
  "action": "create",
  "title": "Buy groceries",
  "dueDate": "2024-03-25 18:00:00",
  "targetList": "Shopping",
  "note": "Don't forget milk and eggs",
  "url": "https://example.com/shopping-list"
}
```

```json
{
  "action": "read",
  "filterList": "Work",
  "showCompleted": false,
  "dueWithin": "today"
}
```

```json
{
  "action": "delete",
  "id": "reminder-123"
}
```

### Lists Tool

**Tool Name**: `lists`

Manage reminder lists - view existing lists or create new ones for organizing reminders.

**Actions**: `read`, `create`, `update`, `delete`

**Main Handler Functions**:
- `handleReadReminderLists()` - Read all reminder lists
- `handleCreateReminderList()` - Create new reminder lists
- `handleUpdateReminderList()` - Update existing reminder lists
- `handleDeleteReminderList()` - Delete reminder lists

#### Parameters by Action

**Read Action** (`action: "read"`):
- No additional parameters required

**Create Action** (`action: "create"`):
- `name` *(required)*: Name for new reminder list

**Update Action** (`action: "update"`):
- `name` *(required)*: Current name of the list to update
- `newName` *(required)*: New name for the reminder list

**Delete Action** (`action: "delete"`):
- `name` *(required)*: Name of the list to delete

#### Example Usage

```json
{
  "action": "create",
  "name": "Project Alpha"
}
```

#### Response Formats

**Success Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully created reminder: Buy groceries"
    }
  ],
  "isError": false
}
```

**Note about URL fields**: The `url` field is fully supported by EventKit API. When you create or update a reminder with a URL parameter, the URL is stored in two places for maximum compatibility:

1. **EventKit URL field**: The URL is stored in the native `url` property (visible in Reminders app detail view via the "i" icon)
2. **Notes field**: The URL is also appended to the notes using a structured format for parsing

**Dual Storage Approach**:
- **URL field**: Stores a single URL for native Reminders app display
- **Notes field**: Stores URLs in a structured format for parsing and multiple URL support

```
Reminder note content here...

URLs:
- https://example.com
- https://another-url.com
```

This ensures URLs are accessible both in the Reminders app UI and through the API/notes for parsing.

**URL Extraction**: You can extract URLs from reminder notes using the structured format or regex fallback:
```typescript
// Using the structured format (recommended)
import { extractUrlsFromNotes, parseReminderNote } from './urlHelpers';

// Extract just URLs
const urls = extractUrlsFromNotes(reminder.notes);

// Parse into separate note content and URLs
const { note, urls } = parseReminderNote(reminder.notes);

// Legacy regex method (fallback for unstructured content)
const urlsRegex = reminder.notes?.match(/https?:\/\/[^\s]+/g) || [];
```

**Benefits of Structured Format**:
- **Consistent parsing**: URLs are always in a predictable location
- **Multiple URL support**: Handle multiple URLs per reminder reliably
- **Clean separation**: Note content and URLs are clearly separated
- **Backward compatible**: Unstructured URLs still detected as fallback

**List Response**:
```json
{
  "reminders": [
    {
      "title": "Buy groceries", 
      "list": "Shopping",
      "isCompleted": false,
      "dueDate": "2024-03-25 18:00:00",
      "notes": "Don't forget milk\n\nURLs:\n- https://grocery-store.com\n- https://shopping-list.com",
      "url": null
    }
  ],
  "total": 1,
  "filter": {
    "list": "Shopping",
    "showCompleted": false
  }
}
```

## URL Utilities

The server includes built-in URL utilities for working with the structured URL format. These utilities are exported from `src/utils/urlHelpers.js`:

### Key Functions

- `extractUrlsFromNotes(notes)` - Extract URLs from structured or unstructured notes
- `parseReminderNote(notes)` - Parse notes into separate content and URL array  
- `formatNoteWithUrls(note, urls)` - Format note content with structured URLs
- `removeUrlSections(notes)` - Remove URL sections to get clean note content
- `combineNoteWithUrl(note, url)` - Combine note with single URL in structured format

### Usage Examples

```typescript
import { 
  extractUrlsFromNotes, 
  parseReminderNote,
  formatNoteWithUrls 
} from 'mcp-server-apple-reminders/src/utils/urlHelpers.js';

// Extract URLs from any reminder note
const urls = extractUrlsFromNotes(reminder.notes);
console.log(urls); // ['https://example.com', 'https://test.com']

// Parse note into content and URLs
const { note, urls } = parseReminderNote(reminder.notes);
console.log(note); // "Task description" 
console.log(urls); // ['https://example.com']

// Create structured note content
const structured = formatNoteWithUrls("New task", ['https://link1.com', 'https://link2.com']);
// Result: "New task\n\nURLs:\n- https://link1.com\n- https://link2.com"
```

## Organization Strategies

The server provides intelligent reminder organization capabilities through four built-in strategies:

### Priority Strategy
Automatically categorizes reminders based on priority keywords:
- **High Priority**: Contains words like "urgent", "important", "critical", "asap"
- **Medium Priority**: Default category for standard reminders
- **Low Priority**: Contains words like "later", "someday", "eventually", "maybe"

### Due Date Strategy
Organizes reminders based on their due dates:
- **Overdue**: Past due dates
- **Today**: Due today
- **Tomorrow**: Due tomorrow
- **This Week**: Due within the current week
- **Next Week**: Due next week
- **Future**: Due beyond next week
- **No Date**: Reminders without due dates

### Category Strategy
Intelligently categorizes reminders by content analysis:
- **Work**: Business, meetings, projects, office, client related
- **Personal**: Home, family, friends, self-care related
- **Shopping**: Buy, store, purchase, groceries related
- **Health**: Doctor, exercise, medical, fitness, workout related
- **Finance**: Bills, payments, bank, budget related
- **Travel**: Trips, flights, hotels, vacation related
- **Education**: Study, learn, courses, books, research related
- **Uncategorized**: Doesn't match any specific category

### Completion Status Strategy
Simple binary organization:
- **Active**: Incomplete reminders
- **Completed**: Finished reminders

### Usage Examples

Organize all reminders by priority:
```
Organize my reminders by priority
```

Categorize work-related reminders:
```
Organize reminders from Work list by category
```

Sort overdue items:
```
Organize overdue reminders by due date
```

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.

## Development

1. Install dependencies with pnpm (keeps the Swift bridge and TypeScript graph in sync):
```bash
pnpm install
```

2. Build the project (TypeScript and Swift binary) before invoking the CLI:
```bash
pnpm build
```

3. Run the full test suite to validate TypeScript, Swift bridge shims, and prompt templates:
```bash
pnpm test
```

4. Lint and format with Biome prior to committing:
```bash
pnpm exec biome check
```

### Launching from nested directories

The CLI entry point includes a project-root fallback, so you can start the server from nested paths (for example `dist/` or editor task runners) without losing access to the bundled Swift binary. The bootstrapper walks up to ten directories to find `package.json`; if you customise the folder layout, keep the manifest reachable within that depth to retain the guarantee.

### Available Scripts

- `pnpm build` - Build the Swift helper binary (required before starting the server)
- `pnpm build:swift` - Build the Swift helper binary only
- `pnpm dev` - TypeScript development mode with file watching via tsx (runtime TS execution)
- `pnpm start` - Start the MCP server over stdio (auto-fallback to runtime TS if no build)
- `pnpm test` - Run the comprehensive Jest test suite
- `pnpm check` - Run Biome formatting and TypeScript type checking

### Dependencies

**Runtime Dependencies:**
- `@modelcontextprotocol/sdk ^1.20.2` - MCP protocol implementation
- `moment ^2.30.1` - Date/time handling utilities
- `exit-on-epipe ^1.0.1` - Graceful process termination handling
- `tsx ^4.20.6` - TypeScript execution and REPL
- `zod ^4.1.12` - Runtime type validation

**Development Dependencies:**
- `typescript ^5.9.3` - TypeScript compiler
- `@types/node ^24.9.2` - Node.js type definitions
- `@types/jest ^30.0.0` - Jest type definitions
- `jest ^30.2.0` - Testing framework
- `babel-jest ^30.2.0` - Babel Jest transformer
- `babel-plugin-transform-import-meta ^2.3.3` - Babel import meta transform
- `ts-jest ^29.4.5` - Jest TypeScript support
- `@biomejs/biome ^2.3.2` - Code formatting and linting

**Build Tools:**
- Swift binaries for native macOS integration
- TypeScript compilation for cross-platform compatibility
