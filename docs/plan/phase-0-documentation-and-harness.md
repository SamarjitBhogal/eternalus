---
title: Phase 0 — Documentation and harness
description: The phase delivered by the docs/phase-0-foundation PR; read this to see what the documentation tree and agent harness must contain, which human steps remain, and what makes Phase 0 done.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [plan, phase-0, documentation, harness]
paths: ['docs/**', '.claude/**', 'scripts/**', 'AGENTS.md']
related: ['docs/plan/README.md', 'docs/architecture/16-agentic-harness.md', 'docs/agents/README.md']
---

# Phase 0 — Documentation and harness

## Purpose

Read this when reviewing the `docs/phase-0-foundation` PR or when you are one of the humans who
must finish Phase 0 (push, review, walkthrough, decisions). Phase 0 turns the two source
documents (the requirements doc and the Eternalus v2 game doc) plus three research reports into
a navigable `docs/` tree, records the decisions already made as ADRs, and scaffolds the agentic
harness so that every later phase is built by agents under the same rules. There is no game code
in this phase; the only code is tooling (docs check, hooks).

- **Branch:** `docs/phase-0-foundation` → PR into `main`, reviewer **SamarjitBhogal**.
- **Weeks:** week 0 (2026-09-29 → 2026-10-04) for writing; sprint 0.5 lands in week 1
  (2026-10-05 → 2026-10-09) because it needs the whole team in one room.
- **Requirement areas served:** "FR: agentic harness", "FR: documentation for humans and
  agents", "NFR: SOLID/DRY/patterns", "NFR: no hardcoding" (the plan and architecture docs are
  where those rules become checkable).
- **Depends on:** nothing. **Unblocks:** every other phase.

## Sprint 0.1 — Documentation tree, requirements and reference

Owner: sholtzman (agents write, humans review). Goal: the tree in the writer brief exists, every
file has the frontmatter schema, and the two source documents are transcribed faithfully with
`[status]` tags from the highlight annotations.

- [x] `docs/README.md` doc map (generated index + how to navigate). Test: docs check regenerates
      the same index. Done when: every file under `docs/` is listed once.
- [x] `docs/requirements/` (`README.md`, `01-architecture-principles.md`,
      `02-coding-principles.md`, `03-organization-guidelines.md`, `04-agentic-instructions.md`,
      `05-engineering-standards.md`, `06-mvp-requirements.md`, `source/requirements-of-architecture.md`).
      Test: frontmatter check. Done when: `06-mvp-requirements.md` has an FR/NFR row for every
      bullet of the requirements doc's MVP list, each traceable to a phase.
- [x] `docs/reference/` (`README.md`, `glossary.md`, `game-design/00`–`12`, `suggestions/*`,
      `source/game-project-eternalus-v2.md`). Test: frontmatter + link check. Done when: every
      item carries **MVP**, **MVP-if-time**, **post-MVP** or **removed** per the highlight
      annotations, and "horde" replaces "hoard" everywhere except in the faithful transcription.
- [x] `docs/process/` (`git-workflow.md`, `sdlc.md`, `guardrails.md` moved from
      `docs/guardrails.md`). Done when: the phase branching model (D5) is the only git model
      described anywhere in the repo.
- [x] `docs/changelog/README.md` + `2026-09-30-phase-0-foundation.md`. Done when: the entry
      lists every file this PR adds, moves or rewrites.

**Success metric:** docs check reports 0 missing frontmatter keys, 0 unknown keys, 0 broken
relative links across `docs/**/*.md`.

## Sprint 0.2 — Architecture

Owner: sholtzman + one reviewer per theme. Goal: seventeen themed architecture docs (`01`–`17`)
that use the canonical vocabulary of the brief and say, for every design, which SOLID principle
it serves and where the single place of change is.

- [x] `docs/architecture/README.md` and `01-layered-oop-model.md` … `17-extension-recipes.md`.
      Test: frontmatter check; every class name in an architecture doc appears in the glossary
      or the code-structure doc. Done when: a reviewer can trace each of the twelve rules in
      [AGENTS.md](../../AGENTS.md) to a section.
- [x] `docs/architecture.md` (the old single file) reduced to a pointer or removed; links
      updated in `README.md`, `AGENTS.md`, `CONTRIBUTING.md`. Done when: link check is green.
- [x] Deviation D10 (team as a component, not a class) and D11 (sub-classes as data-driven
      specializations) explained in `04-entity-architecture.md` with reasoning.

**Success metric:** every entry in the patterns catalogue (Factory, Type Object, Command,
Observer, State, Strategy, Facade, Object Pool, Registry, Template Method, Composite, Adapter,
Builder, Flyweight, Repository + Unit of Work, DI) is named in at least one architecture doc
with the class that implements it.

## Sprint 0.3 — Plan, research and ADRs

Owner: sholtzman. Goal: the delivery plan (this folder), the research reports with works cited,
and ADRs 0003–0009 for decisions D1–D7.

- [x] `docs/plan/README.md`, `phase-0` … `phase-6`, `backlog-post-mvp.md`, `PROGRESS.md`.
      Test: frontmatter + link check; every task line has "Test" and "Done when". Done when:
      each phase doc is 150–300 lines and every sprint has a measurable success metric.
- [x] `docs/research/README.md`, `agentic-harness-research.md`,
      `game-architecture-and-performance-research.md`,
      `persistence-input-diagnostics-research.md`, `works-cited.md`. Done when: every external
      fact cited in architecture or plan docs resolves to a works-cited entry.
- [x] ADRs `0003` (TypeScript everywhere, D1), `0004` (React + Redux Toolkit + Vite, D2),
      `0005` (IndexedDB behind `PersistenceController`, D3), `0006` (entity model, D4/D10/D11),
      `0007` (phase branching, D5), `0008` (docs structure and frontmatter, D6), `0009` (map
      generated from config, D7). Done when: each follows `0000-template.md` and links back to
      the architecture doc it governs.

**Success metric:** a reader starting at `docs/README.md` reaches any decision (D1–D12) in at
most two clicks.

## Sprint 0.4 — Harness scaffold

Owner: sholtzman, reviewer SamarjitBhogal (CI/tooling). Goal: the agent harness recommended in
[agentic-harness-research.md](../research/agentic-harness-research.md#summary): Claude Code
as the primary agent, analogous files for Codex/ChatGPT and Gemini users, and one docs check
that runs inside `npm run check`. File names follow
[16-agentic-harness.md](../architecture/16-agentic-harness.md) and
[tool-setup.md](../agents/tool-setup.md); the PR diff is the truth, and the reviewer unticks
any box the diff does not deliver.

- [x] `AGENTS.md` rewritten as a short table of contents that links into `docs/`; `CLAUDE.md`
      stays `@AGENTS.md`; `GEMINI.md` added with the same pointer; package `AGENTS.md` files
      updated to the canonical folder names. Done when: root instruction files stay under 200
      lines each and carry no frontmatter.
- [x] `docs/agents/` (`README.md`, `running-agents.md` moved and updated, `tool-setup.md`,
      `task-brief-template.md`, `checklists.md`). Done when: a new teammate can set up Claude
      Code, Codex or Gemini from `tool-setup.md` alone.
- [x] `.claude/settings.json` (permissions deny/allow + hooks: lint-on-edit, stop gate, session
      start), `.claude/skills/` (`new-entity`, `new-system`, `new-ability`, `new-screen`,
      `new-content`, `pr-review`, `doc-gardening`, `verify`, `adr`; pointer stubs in
      `.agents/skills/`), `.claude/agents/` (`architecture-reviewer`, `test-writer`,
      `doc-gardener`); `.gemini/settings.json`; tool-neutral scripts under `scripts/hooks/`
      (no `.codex/hooks.json` is committed: it is optional and would reuse the same scripts).
      Test: run a hook by hand on macOS, Linux and Windows (exec form `node <script>`). Done
      when: an edit to a `.ts` file with a lint error surfaces the error in the agent session.
- [x] Docs check script `scripts/docs/check-docs.mjs`, run by `npm run docs:check` (inside
      `npm run check`) and `npm run docs:index`, wired into CI (frontmatter schema, relative
      links, index in sync, `last-reviewed` staleness warning at 90 days). Test: a fixture doc
      with a bad key fails the check. Done when: CI has a named "Docs" step that mirrors the npm
      script one-to-one, as the other steps do.
- [x] `INBOX.md` at the repo root: the product-owner decision queue (open questions from the
      game doc, naming to-dos, instructor confirmations), each with a default recommendation and
      a decide-by date.

**Success metric:** `npm run check` is green locally and on all three CI runners with the docs
step included; the harness hook fires on a deliberate lint error in a scratch branch.

## Sprint 0.5 — Team walkthrough, triage and confirmations

Owner: sholtzman (facilitator), all five members. Goal: the "team concern" in the game doc (not
everyone understands the design) is closed before any game code is written.

- [ ] Push `docs/phase-0-foundation` and open the PR to `main` with reviewer SamarjitBhogal;
      description links `docs/README.md`, this file and the changelog entry. Done when: CI is
      green on three OSes.
- [ ] Team meeting (90 minutes, week 1): walk `docs/README.md` → plan → architecture 01–04 →
      reference 00/11/12; assign the sim lane, client lane, map owner, AI owner, persistence
      owner and deputy maintainer; minutes appended to [PROGRESS.md](PROGRESS.md). Done when:
      every member names the doc for three random topics without help.
- [ ] Product owner answers or schedules every `INBOX.md` decision (rename queue, MVP-if-time
      items, tuning defaults marked `TUNE`). Done when: 100% of entries have an answer or a
      decide-by date within Phase 1.
- [ ] Instructor confirms React + Redux Toolkit + Vite for menus/HUD (D2) and TypeScript
      everywhere (D1); the answer is recorded in ADR 0004/0003 status lines and in PROGRESS.
- [ ] Reconcile `feat/map` with D7: the `feat/map` author and sholtzman list which
      `MapDefinition` types survive, which hand-traced coordinates become `MapGenerator` test
      expectations, and which are dropped; the result is a task in
      [Phase 1 sprint 1.3](phase-1-simulation-kernel-and-world.md#sprint-13--map).
- [ ] SamarjitBhogal merges the PR (squash) and enables branch protection per
      [guardrails.md §5](../process/guardrails.md#5-manual-setup-humans-on-github).

**Success metric:** walkthrough held with all five members present; 0 unanswered INBOX entries
without a date; PR merged to `main` by 2026-10-09.

## Tests and verification for documentation

Documentation is verified like code, in the same `npm run check`:

- `format:check` (Prettier, printWidth 100, `proseWrap: preserve`) on every `.md`.
- Docs check: every `docs/**/*.md` (except `docs/README.md`, which may omit `paths`) has the
  frontmatter keys `title`, `description`, `audience`, `status`, `owner`, `last-reviewed`,
  `tags` and optionally `paths`, `related`; `title` equals the H1; no other keys; root
  `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`, `CONTRIBUTING.md`, `INBOX.md` have none.
- Link check: every relative link and anchor in `docs/**/*.md` resolves inside the repo.
- Index check: `docs/README.md` lists every doc exactly once with its `description`.
- Review checklist for prose ([checklists.md](../agents/checklists.md)): canonical names from
  the brief, MVP status on every item, `TUNE` on quoted numbers, `Recommendation:` on invented
  ones, "horde" not "hoard", no claims that code exists.

## Success metrics (phase level)

| Metric                                    | Target                         |
| ----------------------------------------- | ------------------------------ |
| Docs tree files present (brief §3)        | 100%                           |
| Frontmatter / link / index errors         | 0                              |
| `npm run check` on ubuntu, macos, windows | green, including the docs step |
| Walkthrough attendance                    | 5 of 5                         |
| INBOX entries answered or dated           | 100%                           |
| Instructor confirmation of D1/D2          | recorded                       |
| `feat/map` reconciliation task written    | yes, with owner                |

## Exit criteria

1. Every file in the writer brief's documentation tree exists with valid frontmatter, a Purpose
   paragraph and a Related list; the docs check and link check are green.
2. The harness scaffold is committed and its hooks work on the three OSes the team uses.
3. The team walkthrough was held and its minutes are in `PROGRESS.md`.
4. The product owner has answered or dated every `INBOX.md` decision.
5. The instructor's confirmation of the UI libraries is recorded.
6. The PR is merged to `main` by SamarjitBhogal and branch protection is on.

## Risks

| Risk                                              | Mitigation                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Docs drift from code once Phase 1 starts          | `paths` frontmatter ties docs to folders; the docs check flags stale `last-reviewed`; Phase 6 gardening.    |
| Walkthrough slips past week 1                     | Book it now; Phase 1 sprints 1.1 and 1.3 may start on the kernel and map, which the docs already fix.       |
| INBOX decisions block Phase 1                     | Each entry has a default recommendation that applies automatically on its decide-by date.                   |
| Hooks fail on Windows                             | Exec form `node <script>` (no `.cmd` shims); CI matrix already runs Windows; git hooks remain the backstop. |
| Codex/ChatGPT and Gemini users ignore the harness | `.agents/skills/`, `.gemini/settings.json`, `GEMINI.md`, `tool-setup.md` ship; Codex hooks are optional.    |
| The single PR is large and hard to review         | Reviewer reads `docs/README.md` first, then this file, then the changelog; prose is reviewed per folder.    |

## Related

- [README.md](README.md) (roadmap, cut lines, metrics dashboard)
- [PROGRESS.md](PROGRESS.md)
- [phase-1-simulation-kernel-and-world.md](phase-1-simulation-kernel-and-world.md)
- [../architecture/16-agentic-harness.md](../architecture/16-agentic-harness.md)
- [../agents/README.md](../agents/README.md)
- [../research/agentic-harness-research.md](../research/agentic-harness-research.md)
- [../process/guardrails.md](../process/guardrails.md)
- [../changelog/2026-09-30-phase-0-foundation.md](../changelog/2026-09-30-phase-0-foundation.md)
