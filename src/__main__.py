import json
import os
import time
from datetime import datetime
from pprint import pprint

import requests
from pixivpy3 import AppPixivAPI

from src import add_notified_id, load_notified_ids, remove_html_tags

TOKEN_FILE = os.environ.setdefault('PIXIVPY_TOKEN_FILE', '/data/token.json')
DISCORD_TOKEN = os.environ.get('DISCORD_TOKEN')
DISCORD_CHANNEL_ID = os.environ.get('DISCORD_CHANNEL_ID')


def main():
    api = AppPixivAPI()

    notified_ids = load_notified_ids()
    is_first = len(notified_ids) == 0

    if not os.path.exists(TOKEN_FILE):
        raise Exception('Token file not found')

    with open(TOKEN_FILE, 'r') as f:
        prev = json.load(f)
        token = api.auth(None, None, prev["refresh_token"])
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        f.write(json.dumps(token))

    bookmarks = api.user_bookmarks_illust(16568776, restrict="private")
    if "illusts" not in bookmarks:
        raise Exception("No illusts in bookmarks")

    for illust in bookmarks["illusts"]:
        item_id = illust["id"]
        title = illust["title"]
        caption = remove_html_tags(illust["caption"])
        total_bookmarks = illust["total_bookmarks"]
        total_view = illust["total_view"]
        username = illust["user"]["name"]
        user_id = illust["user"]["id"]
        image_url = illust["image_urls"]["large"]
        tags = list(map(lambda x: x["name"], illust["tags"]))
        created_date = datetime.fromisoformat(illust["create_date"])

        print(f"{title} ({item_id})")

        if "R-18" in tags:
            continue

        if item_id in notified_ids:
            continue

        embed = {
            "title": title,
            "url": f"https://www.pixiv.net/artworks/{item_id}",
            "description": caption,
            "color": 0x0096FA,
            "fields": [
                {
                    "name": "Tags",
                    "value": "`" + "`, `".join(tags) + "`",
                    "inline": False,
                },
                {
                    "name": "Author",
                    "value": f"[{username}](https://www.pixiv.net/users/{user_id})",
                    "inline": True,
                },
                {
                    "name": "Bookmarks",
                    "value": total_bookmarks,
                    "inline": True,
                },
                {
                    "name": "Views",
                    "value": total_view,
                    "inline": True,
                },
                {
                    "name": "Created",
                    "value": created_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "inline": True,
                },
            ],
            "image": {
                "url": "attachment://image.png",
            },
        }

        if not is_first:
            file_data = requests.get(image_url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
                              "Chrome/80.0.3987.149 Safari/537.36",
                "Referer": "https://www.pixiv.net/"
            }).content

            params = {
                "payload_json": json.dumps({
                    "embed": embed
                })
            }
            response = requests.post(f"https://discord.com/api/channels/{DISCORD_CHANNEL_ID}/messages", headers={
                "Authorization": f"Bot {DISCORD_TOKEN}",
            }, files={
                "file": ("image.png", file_data, "image/png"),
            }, data=params)
            if response.status_code != 200:
                print(response.content)
                raise Exception("Failed to send message")

            time.sleep(1)

        add_notified_id(item_id)


if __name__ == '__main__':
    main()
