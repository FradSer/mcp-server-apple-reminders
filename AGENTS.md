# Repository Guidelines

## Project Structure & Module Organization
The TypeScript entrypoint is `src/index.ts`, which boots the MCP server defined under `src/server`. Request handlers live in `src/server/handlers.ts` and helper logic sits in `src/utils`, with co-located tests such as `src/utils/logger.test.ts`. Swift scaffolding for the native Reminders bridge lives in `src/swift`, including `build.sh` and the generated `bin/GetReminders`. Built artifacts land in `dist/`; regenerate them rather than editing manually. Shared type definitions live in `src/types`, while validation schemas reside in `src/validation`.

## Build, Test, and Development Commands
Use `pnpm install` to sync dependencies. `pnpm build` runs the Swift bridge build and the TypeScript compiler, producing `dist/`. Run `pnpm build:swift` when you touch Swift sources; macOS with Xcode command-line tools is required. `pnpm dev` starts `tsc --watch` for incremental builds. Execute `pnpm start` to launch the compiled server locally. `pnpm test` runs Jest with the TypeScript config defined in `jest.config.mjs`.

## Coding Style & Naming Conventions
Biome (`biome.json`) enforces formatting; run `pnpm exec biome check .` before commits if you need lint feedback. Keep two-space indentation, single quotes, and trailing semicolons. Use `camelCase` for functions and variables, `PascalCase` for classes and TypeScript types, and `SCREAMING_SNAKE_CASE` only for constants. Organize imports logically (Node built-ins, third-party, internal) and prefer zod schemas from `src/validation` for runtime checks.

## Testing Guidelines
Write tests alongside code using the `*.test.ts` naming pattern. Rely on Jest plus the shared setup in `src/test-setup.ts` for environment mocks. Favor unit coverage for utilities and handler behavior; integration tests should stub the Swift bridge via the provided mocks in `src/utils/__mocks__`. Always run `pnpm test` before opening a pull request.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `refactor:`) as seen in `git log`. Keep commits scoped and include context for Swift or AppleScript changes. Pull requests should summarize behavior changes, reference linked issues, and describe testing (`pnpm build`, `pnpm test`). Add screenshots or transcripts when agent-facing prompt flows change.
