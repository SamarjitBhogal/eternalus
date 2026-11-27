---
title: 'Progress 2026-11-22: feat/wall-turrets (PR 4 part 1)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: wall turrets become Turret structures with one health pool; turret ammo, bolts and TurretController (target, ammo, predictive aim) built; the shot waits for PR 2.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/wall-turrets (PR 4 part 1)

Phase 4 / sprint 4.2 · feat/wall-turrets · sholtzman + Claude Code (PR-REVIEW-ASSIST-31 and its runner)

- What was done: on `9cb3a31e` (#148 head), uncommitted. Each turret feature builds a `Turret`
  structure (600 health, walls' breakability pending an owner card). Its pylon is its body (one
  pool) and goes with it when it is destroyed (`isBodyRemovedWithIt`, owner card default A). Ammo
  `bolt-default` / `bolt-heavy` (`turretAmmo.ts`), bolts `turret-bolt` / `turret-heavy-bolt` (35 m
  `TUNE`, owner card "WT bolt stop"), `loadTurrets`. `TurretController`: defend-ally override, then
  stickiness, heavy, nearest; ammo by kind; predictive aim; memory in its brain. Status notes in
  architecture 07 §13 and 11 §10. Fail-first: 37 breaks
  (`eternalus-agent-work/wall-turrets/fail-first.md`).
- Checks run: `npm run check` → `EXIT=0` (core 355 files / 2245 tests, protocol 1 / 31, client
  314 / 2202, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/wall-turrets/check-2.log`); `npm run docs:check` on this entry.
- Next step: PR 2 (`feat/melee-sweeps`) lands; then fire through `Combat`'s aim point, the
  turret's `Combat`, a scenario test, the pre-PR gate (coordinator).
