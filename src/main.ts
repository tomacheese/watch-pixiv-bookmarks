import fs from 'node:fs'
import { Discord, DiscordEmbed, Logger } from '@book000/node-utils'
import { BookmarkRestrict, PixivClient } from '@book000/pixivts'
import { Notified } from './notified'

function isJSON(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

function isValidTokenJSON(data: object): data is { refresh_token: string } {
  try {
    return typeof data === 'object' && 'refresh_token' in data
  } catch {
    return false
  }
}

/** Exit code signalling a permanent token failure. Must match entrypoint.sh. */
const PERMANENT_AUTH_FAILURE_EXIT_CODE = 10

/**
 * Refreshes the pixiv token and persists it.
 * @returns The client, or `undefined` after a permanent refresh failure (exit code 10 is already set)
 * @throws If the token file is missing or invalid, or the refresh fails for another reason
 */
async function getPixiv(): Promise<PixivClient | undefined> {
  const logger = Logger.configure('getPixiv')
  const tokenPath = process.env.PIXIV_TOKEN_PATH ?? 'data/token.json'
  if (!fs.existsSync(tokenPath)) {
    throw new Error(`Token file does not exist: ${tokenPath}`)
  }

  const tokenRaw = fs.readFileSync(tokenPath, 'utf8')
  if (!isJSON(tokenRaw)) {
    throw new Error(`Token file is not JSON: ${tokenPath}`)
  }
  const tokenData = JSON.parse(tokenRaw)
  if (!isValidTokenJSON(tokenData)) {
    throw new Error(`Token file is not valid: ${tokenPath}`)
  }

  const inputRefreshToken = tokenData.refresh_token
  if (!inputRefreshToken) {
    throw new Error(`Refresh token is not defined: ${tokenPath}`)
  }

  let pixiv: PixivClient
  try {
    pixiv = await PixivClient.of(inputRefreshToken)
  } catch (error) {
    // An expired refresh token returns HTTP 400/401: permanent failure; anything else is rethrown
    if (!(error instanceof Error) || !/HTTP (400|401)$/.test(error.message)) {
      throw error
    }
    logger.error('🚨 Failed to refresh pixiv token (permanent failure)', error)
    // entrypoint.sh backs off its retry interval on this exit code
    process.exitCode = PERMANENT_AUTH_FAILURE_EXIT_CODE
    return
  }

  fs.writeFileSync(
    tokenPath,
    JSON.stringify({
      access_token: pixiv.getAccessToken(),
      user: {
        id: pixiv.userId,
      },
      refresh_token: pixiv.getRefreshToken(),
    })
  )

  return pixiv
}

async function getImageArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
      Referer: 'https://www.pixiv.net/',
    },
  })
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
  const data = await res.arrayBuffer()
  return data
}

async function getIllusts(pixiv: PixivClient, targetUserId: number) {
  const logger = Logger.configure('getIllusts')

  const bookmarkPublicIllusts = await pixiv.users.bookmarks.illusts({
    userId: targetUserId,
    restrict: BookmarkRestrict.PUBLIC,
  })
  if (bookmarkPublicIllusts.isErr) {
    logger.error(
      `🚨 Failed to get illust private bookmarks: ${JSON.stringify(bookmarkPublicIllusts.error)}`
    )
    return
  }

  const bookmarkPrivateIllusts = await pixiv.users.bookmarks.illusts({
    userId: targetUserId,
    restrict: BookmarkRestrict.PRIVATE,
  })
  if (bookmarkPrivateIllusts.isErr) {
    logger.error(
      `🚨 Failed to get illust private bookmarks: ${JSON.stringify(bookmarkPrivateIllusts.error)}`
    )
    return
  }

  return [
    ...bookmarkPublicIllusts.value.illusts.toReversed(),
    ...bookmarkPrivateIllusts.value.illusts.toReversed(),
  ]
}

async function getNovels(pixiv: PixivClient, targetUserId: number) {
  const logger = Logger.configure('getNovels')

  const bookmarkPublicNovels = await pixiv.users.bookmarks.novels({
    userId: targetUserId,
    restrict: BookmarkRestrict.PUBLIC,
  })
  if (bookmarkPublicNovels.isErr) {
    logger.error(
      `🚨 Failed to get novel public bookmarks: ${JSON.stringify(bookmarkPublicNovels.error)}`
    )
    return
  }

  const bookmarkPrivateNovels = await pixiv.users.bookmarks.novels({
    userId: targetUserId,
    restrict: BookmarkRestrict.PRIVATE,
  })
  if (bookmarkPrivateNovels.isErr) {
    logger.error(
      `🚨 Failed to get novel private bookmarks: ${JSON.stringify(bookmarkPrivateNovels.error)}`
    )
    return
  }

  return [
    ...bookmarkPublicNovels.value.novels.toReversed(),
    ...bookmarkPrivateNovels.value.novels.toReversed(),
  ]
}
function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function formatDateTime(date: Date) {
  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join(
      '-'
    ) +
    ' ' +
    [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(
      ':'
    )
  )
}

async function processIllusts(pixiv: PixivClient, discord: Discord) {
  const logger = Logger.configure('processIllusts')

  const targetUserId = Number(process.env.PIXIV_USER_ID)
  if (!targetUserId) {
    throw new Error('Target user ID is not defined')
  }

  const illusts = await getIllusts(pixiv, targetUserId)
  if (!illusts) {
    throw new Error('Failed to get illusts bookmarks')
  }

  const isFirst = Notified.isFirst('illust')

  const filteredBookmarkIllusts = illusts
    .filter((previous, index, self) => {
      return self.findIndex((illust) => illust.id === previous.id) === index
    })
    .filter((illust) => !Notified.isNotified('illust', illust.id))

  logger.info(`📸 Found ${filteredBookmarkIllusts.length} illusts`)

  for (const illust of filteredBookmarkIllusts) {
    const {
      id: illustId,
      title,
      caption: captionRaw,
      user: { name: username, id: userId },
      totalBookmarks,
      totalView,
      imageUrls: { large: imageUrl },
      tags: tagLists,
      createDate: createdDateRaw,
    } = illust

    const caption = captionRaw.replaceAll(/<("[^"]*"|'[^']*'|[^"'>])*>/g, '')
    const createdDate = new Date(createdDateRaw)
    const tags = tagLists.map((tag) => tag.name)

    console.log(`[Illust] ${title} ${illustId}`)

    const embed: DiscordEmbed = {
      title,
      url: `https://www.pixiv.net/artworks/${illustId}`,
      description: caption,
      color: 0x00_96_fa,
      fields: [
        {
          name: 'Tags',
          value: `\`${tags.join('` `')}\``,
          inline: true,
        },
        {
          name: 'Author',
          value: `[${username}](https://www.pixiv.net/users/${userId})`,
          inline: true,
        },
        {
          name: 'Bookmarks',
          value: totalBookmarks.toString(),
          inline: true,
        },
        {
          name: 'Views',
          value: totalView.toString(),
          inline: true,
        },
        {
          name: 'Created',
          value: formatDateTime(createdDate),
          inline: true,
        },
        {
          name: 'Open with app',
          value: `[Open](https://api.tomacheese.com/redirect/pixiv/illusts/${illustId})`,
          inline: true,
        },
      ],
      image: {
        url: 'attachment://image.png',
      },
    }

    if (!isFirst) {
      const arraybuffer = await getImageArrayBuffer(imageUrl)

      await discord.sendMessage({
        embeds: [embed],
        file: {
          name: 'image.png',
          file: arraybuffer,
        },
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    Notified.addNotified('illust', illustId)
  }

  if (isFirst) {
    Notified.markInitialized('illust')
  }
}

async function processNovels(pixiv: PixivClient, discord: Discord) {
  const logger = Logger.configure('processNovels')

  const targetUserId = Number(process.env.PIXIV_USER_ID)
  if (!targetUserId) {
    throw new Error('Target user ID is not defined')
  }

  const novels = await getNovels(pixiv, targetUserId)
  if (!novels) {
    throw new Error('Failed to get novels bookmarks')
  }

  const isFirst = Notified.isFirst('novel')

  const filteredBookmarkNovels = novels
    .filter((previous, index, self) => {
      return self.findIndex((novel) => novel.id === previous.id) === index
    })
    .filter((novel) => !Notified.isNotified('novel', novel.id))

  logger.info(`📚 Found ${filteredBookmarkNovels.length} novels`)

  for (const novel of filteredBookmarkNovels) {
    const {
      id: novelId,
      title,
      caption: captionRaw,
      user: { name: username, id: userId },
      tags: tagLists,
      totalBookmarks,
      totalView,
      createDate: createdDateRaw,
    } = novel

    const caption = captionRaw.replaceAll(/<("[^"]*"|'[^']*'|[^"'>])*>/g, '')
    const createdDate = new Date(createdDateRaw)
    const tags = tagLists.map((tag) => tag.name)

    console.log(`[Novel] ${title} ${novelId}`)

    const embed: DiscordEmbed = {
      title,
      url: `https://www.pixiv.net/novel/show.php?id=${novelId}`,
      description: caption,
      color: 0xad_ff_2f,
      fields: [
        {
          name: 'Tags',
          value: `\`${tags.join('` `')}\``,
          inline: true,
        },
        {
          name: 'Author',
          value: `[${username}](https://www.pixiv.net/users/${userId})`,
          inline: true,
        },
        {
          name: 'Bookmarks',
          value: totalBookmarks.toString(),
          inline: true,
        },
        {
          name: 'Views',
          value: totalView.toString(),
          inline: true,
        },
        {
          name: 'Created',
          value: formatDateTime(createdDate),
          inline: true,
        },
        {
          name: 'Open with app',
          value: `[Open](https://api.tomacheese.com/redirect/pixiv/novels/${novelId})`,
          inline: true,
        },
      ],
    }

    if (!isFirst) {
      await discord.sendMessage({
        embeds: [embed],
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    Notified.addNotified('novel', novelId)
  }

  if (isFirst) {
    Notified.markInitialized('novel')
  }
}

/**
 * Copies a thrown value into a fresh `Error` holding only its message and
 * stack, because extra properties can carry credentials (for example the
 * `input` of an invalid webhook URL error) that the logger would print.
 * @returns A new `Error` that is safe to log
 */
function sanitizeError(error: unknown): Error {
  const safe = new Error(error instanceof Error ? error.message : String(error))
  if (error instanceof Error) {
    // Keep the original stack; a new Error would point at this helper
    // eslint-disable-next-line unicorn/no-error-property-assignment
    safe.stack = error.stack
  }
  return safe
}

async function main() {
  const logger = Logger.configure('main')

  const pixiv = await getPixiv()
  if (!pixiv) {
    return
  }

  const discordToken = process.env.DISCORD_TOKEN
  const discordChannelId = process.env.DISCORD_CHANNEL_ID
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL

  let discord
  if (discordToken && discordChannelId) {
    discord = new Discord({
      token: discordToken,
      channelId: discordChannelId,
    })
  } else if (discordWebhookUrl) {
    discord = new Discord({
      webhookUrl: discordWebhookUrl,
    })
  } else {
    throw new Error(
      'Discord token and channel ID, or webhook URL is not defined'
    )
  }

  let failed = false
  for (const stage of [processIllusts, processNovels]) {
    try {
      await stage(pixiv, discord)
    } catch (error) {
      const safe = sanitizeError(error)
      logger.error('🚨', safe)
      failed = true
    }
  }
  if (failed) {
    process.exitCode = 1
  }
}

;(async () => {
  try {
    await main()
  } catch (error) {
    const safe = sanitizeError(error)
    Logger.configure('main').error('🚨', safe)
    if (process.exitCode !== PERMANENT_AUTH_FAILURE_EXIT_CODE) {
      process.exitCode = 1
    }
  }
})()
