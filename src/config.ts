import fs from 'node:fs'

export const PATH = {
  CONFIG_FILE: process.env.CONFIG_FILE || 'data/config.json',
  NOTIFIED_FILE: process.env.NOTIFIED_FILE || 'data/notified.json',
  TOKEN_FILE: process.env.TOKEN_FILE || 'data/token.json',
}

export interface Configuration {
  /** Discord webhook URL or bot token */
  discord: {
    /** Discord webhook URL (required if using webhook) */
    webhook_url?: string
    /** Discord bot token (required if using bot) */
    token?: string
    /** Discord channel ID (required if using bot) */
    channel_id?: string
  }
  filter?: {
    /** Ignore tags */
    ignore_tags: string[]
  }
}

const isConfig = (config: any): config is Configuration => {
  return (
    config &&
    typeof config.discord === 'object' &&
    // webhook_url があるか token と channel_id があるか
    (config.discord.webhook_url ||
      (config.discord.token && config.discord.channel_id)) &&
    // webhook_url があるとき、string である
    (config.discord.webhook_url === undefined ||
      typeof config.discord.webhook_url === 'string') &&
    // token があるとき、string である
    (config.discord.token === undefined ||
      typeof config.discord.token === 'string') &&
    // channel_id があるとき、string である
    (config.discord.channel_id === undefined ||
      typeof config.discord.channel_id === 'string') &&
    // filter があるとき、object である
    (config.filter === undefined || typeof config.filter === 'object') &&
    // filter.ignore_tags があるとき、string[] である
    (config.filter?.ignore_tags === undefined ||
      Array.isArray(config.filter.ignore_tags))
  )
}

export function loadConfig(): Configuration {
  if (!fs.existsSync(PATH.CONFIG_FILE)) {
    throw new Error('Config file not found')
  }
  const config = JSON.parse(fs.readFileSync(PATH.CONFIG_FILE, 'utf8'))
  if (!isConfig(config)) {
    throw new Error('Invalid config')
  }
  return config
}
