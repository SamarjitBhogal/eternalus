---
title: Progress entries
description: The one-file-per-entry progress log since 2026-11-19; read the newest entries to know where the project is, and copy the template here to write yours.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-20
tags: [plan, progress, log]
related: ['docs/plan/PROGRESS.md', 'docs/plan/README.md', 'docs/agents/running-agents.md']
---

# Progress entries

## Purpose

Every work session or PR ends with one new file in this folder. Two sessions never edit the same
file, so merging a PR no longer makes the other open PRs conflict on one shared log (DEC-277,
owner ruling 2026-11-19). The earlier entries stay in the archive [PROGRESS.md](../PROGRESS.md).
New entries go in this folder. The cut-over is the merge (owner, 2026-11-20): entries that a
branch wrote before it merged a `phase/3-sprint-3-work` that has DEC-277 stay in PROGRESS.md;
every entry after that merge is a file here.

## Read the latest

Read the newest three files before you start a task: they tell you which phase and sprint is
active, which branch it lives on, what the last `npm run check` said and what the next step is.

```sh
ls docs/plan/progress/2*.md | tail -3
```

## Naming rule

`YYYY-MM-DD-HHMM-<branch-slug>.md`: the date and the 24-hour time at the moment you create the
file (`date +%Y-%m-%d-%H%M`), and the git branch with every `/` changed to `-` (for example
`2026-11-19-1430-chore-progress-entry-files.md`).
Name order is time order. Do not rename or reorder files.

## Format rules

- **One file per work session or PR.** Never rewrite an earlier entry. To correct one, write a
  new entry that says what was wrong. The only allowed edit to an old entry is fixing a broken
  link.
- The file has the frontmatter below (`npm run docs:check` enforces it) and the three bullets, in
  this order:
  - `What was done:` the tasks ticked (name them as in the phase doc), files or features
    touched, decisions made or asked for (INBOX ids), metrics measured with the machine
    (CPU, RAM, browser and version) when a sprint metric is involved.
  - `Checks run:` the verbatim command and its result line. Quote failures verbatim too; a
    failing check is not hidden ([AGENTS.md](../../../AGENTS.md)).
  - `Next step:` the next task, PR or decision, with who owns it.
- Keep an entry under 15 lines; link to the PR, commit or INBOX item rather than repeating it.
- Meeting minutes (walkthroughs, retrospectives) are entries too: the bullets list attendees,
  decisions and actions.
- Never log secrets, tokens or personal data; the files are committed.
- Agents write the file; they never commit or push it unless asked (`AGENTS.md`).
- Entry files are checked by `npm run docs:check` but are not listed in `docs/README.md`.

## Entry template

The template below is fenced so it is not read as a real entry. `<who or agent>` is a GitHub
handle for a human, or `<handle> + <tool>` for an agent session (for example
`sholtzman + Claude Code`). `<phase/sprint>` is `Phase N / sprint N.M`.

```markdown
---
title: 'Progress 2026-10-14: feat/core-seeded-random'
description: 'Phase 1 / sprint 1.1, sholtzman + Claude Code: the seeded random and state hasher, checks green.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-14
tags: [plan, progress, log]
---

# Progress 2026-10-14: feat/core-seeded-random

Phase 1 / sprint 1.1 · feat/core-seeded-random · sholtzman + Claude Code

- What was done: `SeededRandom` (sfc32) and the deterministic math wrappers with known-answer
  tests; `StateHasher` (FNV-1a) with equal/changed-state tests; ESLint ban on `Math.sin/cos`
  outside `core/utils/`. Asked INBOX DEC-06 (world scale) to be answered before 1.3 starts.
- Checks run: `npm run check` → `All checks passed (format, lint, typecheck, knip, coverage, build, docs)`;
  coverage core 83% / client 55%.
- Next step: open the PR into `phase/1-simulation-kernel-and-world`; reviewer: the map owner.
  Then `Vec2` and geometry helpers (sprint 1.1, next checkbox).
```

## Related

- [PROGRESS.md](../PROGRESS.md) (archive)
- [Delivery plan](../README.md)
- [Running AI agents on this repo](../../agents/running-agents.md)
