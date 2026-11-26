---
title: 'Progress 2026-11-26: docs/features-nfr-report (CI bench evidence)'
description: 'Phase 3: the NFR-021 row of the Sprint 3 report now cites the bench on the CI reference machine.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: docs/features-nfr-report (CI bench evidence)

Phase 3 / sprint 3 work · docs/features-nfr-report · SamarjitBhogal + Claude Code

- What was done: answered the CodeRabbit finding on PR #174 (NFR-021 evidence came from a laptop, not the reference machine). The NFR-021 row now cites the `npm run bench` step of CI run 45758097070 on `ubuntu-latest` (head `78f5e0e4`): 144 mobs per team + 10 Legends per team (20 in all) → p95 5.26 ms, under the 8 ms budget. The status stays Met, so the summary totals do not change. The bench label "10 Legends" is per team (`match.legendsPerTeam`), which the row now says.
- Checks run: see the PR comment for the verbatim `npm run check` output.
- Next step: team review of the report.
