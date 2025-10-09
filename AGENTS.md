# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`, arranged by Clean Architecture rings: `server/` transports prompts, `tools/` orchestrates workflows, `utils/` bridges AppleScript, and `validation/` holds Zod contracts. `swift/` compiles the macOS helper consumed by the server transport; treat `dist/` as generated output and rebuild rather than editing artifacts. Tests reside beside their subjects as `*.test.ts`, preserving layer boundaries and preventing accidental cross-ring dependencies.

## Build, Test, and Development Commands
`pnpm install` locks dependencies to the committed graph so the Swift bridge and TypeScript stay in sync. `pnpm dev` runs `tsc --watch` for rapid iteration, while `pnpm build`, `pnpm build:ts`, and `pnpm build:swift` target full or focused builds. Always execute `pnpm test` or scope to `pnpm test -- src/server/prompts.test.ts` before sharing changes to catch prompt regressions early.

## Coding Style & Naming Conventions
Biome enforces two-space indentation, single quotes, and sorted imports; run `pnpm exec biome check` before every commit. Use camelCase for variables, PascalCase for classes, and reserve SCREAMING_SNAKE_CASE for constants already declared in `src/utils/constants.ts`. Limit functions to 50 lines, keep files under 300, and inject dependencies so outer layers depend only on abstractions.

## Testing Guidelines
Practice strict TDD by writing the failing Jest spec first, then the minimal implementation, and refactoring only with the suite green. `ts-jest` powers the runner, so keep typings accurate and reuse fixtures from `src/utils/__mocks__` to avoid brittle mocks. Every new prompt template needs a structural assertion in `src/server/prompts.test.ts` to guard against schema drift.

## Commit & Pull Request Guidelines
Commits follow lowercase conventional syntax such as `feat: sync reminders bridge` and stay under 50 characters. Document verification by running `pnpm exec biome check` and `pnpm test`, then noting those commands in the PR description. Pull requests must reference the issue, list touched layers, and merge via merge commits only after CI succeeds.

## Security & Configuration Tips
Grant Calendar and Reminders permissions locally; without them the Swift bridge aborts before integration tests can run. Store secrets in `.env.local`, never commit personal reminder data or `claude_desktop_config.json`, and keep the repo clean of hardcoded tokens. After modifying AppleScript, rebuild with `pnpm build:swift` and run `pnpm audit --prod` ahead of release branches to surface macOS-specific CVEs.
