---
title: Tool setup for coding agents
description: Line-by-line explanation of the committed agent configuration (Claude Code settings, hooks, skills, subagents; Codex; Gemini/Antigravity; Copilot; Cursor) and how to verify that the harness actually runs; read this when onboarding a tool or when a hook misbehaves.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-07
tags: [agents, harness, tooling, claude-code, codex, gemini, copilot, cursor]
paths:
  [
    '.claude/**',
    '.agents/**',
    '.gemini/**',
    'scripts/hooks/**',
    'GEMINI.md',
    '.github/copilot-instructions.md',
  ]
related:
  [
    'docs/agents/README.md',
    'docs/research/agentic-harness-research.md',
    'docs/decisions/0012-agents-push-task-branches-and-open-prs.md',
  ]
---

# Tool setup for coding agents

**Purpose.** Read this when you set up a coding tool on this repo, or when a hook, skill or
permission rule does something unexpected. Every fact about a tool below comes from the
[harness research report](../research/agentic-harness-research.md) (verified 2026-09-30);
re-verify against the tool's docs before changing a key name.

## 1. Claude Code (primary)

### Instruction files

- `CLAUDE.md` (root, `packages/core/`, `apps/client/`) contains only `@AGENTS.md`. Claude Code
  expands the import at launch, relative to the importing file, so each level loads its own
  `AGENTS.md`. Do not add rules to `CLAUDE.md`; add them to `AGENTS.md` so every tool sees them.
- Keep `AGENTS.md` under ~150 lines (the docs recommend < 200): it is a table of contents plus
  hard rules, and it links to `docs/` for everything else.

### `.claude/settings.json`

Project settings, committed, applied to everyone who opens the repo in Claude Code after the
workspace-trust dialog (deny rules apply immediately, allow rules after trust).

| Key                  | Entries                                                                                                                                                                                                                                                                                                    | Why                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `permissions.allow`  | `Read`, `Edit`, `Write`; `Bash(npm run check…)`, `test`, `lint`, `typecheck`, `knip`, `format`, `docs:*`, `build`, `dev`; `npx prettier/eslint/vitest`; read-only git (`status`, `diff`, `log`, `branch`, `show`, `worktree list`); `git push -u origin *` and `gh pr create *` (ADR 0012)                 | The quality gate and inspection commands run without prompts, so agents actually run them                                         |
| `permissions.deny`   | force pushes (`--force`, `-f`, before or after the branch), pushes naming `main` or `phase/…`, `git commit --no-verify`, `git reset --hard`, `git checkout/switch main`, `git branch -D`, `rm -rf`; reading `.env*`, `dist/`, `coverage/`; editing `package-lock.json`, `.githooks/`, `.github/workflows/` | Agents push their own task branch and open its PR when asked (ADR 0012); humans merge; guardrail files change only through an ADR |
| `hooks.SessionStart` | `node scripts/hooks/session-start.mjs`                                                                                                                                                                                                                                                                     | Prints branch (warns on `main`), the reading order, open INBOX items, last PROGRESS entry                                         |
| `hooks.PostToolUse`  | matcher `Edit\|Write` → `node scripts/hooks/post-edit.mjs`                                                                                                                                                                                                                                                 | Prettier + ESLint on the touched file; exit 2 shows lint failures to the agent immediately                                        |
| `hooks.Stop`         | `node scripts/hooks/stop-check.mjs`                                                                                                                                                                                                                                                                        | Runs `npm run check:quick`; exit 2 stops the agent from ending its turn with failing checks                                       |

Notes: permission patterns are best-effort (`git -C . push` is not matched by `Bash(git push *)`);
the git hooks and CI remain the hard gate. Commands use the exec form (`"command": "node",
"args": [...]`) because `.cmd` shims cannot be spawned without a shell on Windows. Hook scripts
receive a JSON object on stdin (`tool_name`, `tool_input.file_path`, `cwd`, `stop_hook_active`,
…); only exit code 2 blocks; the `Stop` hook honours `stop_hook_active` so it cannot trap an
agent in a loop. Personal overrides go in `.claude/settings.local.json` (gitignored).

### Skills (`.claude/skills/<name>/SKILL.md`)

| Skill           | Use                                                                                             | Invocation               |
| --------------- | ----------------------------------------------------------------------------------------------- | ------------------------ |
| `new-entity`    | Add a Legend/mob/structure/obstacle/boss/zone: content → (class) → registry line → tests → docs | auto or `/new-entity`    |
| `new-system`    | Add a per-tick system (+ component/strategy), registered in `SystemPipeline`                    | auto or `/new-system`    |
| `new-ability`   | Add an ability/weapon/artifact/status effect as content (+ one effect class)                    | auto or `/new-ability`   |
| `new-screen`    | Add a React screen/HUD element with CSS module, selectors and render tests                      | auto or `/new-screen`    |
| `new-content`   | Change tuning/config data only (the `numLanes` litmus test)                                     | auto or `/new-content`   |
| `pr-review`     | Structured, read-only review against the checklists                                             | auto or `/pr-review`     |
| `doc-gardening` | Fix stale docs, links, frontmatter; regenerate the index                                        | auto or `/doc-gardening` |
| `verify`        | Run `npm run check` and report verbatim                                                         | auto or `/verify`        |
| `adr`           | Draft an ADR from the template (manual only: `disable-model-invocation: true`)                  | `/adr`                   |

Frontmatter uses only the portable fields (`name`, `description`, `allowed-tools`, and
`disable-model-invocation` for `adr`), so the same files are valid for the Agent Skills spec.
`.agents/skills/<name>/SKILL.md` are pointer stubs for the other tools.

### Plugins

| Plugin              | Install (once per machine)                                                                  | Used for                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ponytail@ponytail` | `/plugin marketplace add DietrichGebert/ponytail`, then `/plugin install ponytail@ponytail` | Step 2 of the pre-PR gate (`AGENTS.md`, ADR 0010): `/ponytail-review` on the branch diff, `/ponytail` to apply |

The gate needs the plugin; a session without it stops after the Definition of Done and hands the
branch to a session that has it.

### Subagents (`.claude/agents/*.md`)

`architecture-reviewer` (read-only: `Read, Grep, Glob, Bash`), `test-writer` (tests only),
`doc-gardener`. Invoke with "use the architecture-reviewer subagent to review this diff".

### Parallel sessions

`claude --worktree <name>` creates `.claude/worktrees/<name>` on a `worktree-<name>` branch;
or create your own with `git worktree add .worktrees/<task> -b feat/<task> phase/<n>-<name>`
(both folders are gitignored). Each worktree needs its own `npm install`.

## 2. OpenAI Codex / ChatGPT

Codex reads `AGENTS.md` natively (root → cwd chain, 32 KiB cap) and discovers skills in
`.agents/skills/`. No extra config is committed. If the team wants the same hook gates in Codex,
`.codex/hooks.json` uses the same event names and JSON shape as Claude Code, so the scripts in
`scripts/hooks/` can be reused unchanged; add it through an ADR when someone uses Codex daily.

## 3. Gemini CLI / Antigravity CLI

- `.gemini/settings.json`: `{"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}}` makes Gemini
  CLI load `AGENTS.md` as context. `GEMINI.md` (root and packages) are two-line pointers.
- Google retired Gemini CLI for consumer tiers on 2026-06-18 in favour of Antigravity CLI
  (`agy`), which reads `GEMINI.md` and `AGENTS.md` natively and looks for skills in
  `.agents/skills/`; the same files work.

## 4. GitHub Copilot

Copilot's coding agent and code review read `AGENTS.md` natively (nearest file wins);
`.github/copilot-instructions.md` restates the six most-broken rules. `.github/instructions/`
is intentionally unused to avoid drift. In VS Code, enable `chat.useAgentsMdFile`.

## 5. Cursor

Cursor reads `AGENTS.md` (root and nested) and both skill folders natively; no `.cursor/rules`
are committed for the same drift reason.

## 6. Verifying the harness works

Run these once after cloning and after any change to the files above:

```bash
# 1. Hooks run and understand their input (no Claude needed)
echo '{"tool_name":"Edit","tool_input":{"file_path":"AGENTS.md"},"cwd":"."}' | node scripts/hooks/post-edit.mjs
echo '{"stop_hook_active":false,"cwd":"."}' | node scripts/hooks/stop-check.mjs   # runs check:quick
echo '{}' | node scripts/hooks/session-start.mjs

# 2. The settings file is valid JSON and lists the expected events
node -e "const s=require('./.claude/settings.json');console.log(Object.keys(s.hooks))"

# 3. In Claude Code: /doctor (config and hook health), /context (what loaded), /skills (list)
```

Expected: exit code 0 for the first and third commands; the second exits 2 only if
`npm run check:quick` fails. If a hook prints nothing, check that Node 24 is active (`.nvmrc`).

## Related

- [`README.md`](README.md) — harness overview
- [`running-agents.md`](running-agents.md) — scoping, worktrees, review, recovery
- [`../architecture/16-agentic-harness.md`](../architecture/16-agentic-harness.md)
- [`../research/agentic-harness-research.md`](../research/agentic-harness-research.md)
