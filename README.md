# Apple Reminders MCP Server ![Version 0.9.0](https://img.shields.io/badge/version-0.9.0-blue) ![License: MIT](https://img.shields.io/badge/license-MIT-green)

[![Twitter Follow](https://img.shields.io/twitter/follow/FradSer?style=social)](https://twitter.com/FradSer)

English | [简体中文](README.zh-CN.md)

A Model Context Protocol (MCP) server that provides native integration with Apple Reminders on macOS. This server allows you to interact with Apple Reminders through a standardized interface with comprehensive management capabilities.

[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/fradser-mcp-server-apple-reminders-badge.png)](https://mseep.ai/app/fradser-mcp-server-apple-reminders)

## Features

### Core Functionality
- **List Management**: View all reminders and reminder lists with advanced filtering
- **Reminder Operations**: Create, update, delete, and move reminders across lists
- **Rich Content**: Support for titles, notes, due dates, URLs, and completion status
- **Native Integration**: Seamless integration with macOS Apple Reminders app

### Advanced Features
- **Smart Organization**: Automatic categorization by priority, due date, category, or completion status
- **Powerful Search**: Filter reminders by completion status, due dates, and search terms
- **Batch Operations**: Organize multiple reminders with intelligent strategies
- **Permission Management**: Proactive validation of system permissions
- **Flexible Date Handling**: Support for both date-only and date-time formats with locale awareness
- **Unicode Support**: Full international character support with validation

### Technical Excellence
- **Unified API**: Streamlined tool architecture with action-based operations
- **Type Safety**: Comprehensive TypeScript coverage with Zod validation
- **Performance**: Swift binaries for performance-critical operations
- **Error Handling**: Consistent error responses with detailed feedback

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

- **daily-task-organizer** — optional `task_category`, `priority_level`, and `time_frame` inputs produce a same-day execution blueprint that keeps priority work balanced with recovery time.
- **smart-reminder-creator** — requires `task_description`, optionally `context` and `urgency`, yielding a reminder draft that mitigates follow-through gaps by mapping metadata explicitly.
- **reminder-review-assistant** — optional `review_type` and `list_name` drive inbox triage scripts that surface stale reminders while avoiding destructive edits.
- **weekly-planning-workflow** — optional `focus_areas` and `week_start_date` guide a Monday-through-Sunday reset with time blocks tied to existing lists.
- **reminder-cleanup-guide** — optional `cleanup_strategy` lists guardrails and sequencing for stress-free list pruning.
- **goal-tracking-setup** — required `goal_type` plus optional `time_horizon` assemble recurring reminders and reflection cadences.

### Design constraints and validation

- Prompts are intentionally constrained to native Apple Reminders capabilities (no third-party automations) and ask for missing context before committing to irreversible actions.
- Shared formatting keeps outputs renderable as Markdown sections or tables without extra parsing glue in client applications.
- Run `pnpm test -- src/server/prompts.test.ts` to assert metadata, schema compatibility, and narrative assembly each time you amend prompt copy.

## Available MCP Tools

This server provides two unified MCP tools for comprehensive Apple Reminders management:

### Reminders Tool

**Tool Name**: `reminders`

A comprehensive tool for managing Apple Reminders with action-based operations. Supports all reminder operations through a single unified interface.

**Actions**: `list`, `create`, `update`, `delete`, `bulk_create`, `bulk_update`, `bulk_delete`, `organize`

#### Parameters by Action

**List Action** (`action: "list"`):
- `list` *(optional)*: Name of the reminder list to show
- `showCompleted` *(optional)*: Include completed reminders (default: false)
- `search` *(optional)*: Search term to filter reminders by title or content
- `dueWithin` *(optional)*: Filter by due date range ("today", "tomorrow", "this-week", "overdue", "no-date")

**Create Action** (`action: "create"`):
- `title` *(required)*: Title of the reminder
- `dueDate` *(optional)*: Due date in format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'
- `list` *(optional)*: Name of the reminders list to add to
- `note` *(optional)*: Note text to attach to the reminder
- `url` *(optional)*: URL to associate with the reminder

**Update Action** (`action: "update"`):
- `title` *(required)*: Current title of the reminder to update
- `newTitle` *(optional)*: New title for the reminder
- `dueDate` *(optional)*: New due date in format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'
- `note` *(optional)*: New note text
- `completed` *(optional)*: Mark reminder as completed/uncompleted
- `list` *(optional)*: Name of the list containing the reminder
- `url` *(optional)*: New URL to attach to the reminder

**Delete Action** (`action: "delete"`):
- `title` *(required)*: Title of the reminder to delete
- `list` *(optional)*: Name of the list containing the reminder

**Bulk Create Action** (`action: "bulk_create"`):
- `items` *(required)*: Array of reminder objects to create

**Bulk Update Action** (`action: "bulk_update"`):
- `criteria` *(required)*: Search criteria to find reminders
- `updates` *(required)*: Properties to update

**Bulk Delete Action** (`action: "bulk_delete"`):
- `criteria` *(required)*: Search criteria to find reminders to delete

**Organize Action** (`action: "organize"`):
- `strategy` *(required)*: Organization strategy ("priority", "due_date", "category", "completion_status")
- `sourceList` *(optional)*: Source list to organize from
- `createLists` *(optional)*: Create new lists automatically (default: true)

#### Example Usage

```json
{
  "action": "create",
  "title": "Buy groceries",
  "dueDate": "2024-03-25 18:00:00",
  "list": "Shopping",
  "note": "Don't forget milk and eggs",
  "url": "https://example.com/shopping-list"
}
```

```json
{
  "action": "list",
  "list": "Work",
  "showCompleted": false,
  "dueWithin": "today"
}
```

```json
{
  "action": "organize",
  "strategy": "category",
  "sourceList": "Inbox",
  "createLists": true
}
```

### Lists Tool

**Tool Name**: `lists`

Manage reminder lists - view existing lists or create new ones for organizing reminders.

**Actions**: `list`, `create`, `update`, `delete`

#### Parameters by Action

**List Action** (`action: "list"`):
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

### Project Structure

```
.
├── src/                          # Source code directory
│   ├── index.ts                  # Main entry point
│   ├── server/                   # MCP server implementation
│   │   ├── server.ts             # Server configuration and lifecycle
│   │   ├── handlers.ts           # Request handlers and routing
│   │   └── *.test.ts             # Server tests
│   ├── swift/                    # Native Swift integration code
│   │   ├── bin/                  # Compiled Swift binaries
│   │   ├── GetReminders.swift    # Swift source file
│   │   └── build.sh              # Swift build script
│   ├── tools/                    # MCP tool definitions and handlers
│   │   ├── definitions.ts        # Tool schemas and validation
│   │   ├── handlers.ts           # Tool implementation logic
│   │   ├── index.ts              # Tool registration
│   │   └── *.test.ts             # Tool tests
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts              # Core type definitions
│   ├── utils/                    # Helper functions and utilities
│   │   ├── __mocks__/            # Test mocks
│   │   ├── *.ts                  # Utility modules
│   │   └── *.test.ts             # Utility tests
│   ├── validation/               # Schema validation utilities
│   │   └── schemas.ts            # Zod validation schemas
│   └── test-setup.ts             # Test environment setup
├── dist/                         # Compiled JavaScript output
│   ├── index.js                  # Main compiled entry point
│   ├── swift/bin/                # Compiled Swift binaries
│   ├── server/                   # Server compiled files
│   ├── tools/                    # Tools compiled files
│   ├── types/                    # Types compiled files
│   ├── utils/                    # Utils compiled files
│   └── validation/               # Validation compiled files
├── node_modules/                 # Node.js dependencies
├── package.json                  # Package configuration
├── tsconfig.json                 # TypeScript configuration
├── jest.config.mjs               # Jest test configuration
├── pnpm-lock.yaml               # pnpm lock file
└── *.md                         # Documentation files
```

### Available Scripts

- `pnpm build` - Build both TypeScript and Swift components (required before starting the server)
- `pnpm build:ts` - Build TypeScript code only
- `pnpm build:swift` - Build the Swift helper binary only
- `pnpm dev` - TypeScript development mode with file watching
- `pnpm start` - Start the MCP server over stdio
- `pnpm test` - Run the comprehensive Jest suite
- `pnpm exec biome check` - Enforce formatting and lint rules

### Dependencies

**Runtime Dependencies:**
- `@modelcontextprotocol/sdk ^1.5.0` - MCP protocol implementation
- `moment ^2.30.1` - Date/time handling utilities
- `zod ^3.24.2` - Runtime type validation

**Development Dependencies:**
- `typescript ^5.8.2` - TypeScript compiler
- `@types/node ^20.0.0` - Node.js type definitions
- `@types/jest ^29.5.12` - Jest type definitions
- `jest ^29.7.0` - Testing framework
- `ts-jest ^29.1.2` - Jest TypeScript support

**Build Tools:**
- Swift binaries for native macOS integration
- TypeScript compilation for cross-platform compatibility
