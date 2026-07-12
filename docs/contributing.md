# Contributing

Thank you for your interest in BrewLedger. Contributions help keep this open-source brewery operations codebase healthy. Maintenance is best-effort—there is no SLA on issues or pull requests—but bug fixes, documentation improvements, and security hardening are especially welcome.

By participating, you agree to follow the [Code of Conduct](../CODE_OF_CONDUCT.md). Project roles and decision making are described in [GOVERNANCE.md](../GOVERNANCE.md).

**Source of truth:** open issues and pull requests against [`jackjusko/brewledger-oss`](https://github.com/jackjusko/brewledger-oss) on branch **`main`**. Do not target a private development tree.

## Before you start

1. Read [getting-started.md](getting-started.md) to run the stack locally.
2. Skim [ARCHITECTURE.md](../ARCHITECTURE.md) to understand how server, console, and mobile clients fit together.
3. Check [open issues](https://github.com/jackjusko/brewledger-oss/issues) and existing pull requests to avoid duplicate work. Prefer the [bug report](https://github.com/jackjusko/brewledger-oss/issues/new?template=bug_report.yml) or [feature request](https://github.com/jackjusko/brewledger-oss/issues/new?template=feature_request.yml) templates when filing something new.
4. Look for issues labeled **`good first issue`** or **`help wanted`** if you want a smaller first contribution.

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

CI also runs `npm run build` for the console.

### Mobile app

```bash
cd platforms/brewledger-app
npm test
```

This runs frontend Vitest unit tests. Full stack checks (`npm run test:all`, including `test:backend`) need a running API and are optional locally; CI runs frontend unit tests only.

### API server

```bash
cd server
npm test
```

This runs a schema smoke test (`init_db.js` against a temporary SQLite file). Broader server behavior is still exercised indirectly via mobile backend tests in `platforms/brewledger-app/src/tests/backend/` when you run them locally with a live server.

## Pull request guidelines

**Welcome:**

- Bug fixes with a clear reproduction case
- Documentation improvements
- Security fixes (see [SECURITY.md](../SECURITY.md))
- Small, well-scoped improvements that match existing patterns
- Issues labeled `good first issue` or `help wanted`

**May be declined or slow-reviewed:**

- Large new features that expand scope significantly without a prior issue
- Changes that break optional integrations without a migration path
- Style-only refactors unrelated to surrounding work

Match existing code conventions: naming, file structure, and patterns in the file you are editing. Keep diffs as small as practical.

Interested in helping long-term? See the contributor → triage → maintainer path in [GOVERNANCE.md](../GOVERNANCE.md).

## Reporting security issues

Do not open public issues for sensitive vulnerabilities. See [SECURITY.md](../SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [GNU General Public License v3.0](../LICENSE).
