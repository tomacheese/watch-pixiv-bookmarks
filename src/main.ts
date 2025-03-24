import fs from 'node:fs'
import { Discord, DiscordEmbed, Logger } from '@book000/node-utils'
import { BookmarkRestrict, Pixiv } from '@book000/pixivts'
import { Notified } from './notified'
import axios from 'axios'

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
    if (typeof data !== 'object') {
      return false
    }
    if ('refresh_token' in data) {
      return true
    }
    return false
  } catch {
    return false
  }
}

async function getPixiv() {
  const logger = Logger.configure('getPixiv')
  const tokenPath = process.env.PIXIV_TOKEN_PATH ?? 'data/token.json'
  if (!fs.existsSync(tokenPath)) {
    logger.error(`🚨 Token file does not exist: ${tokenPath}`)
    return
  }

  const tokenRaw = fs.readFileSync(tokenPath, 'utf8')
  if (!isJSON(tokenRaw)) {
    logger.error(`🚨 Token file is not JSON: ${tokenPath}`)
    return
  }
  const tokenData = JSON.parse(tokenRaw)
  if (!isValidTokenJSON(tokenData)) {
    logger.error(`🚨 Token file is not valid: ${tokenPath}`)
    return
  }

  const inputRefreshToken = tokenData.refresh_token
  if (!inputRefreshToken) {
    logger.error(`🚨 Refresh token is not defined: ${tokenPath}`)
    return
  }

  const isEnabledResponseSave = !!process.env.RESPONSE_DB_HOSTNAME
  const pixiv = await Pixiv.of(inputRefreshToken, {
    debugOptions: {
      outputResponse: {
        enable: isEnabledResponseSave,
      },
    },
  })

  fs.writeFileSync(
    tokenPath,
    JSON.stringify({
      access_token: pixiv.accessToken,
      user: {
        id: pixiv.userId,
      },
      refresh_token: pixiv.refreshToken,
    })
  )

  return pixiv
}

async function getImageArrayBuffer(url: string): Promise<ArrayBuffer> {
  const { data } = await axios.get<ArrayBuffer>(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
      Referer: 'https://www.pixiv.net/',
    },
    responseType: 'arraybuffer',
  })

  return data
}

async function getIllusts(pixiv: Pixiv, targetUserId: number) {
  const logger = Logger.configure('getIllusts')

  const bookmarkPublicIllusts = await pixiv.userBookmarksIllust({
    userId: targetUserId,
    restrict: BookmarkRestrict.PUBLIC,
  })
  if (bookmarkPublicIllusts.status !== 200) {
    logger.error(
      `🚨 Failed to get illust private bookmarks: ${bookmarkPublicIllusts.status} ${JSON.stringify(bookmarkPublicIllusts.data)}`
    )
    return
  }

  const bookmarkPrivateIllusts = await pixiv.userBookmarksIllust({
    userId: targetUserId,
    restrict: BookmarkRestrict.PRIVATE,
  })
  if (bookmarkPrivateIllusts.status !== 200) {
    logger.error(
      `🚨 Failed to get illust private bookmarks: ${bookmarkPrivateIllusts.status} ${JSON.stringify(bookmarkPrivateIllusts.data)}`
    )
    return
  }

  return [
    ...bookmarkPublicIllusts.data.illusts.reverse(),
    ...bookmarkPrivateIllusts.data.illusts.reverse(),
  ]
}

async function getNovels(pixiv: Pixiv, targetUserId: number) {
  const logger = Logger.configure('getNovels')

  const bookmarkPublicNovels = await pixiv.userBookmarksNovel({
    userId: targetUserId,
    restrict: BookmarkRestrict.PUBLIC,
  })
  if (bookmarkPublicNovels.status !== 200) {
    logger.error(
      `🚨 Failed to get novel public bookmarks: ${bookmarkPublicNovels.status} ${JSON.stringify(bookmarkPublicNovels.data)}`
    )
    return
  }

  const bookmarkPrivateNovels = await pixiv.userBookmarksNovel({
    userId: targetUserId,
    restrict: BookmarkRestrict.PRIVATE,
  })
  if (bookmarkPrivateNovels.status !== 200) {
    logger.error(
      `🚨 Failed to get novel private bookmarks: ${bookmarkPrivateNovels.status} ${JSON.stringify(bookmarkPrivateNovels.data)}`
    )
    return
  }

  return [
    ...bookmarkPublicNovels.data.novels.reverse(),
    ...bookmarkPrivateNovels.data.novels.reverse(),
  ]
}
function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function formatDateTime(date: Date) {
  // 0埋めして YYYY-MM-DD HH:mm:ss にする
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

async function processIllusts(
  pixiv: Pixiv,
  discord: Discord,
  isFirst: boolean
) {
  const logger = Logger.configure('processIllusts')

  const targetUserId = Number(process.env.PIXIV_USER_ID)
  if (!targetUserId) {
    logger.error('🚨 Target user ID is not defined')
    return
  }

  const illusts = await getIllusts(pixiv, targetUserId)
  if (!illusts) {
    return
  }

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
      total_bookmarks: totalBookmarks,
      total_view: totalView,
      image_urls: { large: imageUrl },
      tags: tagLists,
      create_date: createDateRaw,
    } = illust

    const caption = captionRaw.replaceAll(/<("[^"]*"|'[^']*'|[^"'>])*>/g, '')
    const createDate = new Date(createDateRaw)
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
          value: formatDateTime(createDate),
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
}

async function processNovels(pixiv: Pixiv, discord: Discord, isFirst: boolean) {
  const logger = Logger.configure('processNovels')

  const targetUserId = Number(process.env.PIXIV_USER_ID)
  if (!targetUserId) {
    logger.error('🚨 Target user ID is not defined')
    return
  }

  const novels = await getNovels(pixiv, targetUserId)
  if (!novels) {
    return
  }

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
      total_bookmarks: totalBookmarks,
      total_view: totalView,
      create_date: createDateRaw,
    } = novel

    const caption = captionRaw.replaceAll(/<("[^"]*"|'[^']*'|[^"'>])*>/g, '')
    const createDate = new Date(createDateRaw)
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
          value: formatDateTime(createDate),
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
}

async function main() {
  const logger = Logger.configure('main')

  const isFirst = Notified.isFirst()
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
    logger.error(
      '🚨 Discord token and channel ID, or webhook URL is not defined'
    )
    return
  }

  await processIllusts(pixiv, discord, isFirst)
  await processNovels(pixiv, discord, isFirst)
}

;(async () => {
  await main()
})()
