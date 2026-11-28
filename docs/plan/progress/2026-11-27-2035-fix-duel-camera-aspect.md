---
title: 'Progress 2026-11-27: fix/duel-camera-aspect'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: the camera keeps the screen aspect, so a 4:3 tablet is not squashed; the canvas follows its own size.'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: fix/duel-camera-aspect

Phase 3 / sprint 3 · fix/duel-camera-aspect · claudiodh + Claude Code

- What was done: on a 4:3 tablet (an iPad over Tailscale) the match was drawn squashed, because the
  following camera always showed a 16:9 world rectangle and the renderer stretched it to the
  canvas. `Camera.fitTo(width, height)` now keeps the visible height and takes the screen's aspect
  for the width, before the view is kept inside the map; `MatchCamera.resize` calls it. A 16:9
  screen sees no change. `MatchHost` also watches the canvas box with `ResizeObserver` where it
  exists, since a tablet browser resizes the page with no window `resize` (its address bar, a
  turned device). Architecture 08 §5 says so.
- Tests proven by a deliberate break: `fitTo` made a no-op turned 4 of 24 red in `Camera.test.ts`
  and `MatchCamera.test.ts` (the zero-size test stays green by design); the observer left
  unconnected turned the new `MatchHost.test.ts` test red (1 of 18). Both restored (`cmp` same).
- Pre-PR critic (independent reviewer, base `74052e2c` docs): PASS WITH FINDINGS, no blockers.
  Applied: a `MatchHost` test with a fake `ResizeObserver` (a canvas-box change resizes, `destroy`
  disconnects), the `Camera` constructor TSDoc, the `FOLLOW_VIEW_WIDTH` TSDoc, a reflowed line.
  Better than the design: DEC-238 names a fixed 96 × 54 m view, and the width now follows the
  screen; `INBOX.md` asks Sam (recommendation A, as built). Not taken: injecting the observer
  through `MatchHostDeps` (the global guard and the fake cover it), and dropping the window
  `resize` listener (both firing is harmless).
- Checks run: `npm run check` EXIT=0 after `npm ci`: core "Tests 2000 passed (2000)", protocol "Tests 33
  passed (33)", client "Tests 2311 passed (2311)", server "Tests 165 passed (165)",
  "Documentation check passed."
- Next step: open the PR into phase/3; Sam answers the INBOX camera-aspect item.
