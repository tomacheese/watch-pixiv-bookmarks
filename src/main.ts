import { loadPixiv, Pixiv } from './pixiv'
import { Configuration, loadConfig } from './config'
import { Notified } from './notified'
import { DiscordEmbed, sendDiscordMessage } from './discord'

function getTargetUserId(config: Configuration) {
  // config.json の user_id か、環境変数の PIXIV_USER_ID から取る
  // 環境変数 PIXIV_USER_ID を優先する

  const userId =
    process.env.PIXIV_USER_ID ??
    (config.pixiv ? config.pixiv.user_id : undefined)
  if (!userId) {
    throw new Error('user_id is not defined')
  }
  return userId
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function formatDateTime(date: Date) {
  // 0埋めして YYYY-MM-DD HH:mm:ss にする
  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join(
      '-',
    ) +
    ' ' +
    [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(
      ':',
    )
  )
}

async function main() {
  const pixiv = await loadPixiv()
  const config = loadConfig()
  const userId = getTargetUserId(config)
  const isFirst = Notified.isFirst()

  const publicBookmarkIllusts = await pixiv.getIllustBookmarks({
    userId,
    restrict: 'public',
  })
  if (publicBookmarkIllusts.status !== 200) {
    throw new Error(
      `Failed to get illust public bookmarks: ${publicBookmarkIllusts.status} ${JSON.stringify(publicBookmarkIllusts.data)}`,
    )
  }
  const privateBookmarkIllusts = await pixiv.getIllustBookmarks({
    userId,
    restrict: 'private',
  })
  if (privateBookmarkIllusts.status !== 200) {
    throw new Error(
      `Failed to get illust private bookmarks: ${privateBookmarkIllusts.status} ${JSON.stringify(privateBookmarkIllusts.data)}`,
    )
  }
  const bookmarkIllusts = [
    ...publicBookmarkIllusts.data.illusts,
    ...privateBookmarkIllusts.data.illusts,
  ]
    .filter((illust) => illust.type === 'illust')
    .filter((previous, index, self) => {
      return self.findIndex((illust) => illust.id === previous.id) === index
    })

  const filteredBookmarkIllusts = bookmarkIllusts.filter(
    (illust) => !Notified.isNotified(illust.id),
  )

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

    if (config.filter?.ignore_tags) {
      const ignoreTags = config.filter.ignore_tags
      if (tags.some((tag) => ignoreTags.includes(tag))) {
        continue
      }
    }

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
      const arraybuffer = await Pixiv.getImageStream(imageUrl)

      await sendDiscordMessage(config, '', embed, arraybuffer)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    Notified.addNotified(illustId)
  }
  // 気が向いたら novel も対応する
}

;(async () => {
  await main().catch((error: unknown) => {
    console.error(error)
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  })
})()
