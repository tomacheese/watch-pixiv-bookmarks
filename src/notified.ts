import fs from 'node:fs'

type NotifiedType = 'illust' | 'novel'

/** Persisted shape of the notified file. */
interface NotifiedJson {
  illust: number[]
  novel: number[]
  /** Absent in files written before per-stream state existed (legacy). */
  initialized?: Record<NotifiedType, boolean>
}

/** Returns the notified file path, read from the environment on every call. */
function getPath(): string {
  return process.env.NOTIFIED_FILE ?? 'data/notified.json'
}

/**
 * Loads the notified file.
 * When the file is absent, returns an empty state with both streams uninitialized.
 */
function load(): NotifiedJson {
  const path = getPath()
  const json: NotifiedJson = fs.existsSync(path)
    ? JSON.parse(fs.readFileSync(path, 'utf8'))
    : {
        illust: [],
        novel: [],
        initialized: { illust: false, novel: false },
      }
  return json
}

/** Writes the notified file, creating it when absent. */
function save(json: NotifiedJson): void {
  fs.writeFileSync(getPath(), JSON.stringify(json, null, 2))
}

export class Notified {
  /**
   * Whether the given stream has not completed its first run yet.
   * A file without `initialized` was written before per-stream state existed,
   * so both of its streams count as initialized.
   */
  public static isFirst(type: NotifiedType): boolean {
    const json = load()
    return !!json.initialized && !json.initialized[type]
  }

  /**
   * Records that the first run of the given stream has completed.
   * Creates the file when absent; a no-op for a file without `initialized`.
   */
  public static markInitialized(type: NotifiedType): void {
    const json = load()
    if (!json.initialized) return

    json.initialized[type] = true
    save(json)
  }

  public static isNotified(type: NotifiedType, itemId: number): boolean {
    return load()[type].includes(itemId)
  }

  public static addNotified(type: NotifiedType, itemId: number): void {
    const json = load()
    json[type].push(itemId)
    save(json)
  }
}
