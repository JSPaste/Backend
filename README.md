# Backend

![OSSF-Scorecard](https://img.shields.io/ossf-scorecard/github.com/JSPaste/Backend?label=scorecard)
![Codacy](https://img.shields.io/codacy/grade/1a477cecd06e4007b276021962e180ae/stable)

## Setup

### Binaries

- Download latest release: https://github.com/jspaste/backend/releases/tag/latest
- Uncompress to a new folder
- Modify the `.env.example` file to your needs and rename it to `.env`
- Execute the binary

### Containerized

- Pull latest image: `docker pull ghcr.io/jspaste/backend:latest`
- Run container: `docker run -e DOCS_ENABLED=true -d -p 127.0.0.1:4000:4000 ghcr.io/jspaste/backend:latest`

## Validate

All artifacts and images originate from this repository (https://github.com/jspaste/backend), no other artifacts or
images built and distributed outside of this repository are considered secure nor trusted by the JSPaste developers.

You can verify the integrity and origin of an artifact and/or image using the GitHub CLI or manually
at [JSPaste Attestations](https://github.com/jspaste/backend/attestations).

Artifacts are attested and can be verified using the following command:

```shell
gh attestation verify backend.tar.gz \
  --owner JSPaste
```

Since container version `2024.05.06-e105023`, images are attested and can be verified using the following command:

```shell
gh attestation verify oci://ghcr.io/jspaste/backend:latest \
  --owner JSPaste
```

## License

This project is licensed under the EUPL License. See the [`LICENSE`](LICENSE) file for more details.
