# Dependency updates (Renovate)

Renovate runs from [`.github/workflows/renovate.yml`](../.github/workflows/renovate.yml)
via the CLI — **no GitHub App**. Config: [`renovate.json`](../renovate.json).
Nothing automerges; review and merge when CI is green.

## One-time setup

1. Create a **fine-grained PAT**
   ([tokens](https://github.com/settings/personal-access-tokens)):
   - Repository access: **this repo only**
   - Permissions: Contents, Pull requests, Issues, Workflows — all **Read and write**
2. Add repo secret **`RENOVATE_TOKEN`** = that PAT  
   (`GITHUB_TOKEN` is not enough — Renovate PRs would not trigger CI.)
3. Merge the workflow to `main`, then wait for the daily run or use
   **Actions → Renovate → Run workflow**.

Optional: use a bot account so update PRs are not under your personal name.

**Classic PAT fallback** (only if fine-grained fails): `repo` + `workflow` scopes.

## How schedules work

| Layer | Role |
|-------|------|
| Actions cron (`0 4 * * *`) | Starts Renovate daily at 04:00 UTC |
| `renovate.json` `schedule` | Only open update PRs before 06:00 Europe/Amsterdam |
| `lockFileMaintenance.schedule` | Same window — lockfile-only PRs (no `package.json` range changes) |

Manual `workflow_dispatch` still respects the Renovate schedule for opening PRs.

## Policy

| Kind | Behaviour |
|------|-----------|
| Patch / minor | Grouped; daily morning window |
| Major | Separate PR; manual review |
| Security | `vulnerabilityAlerts` — can open outside schedule |
| Lockfile maintenance | Daily; refreshes `pnpm-lock.yaml` within existing ranges |
| Release age | **1 day** — see below |
| Ranges | `rangeStrategy: bump` — updates `package.json` and the lockfile |

### Groups

| Group | Packages |
|-------|----------|
| svelte stack | `@sveltejs/*`, `svelte`, `svelte-check` |
| vite and tailwind | `vite`, `@tailwindcss/*`, `tailwindcss` |
| vitest suite | `vitest`, `@vitest/coverage-v8`, `happy-dom` |
| github actions | Workflow action refs |
| node docker | `node` image in `.devcontainer/Dockerfile` |

### Release age

pnpm 11 and Renovate both require packages to be **≥ 24 hours** old:

- `pnpm-workspace.yaml`: `minimumReleaseAge: 1440`
- `renovate.json`: `minimumReleaseAge: "1 day"` + `internalChecksFilter: "strict"`

CI (`pnpm install --frozen-lockfile`) rejects lockfile entries that are too new
(`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`). Renovate should not open those PRs;
if one slips through, wait until the package is 24h old and re-run CI, or close
the PR.

## CI gate

Every PR (including Renovate) must pass:

- `pnpm check`
- `pnpm test:coverage`
- `pnpm build` (with `BASE_PATH` like production)

## Watch carefully

| Package(s) | Why |
|------------|-----|
| `svelte`, `@sveltejs/kit`, `@sveltejs/vite-plugin-svelte` | Runes, routing, build |
| `vite`, `@tailwindcss/vite`, `tailwindcss` | Build pipeline, SW plugin |
| `happy-dom` | DOM behaviour in unit tests (exact-pinned) |
| `sharp` | Native bindings; thumb generation |
| `typescript` / `svelte-check` | Stay on TS **6** until svelte-check supports TS 7’s programmatic API |

## Toolchain

- **Node:** `24.18.0` in the devcontainer and in Actions
- **pnpm:** `packageManager` in `package.json`; Corepack prepares that version in CI and `postCreateCommand`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Workflow fails immediately | Check `RENOVATE_TOKEN` exists and is not expired |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Package under 24h old — wait and re-run CI, or close the PR |
| No Actions updates in PRs | Fine-grained token missing **Workflows** write |
| PRs open but CI does not run | Must use a PAT, not `GITHUB_TOKEN` |
| Fine-grained auth errors | Confirm repo access; fall back to classic `repo` + `workflow` if needed |
