# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Apple Events MCP server - Native macOS integration using Swift CLI for EventKit operations.

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

# Single test pattern
pnpm test -- --testNamePattern="should handle create action"

# Permission verification
./check-permissions.sh    # Manual permission check script (Chinese UI)
pnpm test -- src/swift/Info.plist.test.ts  # Verify Info.plist privacy keys

# Development with enhanced logging
NODE_ENV=development pnpm start

# Manual Swift binary testing
./bin/EventKitCLI --action read --showCompleted true

# Verify Info.plist embedding
otool -s __TEXT __info_plist bin/EventKitCLI
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
- **Info.plist embedding**: `src/swift/Info.plist` is embedded into binary via `-Xlinker -sectcreate` flags - this is REQUIRED for macOS permission dialogs to appear when running from MCP clients like Cursor

### Project Structure Constraints

**ES Modules Configuration:**
- **Package type**: `"module"` in package.json - entire project uses ES modules
- **Import extensions**: All imports must use `.js` extensions even for `.ts` files
  - Correct: `import { foo } from './bar.js'`
  - Incorrect: `import { foo } from './bar'` or `import { foo } from './bar.ts'`
- **TypeScript Config**:
  - `moduleResolution: "NodeNext"` requires explicit `.js` in import paths
  - `module: "NodeNext"` for Node.js ESM compatibility
  - `target: "ES2020"` for modern JavaScript features
- **Entry point chain**: `bin/run.cjs` (CommonJS wrapper) → `dist/index.js` (compiled ES module)
- **Project Root Discovery**: `src/utils/projectUtils.ts` walks up to 10 directories to find `package.json` with name `"mcp-server-apple-events"`

**Critical Build Dependencies:**
- Binary location: `bin/EventKitCLI` (resolved via project root discovery in `cliExecutor.ts`)
- Test environment: Sets `NODE_ENV=test` to mock binary paths and avoid Swift dependency
- **Info.plist embedding**: `src/swift/Info.plist` is embedded into binary via `-Xlinker -sectcreate` flags - this is REQUIRED for macOS permission dialogs to appear when running from MCP clients like Cursor

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
- Supports 7+ input formats: ISO 8601 variants, `YYYY-MM-DD HH:mm:ss`, `YYYY-MM-DD HH:mm`, `YYYY-MM-DD`
- Timezone detection: Explicit timezone parsing via regex (`Z`, `±HH:MM`, `±HHMM`, `±HH`)
- Parser strategy:
  1. Detect explicit timezone suffix → extract timezone → parse with timezone-aware formatter
  2. Try DateFormatter with `en_US_POSIX` locale and multiple format strings
  3. Fallback to ISO8601DateFormatter
- Time detection: Checks for `:` or `T` in input to determine if time components should be included
- Date normalization: Uses `normalizedComponents()` to set calendar, timezone, and zero-out seconds/nanoseconds
- Output: ISO 8601 format via `ISO8601DateFormatter().string(from:)`
- **Critical**: All date parsing uses `en_US_POSIX` locale to avoid user locale issues

**Timezone Handling Architecture:**
- **Single Source of Truth**: Swift CLI handles ALL timezone conversions and date formatting
- **TypeScript Layer Contract**: Passes date strings as-is without modification
  - `reminderRepository.ts`: Removed `normalizeDueDateString()` call to avoid double conversion
  - Date strings flow unchanged from Swift → TypeScript → MCP client
- **Supported Formats**:
  - ISO 8601 with timezone: `2025-11-15T08:30:00Z` (UTC), `2025-11-15T16:30:00+08:00` (Asia/Shanghai)
  - Local format: `2025-11-15 16:30:00` (system timezone)
  - Date only: `2025-11-15` (assumes start of day in system timezone)
- **DST Handling**: Swift correctly handles DST transitions using EventKit's calendar system
  - Spring forward: 2:00 AM → 3:00 AM (1-hour gap)
  - Fall back: 2:00 AM occurs twice (with different offsets)
- **Design Decision**: Eliminating TypeScript-layer timezone conversion prevents:
  - Double conversion errors (Swift converts → TypeScript converts again)
  - Timezone mismatch between server and client
  - DST edge case bugs in JavaScript Date parsing
- **Schema Validation**: `TodayOnlyDateSchema` in `schemas.ts` enforces today-only policy at validation layer
  - Uses `getTodayStart()` and `getTomorrowStart()` from `dateUtils.ts` for local timezone comparison
  - Optional constraint for specific use cases (e.g., daily-task-organizer prompt)
- **Testing**: Comprehensive timezone integration tests in `timezoneIntegration.test.ts`
  - 14 test cases covering UTC, Asia/Shanghai, America/New_York, DST transitions, edge cases

**URL Storage Strategy:**
- Dual storage: EventKit `url` field (single URL) + structured format in `notes` field
- Notes format: `"Original note\n\nURLs:\n- https://url1.com\n- https://url2.com"`

**Permission Handling:**
- macOS 14+: `requestFullAccessToReminders()` and `requestFullAccessToEvents()`
- Pre-macOS 14: `requestAccess(to: .reminder)` and `requestAccess(to: .event)`
- Blocking: Uses `DispatchSemaphore` to wait for async permission grant before proceeding
- **Info.plist requirement**: Binary must have embedded Info.plist with privacy usage descriptions for system permission dialogs to appear - build script automatically embeds `src/swift/Info.plist`
  - Required keys: `NSRemindersUsageDescription`, `NSRemindersFullAccessUsageDescription`, `NSRemindersWriteOnlyAccessUsageDescription`
  - Calendar keys: `NSCalendarsUsageDescription`, `NSCalendarsFullAccessUsageDescription`, `NSCalendarsWriteOnlyAccessUsageDescription`
- **RunLoop requirement**: `RunLoop.main.run()` keeps process alive for async permission callbacks
- Permission flow: TypeScript layer spawns CLI process → Swift requests permission → macOS shows dialog → user grants/denies → CLI returns status
- **Auto-retry mechanism**: `cliExecutor.ts` detects permission errors via `CliPermissionError` → triggers AppleScript prompt via `permissionPrompt.ts` → retries Swift CLI once

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

### Binary Validation & Execution (`src/utils/cliExecutor.ts`, `src/utils/binaryValidator.ts`)

**Security-First Binary Resolution:**
- `findSecureBinaryPath()`: Validates binary existence and path constraints before execution
- Allowed paths: `/bin/`, `/dist/swift/bin/`, `/src/swift/bin/`, `/swift/bin/`
- Binary name: `EventKitCLI` (from `FILE_SYSTEM.SWIFT_BINARY_NAME`)
- Project root discovery: Walks up to 10 directories to find `package.json` with name `"mcp-server-apple-events"`
- Test environment: `NODE_ENV=test` mocks binary paths to avoid Swift dependency

**Permission Error Detection & Auto-Retry:**
- `CliPermissionError`: Thrown when permission keywords detected in CLI output
- Detection keywords: `['permission', 'authoriz']` (case-insensitive)
- Domain inference:
  - Calendar actions: `read-events`, `read-calendars`, `create-event`, `update-event`, `delete-event` → `'calendars'`
  - All other actions → `'reminders'`
- Auto-retry flow: Error detected → `triggerPermissionPrompt()` → AppleScript dialog → Retry once
- One-time retry: `retried` flag prevents infinite loops

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

**Coverage Requirements:**
- 100% coverage enforced across statements, branches, functions, and lines
- Excludes: test files, type definitions, mocks, `projectUtils.ts` (import.meta.url line)
- Coverage reports: text, text-summary, html

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

# Verify Info.plist is embedded in binary
otool -s __TEXT __info_plist bin/EventKitCLI

# Check permissions manually (Chinese UI)
./check-permissions.sh
```

**Common Issues:**
- **Binary not found**: Run `pnpm build` to compile Swift binary
- **Permission denied**: Swift binary requires embedded Info.plist - verify with `otool` command
- **Permission dialogs not appearing**: Info.plist missing or not embedded - check build logs
- **CLI returns empty output**: Check stderr, may be permission or EventKit error

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

### Prompt Abstractions (`src/server/promptAbstractions.ts`)

Shared abstractions for consistent behavior across all prompt templates:

**Confidence Level System:**
- `HIGH` (>80%): Actions are EXECUTED immediately using MCP tool calls
- `MEDIUM` (60-80%): Actions are provided as RECOMMENDATIONS in tool call format
- `LOW` (<60%): Actions are described as text, requiring user confirmation

**Helper Functions:**
- `buildConfidenceAction()`: Format confidence-based actions with tool calls
- `buildToolCall()`: Standard MCP tool call formatting
- `buildTimeFormat()`: Consistent time string generation (YYYY-MM-DD HH:mm:ss)
- `formatConfidenceAction()`: Format actions for output display
- `getActionQueueFormat()`: Standard action queue with confidence levels
- `getVerificationLogFormat()`: Standard verification output
**Shared Constraint Patterns:**
- `CONFIDENCE_CONSTRAINTS`: Standard confidence thresholds and execution rules
- `TIME_CONSISTENCY_CONSTRAINTS`: Due date alignment with urgency (immediate → 2hrs, quick wins → same day)
- `NOTE_FORMATTING_CONSTRAINTS`: Plain text only, minimal intervention principle, three allowed keywords (See:, Note:, Duration:)
- `TIME_BLOCK_CREATION_CONSTRAINTS`: When to create blocks vs. reminders (comprehensive calendar integration rules)
- `DEEP_WORK_CONSTRAINTS`: 60-90 minute blocks, max 4 hours/day, peak energy scheduling
- `SHALLOW_TASKS_CONSTRAINTS`: 15-60 minute blocks for routine work, batch when possible
- `DAILY_CAPACITY_CONSTRAINTS`: Workload balancing with implicit 20% buffer time
- `CALENDAR_PERMISSION_CONSTRAINTS`: Permission troubleshooting guidance
- `BATCHING_CONSTRAINTS`: Idempotency checks and tool call optimization (consolidated from 6 to 2 items for clarity)

**Standard Output Format:**
- `Current state`: Metrics (total, overdue, urgent)
- `Action queue`: Prioritized actions with confidence levels and tool calls
- `Verification log`: Confirms executed actions with timestamps
- Prompt-specific sections (gaps, questions, insights)

**Benefits:**
- DRY principle: No duplicated constraint logic between prompts
- Consistent UX: All prompts follow same action execution patterns
- Easy maintenance: Update constraints in one place
- Type safety: Interfaces prevent inconsistencies
- Testability: Tests validate abstraction consistency
- **Simplified**: Recent refactoring removed unused config constants and redundant constraints, reducing from ~70+ to ~60 total constraints for better maintainability

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
