---
title: 'Progress 2026-11-23: chore/horde-test-speed (HC-B32 signed off, DEC-357)'
description: 'Phase 3, sholtzman + Claude Code: the owner signed off HC-B32 (one queue rule for both path searches) as built; DEC-357 records it and the INBOX card is closed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: chore/horde-test-speed (HC-B32 signed off, DEC-357)

Phase 3 / map work · chore/horde-test-speed (PR #154, into PR #152) · sholtzman + Claude Code
(MEMORY-CLEANUP-7)

- What was done: the owner answered HC-B32 on the Owner Calls page (2026-11-23): "Keep it
  (built)". DEC-357 in the owner decisions log records it. The `INBOX.md` HC-B32 card is ticked
  and has the answer line. No code changes.
- Checks run: `npm run check` → EXIT=0: core "Tests 1838 passed (1838)", protocol "Tests 29
  passed (29)", client "Tests 2105 passed (2105)", server "Tests 84 passed (84)",
  "Documentation check passed." (`eternalus-agent-work/horde-test-speed/check-3.log`).
- Next step: unchanged. `HORDE_WALK_TIMEOUT_MS` goes after PR #84 reaches PR #152's line, with CI
  times on both runners as the proof.
