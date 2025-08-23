# Apple Reminders MCP Server ![](https://img.shields.io/badge/A%20FRAD%20PRODUCT-WIP-yellow)

[![Twitter Follow](https://img.shields.io/twitter/follow/FradSer?style=social)](https://twitter.com/FradSer)

English | [简体中文](README.zh-CN.md)

A Model Context Protocol (MCP) server that provides native integration with Apple Reminders on macOS. This server allows you to interact with Apple Reminders through a standardized interface.

[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/fradser-mcp-server-apple-reminders-badge.png)](https://mseep.ai/app/fradser-mcp-server-apple-reminders)

## Features

- List all reminders and reminder lists
- Create new reminders with titles and optional details
- Update existing reminders (title, notes, due date, completion status)
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

## Available MCP Tools

This server provides the following MCP services for interacting with Apple Reminders:

### Create Reminder

`create_reminder(title: string, dueDate?: string, list?: string, note?: string, url?: string)`

Creates a new reminder with the specified title and optional parameters:
- `title`: Title of the reminder (required)
- `dueDate`: Optional due date in format 'YYYY-MM-DD HH:mm:ss' (e.g., '2025-03-12 10:00:00')
- `list`: Optional name of the reminders list to add to
- `note`: Optional note text to attach to the reminder
- `url`: Optional URL to attach to the reminder

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

### Update Reminder

`update_reminder(title: string, newTitle?: string, dueDate?: string, note?: string, completed?: boolean, list?: string, url?: string)`

Updates an existing reminder by title. Note: If multiple reminders have the same title, only the first one found will be updated.
- `title`: Current title of the reminder to update (required)
- `newTitle`: New title for the reminder (optional)
- `dueDate`: New due date in format 'YYYY-MM-DD HH:mm:ss' (optional)
- `note`: New note text (optional)
- `completed`: Mark reminder as completed/uncompleted (optional)
- `list`: Name of the list containing the reminder (recommended for accuracy)
- `url`: New URL to attach to the reminder (optional)

Example response:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully updated reminder \"Buy groceries\": title to \"Buy organic groceries\", notes"
    }
  ],
  "isError": false
}
```

### List Reminders

`list_reminders(list?: string, showCompleted?: boolean, search?: string, dueWithin?: string)`

Lists all reminders or reminders from a specific list:
- `list`: Optional name of the reminders list to show
- `showCompleted`: Whether to show completed reminders (default: false)
- `search`: Search for reminders containing this text in title or notes
- `dueWithin`: Filter by due date range ("today", "tomorrow", "this-week", "overdue", "no-date")

**Note about URL fields**: The `url` field is currently limited by Apple's EventKit API restrictions and will typically be `null`. This is a limitation of Apple's EventKit framework, not our implementation. URLs stored in the native URL field of reminders cannot be accessed programmatically.

If you need to extract URLs from reminder notes, you can easily do this in your own code:
```typescript
const urls = reminder.notes?.match(/https?:\/\/[^\s]+/g) || [];
```



Example response:
```json
{
  "reminders": [
    {
      "title": "Buy groceries",
      "list": "Shopping",
      "isCompleted": false,
      "dueDate": "2024-03-25 18:00:00",
      "notes": "Don't forget milk",
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

### Delete Reminder

`delete_reminder(title: string, list?: string)`

Deletes a reminder by title:
- `title`: Title of the reminder to delete (required)
- `list`: Optional name of the list containing the reminder (recommended for accuracy)

Example response:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully deleted reminder: Buy groceries"
    }
  ],
  "isError": false
}
```

### Move Reminder

`move_reminder(title: string, fromList?: string, toList: string)`

Moves a reminder between lists:
- `title`: Title of the reminder to move (required)
- `fromList`: Optional name of the source list
- `toList`: Name of the destination list (required)

Example response:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully moved reminder 'Buy groceries' to list 'Shopping'"
    }
  ],
  "isError": false
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

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.

## Development

1. Install dependencies:
```bash
npm install
```

2. Build the project (TypeScript and Swift binary):
```bash
npm run build
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

- `npm run build` - Build TypeScript code and Swift binary (REQUIRED before starting server)
- `npm run dev` - TypeScript watch mode
- `npm test` - Run test suite
- `npm start` - Start MCP server
- `npm run clean` - Clean build artifacts
