# watch-pixiv-bookmarks

Monitor pixiv bookmarks and notify Discord when new items are added.  
Currently, only illustration bookmarks are supported.

## Installation

A valid pixiv account refresh token is required to use this project.

### 1. Create `docker-compose.yml`

First, create `docker-compose.yml` and write the following:

```yaml
version: "3"

services:
  app:
    image: ghcr.io/tomacheese/watch-pixiv-bookmarks:latest
    volumes:
      - type: bind
        source: ./data/
        target: /data/
    environment:
      PIXIV_USER_ID: 1234556789
    restart: always
    init: true
```

### 2. Get pixiv token and write

Retrieve the refresh token by referring to [Retrieving Auth Token (with Selenium)](https://gist.github.com/upbit/6edda27cb1644e94183291109b8a5fde), etc.  
Then, write the refresh token (`<REFRESH-TOKEN>`) in `data/token.json` in the following format.  
If the environment variable `TOKEN_FILE` is set, the specified value is taken as the path to the configuration file.

```json
{
  "refresh_token": "<REFRESH-TOKEN>"
}
```

### 3. Configuration

The configuration file `data/config.json` is used by default.  
If the environment variable `CONFIG_FILE` is set, the specified value is taken as the path to the configuration file.

See here for the JSON Schema of the configuration file: [schema/Configuration.json](schema/Configuration.json)

```json
{
  "$schema": "https://raw.githubusercontent.com/tomacheese/watch-pixiv-bookmarks/master/schema/Configuration.json"
}
```

### 4. Build and Run

```shell
docker-compose up --build -d && docker-compose logs -f
```

## Disclaimer

The developer is not responsible for any problems caused by the user using this project.

## License

The license for this project is [MIT License](LICENSE).
