import axios from 'axios'
import FormData from 'form-data'
import { Configuration } from './config'

export interface DiscordEmbedFooter {
  text: string
  icon_url?: string
  proxy_icon_url?: string
}

export interface DiscordEmbedImage {
  url?: string
  proxy_url?: string
  height?: number
  width?: number
}

export interface DiscordEmbedThumbnail {
  url?: string
  proxy_url?: string
  height?: number
  width?: number
}

export interface DiscordEmbedVideo {
  url?: string
  proxy_url?: string
  height?: number
  width?: number
}

export interface DiscordEmbedProvider {
  name?: string
  url?: string
}

export interface DiscordEmbedAuthor {
  name?: string
  url?: string
  icon_url?: string
  proxy_icon_url?: string
}

export interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface DiscordEmbed {
  title?: string
  type?: 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link'
  description?: string
  url?: string
  timestamp?: string
  color?: number
  footer?: DiscordEmbedFooter
  image?: DiscordEmbedImage
  thumbnail?: DiscordEmbedThumbnail
  video?: DiscordEmbedVideo
  provider?: DiscordEmbedProvider
  author?: DiscordEmbedAuthor
  fields?: DiscordEmbedField[]
}

export async function sendDiscordMessage(
  config: Configuration,
  text: string,
  embed?: DiscordEmbed,
  arraybuffer?: ArrayBuffer
): Promise<void> {
  const formData = new FormData()
  formData.append(
    'payload_json',
    JSON.stringify({
      content: text,
      embeds: [embed],
    })
  )

  if (arraybuffer) {
    formData.append('file', arraybuffer, {
      filename: 'image.png',
      contentType: 'image/png',
    })
  }

  // webhook or bot
  if (config.discord.webhook_url) {
    // webhook
    const response = await axios.post(config.discord.webhook_url, formData, {
      headers: formData.getHeaders(),
    })

    if (response.status !== 204 && response.status !== 200) {
      throw new Error(`Discord webhook failed (${response.status})`)
    }
    return
  }
  if (config.discord.token && config.discord.channel_id) {
    // bot
    const response = await axios.post(
      `https://discord.com/api/channels/${config.discord.channel_id}/messages`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bot ${config.discord.token}`,
        },
      }
    )
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Discord bot failed (${response.status})`)
    }
  }
}
