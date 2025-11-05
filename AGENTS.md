# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`, segmented into clean architecture rings so dependencies flow inward. Transport adapters sit in `src/server/`, the Swift bridge lives in `src/swift/`, and automation workflows stay under `src/tools/`. Shared helpers live in `src/utils/`, while `src/validation/` enforces Zod contracts on every reminder payload. Tests co-locate as `*.test.ts` beside subjects to keep TDD feedback immediate, and generated binaries rebuild instead of touching `dist/`.

## Build, Test, and Development Commands
Run `pnpm install` to sync the locked dependency graph that coordinates TypeScript and Swift toolchains. Use `pnpm dev` for watch-mode development without recompiling Swift components. Execute `pnpm test` to run the Jest suite through `ts-jest` and mocks. Run `pnpm exec biome check` before commits to enforce formatting, linting, and import ordering, and rebuild native helpers with `pnpm build:swift` whenever AppleScript or Swift glue changes.

## Coding Style & Naming Conventions
Biome enforces two-space indentation, single quotes, and sorted imports across `.ts` files. Choose camelCase for variables and functions, PascalCase for classes, and reuse screaming snake constants from `src/utils/constants.ts` when system identifiers need emphasis. Prefer composition, dependency injection, and repository abstractions to keep outer layers independent of inner logic, and comment only to justify architectural trade-offs or business rules.

## Testing Guidelines
Follow strict RED-GREEN-REFACTOR cycles by writing a failing Jest spec beside each new unit. Use the fixtures under `src/__mocks__/` to stabilize reminder schema behavior and initialize shared state through `src/test-setup.ts`. Narrow prompt template changes by targeting `pnpm test -- src/server/prompts.test.ts`. Name specs `<module>.test.ts` for discoverability and prioritize schema and error-path coverage before happy paths.

## Commit & Pull Request Guidelines
Craft conventional commits such as `feat: add transport validator`, keeping titles lowercase and under 50 characters. Ensure every commit leaves `pnpm test` and `pnpm exec biome check` green to maintain CI parity. PRs require actionable descriptions, verification command logs, and linked issues for traceability, and provide screenshots or logs when modifying transport flows or reminder outputs. Merge via merge commits only after CI and security checks pass.

## Security & Configuration Tips
Store secrets exclusively in `.env.local` and load them through typed contracts to avoid leaking reminder data. Grant macOS Reminders and Calendar permissions locally; the Swift bridge aborts before integration tests without them. Run `pnpm audit --prod` ahead of release branches to surface Swift toolchain CVEs, and stub external services via dependency injection instead of hardcoding tokens or calendar IDs.

## Permission Handling
macOS permissions for Reminders and Calendar are now automatically requested when needed. The Swift CLI (`src/swift/EventKitCLI.swift`) handles all permission checking and requesting using `EKEventStore.authorizationStatus()` following EventKit best practices. It checks permission status before operations:
- If authorized: proceeds directly
- If notDetermined: requests permission automatically
- If denied/restricted: returns clear error message

TypeScript handlers trust Swift layer's permission handling and do not duplicate permission checks. The Swift CLI automatically handles permission requests following EventKit best practices.
