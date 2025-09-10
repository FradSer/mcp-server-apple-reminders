# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Apple Reminders MCP server - Native macOS integration with dual-strategy architecture.

## Essential Commands

```bash
npm run build     # REQUIRED before starting server (builds Swift binary)
npm run build:ts  # Build TypeScript only
npm run build:swift  # Build Swift binary only
npm run dev       # TypeScript watch mode
npm test          # Run test suite
npm test -- --watch  # Watch mode testing
npm start         # Start MCP server
```

## Critical Requirements

### Swift Binary
- **MUST run `npm run build` before server startup**
- Binary: `dist/swift/bin/GetReminders` (EventKit access)
- Tests mock binary path (`NODE_ENV=test`)
- Auto-discovery fallbacks: `src/swift/bin/`, `swift/bin/`
- Requires Xcode Command Line Tools for compilation

### Architecture
**MCP Server** (`src/server/`) + **Tools** (`src/tools/`) + **Swift Binary** (`src/swift/`)

**Dual Strategy:**
- **Read**: Swift + EventKit → `dist/swift/bin/GetReminders`  
- **Write**: AppleScript → `tell application "Reminders"`

## MCP Tools Reference

**Current Implementation: Unified Tool Interface**

| Tool | Action | Parameters | Purpose |
|------|--------|------------|---------|
| `reminders` | list | list?, showCompleted?, search?, dueWithin? | List reminders with filters (defaults to "Reminders" list when no params) |
| `reminders` | create | title, dueDate?, list?, note?, url? | Create new reminder |
| `reminders` | update | title, newTitle?, dueDate?, list?, note?, completed?, url? | Update existing reminder |
| `reminders` | delete | title, list? | Delete reminder by title |
| `reminders` | bulk_create | reminders[] | Create multiple reminders at once |
| `reminders` | bulk_update | updates[] | Update multiple reminders at once |
| `reminders` | bulk_delete | titles[], list? | Delete multiple reminders at once |
| `reminders` | organize | strategy, sourceList?, createLists? | Batch organize by priority/due_date/category/completion_status |
| `lists` | list | - | Get all reminder lists |
| `lists` | create | name | Create new reminder list |
| `lists` | update | name, newName | Update reminder list name |
| `lists` | delete | name | Delete reminder list |

**Advanced Features:**
- Unified action-based tool interface for simplified MCP integration
- **Intelligent defaults**: `{"action": "list"}` automatically shows uncompleted reminders from the most appropriate list (tries "Reminders", "提醒事项", etc., or uses first available list)
- Batch operations for organizing multiple reminders by priority, due date, category, or completion status
- System-aware 24-hour/12-hour time detection with async initialization
- Intelligent date parsing with multiple format support
- URL integration with reminder notes
- Dynamic list creation and management

## Key Implementation Details

### Date Handling (Moment.js)
- **Input formats**: ISO_8601, 'YYYY-MM-DD', 'MM/DD/YYYY', 'YYYY-MM-DD HH:mm:ss'
- **AppleScript output**: "MMMM D, YYYY HH:mm:ss" (English month names, locale-independent)
- **System integration**: Async initialization of 24-hour vs 12-hour time preference with safe defaults
- **Error handling**: Detailed error messages with format examples and supported types  
- **Caching**: System preferences cached for performance, with test-only cache clearing
- **TimePreferenceManager**: Non-blocking async initialization to avoid startup delays

### Error Handling
- **JSON responses**: `{isError: boolean, message: string, data?: any}`
- **Child process**: Swift binary execution errors
- **Validation**: Dual validation strategy (Zod + ArkType)
- **Security**: AppleScript injection prevention with heredoc syntax
- **Graceful degradation**: Multiple binary path fallbacks

### File Locations
- **Entry**: `src/index.ts` (package.json auto-discovery)
- **MCP Server**: `src/server/` (@modelcontextprotocol/sdk)
- **Tools**: `src/tools/` (definitions.ts + handlers.ts for unified tool implementation)
- **Utils**: `src/utils/` (reminders, AppleScript, date, logger, binaryValidator, moduleHelpers)
- **Validation**: `src/validation/schemas.ts` (Zod + ArkType schemas)
- **Types**: `src/types/index.ts` (TypeScript definitions)
- **Tests**: `src/**/*.test.ts` (Jest + ts-jest)
- **Swift**: `src/swift/GetReminders.swift` (EventKit integration)

### Testing Environment
- **Config**: `jest.config.mjs` (ESM + TypeScript support)
- **Setup**: `src/test-setup.ts`
- **Mocking**: Swift binary paths when `NODE_ENV=test`
- **Mock Strategy**: Complete isolation of system calls and binary execution
- **Coverage**: Unit tests for all utilities, integration tests for tools
- **Test patterns**: `src/**/*.test.ts` and `src/**/*.spec.ts`

### Permissions & Requirements
- **EventKit**: Reading reminders (macOS 10.15+)
- **Automation**: AppleScript execution permission
- **System**: macOS with Xcode Command Line Tools
- **Runtime**: Node.js with ES modules support
- **Build**: Swift compiler for native binary compilation

## Development Workflow

### Common Tasks
```bash
# Initial setup
npm install
npm run build  # Critical: builds Swift binary

# Development
npm run dev    # TypeScript watch mode
npm test       # Full test suite
npm test -- --watch  # Watch mode testing

# Single test file
npm test src/utils/date.test.ts

# Build individual components
npm run build:ts    # TypeScript compilation only
npm run build:swift # Swift binary compilation only

# Debugging
NODE_ENV=development npm start  # Enhanced logging
NODE_ENV=test npm test  # Test environment
```

### Build System
- **TypeScript**: ESM modules with `.js` imports (Node16 resolution)
- **Swift**: Compiles to `dist/swift/bin/GetReminders` with EventKit framework
- **Package**: Entry point `dist/index.js` with Node.js shebang


### Architecture Notes
- **Project Root Discovery**: Auto-detects via package.json search (up to 10 levels)
- **Binary Management**: Robust path discovery with fallbacks
- **ES Modules**: Full ESM support with proper `.js` imports
- **Dual Strategy**: Swift (read) + AppleScript (write) for optimal macOS integration

## Critical Implementation Notes

### Swift Binary Management
- Binary MUST exist at `dist/swift/bin/GetReminders` before server start
- Test environment mocks binary path to avoid compilation dependency
- EventKit framework linking required: `-framework EventKit -framework Foundation`
- Multiple path fallbacks for robust deployment

### AppleScript Security
- Use heredoc syntax to prevent injection: `cat <<'EOF'...EOF`
- Never interpolate user input directly into AppleScript strings
- URL handling integrated with notes field, not separate properties

### MCP Protocol Implementation
- 2 unified tools (`reminders` and `lists`) with action-based operations
- Complete CRUD operations: Create, Read, Update, Delete for both reminders and lists
- Bulk operation support for creating, updating, and deleting multiple reminders
- Batch organization strategies for automatic categorization
- Consistent error response format across all tools
- Tool parameter validation using dual schema approach (Zod + ArkType)
- Action-based design reduces tool complexity and improves MCP client compatibility

### Environment Considerations
- macOS-only due to EventKit and AppleScript dependencies
- System permission dialogs will appear on first run
- 24-hour time preference affects date formatting output
- Requires EventKit and Automation permissions