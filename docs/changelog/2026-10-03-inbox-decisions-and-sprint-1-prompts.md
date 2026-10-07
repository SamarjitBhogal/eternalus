---
title: INBOX decisions and Sprint 1 session prompts
description: What the docs/inbox-decisions-2026-10-03 branch added, changed and removed, and why - the recorded owner decisions, the plan re-cut to a 2026-11-27 presentation, the Warrior rename, the extended screen flow and the Sprint 1 Ultracode prompts; read this when reviewing that PR.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-03
tags: [changelog, inbox, plan, prompts]
related:
  [
    'docs/reference/game-design/13-owner-decisions-log.md',
    'docs/agents/prompts/2026-10-03-ultracode-sessions.md',
  ]
---

# INBOX decisions and Sprint 1 session prompts

**Purpose.** The record of the second documentation change set (branch
`docs/inbox-decisions-2026-10-03`, after Phase 0 merged as PR #3 and the map branches as PR #1
and #2). It implements the product owner's INBOX answers of 2026-10-03 and prepares the
parallel Claude Code sessions for Sprint 1.

## Added

| Path                                                                | What                                                                                                                                                                               | Why                                                                                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `docs/reference/game-design/13-owner-decisions-log.md`              | Dated log of every decision from INBOX DEC-01…DEC-10 and the discrepancy answers, plus the new ideas (Tower Guardians, weapon upgrades, level visuals, team skins) with MVP status | Decisions arrive in `INBOX.md` and must survive after the item is moved to Done; one place to look.      |
| `docs/reference/game-design/14-interface-and-screen-flow.md`        | The owner's screen flow (home → loading → character select → pre-launch → match loading → match → results) and its engineering reading                                             | New design input that did not exist in the game doc; the UI sessions build from it.                      |
| `docs/agents/prompts/2026-10-03-ultracode-sessions.md`              | Eight session prompts (A–H) plus a review prompt, the run order, the integration contract and a binding file-ownership table                                                       | Requested by the owner: parallel worktree sessions that converge on the Sprint 1 demo without conflicts. |
| `docs/changelog/2026-10-03-inbox-decisions-and-sprint-1-prompts.md` | This entry                                                                                                                                                                         | Every change set gets a changelog entry.                                                                 |

## Changed

| Path                                                                         | What changed                                                                                                                                                                                                           | Why                                                                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `docs/plan/README.md`                                                        | New §0 "Re-cut of 2026-10-03": presentation 2026-11-27, two-week sprints S1–S4, two parallel tracks, feature freeze 2026-11-20; sprint definition updated                                                              | DEC-01 and DEC-05 shorten the term by two weeks and change the cadence; phase docs keep their content. |
| `docs/architecture/13-game-interface.md`                                     | `SessionPhase` gains `character-select`, `pre-launch`, `match-loading`; transition table rows added; `loading` row re-described                                                                                        | The owner's screen flow has three states the original design folded into one.                          |
| `docs/decisions/0004`, `0006`, `0009`                                        | Status lines: instructor confirmation received (DEC-02); team-as-property confirmed (DEC-03); `feat/map` merged and may be changed, reviewer Aryan (DEC-04)                                                            | ADR statuses track the owner's confirmations.                                                          |
| `docs/process/git-workflow.md` §1                                            | Reviewer rule: the feature owner picks the reviewer when opening a PR                                                                                                                                                  | DEC-05.                                                                                                |
| `docs/reference/suggestions/discrepancies.md`                                | 32 rows marked decided with the 2026-10-03 answer; DISC-19/39, DISC-33, DISC-34 marked open with a pointer to the elaboration                                                                                          | DEC-09.                                                                                                |
| `docs/reference/game-design/12-open-questions.md`                            | OQ-01 decided: Assault → Warrior                                                                                                                                                                                       | DEC-08.                                                                                                |
| 30 docs under `docs/` (not `source/`, `research/`, `changelog/`, `reviews/`) | "Assault" → "Warrior" (167 replacements), content id `assault` → `warrior`, placeholder notes now read "Warrior (formerly Assault)"                                                                                    | DEC-08: the rename is effective now so no code is written with the old name.                           |
| `INBOX.md`                                                                   | Answered decisions moved to Done; three follow-up decisions opened (DEC-11 third ability + single ultimate per class, DEC-12 corner-camp crystal timers, DEC-13 match length) with the elaboration the owner asked for | INBOX protocol: items leave only when implemented; questions get answered where they were asked.       |

## Removed

Nothing.

## Review notes for the human

- The remote branch `copilot/implement-entity-modules` implements entities in **JavaScript**
  and widens the Vitest include to `.js`; it conflicts with ADR 0003 and the companion-file
  convention. Session C in the prompts file supersedes it; the review prompt R produces the
  request-changes text. Recommend closing it rather than reworking it file by file.
- Phase docs still say "one-week sprint" in their headings; the re-cut section in
  `docs/plan/README.md` overrides the dates. Re-numbering the phase docs is a `doc-gardening`
  task for the end of Sprint 1, after the first real velocity numbers exist.

## Related

- [`13-owner-decisions-log.md`](../reference/game-design/13-owner-decisions-log.md)
- [`2026-10-03-ultracode-sessions.md`](../agents/prompts/2026-10-03-ultracode-sessions.md)
- [`README.md`](README.md)
