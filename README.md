# Backend

## Setup

### Binary

- Download the [latest release](https://github.com/jspaste/backend/releases/latest) and uncompress it to a new folder
- Edit the `.env.example` file and rename it to `.env`
- Run the binary...

Linux & macOS:

```shell
./backend.<os>-<arch>
```

Windows:

```powershell
powershell -c ".\backend.windows-<arch>.exe"
```

### Container

We publish images to multiple registries for redundancy:

- [`docker.io`](https://hub.docker.com/r/jspaste/backend)
- [`ghcr.io`](https://github.com/jspaste/backend/pkgs/container/backend)

To pull and run the container:

```shell
docker pull docker.io/jspaste/backend:latest
docker run --env-file=.env -d -p [::1]:8080:8080 docker.io/jspaste/backend:latest
```

## Validate

> [!IMPORTANT]
> All artifacts and images originate from GitHub `JSPaste/Backend` repository, no other artifacts or images built and
> distributed outside that repository are considered secure nor trusted by the JSPaste team.

You can verify the integrity and origin of an artifact using the GitHub CLI or manually at
[JSPaste Attestations](https://github.com/jspaste/backend/attestations).

Artifacts are attested and can be verified using the following command:

```shell
gh attestation verify ./backend_latest_linux-amd64.tar.xz --owner JSPaste
```

## Development

See the [`CONTRIBUTING`](CONTRIBUTING.md) file for more details.

## License

This project is licensed under the EUPL License. See the [`LICENSE`](LICENSE) file for more details.
