# Maintainer guide

This document is for people who maintain the public BrewLedger repository from a private development tree. End users and contributors do not need this page.

## Relationship to the private repository

The public repository is a **clean export** with fresh git history. It is not a mirror of the private development repo. Internal commit history, blog posts, and development analysis docs are not included.

## Refreshing the export

The export script copies an allowlisted tree into a clean directory, strips secrets and dev artifacts, and scans for credential patterns.

**Script:** `scripts/prepare-oss-export.ps1`

**Usage:**

```powershell
# From the private repo root (parent of scripts/)
.\scripts\prepare-oss-export.ps1

# Custom output path, overwrite existing
.\scripts\prepare-oss-export.ps1 -OutputDir "D:\brewledger-public" -Force
```

Default output is `oss-export/` next to the private repo root.

### What gets copied

Allowlisted top-level paths:

- `server/`
- `platforms/`
- `docs/` (includes `docs/assets/` — logo, screenshots, social preview)
- `scripts/`
- `.github/` (CI workflow, issue templates, PR template)
- `README.md`, `FAQ.md`, `LICENSE`, `ARCHITECTURE.md`, `SECURITY.md`, `.env.example`, `.gitignore`

### What gets excluded

Robocopy excludes directories such as `node_modules`, `dist`, `build`, `.git`, `changes`, `blogrip`, and files such as `.env`, `*.sqlite`, and `ttb.pdf`.

Post-copy removals include blog content paths and generated Capacitor web assets.

### Secret scan

After copy, the script scans for patterns including Discord webhooks, `sk_live_`, `sk_test_`, `whsec_`, AWS `AKIA` keys, and private LAN IPs in markdown. The export fails if any are found—fix the source before publishing.

## GitHub presence assets

Visual and community files for the public repo:

| Path | Purpose |
|------|---------|
| `docs/assets/logo.png` | README hero logo |
| `docs/assets/desktop-console-*.png` | README desktop screenshots |
| `docs/assets/mobile-app-1.png` | README mobile screenshot |
| `docs/assets/social-preview.png` | Upload in GitHub repo Settings → Social preview (1280×640) |
| `.github/workflows/ci.yml` | Console Vitest CI |
| `.github/ISSUE_TEMPLATE/` | Bug and feature issue forms |
| `.github/pull_request_template.md` | PR checklist |

Keep these under the private tree (not only in `oss-export/`) so the next `prepare-oss-export.ps1 -Force` run preserves them.

### Public GitHub settings (one-time / occasional)

After pushing the public repo ([jackjusko/brewledger-oss](https://github.com/jackjusko/brewledger-oss)):

- **Default branch:** `master` (CI workflow triggers on `master`)
- **About description:** `Open-source brewery operations platform — inventory, production, compliance, taproom (self-hosted)`
- **Website:** `https://getbrewledger.com`
- **Topics:** `brewery`, `brewery-management`, `inventory`, `vue3`, `self-hosted`, `sqlite`, `taproom`, `ttb`, `open-source`, `capacitor`, `express` (keep existing brewery-related topics; add missing ones)
- **Social preview:** Settings → General → Social preview → upload `docs/assets/social-preview.png`

With GitHub CLI authenticated (`gh auth login`):

```powershell
gh repo edit jackjusko/brewledger-oss --description "Open-source brewery operations platform — inventory, production, compliance, taproom (self-hosted)" --homepage "https://getbrewledger.com" --add-topic brewery --add-topic brewery-management --add-topic inventory --add-topic vue3 --add-topic self-hosted --add-topic sqlite --add-topic taproom --add-topic ttb --add-topic open-source --add-topic capacitor --add-topic express
```

Social preview image upload remains UI-only (or GraphQL with a personal access token).

## Publishing to GitHub

After a successful export:

```powershell
cd oss-export
git -c safe.directory="$PWD" init   # if on a network share
git add .
git commit -m "Initial open-source release"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

Create the public GitHub repository first (empty, no README) if it does not exist yet.

For subsequent updates, refresh with `prepare-oss-export.ps1 -Force`, review changes, commit, and push.

## Keeping public docs accurate

When adding features in the private repo, update export-facing documentation before publishing:

- [README.md](../README.md) — overview and quick start
- [README.md](README.md) — documentation index
- [FAQ.md](../FAQ.md) — scope and integration questions
- [.env.example](../.env.example) — new environment variables
- [SECURITY.md](../SECURITY.md) — vulnerability reporting
- `docs/assets/` and `.github/` — README visuals and community templates

Avoid copying internal `changes/` analysis documents into the public export.
