# Governance

This document describes how [brewledger-oss](https://github.com/jackjusko/brewledger-oss) is run.

**This public repository is the source of truth** for open-source BrewLedger. Open issues and pull requests here against `main`. Do not treat any private development tree as the contribution target.

Maintenance is **best-effort**. There is no SLA on issues, pull requests, or security reports. The commercial / hosted product at [getbrewledger.com](https://getbrewledger.com) is separate and is not governed by this document.

Everyone participating is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Roles

### Contributor

Anyone who opens issues or pull requests.

- Contributions are licensed under the [GNU General Public License v3.0](LICENSE).
- Prefer focused changes. See [docs/contributing.md](docs/contributing.md).

### Triage

Trusted contributors with permission to manage issues and pull requests (labels, milestones, requests for information, closing duplicates) **without** merge rights to `main`.

Typical path: several solid, merged PRs that show judgment and CoC alignment, then an invite from a maintainer.

### Maintainer

People listed in [MAINTAINERS.md](MAINTAINERS.md) with write access.

Maintainers may:

- Merge pull requests to `main`
- Cut annotated release tags
- Manage repository settings, labels, and branch protection
- Invite or remove triage members and (by consensus among maintainers) other maintainers

Day-to-day ops are described in [docs/maintainers.md](docs/maintainers.md).

## Becoming a maintainer

1. **Contribute** — merged PRs (bug fixes, docs, tests, security hardening preferred) that match project scope and conventions.
2. **Triage** — accept an invite to help with issues/PRs when offered.
3. **Write access** — after sustained triage judgment and CoC alignment, a maintainer may propose write access. Existing maintainers confirm via lazy consensus (see below).

There is no fixed PR count. Quality and reliability matter more than volume. Maintainers may decline or defer invitations when bandwidth is low.

## Decision making

- **Lazy consensus** on `main`: if a change has a clear PR description, relevant CI green, and no sustained objection from a maintainer within a reasonable review window, it may be merged.
- **Contentious or large changes** should start as a GitHub issue (or discussion in the PR) before significant implementation. Maintainers may ask for an issue first.
- **Security-sensitive** changes follow [SECURITY.md](SECURITY.md).
- In a disagreement among maintainers, prefer the smaller, reversible change; escalate only when needed.

## Releases

Releases are annotated git tags on `main` (for example `v0.1.0`). There is no formal LTS or release train yet. See [docs/maintainers.md](docs/maintainers.md).

## Amendments

Maintainers may update this document via pull request. Material changes (new roles, license policy, source-of-truth) should be called out clearly in the PR summary.
