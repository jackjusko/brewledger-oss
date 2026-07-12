# Maintainer guide

Operations guide for people with **triage** or **maintainer** access on the public repository. Role definitions and how to join: [GOVERNANCE.md](../GOVERNANCE.md). Current maintainers: [MAINTAINERS.md](../MAINTAINERS.md).

**Source of truth:** [jackjusko/brewledger-oss](https://github.com/jackjusko/brewledger-oss) on branch `main`. Contributors and co-maintainers work only in this public repo. Do not ask contributors to run private export scripts.

## Triage checklist

When a new issue or PR arrives:

1. Confirm it follows the [Code of Conduct](../CODE_OF_CONDUCT.md).
2. Apply labels (`bug`, `enhancement`, `documentation`, `good first issue`, `help wanted`, `security`, `needs-info` as appropriate).
3. For bugs: ensure reproduction steps and component are clear; ask for more detail and add `needs-info` if not.
4. Close duplicates with a link to the canonical issue.
5. Point setup questions to [getting-started.md](getting-started.md) or the [FAQ](../FAQ.md) when that answers the report.
6. Security reports: do **not** discuss exploit details in public issues—see [SECURITY.md](../SECURITY.md).

### Good first issues

Prefer labeling small, well-scoped work as `good first issue`:

- Documentation typos or missing setup steps
- Test coverage for an existing pure function
- Narrow UI copy or accessibility fixes with a clear expected result

Avoid labeling large refactors, sync-protocol changes, or TTB math changes as first issues.

**Ladder to maintainer:** after several solid merged PRs and CoC alignment, offer **triage**; after sustained triage judgment, offer **write** (see [GOVERNANCE.md](../GOVERNANCE.md)).

## Merge rules

Before merging to `main`:

- [ ] CI is green (console, mobile unit tests, server smoke)
- [ ] Change is focused; large features had an issue discussion when appropriate
- [ ] Docs updated if setup, config, or user-visible behavior changed
- [ ] No secrets, `.env` files, or credentials in the diff
- [ ] PR author acknowledged CoC / GPLv3 (checklist on the PR template)

**When to require tests:** prefer tests for bug fixes that can be unit-tested and for logic changes in console/mobile Vitest suites. Server coverage is still thin (smoke + indirect mobile backend tests)—do not block purely on missing server unit tests, but do not regress the smoke job.

Prefer squash or rebase merges that keep `main` history readable; match whatever the repo default is set to.

## Releases

1. Ensure `main` is green and the changelog-worthy notes are known (PR titles are enough for now).
2. Create an annotated tag from `main`, for example:

   ```bash
   git checkout main
   git pull
   git tag -a v0.1.0 -m "BrewLedger OSS v0.1.0"
   git push origin v0.1.0
   ```

3. Optionally create a GitHub Release from that tag with a short summary.

There is no formal LTS or release train yet. Security fixes land on `main` and should be tagged when practical.

## GitHub repository settings (checklist)

Apply these in the GitHub UI (or `gh`) if not already set:

- [ ] **Default branch:** `main`
- [ ] **Branch protection on `main`:**
  - Require a pull request before merging
  - Require status checks to pass: `console`, `mobile`, `server` (job names from `.github/workflows/ci.yml`)
  - Do not allow force pushes
  - Do not allow deletions
- [ ] **Private vulnerability reporting** enabled (Settings → Code security)
- [ ] **Labels** exist: `bug`, `enhancement`, `documentation`, `good first issue`, `help wanted`, `security`, `needs-info`
- [ ] **About:** description, homepage `https://getbrewledger.com`, topics (brewery, self-hosted, vue3, etc.)
- [ ] **Social preview:** upload `docs/assets/social-preview.png`

Example `gh` topic/description update:

```powershell
gh repo edit jackjusko/brewledger-oss --description "Open-source brewery operations platform — inventory, production, compliance, taproom (self-hosted)" --homepage "https://getbrewledger.com" --add-topic brewery --add-topic brewery-management --add-topic inventory --add-topic vue3 --add-topic self-hosted --add-topic sqlite --add-topic taproom --add-topic ttb --add-topic open-source --add-topic capacitor --add-topic express
```

## Appendix: private tree sync (owner-only, optional)

Some maintainers may still keep a private development tree. That tree is **not** the OSS source of truth.

- Contributors and co-maintainers **never** need `scripts/prepare-oss-export.ps1`.
- If the owner develops privately, changes destined for OSS should be merged or cherry-picked **into** this public repo on `main`.
- The export script remains a convenience for one-way scrubbed copies from a private root into a clean directory. It must not overwrite unreviewed public history without a careful review.

### Export script (reference)

**Script:** `scripts/prepare-oss-export.ps1` (typically run from a private checkout that still vendors the script)

```powershell
.\scripts\prepare-oss-export.ps1
.\scripts\prepare-oss-export.ps1 -OutputDir "D:\brewledger-public" -Force
```

Allowlisted paths include `server/`, `platforms/`, `docs/`, `scripts/`, `.github/`, and root docs (`README.md`, `FAQ.md`, `LICENSE`, `ARCHITECTURE.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `GOVERNANCE.md`, `MAINTAINERS.md`, `CONTRIBUTING.md`, `.env.example`, `.gitignore`). The script scans for credential patterns and fails if hits are found.

After any optional private sync, review the diff on GitHub before pushing to `main`.
