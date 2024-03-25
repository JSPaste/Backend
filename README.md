# Backend

This repository contains the backend code for [JSPaste](https://jspaste.eu). It is built using [Bun](https://bun.sh)
and [ElysiaJS](https://elysiajs.com)

## Setup

### Local

- Copy `.env.example` to `.env.local`.
- Run: `bun install --production`
- Run: `bun run start`

### Docker

- Run: `docker run -e DOCS_ENABLED=true -d -p 4000:4000 ghcr.io/jspaste/backend:latest`

## License

This project is licensed under the EUPL License. See the [`LICENSE`](LICENSE) file for more details.
