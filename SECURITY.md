# Security Policy

## Supported versions

Security fixes are applied to the `master` branch of this repository. There is no formal release cadence or long-term support policy for older commits.

## Reporting a vulnerability

If you discover a security issue:

1. **Do not** open a public issue with exploit details until it has been reviewed.
2. Open a [GitHub Issue](https://github.com/jackjusko/brewledger-oss/issues) on this repository with a clear description of the problem, impact, and steps to reproduce if applicable. Prefer a private [security advisory](https://github.com/jackjusko/brewledger-oss/security/advisories/new) if the issue is sensitive.

There is **no bug bounty program** and no guaranteed response time. Reports are handled on a best-effort basis.

## Secrets and credentials

- Never commit `.env` files, API keys, tokens, or certificates.
- Use [.env.example](.env.example) as a template for required variable names only.
- Leave `MASTER_PASSWORD` empty in any shared or production environment—it is for local testing only.

## Self-hosted responsibility

BrewLedger is self-hosted software. You are responsible for securing your server, network access, TLS configuration, database backups, and user accounts.

See [docs/deployment.md](docs/deployment.md) for production hardening notes.
