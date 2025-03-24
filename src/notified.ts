import fs from 'node:fs'

type NotifiedType = 'illust' | 'novel'

interface NotifiedJson {
  illust: number[]
  novel: number[]
}

export class Notified {
  public static isFirst(): boolean {
    const path = process.env.NOTIFIED_FILE ?? 'data/notified.json'
    return !fs.existsSync(path)
  }

  public static isNotified(type: NotifiedType, itemId: number): boolean {
    const path = process.env.NOTIFIED_FILE ?? 'data/notified.json'
    const json: NotifiedJson = fs.existsSync(path)
      ? JSON.parse(fs.readFileSync(path, 'utf8'))
      : {
          illust: [],
          novel: [],
        }

    return json[type].includes(itemId)
  }

  public static addNotified(type: NotifiedType, itemId: number): void {
    const path = process.env.NOTIFIED_FILE ?? 'data/notified.json'
    const json: NotifiedJson = fs.existsSync(path)
      ? JSON.parse(fs.readFileSync(path, 'utf8'))
      : {
          illust: [],
          novel: [],
        }

    json[type].push(itemId)
    fs.writeFileSync(path, JSON.stringify(json, null, 2))
  }
}
