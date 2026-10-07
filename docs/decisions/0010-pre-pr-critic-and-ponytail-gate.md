---
title: 0010. Pre-PR critic and ponytail gate
description: Before any pull request is opened, after every existing check, the branch must pass an independent architecture critic, a ponytail simplification pass and a full re-run of the checks on the simplified code; read this before opening a PR or changing the end-of-session steps.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-06
tags: [adr, process, review, guardrail, ponytail]
related:
  [
    'AGENTS.md',
    'docs/agents/checklists.md',
    'docs/process/git-workflow.md',
    'docs/decisions/0011-documentation-longevity.md',
  ]
---

# 0010. Pre-PR critic and ponytail gate

- Status: accepted (product owner decision, 2026-10-06)
- Date: 2026-10-06

## Context

`npm run check` proves the code compiles, lints and passes its own tests. It does not prove the
code follows the design, and it does not catch code that is correct but bigger than it needs to
be. On `feat/map-generator` (PR #8) the check was green while an independent critic found sealed
gates, leaking walls and an asymmetric map. The same critic also found four places where the
code was better than the written design; those had to be surfaced to the owner and folded back
into the architecture so the docs did not go stale. The owner installed the `ponytail` Claude
Code plugin (`/plugin marketplace add DietrichGebert/ponytail`,
`/plugin install ponytail@ponytail`) to cut over-engineering, and asked for both steps to become
mandatory before a PR is opened.

## Decision

After the existing Definition of Done (`AGENTS.md`), and never instead of it, every branch
passes this gate in order before its PR is opened:

1. **Architecture critic.** An independent reviewer (in Claude Code a separate subagent such as
   `architecture-reviewer`) gets only the branch, its base commit and the governing docs as they
   stood at the base commit, not the author's reasoning. It runs `npm run check` and classifies
   every difference between code and design as a **violation** (rework, then re-run the critic
   until it reports no blockers), **acceptable** (forced by a binding contract or an allowed
   interim stand-in; note it in the PR) or **better than the design** (surface it to the owner in
   chat and `INBOX.md`; once signed off, update the design docs in the same PR so nothing stays
   stale).
2. **Ponytail.** Run `/ponytail-review` on the branch diff, then apply the accepted cuts with
   `/ponytail`. Ponytail never removes structure the architecture or an ADR requires (the
   `Renderer` port, strategies and registries, numbers in `content/` and `config/`, companion
   files, validation at boundaries) and never deletes or weakens tests. Where ponytail and the
   architecture disagree the architecture wins; a ponytail cut that would genuinely improve the
   design is raised as a better-than-design item instead of applied.
3. **Re-run on the post-ponytail code.** `npm run check` again, result reported verbatim. If
   ponytail changed structure (not just lines), the critic re-checks that diff.
4. **Only if all of the above pass** is the PR opened. The PR description records the critic's
   verdict, the ponytail result (cuts applied, net lines) and the final check output.

Tools without the ponytail plugin stop after the Definition of Done and hand the branch to a
Claude Code session (or a human with the plugin) for steps 1 to 4.

Ponytail has three placements, each chosen for where it helps and where it would harm:

| Where                                    | What                                                                                                        | Why there                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before code (instruction layer)          | Its hooks inject the ruleset at session start and into subagents; level **lite**, coding subagents only     | The ladder (does it need to exist, reuse what is here, root-cause fixes, no new dependencies) steers against bloat before it is written. Lite suggests the lazier option instead of imposing it, because its rules ("no interface with one implementation", "no config for a value that never changes") conflict with this repo's ports, registries and content-driven numbers. |
| Before the PR (step 2 above)             | `/ponytail-review` on the diff, `/ponytail` applies the accepted cuts                                       | Catches what slipped through, on a small, reviewable diff.                                                                                                                                                                                                                                                                                                                      |
| Phase exit (`docs/agents/checklists.md`) | `/ponytail-audit` (whole repo) and `/ponytail-debt` (the `ponytail:` shortcut ledger) into backlog or INBOX | Over-engineering that spans PRs, and deliberate shortcuts that must not be forgotten.                                                                                                                                                                                                                                                                                           |

Never in critics, reviewers or documentation agents: they run as their own agent types
(`architecture-reviewer`, `doc-gardener`), which `PONYTAIL_SUBAGENT_MATCHER` in
`.claude/settings.json` does not match, so the critic judges code against the architecture
without a bias towards deletion and docs keep their explanations.

## Consequences

- Design drift is caught before review instead of during it, and the design docs are kept in
  step with code that improves on them.
- Every PR costs a critic pass and a ponytail pass; this is accepted as cheaper than a review
  round trip.
- Teammates need the ponytail plugin installed in Claude Code (`docs/agents/tool-setup.md`); the
  level and subagent scope come from the shared `.claude/settings.json`.
- The level and subagent scope reach the plugin hooks only through the shared settings `env`;
  without it ponytail runs at the plugin's own default level in every subagent, critics included.
  A new session's per-project mode flag reading `lite` shows the `env` arrived.
- The gate is checked in review (PR template checklist and `docs/agents/checklists.md` §1); no
  hook enforces it.
