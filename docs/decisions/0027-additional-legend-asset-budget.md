---
title: 0027. Selected Legend sprite atlas budgets
description: Proposed per-Legend byte budgets for the sprites-only rebuild of PR 134.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-11-22
tags: [adr, assets, legends]
related: [docs/reference/legend-sprite-provenance.md]
---

# 0027. Selected Legend sprite atlas budgets

DEC-298 (6) leaves the byte budgets for owner review after the cuts. One local match loads only
the selected Legend's atlas. Pixel-art atlases stay lossless. Selection portraits are deferred to
the selected-subclass portrait follow-up. Existing selection and HUD budget assertions stay in force.

| Atlas               | Standard bytes | High-density bytes |
| ------------------- | -------------: | -----------------: |
| assassin-sprites    |         150240 |             519994 |
| catalyst-sprites    |         399098 |            1391908 |
| colossus-sprites    |         245878 |             873836 |
| juggernaut-sprites  |         264830 |             934970 |
| knight-sprites      |         202298 |             700854 |
| necromancer-sprites |         345032 |            1210002 |
| oracle-sprites      |         426890 |            1487658 |
| paladin-sprites     |         234572 |             826646 |
