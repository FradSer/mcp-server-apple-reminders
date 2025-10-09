# Repository Guidelines

## Project Structure & Module Organization
The TypeScript source lives under `src/`, segmented into `server/` for MCP transport, `tools/` for prompt orchestration, `utils/` for AppleScript integration, `validation/` for Zod schemas, and `swift/` for the macOS helper binary. Tests sit beside their subjects as `*.test.ts`, keeping fixtures close to behaviour and reinforcing the Clean Architecture rule that outer layers (`server` and `tools`) may depend on inner utilities, never the reverse. Generated output lands in `dist/`; treat it as read-only and rebuild instead of editing artifacts.

## Build, Test, and Development Commands
- `pnpm install` synchronizes dependencies against the committed lockfile.
- `pnpm build` compiles Swift and TypeScript, producing binaries under `dist/`.
- `pnpm build:ts` recompiles only the TypeScript boundary when the Swift layer is untouched.
- `pnpm build:swift` runs `src/swift/build.sh`, required after modifying any Swift source.
- `pnpm dev` starts `tsc --watch` for tight feedback while coding.
- `pnpm start` executes the compiled MCP server for manual runs.
- `pnpm test` invokes Jest through `ts-jest`; pair it with `--watch` during red-green TDD loops.

## Coding Style & Naming Conventions
Biome enforces two-space indentation, single quotes, and import ordering; run `pnpm exec biome check` if you need a local report before pushing. Use camelCase for variables, PascalCase for classes, UPPER_SNAKE_CASE for constants in `utils/constants.ts`, and keep functions under fifty lines by extracting composable helpers. Prefer dependency injection and pure functions so higher layers can be mocked in tests.

## Testing Guidelines
Jest powers the suite with `ts-jest`, so seed every feature with a failing `.test.ts` before implementing behaviour. Mirror implementation filenames, describe scenarios explicitly, and lean on fixtures in `src/utils/__mocks__` to avoid touching real Reminders data. All commits must leave `pnpm test` green on macOS 13+ where the Swift binary can execute.

## Commit & Pull Request Guidelines
Commits follow lowercase conventional commits under fifty characters (`feat: add reminder filters`), bundling one logical change plus its tests. Pull requests should outline architectural impact, call out dependency edges touched, link tracking issues, and paste the commands you ran (`pnpm exec biome check`, `pnpm test`, `pnpm build`).

## Security & Configuration Tips
Grant Calendar and Reminders permissions in macOS System Settings before running integration scenarios, because the Swift bridge exits early when authorization fails. Never commit personal reminder payloads or `claude_desktop_config.json`, and prefer environment variables or local config files in `.gitignore` for any credentials or paths.
