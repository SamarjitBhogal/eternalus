---
title: Organization guidelines
description: How the repository and its documentation are organised and why (OG-01 to OG-12), where a new file, doc or decision goes, which docs each kind of change must touch, the doc frontmatter schema and hygiene rules; read when you add something and are not sure where it belongs.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-06
tags: [requirements, organization, docs, repo-layout]
paths: ['docs/**', 'packages/**', 'apps/**']
related:
  ['docs/architecture/02-code-structure.md', 'docs/README.md', 'docs/process/git-workflow.md']
---

# Organization guidelines

Purpose: Read this when you add a file, a folder, a document or a decision and want to know where
it goes and which other files must change with it. The layout rules themselves (companion files,
naming, package folder tables) live in [`CONTRIBUTING.md`](../../CONTRIBUTING.md), the package
`AGENTS.md` files and [`../architecture/02-code-structure.md`](../architecture/02-code-structure.md);
this document explains the organisation, gives the decision table, and states the documentation
duties that come with each kind of change. Requirement IDs are `OG-nn`.

## Code organisation

### OG-01 One monorepo, two workspaces

- **Requirement.** One repository with npm workspaces `packages/core` (`@eternalus/core`, the
  simulation) and `apps/client` (`@eternalus/client`, the browser app), built with TypeScript
  project references (decided, ADR 0001). No new top-level folders or packages without an ADR.
- **Why.** Shared types with a hard boundary, one install, one lockfile, one `npm run check`.

### OG-02 Folders follow layers and domains

- **Requirement.** Inside each workspace, folders map to the layers and domains in
  [`../architecture/02-code-structure.md`](../architecture/02-code-structure.md): core has one
  folder per domain (`config/`, `content/`, `utils/`, `state/`, `commands/`, `entities/`,
  `components/`, `systems/`, `map/`, `physics/`, `ai/`, `abilities/`, `combat/`, `match/`,
  `loadout/`, `diagnostics/`); the client has `game/` (with `engine/`, `views/`, `input/`),
  `bridge/`, `data/` (`persistence/`, `resources/`), `ui/` (`screens/`, `hud/`, `components/`)
  and `styles/`. Folders are created when the first code arrives, never empty. Each class has its
  own file plus optional `.types.ts`/`.constants.ts` companions
  ([`CONTRIBUTING.md` §3.1](../../CONTRIBUTING.md)).
- **Why.** A reader (or an agent given a `paths` glob) can find every piece of a domain in one
  place, and import boundaries can be expressed as folder rules.

### OG-03 Tests live next to the code

- **Requirement.** `<name>.test.ts(x)` beside the file under test; replay and content fixtures in
  a `__fixtures__/` folder beside the tests that use them; no separate `test/` tree. Soak and
  performance tests are tagged so they can run on a separate script (ES-02).
- **Why.** Co-location keeps tests in the same PR and the same review as the code they protect.

## Documentation organisation

### OG-04 The docs tree

- **Requirement.** All documentation lives under `docs/` with the structure below (decided, ADR
  0008); every `.md` under `docs/` carries the frontmatter in OG-07; `docs/README.md` is the index.
  Root files (`README.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CONTRIBUTING.md`, `INBOX.md`)
  have no frontmatter.

| Folder               | Holds                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `docs/plan/`         | Roadmap, one doc per phase (sprints, checklists, tests, metrics), the post-MVP backlog, `PROGRESS.md` |
| `docs/architecture/` | One doc per architecture theme (layers, code structure, game model, entities, ... harness, recipes)   |
| `docs/reference/`    | The game design split by topic, the glossary, suggestions, and the verbatim game doc under `source/`  |
| `docs/requirements/` | This folder: principles, standards, the FR/NFR catalogue, and the verbatim requirements doc           |
| `docs/research/`     | The research reports and works cited; cite them, do not re-research                                   |
| `docs/process/`      | Git workflow, SDLC, guardrails                                                                        |
| `docs/agents/`       | Running agents, tool setup, task-brief template, review checklists                                    |
| `docs/decisions/`    | ADRs, numbered, never edited after acceptance (superseded instead)                                    |
| `docs/changelog/`    | One entry per phase (or notable milestone), dated                                                     |

- **Why.** Anything an agent cannot reach from the repository "effectively doesn't exist"
  ([`../research/agentic-harness-research.md#4-openais-harness-engineering-and-other-2026-sources`](../research/agentic-harness-research.md#4-openais-harness-engineering-and-other-2026-sources));
  the tree is the system of record, and the frontmatter makes it navigable by task.

### OG-05 Where new things go

Use this table before creating anything. "Recipe" refers to the named recipe in
[`../architecture/17-extension-recipes.md`](../architecture/17-extension-recipes.md).

| I am adding...                                    | It goes in...                                                                                          | See                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| A rule that runs every tick                       | `core/src/systems/<Name>System.ts` + one line in `SystemPipeline`                                      | Recipe "new system"                                                                  |
| Per-entity state                                  | `core/src/components/<Name>.ts`                                                                        | Recipe "new component"                                                               |
| A new kind of unit, structure, obstacle           | A definition in `core/src/content/<family>/`; a class only if lifecycle differs; `EntityRegistry` line | Recipe "new entity kind"                                                             |
| An ability, weapon, artifact, status effect       | A content entry; an `AbilityEffect`/strategy class only for unique behaviour; registry line            | Recipe "new ability"                                                                 |
| A tuning number                                   | `core/src/content/` with `// TUNE:`                                                                    | CP-09                                                                                |
| A world-shape number (lanes, towers, caps, times) | `core/src/config/GameConfig` + `validateGameConfig()`                                                  | AP-05                                                                                |
| A way to mutate state                             | A member of the `Command` union + `applyCommand()` case + its producer (input mapper or controller)    | Recipe "new command"                                                                 |
| A fact other systems react to                     | A member of the `GameEvents` map + emitter + subscribers                                               | AP-06                                                                                |
| A bot behaviour                                   | `core/src/ai/` controller, FSM state or behaviour-tree node; aggro numbers in content                  | [`11-game-ai.md`](../architecture/11-game-ai.md)                                     |
| Something drawable                                | `apps/client/src/game/views/<Name>View.ts` + `ViewRegistry` line (map and minimap follow)              | Recipe "new view"                                                                    |
| A player action                                   | `InputAction` id + default binding in `game/input/keybindings.ts` + `InputMapper` mapping              | [`13-game-interface.md`](../architecture/13-game-interface.md)                       |
| A screen or HUD element                           | `ui/screens/` or `ui/hud/` + a slice/selector in `bridge/` if it needs new data                        | [`13-game-interface.md`](../architecture/13-game-interface.md)                       |
| A persisted record                                | A DTO in `data/persistence/dto/`, a repository, a schema migration                                     | [`14-persistence-and-resources.md`](../architecture/14-persistence-and-resources.md) |
| An asset                                          | The asset manifest under `apps/client/src/assets/` with its licence noted                              | AP-14; `AGENTS.md` forbidden actions                                                 |
| A browser API use                                 | A port in `game/engine/` or `data/` + an adapter + a fake                                              | AP-02                                                                                |
| A dependency                                      | Nowhere until a human approves; then `package.json` via `npm install`, justified in the PR             | `AGENTS.md`                                                                          |
| A design decision                                 | `docs/decisions/NNNN-title.md` from the template                                                       | OG-09                                                                                |
| A document                                        | The `docs/` folder for its kind, with frontmatter, and a line in `docs/README.md`                      | OG-04, OG-07                                                                         |
| A game-design idea or naming suggestion           | `docs/reference/suggestions/`                                                                          | [`../reference/suggestions/README.md`](../reference/suggestions/README.md)           |
| An unsorted note, question or link                | Root `INBOX.md`; triaged at the next gardening pass                                                    | OG-09                                                                                |

If nothing fits, propose a location in the PR and ask; do not invent a top-level folder.

### OG-06 Documentation duties per change type

- **Requirement.** A PR is not done until the docs its change type requires are updated in the
  same PR (Definition of Done, [`CONTRIBUTING.md` §8](../../CONTRIBUTING.md)).

| Change type                                    | Must touch                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| New or changed system, component, entity, port | TSDoc; the architecture doc that governs the path (its `paths` frontmatter); the phase doc checklist; `docs/plan/PROGRESS.md`         |
| New content entry or tuning change             | The reference game-design doc if it is a design fact; the `TUNE` marker; balancing notes in `docs/reference/suggestions/` if debated  |
| New folder or public export from core          | The package `AGENTS.md` folder table; `02-code-structure.md`; an ESLint boundary rule if the folder has one; PR notes the API change  |
| Guardrail or tool config change                | An ADR; the table in [`../process/guardrails.md`](../process/guardrails.md)                                                           |
| New dependency                                 | An ADR or PR justification approved by a human; `package-lock.json` via `npm install`                                                 |
| Player-visible behaviour                       | The FR's status in `06-mvp-requirements.md` if it changes; the phase doc; the changelog entry for the phase                           |
| Bug fix                                        | The regression test (and replay fixture if it came from a replay); `PROGRESS.md`                                                      |
| Decision or requirement change                 | ADR first; then the catalogue or principle doc, with `last-reviewed` bumped                                                           |
| Phase completion                               | Phase doc checklist closed; `docs/changelog/<date>-phase-<n>.md`; `docs/README.md` index regenerated; `last-reviewed` on touched docs |
| Edit to many docs at once (sweep, rename)      | The OG-12 guard before commit; an independent reviewer of the diff                                                                    |

### OG-07 Frontmatter schema

- **Requirement.** Every `.md` under `docs/` starts with this YAML block; keys are lowercase-hyphen;
  no other keys; `title` matches the H1; `docs/README.md` and other index files may omit `paths`.

```yaml
---
title: Entity architecture
description: One sentence saying what the doc is for and when to read it.
audience: [humans, agents] # subset of: humans, agents
status: draft # draft | active | deprecated
owner: sholtzman
last-reviewed: 2026-09-30
tags: [architecture, entities] # lowercase-hyphen words
paths: ['packages/core/src/entities/**'] # optional: code the doc governs
related: ['docs/architecture/03-game-model.md'] # optional
---
```

- **Why.** `description` and `paths` reuse the field names and glob semantics agent tools already
  read, so a doc can be promoted to a rule or skill without rewriting; the other keys feed the
  generated index and a staleness check
  ([`../research/agentic-harness-research.md#7-frontmatter-conventions-for-agent-navigable-docs`](../research/agentic-harness-research.md#7-frontmatter-conventions-for-agent-navigable-docs)).

### OG-08 Document hygiene

- **Requirement.**
  - One topic per document; split when a second H1-worthy topic appears.
  - After the H1, one **Purpose** paragraph that starts with what to read it for ("Read this
    when..."); end with a `## Related` list of relative links.
  - Prose first; tables for catalogues; checklists only in plan docs and checklists.
  - Every item carries its MVP status (**MVP**, **MVP-if-time**, **post-MVP**, **removed**);
    tuning numbers carry `TUNE` and their source; invented values are labelled `Recommendation:`.
  - A rule has one home; other docs link to it (one-line restatement at most).
  - `status` moves `draft → active` when the owner signs off and `active → deprecated` with a
    pointer to the replacement; deprecated docs are deleted one phase later.
  - `last-reviewed` is bumped whenever the doc is checked against reality; a doc older than 90
    days is stale and is listed by the index script (Recommendation: a zero-dependency Node script
    in `npm run check` that warns).
  - Gardening cadence: at the end of every phase and at least monthly, one person (or one agent
    session with the prompt "audit docs for stale rules; propose deletions first") reviews
    `AGENTS.md`, `docs/` and the harness files and opens one cleanup PR.
  - Spelling: Canadian/British is fine, consistent within a doc; "horde", never "hoard";
    canonical names from [`../reference/glossary.md`](../reference/glossary.md).

### OG-09 Decisions, changelog, progress and inbox

- **Requirement.**
  - **ADRs** (`docs/decisions/NNNN-title.md`, from `0000-template.md`) record every decision that
    changes a requirement, a guardrail, a dependency, a layer boundary or the docs tree. Accepted
    ADRs are never edited; a new ADR supersedes. Product owner decisions outrank everything else
    ([`README.md`](README.md)).
  - **Changelog** (`docs/changelog/<yyyy-mm-dd>-<slug>.md`): one entry per phase merge or notable
    milestone, written by the phase lead, listing what shipped, what was cut and which ADRs landed.
  - **Progress log** (`docs/plan/PROGRESS.md`): append-only; every agent or human task appends
    one line (date, branch, task, outcome, evidence) so a fresh session can get up to speed
    without reading git history.
  - **Inbox** (root `INBOX.md`): the only free-form file; anyone drops ideas, questions and links
    there; gardening moves them into suggestions, the backlog, an ADR or the bin.

### OG-12 Documents outlive the code

- **Requirement.** Documentation is written to stay true for years, not until the next commit.
  - **Design docs state intent.** Architecture docs, ADRs and reference docs describe decisions,
    invariants, responsibilities, boundaries, extension points and why. They do not restate what
    the code or content already says.
  - **One source per value.** Tuning numbers, limits and defaults are named by where they live
    (for example `DEFAULT_MAP_LAYOUT.wallRing`), never copied into prose; a gameplay number the
    owner set lives in `docs/reference/` or `docs/requirements/`, and content cites it. An example
    value is marked "e.g." and follows from a rule stated next to it.
  - **Code blocks are contracts or sketches.** A block in a design doc is either a stable
    contract (a port, a type at a boundary) labelled as such, or a labelled sketch.
    Implementation detail is not copied.
  - **The target design stays the design.** Interim states (stand-ins, partial implementations,
    work owned by another session) go in one short "Implementation status" section of the doc, or
    in `docs/plan/`, never into the design text itself.
  - **Design text changes for three reasons only:** a decision (an ADR or an owner decision,
    cited by ID), a contract change, or a factual error (a wrong name, path or rule). Each edit is
    the smallest change at the place it applies.
  - **Records are never rewritten.** Accepted ADR bodies, dated changelog entries, `PROGRESS.md`
    entries, dated reviews and prompts that have been run are kept as written; corrections are
    appended (OG-09).
  - **Structure is stable.** Headings are link anchors: renaming or removing one updates every
    inbound link in the same change (`npm run docs:check` checks only links under `docs/`).
    Frontmatter keys and meaning do not change in passing.
  - **Bulk edits are guarded.** A change that touches many docs (an agent sweep, a rename) is
    checked before commit: headings and frontmatter unchanged except `last-reviewed`, no record
    rewritten, every edit traceable to one of the three reasons above, and an independent reviewer
    reads the diff against this rule.
- **Why.** On 2026-10-06 an automated sweep that only checked whether statements matched the code
  replaced a target design with an interim API and copied tuning values into an architecture doc
  (ADR 0011). A doc that mirrors the code goes stale with every commit; a doc that states intent
  and points at the source stays correct.

## Git naming

### OG-10 Branches, commits and pull requests

- **Requirement.** Long-lived `phase/<n>-<name>` integration branches; task branches
  (`feat/`, `fix/`, `docs/`, `refactor/`, `chore/` + short name) PR into the phase branch; one PR
  per phase into `main`; the next phase stacks on the previous until it merges (decided, D5).
  Conventional Commits with an allowed scope; small, squash-merged PRs with one approval and green
  CI; nobody commits to `main`. Full procedure:
  [`../process/git-workflow.md`](../process/git-workflow.md); the basics are in
  [`CONTRIBUTING.md` §7](../../CONTRIBUTING.md).
- **Why.** Phase branches keep `main` releasable and let five people and their agents work in
  parallel without merging half-finished phases.

### OG-11 One task, one branch, one worktree

- **Requirement.** Each task (human or agent) lives on its own branch and, when run in parallel,
  its own git worktree with its own `npm ci`; parallel tasks are given disjoint file sets. PR
  titles name the requirement or phase task they deliver (`feat(core): FR-025 layered shield
bars`).
- **Why.** Disjoint work is what keeps AI-generated PRs reviewable by diff
  ([`../agents/running-agents.md`](../agents/running-agents.md)).

## Related

- [`../architecture/02-code-structure.md`](../architecture/02-code-structure.md): the full folder map with import rules
- [`../README.md`](../README.md): the documentation index
- [`../process/git-workflow.md`](../process/git-workflow.md) and [`../process/sdlc.md`](../process/sdlc.md): branching and lifecycle
- [`../agents/task-brief-template.md`](../agents/task-brief-template.md): how tasks are scoped so they land in the right place
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md): naming table, companion files, Definition of Done
- [`../decisions/`](../decisions/): ADRs 0001 (monorepo), 0007 (phase branching), 0008 (docs tree)
