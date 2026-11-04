# watch-pixiv-bookmarks

Monitor pixiv bookmarks (illustrations and novels, public and private) and notify Discord when new items are added.

On the first run, existing bookmarks are only recorded as already notified, and no notifications are sent. The app checks for new bookmarks every 5 minutes.

## Installation

A valid pixiv account refresh token is required to use this project.

### 1. Create `compose.yaml`

First, create `compose.yaml` and write the following:

```yaml
services:
  app:
    image: ghcr.io/tomacheese/watch-pixiv-bookmarks:latest
    volumes:
      - type: bind
        source: ./data/
        target: /data/
    environment:
      # required DISCORD_TOKEN & DISCORD_CHANNEL_ID or DISCORD_WEBHOOK_URL
      DISCORD_TOKEN: ...
      DISCORD_CHANNEL_ID: 1234567890
      DISCORD_WEBHOOK_URL: https://...
      PIXIV_USER_ID: 1234556789
    restart: always
    init: true
```

### 2. Get pixiv token and write

Retrieve the refresh token by referring to [Retrieving Auth Token (with Selenium)](https://gist.github.com/upbit/6edda27cb1644e94183291109b8a5fde), etc.  
Then, write the refresh token (`<REFRESH-TOKEN>`) in `data/token.json` in the following format.  
The app rewrites this file on every run with the refreshed tokens, so it must be writable.  
Outside Docker, the path can be changed with the `PIXIV_TOKEN_PATH` environment variable (default `data/token.json`).

```json
{
  "refresh_token": "<REFRESH-TOKEN>"
}
```

### 3. Run

```shell
docker compose up -d
```

## Disclaimer

The developer is not responsible for any problems caused by the user using this project.

## License

The license for this project is [MIT License](LICENSE).
