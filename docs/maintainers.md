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
- `docs/`
- `scripts/`
- `README.md`, `FAQ.md`, `LICENSE`, `ARCHITECTURE.md`, `.env.example`, `.gitignore`

### What gets excluded

Robocopy excludes directories such as `node_modules`, `dist`, `build`, `.git`, `changes`, `blogrip`, and files such as `.env`, `*.sqlite`, and `ttb.pdf`.

Post-copy removals include blog content paths and generated Capacitor web assets.

### Secret scan

After copy, the script scans for patterns including Discord webhooks, `sk_live_`, `sk_test_`, `whsec_`, AWS `AKIA` keys, and private LAN IPs in markdown. The export fails if any are found—fix the source before publishing.

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

Avoid copying internal `changes/` analysis documents into the public export.
