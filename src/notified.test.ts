import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Notified } from './notified'

describe('Notified first-run state', () => {
  let dir: string
  let file: string
  const originalEnv = process.env.NOTIFIED_FILE

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notified-'))
    file = path.join(dir, 'notified.json')
    process.env.NOTIFIED_FILE = file
  })

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
    if (originalEnv === undefined) {
      delete process.env.NOTIFIED_FILE
    } else {
      process.env.NOTIFIED_FILE = originalEnv
    }
  })

  it('treats both streams as first when the file does not exist', () => {
    expect(Notified.isFirst('illust')).toBe(true)
    expect(Notified.isFirst('novel')).toBe(true)
  })

  it('initializes the novel stream without initializing the illust stream', () => {
    Notified.addNotified('novel', 1)
    Notified.markInitialized('novel')

    expect(Notified.isFirst('novel')).toBe(false)
    expect(Notified.isFirst('illust')).toBe(true)
  })

  it('records initialization of an empty stream', () => {
    Notified.markInitialized('illust')

    expect(fs.existsSync(file)).toBe(true)
    expect(Notified.isFirst('illust')).toBe(false)
    expect(Notified.isFirst('novel')).toBe(true)
  })

  it('keeps an interrupted first run uninitialized but remembers its items', () => {
    Notified.addNotified('illust', 1)

    expect(Notified.isFirst('illust')).toBe(true)
    expect(Notified.isNotified('illust', 1)).toBe(true)
  })

  it('treats a legacy file without initialized as initialized for both streams', () => {
    fs.writeFileSync(file, JSON.stringify({ illust: [1], novel: [2] }))

    expect(Notified.isFirst('illust')).toBe(false)
    expect(Notified.isFirst('novel')).toBe(false)

    Notified.addNotified('illust', 3)
    Notified.markInitialized('illust')

    const json = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(json).toEqual({ illust: [1, 3], novel: [2] })
    expect(Notified.isFirst('illust')).toBe(false)
  })
})
