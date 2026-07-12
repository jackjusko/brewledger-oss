# Security Policy

## Supported versions

Security fixes are applied to the `main` branch of this repository. There is no formal release cadence or long-term support policy for older tags.

## Reporting a vulnerability

If you discover a security issue:

1. **Do not** open a public issue with exploit details.
2. Prefer a private [GitHub security advisory](https://github.com/jackjusko/brewledger-oss/security/advisories/new) with impact, affected components, and reproduction steps if applicable.
3. Public issues are appropriate only for **non-sensitive** configuration or documentation problems that do not enable abuse (for example, clarifying that an env var is missing from `.env.example`).

There is **no bug bounty program** and no guaranteed response time. Reports are handled on a best-effort basis.

## Secrets and credentials

- Never commit `.env` files, API keys, tokens, or certificates.
- Use [.env.example](.env.example) as a template for required variable names only.
- Leave `MASTER_PASSWORD` empty in any shared or production environment—it is for local testing only.

## Self-hosted responsibility

BrewLedger is self-hosted software. You are responsible for securing your server, network access, TLS configuration, database backups, and user accounts.

See [docs/deployment.md](docs/deployment.md) for production hardening notes.
