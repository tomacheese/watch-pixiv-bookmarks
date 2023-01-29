import fs from 'node:fs'
import { PATH } from './config'

export class Notified {
  public static isFirst(): boolean {
    const path = PATH.NOTIFIED_FILE
    return !fs.existsSync(path)
  }

  public static isNotified(illustId: number): boolean {
    const path = PATH.NOTIFIED_FILE
    const json = fs.existsSync(path)
      ? JSON.parse(fs.readFileSync(path, 'utf8'))
      : []
    return json.includes(illustId)
  }

  public static addNotified(illustId: number): void {
    const path = PATH.NOTIFIED_FILE
    const json = fs.existsSync(path)
      ? JSON.parse(fs.readFileSync(path, 'utf8'))
      : []
    json.push(illustId)
    fs.writeFileSync(path, JSON.stringify(json))
  }
}
