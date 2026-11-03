# AGENTS.md

## Language

- Write all deliverables in English: commit messages, PR/Issue text, review comments, code comments and JSDoc, and documentation.
- Exceptions: end-user-facing Discord notification text, localized UI strings, quotations, technical identifiers, generated files, and external text.
- Error and log messages are in English and start with an emoji matching the existing ones (`🚨` error, `📸` illust, `📚` novel).

## Overview

Monitors the pixiv bookmarks of one user (illustrations and novels, public and private) and posts new ones to Discord, either through a bot token and channel or a webhook. Runs as a Docker container (TypeScript on Node.js, executed with `tsx`, managed with pnpm).

## Commands

```bash
pnpm install   # install dependencies
pnpm start     # run once (tsx ./src/main.ts)
pnpm dev       # run with tsx watch
pnpm lint      # prettier --check, eslint, tsc
pnpm fix       # prettier --write and eslint --fix
pnpm test      # jest (--passWithNoTests; no test files exist yet)
```

There is no build step; the Docker image runs the TypeScript sources directly.

## Architecture

- `src/main.ts`: fetches bookmarks through `@book000/pixivts`, builds Discord embeds and sends them with `@book000/node-utils` (`Logger`, `Discord`). Images are downloaded with the standard `fetch` (no axios).
- `src/notified.ts`: `Notified` class that persists notified item IDs as plain JSON (`data/notified.json`, or `NOTIFIED_FILE`).
- `entrypoint.sh`: Docker entrypoint that runs `pnpm start` in a loop. It waits 5 minutes between runs; on exit code 10 (permanent pixiv token refresh failure, HTTP 400/401) it doubles the wait up to 1 hour. The exit code is defined in `src/main.ts` and must stay in sync.
- `data/`: token file (`PIXIV_TOKEN_PATH`, default `data/token.json`) and notified list. Git-ignored.
- Environment variables: `PIXIV_USER_ID`, `DISCORD_TOKEN` + `DISCORD_CHANNEL_ID` or `DISCORD_WEBHOOK_URL`, `PIXIV_TOKEN_PATH`, `NOTIFIED_FILE`.

## Conventions

- Commits follow Conventional Commits; branches follow Conventional Branch (`feat/...`, `fix/...`). Do not add commits to Renovate PRs.
- Prettier: no semicolons, single quotes, `printWidth` 80, es5 trailing commas, always-parenthesized arrow parameters. ESLint: `@book000/eslint-config`.
- Add JSDoc to functions and interfaces.
- Naming: variables and functions camelCase; classes and interfaces PascalCase.
- Never bypass type checking with `skipLibCheck: true`.
- Keep the 1 second wait between Discord sends (rate limiting).
- Keep the first-run behavior (`Notified.isFirst()`): record items as notified without sending.
- Always go through `Notified.isNotified` / `Notified.addNotified` to avoid duplicate notifications.
- pixiv API results are `Result` values (`isErr`); check them. A failed image `fetch` (`!res.ok`) must throw, not be swallowed.

## Security

- Never commit anything under `data/` or credentials from environment variables (pixiv tokens, Discord token, webhook URL).
- Never put pixiv refresh/access tokens or Discord credentials in logs or error messages.

## Testing

- Jest with `ts-jest`; tests match `**/*.test.ts`. No tests exist, so `pnpm test` passes only because of `--passWithNoTests`.
- Add tests when changing or adding important logic such as notification decisions.
- Manual check: set `data/token.json` and a Discord destination, run `pnpm start`, and confirm the notifications.
