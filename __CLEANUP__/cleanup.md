# Feature cleanup

## Purpose of `__CLEANUP__`

`__CLEANUP__` holds a **feature-flag cleanup system** so you can strip optional features from the starter without editing code by hand. It keeps the app generic; you run the script when you want to remove a feature you don’t need.

**What it does:**

- **Scripts** (`scripts/`) – Config and Node script that delete feature folders/files, overwrite shared files from templates, remove nav items and deps, and clean env/docs.
- **Templates** (e.g. `clerk/`, `kanban/`, `sentry/`) – “After removal” versions of files (e.g. providers, nav, pages, next.config, instrumentation). The script copies these over the real files when you run a cleanup.

**Available flags:** `clerk` (auth, orgs, billing), `kanban` (drag‑and‑drop board), `sentry` (error tracking). Run with `--list` to see all.

---

## Safety

Before running, the script checks that the project is a **git repo with at least one commit**. If not, it exits so you can `git init` and commit first—then you can revert with `git restore .` if you run cleanup by mistake. Use `--force` to skip this check.

## Run from project root

```bash
node __CLEANUP__/scripts/cleanup.js clerk
node __CLEANUP__/scripts/cleanup.js kanban
node __CLEANUP__/scripts/cleanup.js sentry
node __CLEANUP__/scripts/cleanup.js --list
node __CLEANUP__/scripts/cleanup.js --help
```

## After Cleanup

Once you've finished cleaning up features you don't need, **delete the `__CLEANUP__` folder** from your project.
