import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const repositoryRoot = process.cwd()

describe('main exit code on token file failures', () => {
  let tempDir: string
  let tokenPath: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-pixiv-bookmarks-'))
    tokenPath = path.join(tempDir, 'token.json')
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  /**
   * Runs the entry point as a child process with all state under a temp dir.
   * @returns The exit status and the combined stdout/stderr text
   */
  function runMain(overrides: NodeJS.ProcessEnv = {}) {
    const result = spawnSync('pnpm', ['exec', 'tsx', 'src/main.ts'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      timeout: 50_000,
      env: {
        ...process.env,
        PIXIV_TOKEN_PATH: tokenPath,
        NOTIFIED_FILE: path.join(tempDir, 'notified.json'),
        LOG_DIR: tempDir,
        SENTRY_DSN: '',
        PIXIV_AUTH_FILE: undefined,
        ...overrides,
      },
    })
    return {
      status: result.status,
      output: `${result.stdout}${result.stderr}`,
    }
  }

  it('uses PIXIV_AUTH_FILE when the legacy variable is unset', () => {
    const { status, output } = runMain({
      PIXIV_TOKEN_PATH: undefined,
      PIXIV_AUTH_FILE: tokenPath,
    })

    expect(status).toBe(1)
    expect(output).toContain(`🚨 Token file does not exist: ${tokenPath}`)
  }, 60_000)

  it('gives the legacy path precedence over the container default', () => {
    const { status, output } = runMain({ PIXIV_AUTH_FILE: '/data/token.json' })

    expect(status).toBe(1)
    expect(output).toContain(`🚨 Token file does not exist: ${tokenPath}`)
  }, 60_000)

  it('exits 1 when the token file does not exist', () => {
    const { status, output } = runMain()

    expect(status).toBe(1)
    expect(output).toContain(`🚨 Token file does not exist: ${tokenPath}`)
  }, 60_000)

  it('exits 1 when the token file is not JSON', () => {
    fs.writeFileSync(tokenPath, 'not json')

    const { status, output } = runMain()

    expect(status).toBe(1)
    expect(output).toContain(`🚨 Token file is not JSON: ${tokenPath}`)
  }, 60_000)

  it('exits 1 when the token file has no refresh_token key', () => {
    fs.writeFileSync(tokenPath, '{}')

    const { status, output } = runMain()

    expect(status).toBe(1)
    expect(output).toContain(`🚨 Token file is not valid: ${tokenPath}`)
  }, 60_000)

  it('exits 1 when the refresh token is empty', () => {
    fs.writeFileSync(tokenPath, JSON.stringify({ refresh_token: '' }))

    const { status, output } = runMain()

    expect(status).toBe(1)
    expect(output).toContain(`🚨 Refresh token is not defined: ${tokenPath}`)
  }, 60_000)
})
