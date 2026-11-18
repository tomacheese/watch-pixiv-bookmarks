import { BookmarkRestrict, PixivClient } from '@book000/pixivts'

export async function getIllusts(pixiv: PixivClient, userId: number) {
  const publicIllusts = await Array.fromAsync(
    pixiv.users.bookmarks
      .illusts({ userId, restrict: BookmarkRestrict.PUBLIC })
      .items()
  )
  const privateIllusts = await Array.fromAsync(
    pixiv.users.bookmarks
      .illusts({ userId, restrict: BookmarkRestrict.PRIVATE })
      .items()
  )
  return [...publicIllusts.toReversed(), ...privateIllusts.toReversed()]
}

export async function getNovels(pixiv: PixivClient, userId: number) {
  const publicNovels = await Array.fromAsync(
    pixiv.users.bookmarks
      .novels({ userId, restrict: BookmarkRestrict.PUBLIC })
      .items()
  )
  const privateNovels = await Array.fromAsync(
    pixiv.users.bookmarks
      .novels({ userId, restrict: BookmarkRestrict.PRIVATE })
      .items()
  )
  return [...publicNovels.toReversed(), ...privateNovels.toReversed()]
}
