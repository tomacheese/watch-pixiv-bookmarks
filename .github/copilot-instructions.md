# GitHub Copilot code review instructions

Project overview, commands, conventions and safety rules are in [AGENTS.md](../AGENTS.md). Write review comments in English.

## Review focus

- Credential leaks: pixiv tokens, `data/token.json` contents, or Discord credentials in logs, error messages or commits.
- Error handling: pixiv API `Result` values (`isErr`) must be checked, and a failed image `fetch` (`!res.ok`) must not be swallowed.
- Idempotency: notified items go through `Notified.isNotified` / `Notified.addNotified`, and the first-run behavior (record only, no sending) must be preserved.
- Type safety: no `skipLibCheck: true`; `pnpm lint` (includes `tsc`) must pass.
- Rate limiting: the 1 second wait between Discord sends must not be removed.
- Formatting follows Prettier and ESLint (see AGENTS.md).

## Do not flag (intentional)

- Standard `fetch` instead of axios.
- Plain JSON file (`data/notified.json`) instead of a database.
- Tests passing with `--passWithNoTests` because no test files exist.
