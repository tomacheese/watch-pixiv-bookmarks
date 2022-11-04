# watch-pixiv-bookmarks

Monitor pixiv bookmarks and notify Discord when new items are added.  
Currently, only illustrations in private bookmarks are supported.

## Installation

A valid pixiv account refresh token is required to use this project.

### 1. Create `docker-compose.yml`

First, create `docker-compose.yml` and write the following:

```yaml
version: "3"

services:
  app:
    image: ghcr.io/tomacheese/watch-pixiv-bookmarks
    volumes:
      - type: bind
        source: ./data/
        target: /data/
    env_file:
      - .env
    restart: always
    init: true
```

### 2. Get pixiv token and write

Retrieve the refresh token by referring to [Retrieving Auth Token (with Selenium)](https://gist.github.com/upbit/6edda27cb1644e94183291109b8a5fde), etc.  
Then, write the refresh token (`<REFRESH-TOKEN>`) in `data/token.json` in the following format.

```json
{
  "refresh_token": "<REFRESH-TOKEN>"
}
```

### 3. Write configuration file

Describe the settings in the `.env` file with reference to the following configuration items.

- `PIXIV_USER_ID`: ID of pixiv users to be monitored
- `DISCORD_TOKEN`: Discord bot token
- `DISCORD_CHANNEL_ID`: ID of the channel to be notified
- `PIXIVPY_TOKEN_FILE` (optional): Token file path for pixivpy library (Default: `/data/token.json`)

(Discord Webhook is not supported. Please create a pull request if necessary.)

### 4. Build and Run

```shell
docker-compose up --build -d && docker-compose logs -f
```

## Disclaimer

The developer is not responsible for any problems caused by the user using this project.

## License

The license for this project is [MIT License](LICENSE).
