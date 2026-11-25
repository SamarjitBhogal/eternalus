---
title: 'Progress 2026-11-22: feat/duel-player-messaging (PR #118 review round)'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: merged the parent branch, clearMatchSetup closes again, forfeit intent renamed, one match-time format, split banner roles, docs.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/duel-player-messaging (PR #118 review round)

Phase 3 / sprint 3 · feat/duel-player-messaging · claudiodh + Claude Code

- What was done: merged `feat/mm-guest-identity` (`DuelHud` keeps only the banner; the countdown is `MatchCountdown`'s). Fixes for the review of `90359f5b`: `clearMatchSetup` calls `duel.close()` again (a crash holds the seat, DEC-297 (1)); UI intent `forfeit-duel` is now `forfeit` (13 §2, §3, §5); `ElapsedTimeFormatter` deleted, `WaitTimer` uses `matchTimeText`; `MS_PER_SECOND` constants; banner text (`status`) split from its seconds (`timer`); `duelVersus.matchFound` template; `duelQueue.explanation` no longer promises rating-based pairing (INBOX SCRUM-431); string citations; a happy-dom keyboard test for the leave dialog; 13 §3 and §5 and §7, the plan status and INBOX SCRUM-430 (4) updated.
- Checks run: see the verbatim `npm run check` result in the PR hand-off.
- Next step: owner pushes; owner rules on auto-reconnect of a dropped Duel player (INBOX SCRUM-430 (7)).
