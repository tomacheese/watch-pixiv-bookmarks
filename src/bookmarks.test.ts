import { BookmarkRestrict, PixivClient } from '@book000/pixivts'
import { getIllusts, getNovels } from './bookmarks'

describe.each([
  ['illusts', getIllusts],
  ['novels', getNovels],
] as const)('%s bookmarks', (kind, getBookmarks) => {
  test('collects every page for both visibility settings in oldest-first order', async () => {
    const calls: string[] = []
    const load = jest.fn((id: number) => Promise.resolve({ id }))
    const bookmarks = jest.fn(({ restrict }: { restrict: string }) => ({
      async *items() {
        calls.push(`${restrict}:first`)
        yield await load(restrict === BookmarkRestrict.PUBLIC ? 4 : 8)
        calls.push(`${restrict}:next`)
        yield { id: restrict === BookmarkRestrict.PUBLIC ? 3 : 7 }
      },
    }))
    const pixiv = {
      users: { bookmarks: { [kind]: bookmarks } },
    } as unknown as PixivClient

    expect(await getBookmarks(pixiv, 42)).toEqual([
      { id: 3 },
      { id: 4 },
      { id: 7 },
      { id: 8 },
    ])
    expect(bookmarks.mock.calls).toEqual([
      [{ userId: 42, restrict: BookmarkRestrict.PUBLIC }],
      [{ userId: 42, restrict: BookmarkRestrict.PRIVATE }],
    ])
    expect(calls).toEqual([
      'public:first',
      'public:next',
      'private:first',
      'private:next',
    ])
  })

  test('rejects partial results when a later page fails', async () => {
    const load = jest.fn(() => Promise.resolve({ id: 1 }))
    const bookmarks = jest.fn(() => ({
      async *items() {
        yield await load()
        throw new Error('page failed')
      },
    }))
    const pixiv = {
      users: { bookmarks: { [kind]: bookmarks } },
    } as unknown as PixivClient

    await expect(getBookmarks(pixiv, 42)).rejects.toThrow('page failed')
  })
})
