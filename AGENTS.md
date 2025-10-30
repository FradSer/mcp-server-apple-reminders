# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`, segmented into clean architecture rings enforcing inward-only dependencies.
Transport logic in `src/server/` consumes the Swift bridge without leaning on outer layers.
Workflows sit in `src/tools/`, AppleScript helpers in `src/utils/`, and validation contracts in `src/validation/` guard reminder payloads.
macOS helpers in `src/swift/` compile into distributable artifacts, so treat `dist/` as generated and rebuild instead of editing outputs.
Tests sit beside subjects as `*.test.ts` like `src/index.test.ts`, keeping guardrails close.

## Build, Test, and Development Commands
Run `pnpm install` to sync dependencies with the locked graph and prevent drift between TypeScript and Swift components.
Use `pnpm dev` for watch-mode CLI parity without rebuilding Swift.
Execute `pnpm build:swift` whenever AppleScript or Swift helper changes because the server binary is not version-controlled.
Run `pnpm test` and `pnpm exec biome check` before commits to enforce formatting and lint rules.

## Coding Style & Naming Conventions
Biome enforces two-space indentation, single quotes, and sorted imports across the codebase.
Adopt camelCase for variables, PascalCase for classes, and reuse existing constants from `src/utils/constants.ts` when screaming snake case is required.
Prefer composition and dependency injection so outer layers lean only on inner abstractions.
Never embed secrets or tokens; load configuration via `.env.local` and typed contracts in `src/validation/`.

## Testing Guidelines
Practice strict TDD by writing the failing Jest spec first beside the unit under test.
Leverage `ts-jest` with shared fixtures in `src/utils/__mocks__/` to keep reminder schema expectations stable.
Guard new prompt templates by extending `src/server/prompts.test.ts` to assert structure and Zod compatibility.
Isolate prompt failures with `pnpm test -- src/server/prompts.test.ts`.

## Commit & Pull Request Guidelines
Commit messages follow lowercase conventional prefixes like `feat:` or `fix:` and stay under fifty characters.
Group changes atomically so each commit tells a coherent story and leaves tests green.
Before opening a pull request, document verification commands and link the relevant issue for traceability.
Merge via merge commits only after CI passes, keeping a record of touched layers in the description.

## Security & Configuration Tips
Grant macOS Reminders and Calendar permissions locally or the Swift bridge aborts before integration tests reach the transport layer.
Store secrets in `.env.local` and exclude them from version control to prevent leaking reminder data.
Run `pnpm audit --prod` ahead of release branches to surface platform-specific CVEs in the Swift toolchain.
