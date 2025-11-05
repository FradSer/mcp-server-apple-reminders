# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Apple Reminders MCP server - Native macOS integration using Swift CLI for EventKit operations.

## Essential Commands

```bash
pnpm install              # Install dependencies (pnpm is preferred over npm)
pnpm build                # REQUIRED before starting server (compiles Swift binary)
pnpm build:swift          # Build Swift binary only
pnpm start                # Start MCP server over stdio
pnpm dev                  # Development mode with tsx runtime (no build needed)
pnpm test                 # Run full Jest test suite
pnpm test -- --watch      # Watch mode testing
pnpm check                # Run Biome formatting + TypeScript type checking

# Single test file
pnpm test src/utils/cliExecutor.test.ts

# Development with enhanced logging
NODE_ENV=development pnpm start
```

## Automatic Permission Handling

**Permissions are automatically requested when you use MCP tools!**

When you call any reminder or calendar tool, the Swift CLI (`src/swift/EventKitCLI.swift`) will:
1. Check permission status using `EKEventStore.authorizationStatus()`
2. If not authorized, automatically request permission
3. Proceed with the operation once permission is granted

The Swift layer handles all permission checking and requesting following EventKit best practices.

## Critical Build Requirements

### Swift Binary Compilation
- **MUST run `pnpm build` before server startup** - compiles `src/swift/EventKitCLI.swift` to `bin/EventKitCLI`
- Requires **Xcode Command Line Tools** (install via `xcode-select --install`)
- Build script: `scripts/build-swift.mjs` compiles Swift with EventKit and Foundation frameworks
- Binary location: `bin/EventKitCLI` (resolved via project root discovery in `cliExecutor.ts`)
- Test environment: Sets `NODE_ENV=test` to mock binary paths and avoid Swift dependency
- **Info.plist embedding**: `src/swift/Info.plist` is embedded into binary via `-Xlinker -sectcreate` flags - this is REQUIRED for macOS permission dialogs to appear when running from MCP clients like Cursor

### Project Structure Constraints
- **ES Modules only**: Package type is `"module"`, all imports must use `.js` extensions even for `.ts` files
- **TypeScript Config**: `moduleResolution: "NodeNext"` requires explicit `.js` in import paths
- **Project Root Discovery**: `src/utils/projectUtils.ts` walks up to 10 directories to find `package.json` with name `"mcp-server-apple-reminders"`
- Entry point: `bin/run.cjs` (CommonJS wrapper) → `dist/index.js` (compiled ES module)

## Architecture Overview

### Three-Layer System

**1. MCP Server Layer** (`src/server/`)
- `server.ts`: Creates MCP Server instance with stdio transport
- `handlers.ts`: Registers MCP protocol handlers (tools, prompts, resources)
- `prompts.ts`: Six structured prompt templates for task management workflows

**2. Tools Layer** (`src/tools/`)
- `definitions.ts`: MCP tool schemas (JSON Schema format for `reminders` and `lists` tools)
- `handlers.ts`: Tool implementation - all handlers use `handleAsyncOperation` wrapper for consistent error handling
- `index.ts`: Routes tool calls by action type (read/create/update/delete/move)

**3. Swift CLI Execution** (`src/swift/EventKitCLI.swift`)
- **Single source of truth** for all EventKit operations (Reminders and Calendar Events) - TypeScript layer ONLY calls this binary
- EventKit integration: Reads and writes reminders and calendar events via native macOS APIs
- JSON I/O: Accepts CLI args, returns `{status: "success", result: T}` or `{status: "error", message: string}`
- Reminder actions: `read`, `create`, `update`, `delete`, `move`, `create-list`, `update-list`, `delete-list`
- Calendar event actions: `read-events`, `read-calendars`, `create-event`, `update-event`, `delete-event`

### Data Flow

```
User Request → MCP Protocol → tools/index.ts (routing)
  → tools/handlers.ts (validation via Zod schemas)
  → utils/reminderRepository.ts (wraps cliExecutor)
  → utils/cliExecutor.ts (executes Swift binary)
  → Swift EventKitCLI (EventKit operations)
  → JSON response back through layers
```

## Key Implementation Details

### Swift CLI Interface (`src/swift/EventKitCLI.swift`)

**Date Handling:**
- Supports 7 input formats: ISO 8601 variants, `YYYY-MM-DD HH:mm:ss`, `YYYY-MM-DD HH:mm`, `YYYY-MM-DD`
- Parser: `parseDateComponents()` tries DateFormatter with en_US_POSIX locale, falls back to ISO8601DateFormatter
- Time detection: Checks for `:` or `T` in input to determine if time components should be included
- Output: ISO 8601 format via `ISO8601DateFormatter().string(from:)`

**URL Storage Strategy:**
- Dual storage: EventKit `url` field (single URL) + structured format in `notes` field
- Notes format: `"Original note\n\nURLs:\n- https://url1.com\n- https://url2.com"`
- TypeScript utilities in `src/utils/urlHelpers.ts`: `extractUrlsFromNotes`, `parseReminderNote`, `formatNoteWithUrls`

**Permission Handling:**
- macOS 14+: `requestFullAccessToReminders()` and `requestFullAccessToEvents()`
- Pre-macOS 14: `requestAccess(to: .reminder)` and `requestAccess(to: .event)`
- Blocking: Uses `DispatchSemaphore` to wait for async permission grant before proceeding
- **Info.plist requirement**: Binary must have embedded Info.plist with `NSCalendarsUsageDescription` and `NSRemindersUsageDescription` keys for system permission dialogs to appear - build script automatically embeds `src/swift/Info.plist`
- **RunLoop requirement**: `RunLoop.main.run()` keeps process alive for async permission callbacks (line 693)
- Permission flow: TypeScript layer spawns CLI process → Swift requests permission → macOS shows dialog → user grants/denies → CLI returns status

### Validation Strategy (`src/validation/schemas.ts`)

**Security-First Design:**
- `SAFE_TEXT_PATTERN`: Blocks control chars (0x00-0x1F except \n\r\t), allows Unicode (CJK, extended Latin)
- `URL_PATTERN`: Blocks localhost/private IPs (127.*, 192.168.*, 10.*, 0.0.0.0) to prevent SSRF attacks
- Max lengths: Title 200 chars, Note 2000 chars, List name 100 chars, Search 100 chars

**Zod Schema Pattern:**
- Factory functions: `createSafeTextSchema()`, `createOptionalSafeTextSchema()` for DRY principle
- Action-specific schemas: `CreateReminderSchema`, `UpdateReminderSchema`, `MoveReminderSchema`, etc.
- Validation function: `validateInput(schema, data)` throws descriptive errors on failure

### Error Handling Conventions

**Consistent Response Format:**
```typescript
{
  content: [{ type: 'text', text: string }],
  isError: boolean
}
```

**Error Wrapper:** `handleAsyncOperation(operation, operationName)` in `src/utils/errorHandling.ts`
- Catches all errors from async operations
- Logs errors via `logError()`
- Returns formatted CallToolResult with `isError: true`

### Testing Strategy (`jest.config.mjs`)

**ESM Support:**
- Preset: `ts-jest/presets/default-esm`
- Transform: ts-jest with `useESM: true`, module `ES2022`, target `ES2020`
- Module mapper: `'^(\\.{1,2}/.*)\\.js$': '$1'` - strips `.js` extension for imports
- Ignores TS diagnostic code `TS151001` (import.meta errors in non-ESM contexts)

**Mock Strategy:**
- `src/test-setup.ts`: Mocks console, sets `NODE_ENV=test`, mocks `import.meta`
- `src/tools/handlers.test.ts`: Mocks `cliExecutor.js` to avoid binary dependency
- Test isolation: Each handler test mocks `reminderRepository` methods

**Critical:** Obsolete test files (`projectUtils.test.ts`, `reminders.test.ts`) have been removed - they tested AppleScript implementation replaced by Swift CLI.

## Common Development Workflows

### Adding a New Reminder Field

1. **Swift binary** (`src/swift/EventKitCLI.swift`):
   - Add parameter to `ArgumentParser.get()` in main switch cases
   - Add parameter to `RemindersManager` method (e.g., `createReminder()`)
   - Update `ReminderJSON` struct with new field
   - Update `toJSON()` extension method

2. **TypeScript schemas** (`src/validation/schemas.ts`):
   - Add Zod schema for new field (e.g., `SafePrioritySchema`)
   - Add field to action schemas (e.g., `CreateReminderSchema.shape`)

3. **Tool definitions** (`src/tools/definitions.ts`):
   - Add field to `inputSchema.properties` with description and type

4. **Repository layer** (`src/utils/reminderRepository.ts`):
   - Add field to `CreateReminderData` or `UpdateReminderData` interface
   - Pass new field to `executeCli()` args array

5. **Tests**:
   - Add test cases in `src/tools/handlers.test.ts`
   - Run `pnpm test` to verify

### Debugging Swift Binary Issues

```bash
# Manual CLI invocation to test Swift binary
./bin/EventKitCLI --action read --showCompleted true

# Check binary exists and is executable
ls -la bin/EventKitCLI

# Rebuild Swift binary
pnpm build

# View Swift compiler warnings
pnpm build 2>&1 | grep warning

# Test with enhanced logging
NODE_ENV=development ./bin/EventKitCLI --action read
```

### Updating MCP Protocol Version

When `@modelcontextprotocol/sdk` is updated:
1. Check breaking changes in SDK changelog
2. Update `src/server/server.ts` capabilities if needed
3. Update `src/server/handlers.ts` for new request types
4. Update `src/tools/definitions.ts` for schema changes
5. Run full test suite: `pnpm test`

## Prompt Templates (`src/server/prompts.ts`)

Six production-ready templates with shared structure: mission statement, numbered process steps, constraints, output format, quality criteria.

- `daily-task-organizer`: Same-day execution blueprint with time blocks
- `smart-reminder-creator`: Converts task descriptions to structured reminders
- `reminder-review-assistant`: Inbox triage with stale reminder detection
- `weekly-planning-workflow`: Monday-to-Sunday planning with focus areas
- `reminder-cleanup-guide`: Safe list pruning strategies
- `goal-tracking-setup`: Recurring reminders for long-term goals

**Design Principle:** Prompts request missing context before destructive actions (e.g., "Which list should I organize?" vs. blindly organizing all lists).

**Testing:** `src/server/prompts.test.ts` validates metadata completeness, argument schemas, and output format consistency.

## macOS-Specific Considerations

- **Permissions**: First run triggers system dialogs for EventKit and Automation access
  - **Critical**: Binary requires embedded Info.plist with privacy usage descriptions (`NSCalendarsUsageDescription`, `NSRemindersUsageDescription`)
  - Without Info.plist, permission dialogs will NOT appear in MCP clients (Cursor, Claude Desktop, etc.)
  - Build script automatically embeds `src/swift/Info.plist` using `-Xlinker -sectcreate __TEXT __info_plist`
  - Verify embedding with: `otool -s __TEXT __info_plist bin/EventKitCLI`
- **Platform Check**: Build script exits on non-macOS platforms
- **Swift Compiler**: Uses `swiftc` with `-framework EventKit -framework Foundation`
- **Locale Handling**: Swift uses `en_US_POSIX` locale for date parsing to avoid user locale issues
- **Unicode Support**: Full CJK character support for Chinese reminder lists (e.g., "提醒事项")

## Known Constraints

- **ID-based operations**: Update/delete/move require unique reminder IDs from prior read operations
- **Single URL in EventKit field**: EventKit `url` property stores one URL; multiple URLs use notes field
- **No recurring reminders**: EventKit recurrence rules not exposed in current implementation
- **Synchronous Swift execution**: Uses `DispatchSemaphore` to block async EventKit operations (acceptable for CLI context)
- **Binary path resolution**: Project root must be within 10 directory levels of execution context
