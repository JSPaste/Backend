# Backend

![OSSF-Scorecard](https://img.shields.io/ossf-scorecard/github.com/JSPaste/Backend?label=scorecard)
![Codacy](https://img.shields.io/codacy/grade/1a477cecd06e4007b276021962e180ae/stable)

## Setup

### Binary

- Download the [latest release](https://github.com/jspaste/backend/releases/latest) and uncompress it to a new folder
- Edit the `.env.example` file and rename it to `.env`
- Run the binary...

Linux & macOS:

```shell
./backend
```

Windows:

```powershell
powershell -c ".\backend.exe"
```

### Container

- Pull latest image and run the container:

```shell
docker pull ghcr.io/jspaste/backend:latest
docker run -e DOCS_ENABLED=true -d -p 127.0.0.1:4000:4000 \
  ghcr.io/jspaste/backend:latest
```

## Validate

> [!IMPORTANT]
> ALL artifacts and images originate from GitHub `JSPaste/Backend` repository, no other artifacts or
> images built and distributed outside that repository are considered secure nor trusted by the JSPaste team.

Artifacts are attested and can be verified using the following command:

```shell
gh attestation verify backend.tar.gz \
  --owner JSPaste
```

Since container version
[`2024.05.06-e105023`](https://github.com/orgs/jspaste/packages/container/backend/212635273?tag=2024.05.06-e105023),
images are attested and can be verified using the following command:

```shell
gh attestation verify oci://ghcr.io/jspaste/backend:latest \
  --owner JSPaste
```

You can verify the integrity and origin of an artifact and/or image using the GitHub CLI or manually
at [JSPaste Attestations](https://github.com/jspaste/backend/attestations).

## Development

### Maintenance

Over time, local repositories can become messy with untracked files, registered hooks, and temporary files in the .git
folder. To clean up the repository (and possibly all your uncommitted work), run the following command:

```shell
bun run clean:git:all
```

## License

This project is licensed under the EUPL License. See the [`LICENSE`](LICENSE) file for more details.
