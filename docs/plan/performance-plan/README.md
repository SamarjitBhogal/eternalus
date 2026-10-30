---
title: Performance plan
description: Two-week plan (2026-11-02 to 2026-11-13) for the course's Performance and Speed requirement - the three latency targets, how each is measured under load, the week-by-week work, what is out of scope, the risk that no server exists yet and the questions to settle first; read this before measuring Duel, server or page-load performance.
audience: [humans, agents]
status: draft
owner: claudiodh
last-reviewed: 2026-10-30
tags: [plan, performance, scalability, multiplayer, sprint-3]
related:
  - 'docs/plan/README.md'
  - 'docs/plan/multiplayer-and-scalability-plan.md'
  - 'docs/decisions/0016-multiplayer-server-authoritative-duel.md'
---

# Performance plan

## Goal

Show with measurements how many rooms one server can hold while meeting the course targets,
where the first bottleneck appears as players and rooms grow, and what we would do to keep the
targets at scale.

Day-by-day view: [timeline](timeline.html) (download it or open it locally; GitHub shows only
the source).

## Targets and measurements

| Brief asks for        | Target             | How it is measured                                                    |
| --------------------- | ------------------ | --------------------------------------------------------------------- |
| Page load             | 2–3 s              | Chrome DevTools on the deployed app, 5 cold loads                     |
| Critical actions      | < 1 s              | Time from joining the queue to the match starting                     |
| Input → opponent sees | < 150 ms           | Bots with timestamps, p50/p95/p99                                     |
| Realistic load        | Hundreds of rooms  | 1, 10, 50, 100 and 200 rooms; 5 minutes and 3 runs per level          |
| First bottleneck      | Identify with data | Tick p99, event-loop delay p99, bytes per snapshot, CPU and RAM usage |

## Week 1: be able to measure

- **Nov 2:** agree the message format and server metrics with whoever builds multiplayer, and
  measure page load.
- **Nov 3–5:** build the load bots: 2 per room, with each input timed end to end.
- **Nov 6 (deliverable):** first numbers for 1 and 10 rooms.

## Week 2: measure and explain

- **Nov 9–10:** run every level until something breaks, with and without simulated latency.
- **Nov 11:** apply one improvement and measure again. The first suspect is payload size,
  because `Snapshot` sends every entity in full, but this is a hypothesis for the data to
  confirm.
- **Nov 12:** write a 1–2 page report: results table, chart, first bottleneck and strategies
  (state diffing, smaller payloads, connection handling, horizontal scaling).
- **Nov 13:** prepare the demo with those numbers.

## Out of scope

- Security, privacy, observability and accessibility requirements.
- The 5,000 idle-connection test from the
  [multiplayer and scalability plan](../multiplayer-and-scalability-plan.md).
- A server database and rating-based matchmaking.
- The 60 fps pass and per-system budgets (SCRUM-187 and SCRUM-322), which stay in Sprint 4.

## Main risk: there is nothing to measure yet

As of 2026-10-30 the repo has no `apps/server`, `packages/protocol`, WebSocket code, Duel mode
or benchmark script, and in Jira SCRUM-391 (server epic) and SCRUM-401 (scale test) are To Do
and unassigned.

**Fallback:** if the server is not ready by Nov 6, measure against a minimal host running the
real core `Simulation`, and say so in the report. Those numbers do not count as Duel
measurements and must be repeated once the Duel server exists.

## Jira changes proposed

- Assign SCRUM-401 to Claudio and add the targets above to it.
- Add a ticket for page-load measurement, which no ticket covers today.

## To settle on Nov 2

1. **What is the real due date?** The brief says Sprint II, Jira lists the Sprint II demo on
   Oct 30, and the repo puts the server at Nov 13. This plan assumes Nov 13; an earlier date
   invalidates this calendar.
2. **Who builds the server, and by when?** This decides between the real Duel and the minimal
   host.
3. **Is adding `ws` approved?** New dependencies need approval, and the minimal host needs it.
4. **Where is it deployed?** The Render plan is still open (SCRUM-404), and final measurements
   should run there.

The copy of the brief used for this plan was cropped and did not include the D2L rubric, so
check the report against the rubric before submitting.
