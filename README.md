[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/fradser-mcp-server-apple-reminders-badge.png)](https://mseep.ai/app/fradser-mcp-server-apple-reminders)

# Apple Reminders MCP Server ![](https://img.shields.io/badge/A%20FRAD%20PRODUCT-WIP-yellow)

[![Twitter Follow](https://img.shields.io/twitter/follow/FradSer?style=social)](https://twitter.com/FradSer)

English | [简体中文](README.zh-CN.md)

A Model Context Protocol (MCP) server that provides native integration with Apple Reminders on macOS. This server allows you to interact with Apple Reminders through a standardized interface.

## Features

- List all reminders and reminder lists
- Create new reminders with titles and optional details
- Mark reminders as complete/incomplete
- Add notes to reminders
- Set due dates for reminders
- Native macOS integration

## Prerequisites

- Node.js 18 or later
- macOS (required for Apple Reminders integration)
- Xcode Command Line Tools (required for compiling Swift code)

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

## Available MCP Tools

This server provides the following MCP services for interacting with Apple Reminders:

### Create Reminder

`create_reminder(title: string, dueDate?: string, list?: string, note?: string)`

Creates a new reminder with the specified title and optional parameters:
- `title`: Title of the reminder (required)
- `dueDate`: Optional due date in format 'YYYY-MM-DD HH:mm:ss' (e.g., '2025-03-12 10:00:00')
- `list`: Optional name of the reminders list to add to
- `note`: Optional note text to attach to the reminder

Example response:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully created reminder: Buy groceries with notes"
    }
  ],
  "isError": false
}
```

### List Reminders

`list_reminders(list?: string, showCompleted?: boolean)`

Lists all reminders or reminders from a specific list:
- `list`: Optional name of the reminders list to show
- `showCompleted`: Whether to show completed reminders (default: false)

Example response:
```json
{
  "reminders": [
    {
      "title": "Buy groceries",
      "list": "Shopping",
      "isCompleted": false,
      "dueDate": "2024-03-25 18:00:00",
      "notes": "Don't forget milk"
    }
  ],
  "total": 1,
  "filter": {
    "list": "Shopping",
    "showCompleted": false
  }
}
```

### List Reminder Lists

`list_reminder_lists()`

Returns a list of all available reminder lists.

Example response:
```json
{
  "lists": [
    {
      "id": 1,
      "title": "Shopping"
    },
    {
      "id": 2,
      "title": "Work"
    }
  ],
  "total": 2
}
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Build the Swift binary for Apple Reminders integration:
```bash
npm run build:swift
```

3. Build the TypeScript code:
```bash
npm run build:ts
```

### Project Structure

```
.
├── src/                   # Source code directory
│   ├── index.ts           # Main entry point
│   ├── server/            # MCP server implementation
│   ├── swift/             # Native Swift integration code
│   │   ├── bin/           # Compiled Swift binaries
│   │   └── src/           # Swift source files
│   ├── tools/             # CLI tools and utilities
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions and utilities
├── dist/                  # Compiled JavaScript output
├── node_modules/          # Node.js dependencies
└── tests/                 # Test files and test utilities
```

### Available Scripts

- `npm run build:ts` - Build TypeScript code
- `npm run build:swift` - Build Swift binary
- `npm run dev` - Run TypeScript compiler in watch mode
- `npm run start` - Start the MCP server
- `npm test` - Run tests