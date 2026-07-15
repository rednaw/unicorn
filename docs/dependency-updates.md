# Dependency updates (Renovate)

This repo runs [Renovate](https://docs.renovatebot.com/) from **GitHub Actions**
(`.github/workflows/renovate.yml`) — no Renovate GitHub App. You own the token and
the schedule; nothing automerges.

## One-time setup

### 1. Create a Personal Access Token

Renovate needs a PAT — **`GITHUB_TOKEN` is not sufficient** (PRs would not trigger CI).

#### Fine-grained PAT (preferred)

[Settings → Developer settings → Fine-grained tokens](https://github.com/settings/personal-access-tokens)

1. **Resource owner** — your user or org that owns the repo.
2. **Repository access** — **Only select repositories** → this repo (least privilege).
3. **Permissions** (Repository permissions):

| Permission | Access | Why |
|------------|--------|-----|
| Contents | Read and write | Branches, `package.json`, lockfile |
| Pull requests | Read and write | Open update PRs |
| Issues | Read and write | Dependency Dashboard issue |
| Workflows | Read and write | Bump `actions/*` refs in `.github/workflows/` |

4. Set an **expiration** and calendar a reminder to rotate.

Use a **machine/bot account** if you do not want update PRs under your personal name.

#### Classic PAT (fallback)

Only if fine-grained hits a Renovate limitation ([known gaps](https://github.com/renovatebot/github-action#token) around Checks/automerge — not used here):

| Scope | Required for |
|-------|----------------|
| `repo` | Private repos (or `public_repo` for public only) |
| `workflow` | Updating GitHub Actions refs in `.github/workflows/` |

[Classic tokens](https://github.com/settings/tokens) grant broader access than a single-repo fine-grained token — prefer fine-grained when it works.

### 2. Add the repository secret

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|------|--------|
| `RENOVATE_TOKEN` | the PAT from step 1 |

### 3. Merge this workflow to `main`

After the secret exists, either wait for the Monday schedule or run **Actions →
Renovate → Run workflow** manually.

Renovate opens a **Dependency Dashboard** issue listing pending updates.

Config: [`renovate.json`](../renovate.json) at the repo root.

## How it runs

| Piece | Role |
|-------|------|
| `.github/workflows/renovate.yml` | Weekly cron + manual `workflow_dispatch` |
| `renovatebot/github-action` | Runs Renovate CLI in Docker on GitHub-hosted runners |
| `RENOVATE_TOKEN` | Your PAT — opens branches and PRs |
| `renovate.json` | Grouping, schedule, labels, no automerge |

No third-party GitHub App is installed. Mend’s open-source Renovate image runs
only when your workflow runs.

## Update policy

| Type | Handling |
|------|----------|
| **Patch / minor** | Grouped weekly (Monday mornings, Europe/Amsterdam) |
| **Major** | Separate PR per package; always manual review |
| **Security** | `vulnerabilityAlerts` enabled — PRs outside schedule when needed |
| **Lockfile** | Monthly lockfile maintenance PR |

### Groups

| Group | Packages |
|-------|----------|
| svelte stack | `@sveltejs/*`, `svelte`, `svelte-check` |
| vite and tailwind | `vite`, `@tailwindcss/*`, `tailwindcss` |
| vitest suite | `vitest`, `@vitest/coverage-v8`, `happy-dom` |
| github actions | All workflow action refs |
| node docker | `node` image in `.devcontainer/Dockerfile` |

### `rangeStrategy: bump`

Renovate updates both `package.json` ranges **and** `pnpm-lock.yaml`.

## CI gate for update PRs

Every PR runs:

- `pnpm check`
- `pnpm test:coverage`
- `pnpm build` (with `BASE_PATH` set like production)

Merge only when green.

## Risk areas

| Package(s) | Why |
|------------|-----|
| `svelte`, `@sveltejs/kit`, `@sveltejs/vite-plugin-svelte` | Runes, routing, build |
| `vite`, `@tailwindcss/vite`, `tailwindcss` | Build pipeline, SW plugin |
| `happy-dom` | DOM behaviour in unit tests (exact-pinned) |
| `sharp` | Native bindings; thumb generation |
| `typescript`, `svelte-check` | Type diagnostics |

## Toolchain notes

- **pnpm** version is pinned in `packageManager` and CI Corepack.
- **Node:** devcontainer **22**, CI **24** — align when touching either.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Workflow fails immediately | Check `RENOVATE_TOKEN` secret exists and is not expired |
| No GitHub Actions updates in PRs | Fine-grained **Workflows** permission missing (or classic `workflow` scope) |
| PRs open but CI does not run | Use a PAT — not `GITHUB_TOKEN` |
| Fine-grained auth errors | Fall back to classic PAT with `repo` + `workflow`, or check token repo access includes this repo |
| Rotate token | Create new PAT → update secret → revoke old PAT |

## Later (optional)

- **Automerge** for patch-only groups (not enabled).
- **Playwright e2e** on PRs before automerging Svelte/Vite minors.
- **Node alignment** (22 vs 24) across devcontainer and CI.

## Open decisions

| Question | Decision |
|----------|----------|
| Automerge | _Off — manual merge_ |
| Node alignment (22 vs 24) | _TBD_ |
| PAT type | _Fine-grained (preferred)_ |
| PAT owner | _Personal vs machine account — TBD_ |
