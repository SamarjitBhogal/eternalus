---
title: 'Progress 2026-11-23: fix/hook-project-dir (HC-B31 answer, DEC-352)'
description: 'Harness / process, sholtzman + Claude Code: recorded the owner rule that a repair to a guardrail needs only a decisions-log row (DEC-352) in guardrails.md, sdlc.md, the DEC-331 row and INBOX HC-B31.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: fix/hook-project-dir (HC-B31 answer, DEC-352)

Harness / process · fix/hook-project-dir (PR #155) · sholtzman + Claude Code

- What was done: applied the owner's answer to `INBOX.md` HC-B31 (Owner Calls page,
  2026-11-23). A repair that makes a guardrail do again what the docs say needs only a row in
  the decisions log. A change to what a guardrail does still needs an ADR. The rule is DEC-352
  in the decisions log, `docs/process/guardrails.md` §4 and `docs/process/sdlc.md` §6. The
  DEC-331 row now cites DEC-352 in place of "owner waiver pending". HC-B31 is ticked with the
  answer. Docs only; no code changed.
- Checks run: see the verbatim `npm run check` result in the PR description.
- Next step: the owner runs the push script; PR #155 then needs a review.
