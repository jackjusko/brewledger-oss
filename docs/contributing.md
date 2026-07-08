# Contributing

Thank you for your interest in BrewLedger. This repository is a reference implementation and portfolio project. Maintenance is best-effort—there is no SLA on issues or pull requests—but bug fixes, documentation improvements, and security hardening are especially welcome.

## Before you start

1. Read [getting-started.md](getting-started.md) to run the stack locally.
2. Skim [ARCHITECTURE.md](../ARCHITECTURE.md) to understand how server, console, and mobile clients fit together.
3. Check open issues and existing pull requests to avoid duplicate work.

## Repository layout

| Path | What to change |
|------|----------------|
| `server/` | API routes, SQLite schema, migrations, Stripe/QBO/SES integrations |
| `platforms/console/` | Desktop web UI (Vue 3), repositories, views, TTB reporting |
| `platforms/brewledger-app/` | Mobile app (Vue 3 + Capacitor), shared patterns with console |
| `docs/` | User and contributor documentation |

Both client apps share the same backend API and sync protocol. Business logic often lives in `*Repository` modules on the client and corresponding API handlers on the server.

## Development workflow

1. Fork the repository and create a branch from `main`.
2. Make focused changes—one logical fix or feature per pull request when possible.
3. Update documentation if your change affects setup, configuration, or behavior.
4. Run relevant tests (see below).
5. Open a pull request with a clear description of what changed and why.

## Running tests

### Web console

```bash
cd platforms/console
npm test
```

Watch mode: `npm run test:watch`

TTB math verification: `npm run verify-ttb-math`

### Mobile app

```bash
cd platforms/brewledger-app
npm run test:all
```

This runs frontend tests and backend integration tests (`test:backend`).

### API server

The server `npm test` script is currently a placeholder. Server behavior is exercised indirectly via mobile backend tests in `platforms/brewledger-app/src/tests/backend/`.

## Pull request guidelines

**Welcome:**

- Bug fixes with a clear reproduction case
- Documentation improvements
- Security fixes (see [SECURITY.md](../SECURITY.md))
- Small, well-scoped improvements that match existing patterns

**May be declined or slow-reviewed:**

- Large new features that expand scope significantly
- Changes that break optional integrations without a migration path
- Style-only refactors unrelated to surrounding work

Match existing code conventions: naming, file structure, and patterns in the file you are editing. Keep diffs as small as practical.

## Reporting security issues

Do not open public issues for sensitive vulnerabilities without coordinating first. See [SECURITY.md](../SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
