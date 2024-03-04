# Backend container

Get your backend up and running quickly using container images.

> [!NOTE]
> Although I refer to "Docker", other container managers such as Podman are also included.

## Docker

* Run: `docker run -d -p 4000:4000 ghcr.io/jspaste/backend:latest`

## Docker Compose

* Copy `.env.example` to `.env.backend`.
* Adapt your `docker-compose.yml` to your needs.
* Run: `docker-compose up -d --pull --remove-orphans docker-compose.yml`
