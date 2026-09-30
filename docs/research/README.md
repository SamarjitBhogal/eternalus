---
title: Research
description: Index of the research folder (the three Phase 0 deep-research reports, the decisions they informed, the merged bibliography and the rules for adding research); read it before citing a source in a doc or before starting new research so you do not redo what exists.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [research, index, works-cited]
related:
  - 'docs/README.md'
  - 'docs/research/works-cited.md'
  - 'docs/requirements/05-engineering-standards.md'
  - 'docs/architecture/README.md'
---

# Research

Purpose: Read this when you need evidence for a design choice, when a doc cites
`docs/research/<file>.md#section` and you want the source behind it, or when you are about to
research something and should first check whether it is already here. The requirements document
asked for "deep research" and a "work cited" folder; this folder holds the three reports written
in Phase 0 (all sources fetched on 2026-09-30), the merged bibliography, and the rules for adding
more. Research **informs** decisions; it does not make them. A decision is an ADR in
[`../decisions/`](../decisions/), and the requirements in [`../requirements/`](../requirements/)
outrank anything written here.

## The three reports

### Agentic coding harness

[`agentic-harness-research.md`](agentic-harness-research.md) verifies, tool by tool, how
Claude Code, Codex, Gemini CLI and its successor Antigravity CLI, GitHub Copilot, Cursor and the
other agents discover instruction files, and shows that `AGENTS.md` is the cross-tool standard
with `CLAUDE.md` importing it. It documents Claude Code's enforcement surface (`.claude/settings.json`
permissions and hooks, where only exit code 2 blocks), skills, subagents, MCP and worktrees; the
Anthropic and OpenAI harness guidance (feature lists with pass/fail, a progress file plus git as
memory, a separate skeptical evaluator, `AGENTS.md` as a ~100-line table of contents pointing
into `docs/`, architecture enforced by linters whose messages contain the fix, doc gardening); the
2026 evidence that prose rules are weakly followed and cost tokens, so controls belong in
scripts; the verification patterns the repo already has and the gaps (agent-loop hooks, per-glob
import boundaries, cycle detection, coverage ratchet); and a frontmatter schema that reuses the
field names the tools already read.

Decisions and requirements it informed: **D5** (phase branches, task branches, stacked PRs:
[§6](agentic-harness-research.md#6-multi-agent-and-parallel-work)), **D6** (the docs tree and
the frontmatter schema: [§7](agentic-harness-research.md#7-frontmatter-conventions-for-agent-navigable-docs)),
the harness requirements `AI-01` to `AI-12` and `NFR-032`, the coverage ratchet `ES-03`, and the
guardrail rule that every control is traceable to an incident and tested both ways.

### Game architecture and performance

[`game-architecture-and-performance-research.md`](game-architecture-and-performance-research.md)
grounds the simulation design in primary sources: the fixed-timestep accumulator with
interpolation and a clamp against the spiral of death; the JavaScript determinism pitfalls
(`Math.random`, transcendental `Math.*`, `Map` iteration order, ill-formed comparators, update
order) and the per-tick checksum that detects divergence; the case for a shallow
entity hierarchy with components, strategies, systems and Type Object definitions (the 0 A.D. and
OpenRA split) rather than a deep tree or a data-oriented ECS; flow fields per lane and team with
Reynolds steering for hordes and A* for the few Legends; a uniform spatial hash with SAT and
swept tests, including the product owner's pass-through check as a Box2D-style shape cast;
layered canvases, pre-rendered chunks and integer coordinates for Canvas 2D; pooling and
pre-allocation against V8's GC; FSMs for minions, behaviour trees at a reduced cadence for bot
Legends and the published MOBA aggro rules as data; and why the simulation stays on the main
thread with structured-clone-safe snapshots so a Worker move stays cheap.

Decisions and requirements it informed: **D4** (entity model:
[§2](game-architecture-and-performance-research.md#2-oop-entity-hierarchies-vs-ecs-vs-hybrid)),
**D7** (map as a pure function of config:
[§9](game-architecture-and-performance-research.md#9-config-driven-and-data-driven-design)),
**D8** (single-threaded simulation, transferable snapshots:
[§8](game-architecture-and-performance-research.md#8-web-workers-for-the-simulation)), **D9**
(fixed 30 ticks/s with interpolation:
[§1](game-architecture-and-performance-research.md#1-fixed-timestep-interpolation-and-determinism)),
**D10** and **D11** (behaviour selected from data on a type object rather than by subclass),
**D12** (extension points as strategies and definitions), the determinism standard `ES-04`, the
performance budgets `ES-05` and the caching strategy `ES-09`, and the pathfinding, physics and AI
architecture docs `06`, `10` and `11`.

### Persistence, input and diagnostics

[`persistence-input-diagnostics-research.md`](persistence-input-diagnostics-research.md) treats
IndexedDB as the game's DBMS: quotas and eviction per browser (Safari's seven-day wipe, private
windows), transactions and durability, the integer version plus `oldVersion` migration ladder,
structured-clone limits (persist DTOs, never class instances), a 40-line promise wrapper instead
of the `idb` package, and the Repository, Unit of Work, facade and DTO patterns applied to
profiles, loadouts, settings, match history and replays stored as seed plus command log. It then
covers input as data (`KeyboardEvent.code` with `key` labels, polled gamepads, mouse side
buttons, focus loss, the press-to-bind flow and prompts rendered from the current binding) and
runtime diagnostics (Design by Contract and Regehr's light/heavy assertions, a `Logger` port with
OpenTelemetry severities, `performance.mark/measure`, long-animation-frame and memory
observers, a developer overlay whose actions are debug commands, and replay, golden-hash, soak
and property-style tests).

Decisions and requirements it informed: **D3** (IndexedDB behind one `PersistenceController`
with repositories and a `StorageAdapter` port, one `ResourceController`:
[§A3](persistence-input-diagnostics-research.md#a3-patterns-repository-unit-of-work-facade-dtos-migrations-replays)
and [§A4](persistence-input-diagnostics-research.md#a4-game-resources-manifests-preloading-caching-progress)),
**D2** (React screens and the developer overlay fed by the bridge store, the game loop never
touching the DOM), **D8** (snapshots and DTOs as structured-clone-safe plain data:
[§A1](persistence-input-diagnostics-research.md#a1-indexeddb-fundamentals-and-browser-behaviour)),
the rebinding requirements `FR-078` to `FR-084` and the accessibility minimum `ES-11`
([§B2](persistence-input-diagnostics-research.md#b2-rebinding-ux-and-data-representation)), the
diagnostics requirements `FR-102` to `FR-110` and `AP-12`
([§C1](persistence-input-diagnostics-research.md#c1-contracts-invariants-and-post-mortem-context)),
the persistence rules `ES-10`, the reliability rules `ES-06`, and the test recipe in `ES-02`
([§C3](persistence-input-diagnostics-research.md#c3-testing-a-running-game-properties-replays-golden-hashes-soak-tests)).

Decision **D1** (TypeScript everywhere) rests on the requirements document's own OOP demands and
on the harness report's observation that typed languages and clear module boundaries are easier
to enforce mechanically; it is recorded in its ADR, not derived from a single source.

## How to add research

- One report per topic, named `<topic>-research.md`, with the frontmatter of
  [`../requirements/03-organization-guidelines.md`](../requirements/03-organization-guidelines.md)
  (OG-07): `title` equal to the H1, a keyword-first `description` that says when to read it,
  `status: active` once reviewed, `tags: [research, ...]`, and `related` links to the docs that
  will cite it.
- Structure: a **Summary** of findings, numbered sections that separate **Findings** (what the
  sources say, with bracketed citation numbers) from **What this means for Eternalus** (the
  recommendation), and a **Works cited** list at the end.
- Works-cited format, one numbered entry per source, in the order first cited:
  `Author or publisher, "Title", site or publication, date shown on the page (or "undated"). URL`.
  Keep the URL exactly as fetched; never invent a source or a date; mark anything you could not
  verify **(unverified)** in the text and say why in a closing note.
- Accessed dates: state once at the top of the list ("All accessed YYYY-MM-DD") and per entry
  only when it differs. A fact that depends on a moving page (a tool's current behaviour, a
  version number) carries its version or date in the sentence that uses it.
- Merge the new entries into [`works-cited.md`](works-cited.md) under the right topic, keeping
  the report's own numbering out of the merged list (the merged list is keyed by title and URL
  and names the citing reports).
- Cite research from other docs as `../research/<file>.md#<section-anchor>` and, for an external
  fact, the URL as given in the report. Do not re-research a settled question; open an ADR if the
  evidence contradicts a decision.

## Index

| Path                                                                                             | What it is                                                                                                              | Sections                                                                                                                                                                                    | Cited by                                                                                                  |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`README.md`](README.md)                                                                         | This index, the abstracts and the rules for adding research.                                                            | —                                                                                                                                                                                           | `docs/README.md`                                                                                          |
| [`agentic-harness-research.md`](agentic-harness-research.md)                                     | How coding agents read instructions and how to enforce rules mechanically; 53 sources.                                  | §1 `AGENTS.md`, §2 Claude Code config, §3 Anthropic guidance, §4 OpenAI and 2026 sources, §5 verification, §6 multi-agent, §7 frontmatter                                                   | `requirements/04`, `requirements/05`, `agents/*`, `process/guardrails.md`, ADR 0007, ADR 0008             |
| [`game-architecture-and-performance-research.md`](game-architecture-and-performance-research.md) | Simulation, entity, pathfinding, collision, rendering, pooling, AI, worker and content-design evidence; 66 sources.     | §1 timestep and determinism, §2 hierarchies vs ECS, §3 pathfinding, §4 partitioning and collision, §5 Canvas 2D, §6 pooling, §7 AI, §8 workers, §9 data-driven, §10 reference architectures | `requirements/01`, `requirements/05`, `architecture/03`, `04`, `06`, `08`, `10`, `11`, ADR 0006, ADR 0009 |
| [`persistence-input-diagnostics-research.md`](persistence-input-diagnostics-research.md)         | IndexedDB as a DBMS, resource loading, input and rebinding, invariants, logging, timing and replay testing; 46 sources. | §A persistence (A1–A4), §B input (B1–B2), §C diagnostics (C1–C3)                                                                                                                            | `requirements/05`, `requirements/06`, `architecture/09`, `14`, `15`, ADR 0005                             |
| [`works-cited.md`](works-cited.md)                                                               | The merged, de-duplicated bibliography of all three reports, grouped by topic, with the citing reports.                 | Agent tooling, game architecture, performance, AI, persistence, input, diagnostics, testing                                                                                                 | Every doc that cites an external fact                                                                     |

## Related

- [`works-cited.md`](works-cited.md): the merged bibliography
- [`../requirements/05-engineering-standards.md`](../requirements/05-engineering-standards.md): the standards that cite these reports
- [`../requirements/06-mvp-requirements.md`](../requirements/06-mvp-requirements.md): the requirements the reports helped shape
- [`../architecture/README.md`](../architecture/README.md): the architecture docs that cite the findings
- [`../decisions/`](../decisions/): the ADRs that record the decisions D1–D12
- [`../requirements/03-organization-guidelines.md`](../requirements/03-organization-guidelines.md): frontmatter and document hygiene rules
