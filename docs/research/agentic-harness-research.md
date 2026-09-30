---
title: 'Agentic coding harness: research report'
description: Verified facts and recommendations for configuring Claude Code, Codex, Gemini/Antigravity, Copilot and Cursor on a TypeScript monorepo game project; read before changing AGENTS.md, .claude/, .codex/ or .gemini/.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-09-30
tags: [research, agents, harness, tooling]
---

# Agentic coding harness: research report

Every factual claim about a tool below is backed by a page fetched on 2026-09-30; the
"Works cited" list gives the URL, title, publisher and publication date where the page states
one. Where something could not be verified it is marked **(unverified)**. Repository facts
(current `AGENTS.md`, `CLAUDE.md`, configs) were read from the working tree on the same day.

## Summary

- `AGENTS.md` is now the de-facto cross-tool instruction file: it is stewarded by the Agentic
  AI Foundation under the Linux Foundation, used by 60k+ repositories, and read natively by
  Codex, Cursor, GitHub Copilot (cloud agent, code review, VS Code), Jules, Factory, Devin
  Desktop/Windsurf, Zed, OpenCode and Antigravity CLI. Aider and Gemini CLI need one config line.
- Claude Code reads `AGENTS.md` directly only when no `CLAUDE.md` exists (v2.1.277+); the
  documented, Windows-safe way to share one file is exactly what Eternalus already does: a
  `CLAUDE.md` containing `@AGENTS.md` at each level.
- Gemini CLI: `.gemini/settings.json` with `{"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}}`.
  Note that Google retired Gemini CLI for consumer tiers on 2026-06-18 in favour of Antigravity
  CLI (`agy`), which reads `GEMINI.md` and `AGENTS.md` natively and stores skills in `.agents/skills/`.
- Claude Code's enforcement surface is `.claude/settings.json`: `permissions.allow/deny/ask`
  rules and `hooks` keyed by events such as `SessionStart`, `UserPromptSubmit`, `PreToolUse`,
  `PostToolUse`, `Stop`, `SubagentStop`, `PreCompact`, `SessionEnd`. Only exit code 2 blocks.
- Codex hooks (`.codex/hooks.json`) use the same event names and JSON shape as Claude Code, and
  Codex, Gemini CLI, Antigravity and Cursor all read skills from `.agents/skills/`; a
  tool-neutral hook script plus three thin configs is therefore realistic.
- Anthropic's harness posts converge on: a feature list with pass/fail, one feature per session,
  a progress file plus git as memory, an init script, self-verification with real tooling, and a
  separate evaluator because agents grade their own work generously.
- OpenAI's "Harness engineering" (Feb 2026) adds: `AGENTS.md` as a ~100-line table of contents,
  `docs/` as system of record, architecture enforced by custom linters whose error messages
  contain the fix, and a recurring doc-gardening/cleanup agent.
- Independent 2026 evidence (ETH Zurich, marmelab) says prose rules are weakly enforced and
  cost tokens; instructions are followed but repository overviews do not help. Enforce with
  scripts; keep instruction files short; test hooks; write down why each control exists.
- Eternalus already has the zero-dependency core (git `core.hooksPath` hooks, `tsc -b` project
  references, ESLint `no-restricted-imports`, knip, Vitest thresholds, CI matrix). The gaps are
  agent-loop hooks, per-glob import boundaries, cycle detection, a coverage ratchet, and docs
  frontmatter/indexing.
- Recommended next steps: add `.claude/settings.json` (permissions + hooks) mirrored in
  `.codex/hooks.json` and `.gemini/settings.json`; add ESLint per-folder boundary configs;
  turn on Vitest `thresholds.autoUpdate` locally; adopt the docs frontmatter schema in §7.

## 1. The AGENTS.md standard

**What it is.** agents.md describes `AGENTS.md` as "a README for agents": plain Markdown with
no required fields, placed at the repository root, with nested files allowed in subprojects
("the closest AGENTS.md to the edited file wins; explicit user chat prompts override
everything"). The format emerged from OpenAI Codex, Amp, Jules, Cursor and Factory and "is now
stewarded by the Agentic AI Foundation under the Linux Foundation"; the site counts 60k+ public
repositories using it [agents.md]. A Sept 2026 survey of 391 harness repositories found 189
with a root `AGENTS.md` versus 155 with `CLAUDE.md`, and in large OSS projects 36 of 53
`CLAUDE.md` files were "just a symlink or a short redirect to AGENTS.md" [marmelab 2026].

**Tool-by-tool support** (each row verified against the tool's own docs):

| Tool                                                                                               | Reads `AGENTS.md`?                                                                                                       | Native instruction file(s) and notes                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI Codex (CLI, IDE, cloud, code review)                                                        | Yes, natively                                                                                                            | Chain: `~/.codex/AGENTS.override.md` or `~/.codex/AGENTS.md`, then every directory from the git root down to cwd (`AGENTS.override.md` wins over `AGENTS.md` per directory); concatenated root-first; stops at `project_doc_max_bytes` (32 KiB default); extra names via `project_doc_fallback_filenames` in `~/.codex/config.toml` [Codex AGENTS.md] |
| Claude Code                                                                                        | Yes since v2.1.277, but only when no `CLAUDE.md`/`.claude/CLAUDE.md`/`CLAUDE.local.md` is in cwd or above                | Native file is `CLAUDE.md` with `@path` imports. Default setting `claude-md-or-agents-md`; `claude-md-and-agents-md` reads both (settable only in user/managed settings, not project). Docs recommend `CLAUDE.md` containing `@AGENTS.md`; symlinks are discouraged on Windows [Claude memory]                                                        |
| Gemini CLI                                                                                         | Not by default                                                                                                           | Native `GEMINI.md` (global `~/.gemini/GEMINI.md`, workspace, and just-in-time in subdirs) with `@file.md` imports. Setting: `context.fileName` (string or array) in `settings.json`; project file is `.gemini/settings.json` [Gemini GEMINI.md; Gemini config reference; Gemini hooks]                                                                |
| Antigravity CLI (`agy`, Gemini CLI's successor)                                                    | Yes, natively                                                                                                            | Reads `GEMINI.md` and `AGENTS.md` in the workspace plus `~/.gemini/GEMINI.md`; skills move from `.gemini/skills/` to `.agents/skills/`; MCP config in `.agents/mcp_config.json` [Antigravity migration]. Consumer Gemini CLI stopped serving on 2026-06-18; enterprise licences keep Gemini CLI [Google blog 2026-05-19]                              |
| GitHub Copilot (cloud agent, code review)                                                          | Yes: "nearest AGENTS.md in the directory tree will take precedence"; a single root `CLAUDE.md` or `GEMINI.md` also works | Native: `.github/copilot-instructions.md` (repo-wide) and `.github/instructions/NAME.instructions.md` with `applyTo` globs (comma-separated) and optional `excludeAgent: "code-review"` or `"cloud-agent"` [GitHub Docs]                                                                                                                              |
| Copilot in VS Code                                                                                 | Yes (`chat.useAgentsMdFile`); nested files experimental (`chat.useNestedAgentsMdFiles`, off by default)                  | Also reads `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md` (`chat.useClaudeMdFile`) and `.claude/rules` with `paths`; harness-dependent discovery [VS Code instructions]                                                                                                                                                                          |
| Cursor                                                                                             | Yes, root and nested ("more specific instructions taking precedence")                                                    | Native: `.cursor/rules/*.mdc` with `description`, `globs`, `alwaysApply` frontmatter; plain `.md` in that folder is ignored [Cursor rules]                                                                                                                                                                                                            |
| Jules (Google)                                                                                     | Yes, root                                                                                                                | "Jules now automatically looks for a file named AGENTS.md in the root of your repository" [Jules docs]                                                                                                                                                                                                                                                |
| Factory Droid                                                                                      | Yes; also `agents.md`, `Agents.md`, `CLAUDE.md`, `Claude.md`                                                             | Searches cwd up to git root, plus `.factory/`, `.agents/`, `.agent/`; caps 80,000 chars initial load, 40,000 dynamic [Factory docs]                                                                                                                                                                                                                   |
| Devin Desktop (formerly Windsurf, Cascade)                                                         | Yes; root = always-on, subdirectory = auto-glob `<dir>/**`                                                               | Native rules: `.devin/rules/*.md` (legacy `.windsurf/rules/`), frontmatter `trigger: always_on                                                                                                                                                                                                                                                        | model_decision | glob | manual`, `globs`, `description`; 12,000 chars per rule file [Devin memories; Devin AGENTS.md] |
| Zed                                                                                                | Yes                                                                                                                      | First match in this list wins: `.rules`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`, `AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` [Zed rules]                                                                                                                                                            |
| OpenCode                                                                                           | Yes (preferred); `CLAUDE.md` used only if no `AGENTS.md`                                                                 | Extra files via `instructions` array in `opencode.json`; no automatic `@file` expansion [OpenCode rules]                                                                                                                                                                                                                                              |
| Aider                                                                                              | No                                                                                                                       | `CONVENTIONS.md` loaded read-only; make it permanent with `read: AGENTS.md` in `.aider.conf.yml` [Aider conventions; agents.md FAQ]                                                                                                                                                                                                                   |
| goose, Warp, Amp, RooCode, Kilo Code, Devin (cloud), Junie, Augment, Ona, Semgrep, Phoenix, UiPath | Listed as compatible on agents.md                                                                                        | **(unverified individually)**                                                                                                                                                                                                                                                                                                                         |

**What this means for Eternalus**

- Keep `AGENTS.md` as the single source and the three `CLAUDE.md` files (`root`,
  `packages/core`, `apps/client`) as `@AGENTS.md` imports. This is the configuration Anthropic's
  docs describe for sharing one file, and it is Windows-safe (symlinked `CLAUDE.md` checks out
  as a one-line text file on Windows without `core.symlinks`). Because relative imports resolve
  relative to the importing file, the nested `CLAUDE.md` files correctly load the nested
  `AGENTS.md` when Claude reads files in those packages.
- Commit `.gemini/settings.json` with `"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}` so
  Gemini CLI (enterprise) users get the same instructions; Antigravity CLI needs nothing.
- Commit `.aider.conf.yml` with `read: AGENTS.md` only if someone actually uses Aider.
- Root `AGENTS.md` is 6.6 KB / 114 lines, well under Codex's 32 KiB combined cap and Claude's
  200-line guidance; nested files add roughly 3-4 KB each. Do not grow it: move procedures into
  skills (§2) and reference docs into `docs/` (§4).
- Copilot code review and the VS Code local agent honour `.github/instructions/*.instructions.md`
  with `applyTo`; add two small ones (`core.instructions.md` with `applyTo: "packages/core/**"`,
  `client.instructions.md` with `applyTo: "apps/client/**"`) that just restate the nested
  `AGENTS.md` boundary rules for PR review. Keep them short; they are duplicates by design.

## 2. Claude Code project configuration in 2026

All facts from the Claude Code docs at code.claude.com (the old
`anthropic.com/engineering/claude-code-best-practices` URL now redirects there).

**CLAUDE.md hierarchy and imports** [Claude memory]. Load order, broadest first: managed policy
(`/Library/Application Support/ClaudeCode/CLAUDE.md`, `/etc/claude-code/CLAUDE.md`,
`C:\Program Files\ClaudeCode\CLAUDE.md`), user `~/.claude/CLAUDE.md`, project `./CLAUDE.md` or
`./.claude/CLAUDE.md`, local `./CLAUDE.local.md` (gitignore it). Files in cwd and every parent
load at launch; files in subdirectories load on demand when Claude reads files there. All are
concatenated, not overridden. `@path/to/file` imports expand at launch (relative to the importing
file, max depth 4 hops; backticked `@paths` are not imported; paths with spaces need `\ `).
Imports do not reduce context cost. Guidance: under 200 lines per file, concrete and verifiable
instructions, prune conflicts; `/doctor prompt-audit` (v2.1.283+) finds stale or conflicting
instructions; `/context` shows what loaded. HTML comments are stripped before injection. A file
over 4 MiB is skipped. `.claude/rules/*.md` are always-on or, with `paths:` frontmatter
(the only rule field read), load only when matching files are touched.

**Settings** [Claude settings; Claude permissions]. Precedence, highest first: managed
settings, `claude --settings`, `.claude/settings.local.json`, `.claude/settings.json`,
`~/.claude/settings.json`. Permission rules are `Tool` or `Tool(specifier)`: `Bash(npm run *)`
(trailing `*` after a space also matches the bare command), `Read(./.env)`,
`WebFetch(domain:example.com)`, `Edit(src/**)`. Deny/ask rules can also match a scalar parameter,
e.g. `Agent(isolation:worktree)`. Caveats: `Bash(git push *)` does not match `git -C . push`;
`Bash(git * main)` is broader than it looks (`*` swallows the subcommand); `permissions.allow`
in a committed `.claude/settings.json` applies only after the workspace-trust dialog, deny/ask
apply immediately. Example from the docs:

```json
{
  "permissions": {
    "allow": ["Bash(npm run *)", "Bash(git commit *)"],
    "deny": ["Bash(git push *)"]
  }
}
```

**Hooks** [Claude hooks]. Defined under `hooks` in the same settings files (project file is
shareable), in plugin `hooks/hooks.json`, or in skill/agent frontmatter. Three levels: event,
matcher group, handler (`type: command | http | mcp_tool | prompt | agent`). Events (per
session) `SessionStart`, `SessionEnd`, `Setup`; (per turn) `UserPromptSubmit`,
`UserPromptExpansion`, `Stop`, `StopFailure`; (per tool call) `PreToolUse`, `PermissionRequest`,
`PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`; plus `SubagentStart`,
`SubagentStop`, `TaskCreated`, `TaskCompleted`, `TeammateIdle`, `Notification`, `MessageDisplay`,
`InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged`,
`WorktreeCreate`, `WorktreeRemove`, `PreCompact`, `PostCompact`, `PreModelSwitch`,
`PostModelSwitch`, `Elicitation`, `ElicitationResult`. Tool-event matchers filter on tool name
(`Edit|Write`, `Bash`, `mcp__server__.*`); the handler-level `if` field narrows by permission-rule
syntax (`"Edit(*.ts)"`, `"Bash(git *)"`). Handlers receive JSON on stdin (`tool_name`,
`tool_input`, `cwd`, ...). **Exit code 2 is the only exit code that blocks**; exit 1 is a
non-blocking error. What exit 2 does: `PreToolUse` blocks the call, `Stop` "prevents Claude
from stopping, continues the conversation", `PostToolUse` cannot block but "shows stderr to
Claude", `UserPromptSubmit` rejects the prompt. Stdout JSON can return `permissionDecision`
(`allow|deny|ask`), `updatedInput`, `additionalContext`, `systemMessage`, or top-level
`decision: "block"` + `reason` on `Stop`/`PostToolUse`. Default timeout 600 s (30 s for
`UserPromptSubmit`). On Windows, exec form (`"command": "node", "args": [...]`) is recommended
because `.cmd` shims cannot be spawned without a shell; "the node plus script-path pattern works
on every platform". Hooks also fire inside subagents. The documented lint recipe:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "/path/to/lint-check.sh" }]
      }
    ]
  }
}
```

**Skills** [Claude skills; Agent Skills spec]. `.claude/skills/<name>/SKILL.md` (project,
committed), `~/.claude/skills/` (personal), nested `<subdir>/.claude/skills/` (loads when Claude
works there). `.claude/commands/*.md` still works ("custom commands have been merged into
skills") and accepts the same frontmatter except `name` and `paths`. Frontmatter fields:
`name`, `description` (recommended; combined with `when_to_use`, truncated at 1,536 chars in the
listing), `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`,
`user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork`,
`agent`, `background`, `hooks`, `paths`, `shell`, `metadata`, `license`, `compatibility`.
Unknown fields are ignored silently. The portable Agent Skills spec allows only `name`,
`description`, `license`, `compatibility`, `metadata`, `allowed-tools`; `name` must be
lowercase-hyphen and match the directory. `disable-model-invocation: true` makes a skill a
manual `/command` (use for anything with side effects, e.g. commits).

**Subagents** [Claude sub-agents]. `.claude/agents/*.md` (project) or `~/.claude/agents/`;
frontmatter: `name` (required), `description` (required), `tools`, `disallowedTools`, `model`
(`sonnet|opus|haiku|fable|inherit` or full ID), `permissionMode`, `maxTurns`, `skills`,
`mcpServers`, `hooks`, `memory`, `background`, `omitClaudeMd`, `effort`, `isolation: worktree`,
`color`, `initialPrompt`. Nested `.claude/agents/` directories are walked up to the repo root.

**MCP** [Claude MCP]. Project servers live in `.mcp.json` at the repo root under `mcpServers`
(`type: http|sse|stdio`, env expansion `${VAR}` / `${VAR:-default}`), committed; interactive
sessions prompt for approval (`claude mcp reset-project-choices` resets), `-p` runs load them
without asking, `disabledMcpjsonServers` blocks one.

**Monorepo guidance** [Claude large codebases]. Root `CLAUDE.md` for repo-wide rules, one
per package; `.claude/settings.json` is not inherited from parent directories, so keep
permission/hook settings in the root file (worktree sessions read the worktree root's copy);
`permissions.deny` `Read(./**/dist/**/*)` rules keep build output out of context; per-directory
skills load only when relevant; `worktree.sparsePaths` / `symlinkDirectories` exist; a `Stop`
hook can propose `CLAUDE.md` updates from the transcript.

**What this means for Eternalus**

- Add a committed `.claude/settings.json` with: `permissions.deny` for `Bash(git push *)`,
  `Bash(git reset --hard*)`, `Bash(git commit --no-verify*)`, `Bash(git push --force*)`,
  `Read(./.env*)`, `Read(./**/dist/**/*)`, `Read(./**/coverage/**/*)`; `permissions.allow` for
  `Bash(npm run *)`, `Bash(npm test*)`, `Bash(npx vitest *)`, `Bash(git status *)`,
  `Bash(git diff *)`, `Bash(git log *)`. Denies work before trust; allows need the trust dialog.
  These rules are pattern-based and best-effort (`git -C` bypasses them), so keep the
  `.githooks` and CI as the hard gate.
- Hooks (all `type: command`, exec form with `node` for Windows): `PostToolUse` matcher
  `Edit|Write`, `if: "Edit(**/*.ts)"` / `Edit(**/*.tsx)` running `eslint --max-warnings 0` on the
  edited file and exiting 2 with the lint output on stderr; `Stop` running `npm run check:quick`
  and exiting 2 with the failure when it fails (Claude's docs describe the Stop hook as "a
  deterministic gate" and note a cap on consecutive blocks); `SessionStart` printing
  `git status --short` and the tail of a progress file (§3). Keep hook scripts in a tool-neutral
  folder (`scripts/agent-hooks/*.mjs`) so Codex and Gemini configs can call the same files.
- Skills (project, committed): `/verify` = run `npm run check` and paste the verbatim result;
  `/add-system`, `/add-component` = the procedures already in `packages/core/AGENTS.md`
  ("Adding code"), moved out of the always-loaded file; `/adr` = create an ADR from
  `docs/decisions/0000-template.md`. Mark commit-related skills `disable-model-invocation: true`.
- Subagents: `reviewer` (tools `Read, Grep, Glob, Bash`; reviews the diff against
  `docs/agents/running-agents.md` §4 checklist and reports gaps only) and `explorer` (read-only). Add
  `isolation: worktree` only for agents that edit.
- `.mcp.json`: nothing needed today; if browser-driven verification is adopted later (§3), a
  Playwright/Chrome MCP entry goes here.

## 3. Anthropic engineering guidance

**Effective harnesses for long-running agents** (2025-11-26) [Anthropic harnesses]. Two
failure modes: the agent tries to one-shot the app and runs out of context mid-feature, or a
later session "declares the job done". Solution: an **initializer agent** that writes an
`init.sh`, a `claude-progress.txt` log, an initial commit and a **feature list JSON** where each
entry has `category`, `description`, `steps` and `passes: false` (JSON because "the model is less
likely to inappropriately change or overwrite JSON files"), with strong wording that removing or
editing tests is unacceptable; a **coding agent** that each session runs `pwd`, reads the
progress file and `git log`, runs `init.sh` and a basic end-to-end check, picks **one** failing
feature, self-verifies with real tooling (browser automation via an MCP), and ends with a
descriptive commit plus a progress note. Git is the recovery mechanism.

**Harness design for long-running application development** (2026-03-24) [Anthropic harness
design]. Agents "reliably skew positive when grading their own work", so separate the
generator from an **evaluator** that is tuned to be skeptical and drives the running app
(Playwright MCP). A **planner** expands a short prompt into a spec; generator and evaluator
negotiate a **sprint contract** ("what done looks like") before code; communication is through
files. Newer models made sprints and context resets unnecessary: "every component in a harness
encodes an assumption about what the model can't do on its own", so re-examine the harness on
each model release and remove dead scaffolding. The evaluator is worth its cost only for work at
the edge of the model's ability.

**Effective context engineering** (2025-09-29) [Anthropic context]. Context is a finite
"attention budget" subject to context rot; find "the smallest possible set of high-signal
tokens". Prefer just-in-time retrieval (file paths, grep) over pre-loading; use compaction,
structured note-taking (a `NOTES.md`/progress file) and sub-agents that return distilled
summaries; give tools clear, non-overlapping contracts; canonical examples beat edge-case lists.

**Building effective agents** (2024-12-19, updated 2026) [Anthropic agents]. Start simple; add
workflow patterns (prompt chaining with gates, routing, parallelization, orchestrator-workers,
evaluator-optimizer) only when they measurably help; coding agents work because "code solutions
are verifiable through automated tests"; invest in tool descriptions as much as prompts.

**Claude Code best practices** (docs) [Claude best practices]. "Give Claude a way to verify its
work": tests, build exit codes, linters, screenshots; escalate from prompt-level checks to a
`/goal`, a `Stop` hook ("deterministic gate"), or a fresh-context verification subagent; have
Claude "show evidence rather than asserting success". Explore, plan (plan mode), implement,
commit. Keep `CLAUDE.md` short ("would removing this cause Claude to make mistakes?"), convert
rules Claude already follows into hooks, `/clear` between tasks, use subagents for research, use
a Writer/Reviewer pair of sessions, and `claude -p ... --allowedTools` for unattended batches.

**What this means for Eternalus**

- The "definition of done" in `AGENTS.md` already matches the verification advice; add the
  evidence rule: the agent pastes the verbatim tail of `npm run check` output in its final
  message and in the PR description (the PR template can carry a "Verification output" field).
- Adopt the feature-list pattern for multi-session work: `docs/plans/<task>.json` (JSON, not
  Markdown) with `passes: false` entries and steps a human can check, plus a per-branch
  `docs/plans/<task>-progress.md`. Agents may only flip `passes`. This complements, not replaces,
  the ADR process.
- Session bootstrap: a `SessionStart` hook that prints `git log --oneline -10`, `git status
--short` and the active plan's progress file gives every fresh context the "getting up to
  speed" ritual without relying on the model to remember to do it.
- Self-verification for a Canvas game: unit tests are the primary oracle (deterministic core,
  fake frame scheduler). For UI/rendering work, consider a browser MCP (Playwright or Chrome
  DevTools) in `.mcp.json` later; both Anthropic and OpenAI report large gains from letting the
  agent drive the running app. This is an optional dependency decision for the team.
- Use a fresh-context reviewer (subagent or second session) before calling a task done; tell it
  to report only correctness and scope gaps, since reviewers over-report by construction.

## 4. OpenAI's "Harness engineering" and other 2026 sources

**OpenAI, "Harness engineering: leveraging Codex in an agent-first world"** (2026-02-11)
[OpenAI harness engineering]. A team shipped ~1M lines with "0 lines of manually-written code"
(1,500 PRs, ~3.5 PRs/engineer/day). Actionable patterns:

- "Give Codex a map, not a 1,000-page instruction manual." One big `AGENTS.md` failed: it
  crowds out the task, "when everything is important, nothing is", it "rots instantly", and a
  blob can't be mechanically checked. They keep `AGENTS.md` to roughly 100 lines as a **table of
  contents** pointing into a structured `docs/` tree (`design-docs/`, `exec-plans/active|completed`,
  `product-specs/`, `references/*-llms.txt`, `ARCHITECTURE.md`, `QUALITY_SCORE.md`, ...).
- **Repository knowledge is the system of record**: "anything it can't access in-context while
  running effectively doesn't exist"; Slack/Docs knowledge must be encoded in the repo.
- Plans are first-class, versioned artifacts (execution plans with progress and decision logs);
  the companion cookbook `PLANS.md` requires sections `Progress`, `Surprises & Discoveries`,
  `Decision Log`, `Outcomes & Retrospective`, self-contained prose and behavioural acceptance
  criteria [OpenAI PLANS.md].
- **Enforce architecture mechanically**: fixed layers with validated dependency directions,
  custom linters and structural tests, "taste invariants" (structured logging, naming, file size
  limits); "because the lints are custom, we write the error messages to inject remediation
  instructions into agent context". Enforce boundaries centrally, allow autonomy locally.
- Make the app legible to the agent: bootable per git worktree, Chrome DevTools Protocol access,
  ephemeral logs/metrics/traces per worktree.
- **Garbage collection**: "golden principles" encoded in the repo, recurring background agents
  that scan for drift and open small refactor PRs, and a doc-gardening agent for stale docs.
  Fewer blocking merge gates when throughput is high ("would be irresponsible in a
  low-throughput environment").

**Other 2026 sources.**

- Böckeler, "Harness engineering for coding agent users" (martinfowler.com, 2026-04-02): a
  harness is **guides** (feedforward: `AGENTS.md`, skills, LSP, codemods) plus **sensors**
  (feedback: linters, structural tests, coverage, review agents), each either computational
  (deterministic, cheap) or inferential (LLM, expensive); keep checks left; regulate
  maintainability, architecture fitness and behaviour; "harnessability" favours typed languages
  and clear module boundaries [Fowler/Böckeler].
- Osmani, "Agent Harness Engineering" (2026-04-19): the ratchet ("every line in a good
  `AGENTS.md` should be traceable back to a specific thing that went wrong"), hooks as the
  enforcement layer ("success is silent, failures are verbose"), few focused tools, and harness
  components that become dead weight as models improve [Osmani].
- marmelab, "The State of AI Harness Engineering 2026" (2026-09-24), a survey of 391 repos:
  63% of large OSS projects ship an instruction file but only 4 declare a subagent and 14 hooks
  exist in total; the median root instruction file is 123 lines; 60% of harnesses have neither
  tests nor evals; recommendations: test hooks both ways (must block / must allow), reduce the
  harness to what a real failure justified, "double or replace rules with scripts", let the agent
  run the app, measure usage, "don't let the harness rot" (give every control an expiry
  condition and record the incident it exists for). It also reports that a second reviewer agent
  lowered success in one ablation study and that pre-written permission rules blocked fewer bad
  actions than per-action approval **(these two are second-hand via the survey)** [marmelab 2026].
- Gloaguen et al., "Evaluating AGENTS.md" (ETH Zurich, arXiv 2602.11988, Feb 2026, v2 Jun 2026):
  context files "do not generally improve task success rates, while increasing inference cost by
  over 20%"; instructions are followed, but repository overviews "are not helpful"; context files
  are "useful for specifying non-standard coding practices" [ETH AGENTS.md].

**What this means for Eternalus**

- Restructure the root `AGENTS.md` toward a map: keep the definition of done, git rules,
  forbidden actions, commands and the boundary rules that lint cannot catch; move the
  "Architecture (planned)" narrative and "Where code goes" tables into `docs/architecture/`
  (already referenced) and link them. The ETH result says overviews cost tokens without helping.
- Add `docs/README.md` as the index (title + one-line description per doc, the frontmatter of
  §7 makes this generatable) and `docs/plans/` for execution plans; keep ADRs in
  `docs/decisions/` and add a one-line "why this control exists" to each guardrail row in
  `docs/process/guardrails.md` (the marmelab "expiry condition" advice).
- Write lint messages as remediation instructions (the existing `no-restricted-properties`
  message "core must be deterministic: use a seeded RNG" is the right style).
- Schedule "garbage collection": a monthly human-run session with the prompt "audit
  `AGENTS.md`, `docs/` and `.claude/` for stale rules; propose deletions first" (Claude's
  `/doctor prompt-audit` does part of this).

## 5. Verification patterns

| Pattern                                                     | What it gives an agent                                                                                                                                                                                                                                 | Eternalus status                                                                                | Extra npm dependency?                                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tests as the oracle (Vitest, deterministic, seeded shuffle) | Pass/fail signal the loop can read                                                                                                                                                                                                                     | In place per package (`vitest run --coverage`)                                                  | No                                                                                                                                                                 |
| Type check as gate (`tsc -b` with project references)       | Cross-package layering: `apps/client` references `packages/core`; core cannot reference client; `composite` + `declaration` required; `-b` acts as `noEmitOnError` [TS project refs]                                                                   | In place (`tsconfig.json` solution file)                                                        | No                                                                                                                                                                 |
| ESLint `no-restricted-imports`                              | Per-file-glob bans by `paths`/`patterns` (`group` gitignore-style, `regex`, `importNames`, TypeScript-only `allowTypeImports`) with custom `message` [ESLint no-restricted-imports]                                                                    | Core bans React/Redux/client. Client-side rules (5, 6 of the architecture list) not yet encoded | No                                                                                                                                                                 |
| ESLint `no-restricted-syntax`                               | AST-selector bans with a message, e.g. `CallExpression[callee.property.name='getContext']` outside `Renderer.ts` [ESLint no-restricted-syntax]                                                                                                         | Not yet                                                                                         | No                                                                                                                                                                 |
| ESLint `no-restricted-properties`                           | Property bans (`Math.random`)                                                                                                                                                                                                                          | In place                                                                                        | No                                                                                                                                                                 |
| Coverage thresholds and ratchet                             | Vitest `coverage.thresholds.{lines,functions,branches,statements}`, `perFile`, glob-scoped thresholds, and `thresholds.autoUpdate: true`, which rewrites the config "when current coverage is better than the configured thresholds" [Vitest coverage] | Thresholds in place; no autoUpdate                                                              | No (Vitest 5.0.2 already installed)                                                                                                                                |
| Dead code / unlisted deps (knip)                            | Catches unused exports and deps agents leave behind                                                                                                                                                                                                    | In place                                                                                        | No                                                                                                                                                                 |
| Git hooks via `core.hooksPath`                              | Runs `check:quick` on commit and push for every tool [git hooks]                                                                                                                                                                                       | In place (`.githooks/`, `prepare` script)                                                       | No (husky/lint-staged would be extra)                                                                                                                              |
| CI gate mirroring `npm run check` on 3 OSes                 | Same signal in the cloud; branch protection makes it binding                                                                                                                                                                                           | In place                                                                                        | No                                                                                                                                                                 |
| Import-cycle detection                                      | Cycles inside a package are not caught by `tsc -b` or the current ESLint config                                                                                                                                                                        | Missing                                                                                         | Yes: dependency-cruiser (`--init` adds circular-dependency rules; violations reported "in an eslint-like format") [dependency-cruiser] or a custom zero-dep script |
| Architectural boundary plugin                               | eslint-plugin-boundaries classifies files into elements and enforces `boundaries/dependencies` policies [eslint-plugin-boundaries]                                                                                                                     | Missing                                                                                         | Yes (needs approval)                                                                                                                                               |
| Agent-loop hooks (lint after edit, gate on stop)            | Failure text re-enters the model's context immediately                                                                                                                                                                                                 | Missing                                                                                         | No (Claude/Codex/Gemini hooks are JSON + a script)                                                                                                                 |
| Fresh-context review                                        | Independent grader, per Anthropic                                                                                                                                                                                                                      | Manual today                                                                                    | No                                                                                                                                                                 |

**Definition of done for agents** (synthesis of Anthropic, OpenAI, Factory templates): (1) every
behaviour change has a test that fails before and passes after; (2) `npm run check` passes and
its output is quoted verbatim; (3) no guardrail file changed unless the task says so; (4) the
diff stays inside the named scope; (5) the plan/progress file is updated; (6) nothing committed
unless asked.

**What this means for Eternalus**

- Zero-dependency additions to `eslint.config.js`, all using rules already available:
  - `apps/client/src/ui/**`: `no-restricted-imports` `patterns: [{ group: ["**/game/**",
"@eternalus/core", "@eternalus/core/*"], message: "ui/ reads data through bridge/ selectors
(AGENTS.md client boundaries)." }]`.
  - `apps/client/src/game/views/**`: `paths: [{ name: "@eternalus/core", allowTypeImports:
true, message: "views only import types from core and draw through Renderer." }]`.
  - `apps/client/src/**` except `game/engine/Renderer.ts`: `no-restricted-syntax` selector
    for `getContext` calls and `CanvasRenderingContext2D` identifiers, message naming the
    renderer.
  - `apps/client/src/**` and `packages/core/src/**`: `no-restricted-imports` `patterns: [{
group: ["@eternalus/core/*"], message: "Import from '@eternalus/core' only." }]`.
  - `apps/client/src/game/engine/**`: ban `**/views/**`, `**/input/**`, `**/bridge/**`, `../Match`.
  - `packages/core/src/systems/**`: ban `./*System` sibling imports via `regex`; `ai/**` may only
    import `state/`, `commands/`, `utils/`.
    These encode rules 3, 5, 6, 7 and most of the per-folder table; record each one's origin in
    `docs/process/guardrails.md`.
- Cycles (rule 4): request approval for `dependency-cruiser` (one devDependency, config in
  `.dependency-cruiser.cjs`, run in `npm run check`), or write a ~60-line Node script that walks
  `src/` imports with the TypeScript compiler API already installed and fails on a cycle. The
  script route is zero-dep but is code the team must own.
- Coverage ratchet: enable `thresholds.autoUpdate: true` for local runs only (it edits
  `vitest.config.ts`; CI should not write to the tree) and require the raised numbers to be
  committed in the same PR, which is what `docs/process/guardrails.md` already asks for. Consider
  `perFile` minimums (e.g. 50%) once real code exists so one large untested file cannot hide.
- Hooks: `PostToolUse` lint-on-edit and `Stop` gate as in §2; the pre-commit hook stays the
  hard backstop for humans and for tools without hooks.

## 6. Multi-agent and parallel work

- **Claude Code worktrees** [Claude worktrees]: `claude --worktree <name>` (`-w`) creates
  `.claude/worktrees/<name>/` on branch `worktree-<name>` from the remote default branch
  (`worktree.baseRef: "head"` branches from local HEAD); add `.claude/worktrees/` to `.gitignore`;
  `.worktreeinclude` (gitignore syntax) copies ignored files such as `.env` into new worktrees;
  Claude blocks edits and git commands that reach the main checkout; subagents get
  `isolation: worktree` in frontmatter; `${CLAUDE_PROJECT_DIR}` in hooks stays at the original
  root while the hook input's `cwd` follows the worktree; project skills/agents fall through to
  the main checkout when the worktree lacks them; `/batch` fans a change across 5-30 subagents in
  their own worktrees. `worktree.symlinkDirectories: ["node_modules"]` avoids duplicate installs.
- **Codex worktrees** [Codex worktrees]: managed worktrees under `$CODEX_HOME/worktrees` in
  detached HEAD, "Create branch here" to turn one into a branch, Handoff between Local and
  Worktree, `.worktreeinclude` honoured, `AGENTS.override.md` copied automatically, 15 most recent
  kept by default. Git allows a branch to be checked out in only one worktree at a time.
- **Gemini CLI** [Gemini worktrees]: experimental `--worktree` behind `experimental.worktrees:
true`, directories in `.gemini/worktrees/`, never auto-deleted.
- **git worktree** itself: `git worktree add ../project-feature -b feature`, `list`, `remove`
  [git worktree].
- **Stacked pull requests** are native on GitHub since the 2026-07-30 public preview: an
  ordered series of PRs, each targeting the layer below, reviewable independently, mergeable in
  one click with existing branch protections and required checks applied; CLI via
  `gh extension install github/gh-stack`, also usable by coding agents through the gh-stack
  skill [GitHub stacked PRs].

**What this means for Eternalus**

- Keep "one task per branch, one branch per worktree" (`docs/agents/running-agents.md`). Extend
  `.gitignore` with `.claude/worktrees/` and `.gemini/worktrees/` next to `.worktrees/`.
- Do **not** enable `worktree.symlinkDirectories` for `node_modules` in this repo: npm
  workspaces install `@eternalus/core` as a relative symlink inside `node_modules`, so a shared
  `node_modules` would resolve core to the main checkout's copy, not the worktree's
  **(inference from npm workspace layout, not tested)**. Run `npm ci` per worktree instead; the
  `prepare` script also re-points `core.hooksPath` for that worktree.
- Add a `.worktreeinclude` only if the team starts using gitignored local files; today there
  are none besides `.env*`.
- For features that span core and client, prefer a GitHub stack (core layer PR, client layer
  PR) over one large PR; CI and the "one approval" rule still apply per layer.
- Parallel agents should be given disjoint file sets (already in `docs/agents/running-agents.md`);
  the `reviewer` subagent runs in the worktree of the task it reviews.

## 7. Frontmatter conventions for agent-navigable docs

Field names that tools actually read (all verified):

| Tool / file                                                                   | Fields read                                                                                                                               | Unknown fields                                                         |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Claude Code `.claude/rules/*.md`                                              | `paths` (list or comma string)                                                                                                            | Ignored, frontmatter stripped before loading [Claude memory]           |
| Claude Code `SKILL.md`                                                        | `name`, `description`, `when_to_use`, `paths`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, ... (§2)                    | Ignored silently [Claude skills]                                       |
| Agent Skills spec (Codex, Gemini CLI, Antigravity, Cursor, claude.ai uploads) | `name` (lowercase-hyphen, = directory), `description` (≤1024 chars), `license`, `compatibility`, `metadata` (string map), `allowed-tools` | Upload/packaging rejects extra keys [Agent Skills spec; Claude skills] |
| Cursor `.cursor/rules/*.mdc`                                                  | `description`, `globs` (comma-separated), `alwaysApply`                                                                                   | Not documented **(unverified)** [Cursor rules]                         |
| Cursor skills                                                                 | `name`, `description`, `paths`, `disable-model-invocation`, `icon`, `color`, `metadata`; legacy `globs` accepted                          | Not documented [Cursor skills]                                         |
| Copilot `.github/instructions/*.instructions.md`                              | `applyTo` (comma-separated globs), `excludeAgent`; VS Code adds `name`, `description`                                                     | Not documented [GitHub Docs; VS Code instructions]                     |
| Devin/Windsurf `.devin/rules/*.md`                                            | `trigger`, `globs`, `description`                                                                                                         | Not documented [Devin memories]                                        |
| Codex `AGENTS.md`, Gemini `GEMINI.md`, Claude `CLAUDE.md`                     | None: plain Markdown, concatenated as-is                                                                                                  | n/a                                                                    |

Three conventions recur: a keyword-first `description` that tells the agent _when_ to read
the file (Agent Skills, Claude, Cursor, Copilot VS Code all use it for on-demand selection);
a glob scope (`paths` in Claude and Cursor skills, `globs` in Cursor rules and Devin, `applyTo`
in Copilot); and an invocation flag (`disable-model-invocation`, `alwaysApply`, `trigger`).

**Recommended schema for `docs/**/*.md` in Eternalus** (files that agents open on demand; no
tool auto-loads them, so the block costs nothing until read):

```yaml
---
title: Architecture # human heading; matches the H1
description: Layering rules for core and client; read before adding a folder or import.
audience: [humans, agents] # humans | agents | [humans, agents]
status: active # draft | active | deprecated
owner: sholtzman # GitHub handle or team
last-reviewed: 2026-09-30 # ISO date; a CI script warns when > 90 days old
paths: ['packages/core/**', 'apps/client/src/**'] # optional scope, same globs as Claude/Cursor `paths`
tags: [architecture, core, client]
---
```

Rationale: `description` and `paths` reuse the exact field names and glob semantics the
agent tools already understand, so a doc can be promoted into a Claude rule (`paths` only), a
Claude/Cursor/Codex skill (`name` + `description`, other fields moved under `metadata`) or a
Copilot instruction file (`paths` renamed to `applyTo`) without rewriting; `title`, `audience`,
`status`, `owner`, `last-reviewed` and `tags` are for humans and for a zero-dependency Node
script that builds `docs/README.md` and flags stale files. Use lowercase-hyphen keys (the
Claude skills convention) except where a tool defines camelCase (`applyTo`, `alwaysApply`).
Keep `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` frontmatter-free: Codex and Gemini concatenate
them verbatim, so a YAML block would just be noise in the prompt.

## Works cited

All accessed 2026-09-30. Dates in parentheses are the page's own publication or
last-updated date where shown.

1. AGENTS.md — https://agents.md/ — agents.md / Agentic AI Foundation (undated).
2. How Claude remembers your project (CLAUDE.md, AGENTS.md, rules) — https://code.claude.com/docs/en/memory — Anthropic (undated, references v2.1.283).
3. Hooks reference — https://code.claude.com/docs/en/hooks — Anthropic.
4. Skills — https://code.claude.com/docs/en/skills — Anthropic.
5. Subagents — https://code.claude.com/docs/en/sub-agents — Anthropic.
6. Settings files and precedence — https://code.claude.com/docs/en/settings — Anthropic.
7. Permissions — https://code.claude.com/docs/en/permissions — Anthropic.
8. Best practices for Claude Code — https://code.claude.com/docs/en/best-practices — Anthropic (https://www.anthropic.com/engineering/claude-code-best-practices redirects here).
9. Run parallel sessions with worktrees — https://code.claude.com/docs/en/worktrees — Anthropic.
10. Connect to tools with MCP — https://code.claude.com/docs/en/mcp — Anthropic.
11. Set up Claude Code in a monorepo or large codebase — https://code.claude.com/docs/en/large-codebases — Anthropic.
12. Effective harnesses for long-running agents — https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — Anthropic (2025-11-26).
13. Harness design for long-running application development — https://www.anthropic.com/engineering/harness-design-long-running-apps — Anthropic (2026-03-24).
14. Effective context engineering for AI agents — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — Anthropic (2025-09-29, modified 2026-01-06).
15. Building effective agents — https://www.anthropic.com/engineering/building-effective-agents — Anthropic (2024-12-19, modified 2026-08-10).
16. Harness engineering: leveraging Codex in an agent-first world — https://openai.com/index/harness-engineering/ — OpenAI, Ryan Lopopolo (2026-02-11).
17. Using PLANS.md for multi-hour problem solving — https://developers.openai.com/cookbook/articles/codex_exec_plans — OpenAI Cookbook (undated).
18. Custom instructions with AGENTS.md — https://learn.chatgpt.com/docs/agent-configuration/agents-md — OpenAI (Codex docs, undated).
19. Build skills — https://learn.chatgpt.com/docs/build-skills — OpenAI (Codex docs).
20. Hooks — https://learn.chatgpt.com/docs/hooks — OpenAI (Codex docs).
21. Worktrees — https://learn.chatgpt.com/docs/environments/git-worktrees — OpenAI (Codex docs).
22. Provide context with GEMINI.md files — https://geminicli.com/docs/cli/gemini-md/ — Google (last updated 2026-06-18).
23. Configuration reference (`context.fileName`) — https://geminicli.com/docs/reference/configuration/ — Google.
24. Gemini CLI hooks — https://geminicli.com/docs/hooks/ — Google (2026-04-13).
25. Agent Skills (Gemini CLI) — https://geminicli.com/docs/cli/skills/ — Google (2026-04-30).
26. Git worktrees (experimental) — https://geminicli.com/docs/cli/git-worktrees/ — Google (2026-03-20).
27. An important update: Transitioning Gemini CLI to Antigravity CLI — https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli — Google Developers Blog (2026-05-19).
28. Migrating from Gemini CLI — https://antigravity.google/docs/cli/gcli-migration — Google Antigravity docs.
29. Adding repository custom instructions for GitHub Copilot — https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions — GitHub Docs.
30. Use custom instructions in VS Code — https://code.visualstudio.com/docs/agent-customization/custom-instructions — Microsoft (2026-09-16).
31. Rules — https://cursor.com/docs/rules — Cursor.
32. Agent Skills — https://cursor.com/docs/skills — Cursor.
33. Memories & Rules — https://docs.devin.ai/desktop/cascade/memories — Cognition (Devin Desktop, formerly Windsurf).
34. AGENTS.md — https://docs.devin.ai/desktop/cascade/agents-md — Cognition.
35. Using Rules — https://zed.dev/docs/ai/rules — Zed Industries.
36. AGENTS.md — https://docs.factory.com/harness/agents-md — Factory.
37. Getting started (Include AGENTS.md file) — https://jules.google/docs/ — Google Jules.
38. Specifying coding conventions — https://aider.chat/docs/usage/conventions.html — Aider.
39. Rules — https://opencode.ai/docs/rules/ — OpenCode/Anomaly (last updated 2026-09-29).
40. Agent Skills specification — https://agentskills.io/specification — agentskills.io.
41. The State of AI Harness Engineering 2026 — https://marmelab.com/blog/2026/09/24/the-state-of-ai-harness-engineering-2026.html — marmelab (2026-09-24).
42. Agent Harness Engineering — https://addyosmani.com/blog/agent-harness-engineering/ — Addy Osmani (2026-04-19).
43. Harness engineering for coding agent users — https://martinfowler.com/articles/harness-engineering.html — Birgitta Böckeler, martinfowler.com (2026-04-02).
44. Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents? — https://arxiv.org/abs/2602.11988 — Gloaguen, Mündler, Müller, Raychev, Vechev, arXiv (2026-02-12, v2 2026-06-23).
45. Vitest coverage config (thresholds, autoUpdate, perFile) — https://vitest.dev/config/coverage — Vitest (v5.0.2 docs).
46. dependency-cruiser — https://github.com/sverweij/dependency-cruiser — Sander Verweij (README).
47. eslint-plugin-boundaries — https://github.com/javierbrea/eslint-plugin-boundaries — Javier Brea (README).
48. no-restricted-imports — https://eslint.org/docs/latest/rules/no-restricted-imports — ESLint (v10.11.0 docs).
49. no-restricted-syntax — https://eslint.org/docs/latest/rules/no-restricted-syntax — ESLint (v10.11.0 docs).
50. Project References — https://www.typescriptlang.org/docs/handbook/project-references.html — Microsoft TypeScript (last updated 2026-09-28).
51. githooks (`core.hooksPath`) — https://git-scm.com/docs/githooks — Git.
52. git-worktree — https://git-scm.com/docs/git-worktree — Git.
53. Stacked pull requests are now in public preview — https://github.blog/changelog/2026-07-30-stacked-pull-requests-are-now-in-public-preview/ — GitHub Changelog (2026-07-30).

Not verifiable on 2026-09-30: arXiv 2608.23550 ("When 'Do Not' Is Not Deny: Security Rules in
CLAUDE.md vs Built-In Controls"), cited second-hand by marmelab; the fetched PDF returned no
readable text, so its numbers are not used above.
