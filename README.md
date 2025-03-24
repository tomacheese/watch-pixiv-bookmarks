# watch-pixiv-bookmarks

Monitor pixiv bookmarks and notify Discord when new items are added.

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
If the environment variable `PIXIV_TOKEN_PATH` is set, the specified value is taken as the path to the configuration file.

```json
{
  "refresh_token": "<REFRESH-TOKEN>"
}
```

### 3. Build and Run

```shell
docker compose up --build -d
```

## Disclaimer

The developer is not responsible for any problems caused by the user using this project.

## License

The license for this project is [MIT License](LICENSE).
