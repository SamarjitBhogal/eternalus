# Eternalus

Eternalus is a browser-only 2D game built by a student team: single player against AI bots, no
server. It is a TypeScript monorepo (npm workspaces) with a React + CSS Modules UI and a custom
engine on the HTML5 Canvas 2D API, driving a deterministic simulation at a fixed 30 ticks per
second.

**Status:** the repository is scaffolding plus a complete design and delivery plan (Phase 0).
The client renders an empty full-screen canvas inside a Redux provider, and `@eternalus/core`
has no code yet. The design is in [docs/architecture/](docs/architecture/README.md), the
requirements in [docs/requirements/](docs/requirements/README.md) and the plan in
[docs/plan/](docs/plan/README.md). Start at the [documentation map](docs/README.md).

## Prerequisites

Works on **macOS, Linux and Windows**.

- **Node.js 24.21.0** (the version in `.nvmrc`), with npm 11 (ships with Node 24). Use a version
  manager:
  - macOS / Linux: [nvm](https://github.com/nvm-sh/nvm): `nvm install` then `nvm use` (reads `.nvmrc`).
  - Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows):
    `nvm install 24.21.0` then `nvm use 24.21.0`.
  - Any OS: [fnm](https://github.com/Schniz/fnm) also reads `.nvmrc` (`fnm use`).
- **VS Code** is recommended. It prompts you to install the recommended **Prettier** extension
  (`esbenp.prettier-vscode`, from `.vscode/extensions.json`). Accept it.

## Quick start

```bash
git clone git@github.com:SamarjitBhogal/eternalus.git
cd eternalus
# select Node 24.21.0 with your version manager (see Prerequisites)
npm install        # installs all workspaces and activates the git hooks
npm run dev        # http://localhost:5173
npm run check      # the full quality gate, the same as CI
```

## npm scripts

| Command                           | What it does                                                      |
| --------------------------------- | ----------------------------------------------------------------- |
| `npm install`                     | Install all workspaces and point git at `.githooks/`              |
| `npm run dev`                     | Client dev server (Vite)                                          |
| `npm run build`                   | Typecheck and build every package                                 |
| `npm run check`                   | **Everything**: format, lint, typecheck, knip, tests, build, docs |
| `npm run check:quick`             | Typecheck + lint (what the pre-commit and pre-push hooks run)     |
| `npm run test`                    | Vitest in every workspace                                         |
| `npm run test:coverage`           | Tests with coverage thresholds                                    |
| `npm run lint`                    | ESLint with `--max-warnings 0`                                    |
| `npm run typecheck`               | `tsc -b` across all project references                            |
| `npm run knip`                    | Unused files, exports and dependencies                            |
| `npm run docs:check`              | Docs frontmatter, relative links and index freshness              |
| `npm run docs:index`              | Regenerate the index tables in `docs/README.md`                   |
| `npm run format` / `format:check` | Prettier write / check                                            |

## Repository layout

```
packages/core/   @eternalus/core    game simulation, pure TypeScript (empty for now)
apps/client/     @eternalus/client  Vite + React app: canvas, Redux store, UI
.githooks/       pre-commit and pre-push hooks
.claude/         Claude Code harness: settings (permissions, hooks), skills, subagents
.agents/         cross-tool skill pointers (Codex, Gemini/Antigravity, Cursor)
scripts/         zero-dependency Node scripts: agent hooks, docs check
docs/            plan, architecture, requirements, reference, research, process, agents, ADRs, changelog
INBOX.md         product-owner ⇄ agent queue (requests, feedback, decisions)
```

## Documentation

- [docs/README.md](docs/README.md): the documentation map (start here)
- [CONTRIBUTING.md](CONTRIBUTING.md): coding standards, testing, git basics, Definition of Done
- [AGENTS.md](AGENTS.md): rules for AI coding agents (and a good summary for humans)
- [docs/architecture/](docs/architecture/README.md): layered model, code structure, entities, map, engine, AI, persistence, diagnostics, harness
- [docs/requirements/](docs/requirements/README.md): principles, standards and the FR/NFR catalogue
- [docs/plan/](docs/plan/README.md): phases, sprints, metrics, progress log
- [docs/reference/](docs/reference/README.md): the game design split by topic, suggestions, glossary
- [docs/process/git-workflow.md](docs/process/git-workflow.md): phase branches and stacked PRs
- [docs/process/guardrails.md](docs/process/guardrails.md): every automated guardrail and how to change one
- [docs/agents/](docs/agents/README.md): how to run, configure and review AI agents
- [docs/decisions/](docs/decisions/): architecture decision records (ADRs)
- [docs/changelog/](docs/changelog/README.md): what changed and why
