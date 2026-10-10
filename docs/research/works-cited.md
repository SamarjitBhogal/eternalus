---
title: Works cited
description: The merged, de-duplicated bibliography of the five research reports (three from Phase 0, two on multiplayer and servers from 2026-10-10), grouped by topic, with each source's URL, author or publisher, the date shown on the page, the access date and the report(s) that cite it; read it to find or verify the source behind a claim in any Eternalus doc.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-10
tags: [research, works-cited, bibliography, sources]
related:
  - 'docs/research/README.md'
  - 'docs/research/agentic-harness-research.md'
  - 'docs/research/game-architecture-and-performance-research.md'
  - 'docs/research/persistence-input-diagnostics-research.md'
  - 'docs/research/multiplayer-and-netcode-research.md'
  - 'docs/research/server-scalability-and-matchmaking-research.md'
---

# Works cited

Purpose: Read this when a doc cites an external fact and you want the source, when you are
checking that a claim is still true, or when you add research and must merge its bibliography.
This list merges the "Works cited" sections of the three Phase 0 reports and the "Sources"
sections of the two 2026-10-10 reports in this folder, removes the duplicates (Nystrom's
"Command" and Hoskinson's "Determinism in League of Legends: Introduction", each cited from two
URLs; Fiedler's "Deterministic Lockstep", cited by Architecture and Netcode; Fiedler's "Snapshot
Compression" and the Colyseus README, each cited by Netcode and Scalability), and groups the
entries by topic. Every URL is kept exactly as the report cited it. The Phase 0 sources were
accessed on 2026-09-30. The Netcode report gives each source's own access date; the Scalability
report states only "All accessed 2026-10-09 or 2026-10-10" for its whole list, so its entries
carry that range. The date after the publisher is the date the page itself shows ("undated" where
the report says so, "date not stated" where the report gives none). Scalability entries marked
"read through search excerpts" were read from search-engine extracts, not fetched in full. The
last field names the citing report and the entry number in that report's own list: **Harness** =
[`agentic-harness-research.md`](agentic-harness-research.md), **Architecture** =
[`game-architecture-and-performance-research.md`](game-architecture-and-performance-research.md),
**Persistence** = [`persistence-input-diagnostics-research.md`](persistence-input-diagnostics-research.md),
**Netcode** = [`multiplayer-and-netcode-research.md`](multiplayer-and-netcode-research.md),
**Scalability** = [`server-scalability-and-matchmaking-research.md`](server-scalability-and-matchmaking-research.md).

Entry format: title — URL — author/publisher — date on page — accessed date — citing report(s).

## Agent tooling

- AGENTS.md — https://agents.md/ — agents.md / Agentic AI Foundation — undated — accessed 2026-09-30 — Harness #1.
- How Claude remembers your project (CLAUDE.md, AGENTS.md, rules) — https://code.claude.com/docs/en/memory — Anthropic — undated (references v2.1.283) — accessed 2026-09-30 — Harness #2.
- Hooks reference — https://code.claude.com/docs/en/hooks — Anthropic — undated — accessed 2026-09-30 — Harness #3.
- Skills — https://code.claude.com/docs/en/skills — Anthropic — undated — accessed 2026-09-30 — Harness #4.
- Subagents — https://code.claude.com/docs/en/sub-agents — Anthropic — undated — accessed 2026-09-30 — Harness #5.
- Settings files and precedence — https://code.claude.com/docs/en/settings — Anthropic — undated — accessed 2026-09-30 — Harness #6.
- Permissions — https://code.claude.com/docs/en/permissions — Anthropic — undated — accessed 2026-09-30 — Harness #7.
- Best practices for Claude Code — https://code.claude.com/docs/en/best-practices — Anthropic (https://www.anthropic.com/engineering/claude-code-best-practices redirects here) — undated — accessed 2026-09-30 — Harness #8.
- Run parallel sessions with worktrees — https://code.claude.com/docs/en/worktrees — Anthropic — undated — accessed 2026-09-30 — Harness #9.
- Connect to tools with MCP — https://code.claude.com/docs/en/mcp — Anthropic — undated — accessed 2026-09-30 — Harness #10.
- Set up Claude Code in a monorepo or large codebase — https://code.claude.com/docs/en/large-codebases — Anthropic — undated — accessed 2026-09-30 — Harness #11.
- Effective harnesses for long-running agents — https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — Anthropic — 2025-11-26 — accessed 2026-09-30 — Harness #12.
- Harness design for long-running application development — https://www.anthropic.com/engineering/harness-design-long-running-apps — Anthropic — 2026-03-24 — accessed 2026-09-30 — Harness #13.
- Effective context engineering for AI agents — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — Anthropic — 2025-09-29, modified 2026-01-06 — accessed 2026-09-30 — Harness #14.
- Building effective agents — https://www.anthropic.com/engineering/building-effective-agents — Anthropic — 2024-12-19, modified 2026-08-10 — accessed 2026-09-30 — Harness #15.
- Harness engineering: leveraging Codex in an agent-first world — https://openai.com/index/harness-engineering/ — OpenAI, Ryan Lopopolo — 2026-02-11 — accessed 2026-09-30 — Harness #16.
- Using PLANS.md for multi-hour problem solving — https://developers.openai.com/cookbook/articles/codex_exec_plans — OpenAI Cookbook — undated — accessed 2026-09-30 — Harness #17.
- Custom instructions with AGENTS.md — https://learn.chatgpt.com/docs/agent-configuration/agents-md — OpenAI (Codex docs) — undated — accessed 2026-09-30 — Harness #18.
- Build skills — https://learn.chatgpt.com/docs/build-skills — OpenAI (Codex docs) — undated — accessed 2026-09-30 — Harness #19.
- Hooks — https://learn.chatgpt.com/docs/hooks — OpenAI (Codex docs) — undated — accessed 2026-09-30 — Harness #20.
- Worktrees — https://learn.chatgpt.com/docs/environments/git-worktrees — OpenAI (Codex docs) — undated — accessed 2026-09-30 — Harness #21.
- Provide context with GEMINI.md files — https://geminicli.com/docs/cli/gemini-md/ — Google — last updated 2026-06-18 — accessed 2026-09-30 — Harness #22.
- Configuration reference (`context.fileName`) — https://geminicli.com/docs/reference/configuration/ — Google — undated — accessed 2026-09-30 — Harness #23.
- Gemini CLI hooks — https://geminicli.com/docs/hooks/ — Google — 2026-04-13 — accessed 2026-09-30 — Harness #24.
- Agent Skills (Gemini CLI) — https://geminicli.com/docs/cli/skills/ — Google — 2026-04-30 — accessed 2026-09-30 — Harness #25.
- Git worktrees (experimental) — https://geminicli.com/docs/cli/git-worktrees/ — Google — 2026-03-20 — accessed 2026-09-30 — Harness #26.
- An important update: Transitioning Gemini CLI to Antigravity CLI — https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli — Google Developers Blog — 2026-05-19 — accessed 2026-09-30 — Harness #27.
- Migrating from Gemini CLI — https://antigravity.google/docs/cli/gcli-migration — Google Antigravity docs — undated — accessed 2026-09-30 — Harness #28.
- Adding repository custom instructions for GitHub Copilot — https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions — GitHub Docs — undated — accessed 2026-09-30 — Harness #29.
- Use custom instructions in VS Code — https://code.visualstudio.com/docs/agent-customization/custom-instructions — Microsoft — 2026-09-16 — accessed 2026-09-30 — Harness #30.
- Rules — https://cursor.com/docs/rules — Cursor — undated — accessed 2026-09-30 — Harness #31.
- Agent Skills — https://cursor.com/docs/skills — Cursor — undated — accessed 2026-09-30 — Harness #32.
- Memories & Rules — https://docs.devin.ai/desktop/cascade/memories — Cognition (Devin Desktop, formerly Windsurf) — undated — accessed 2026-09-30 — Harness #33.
- AGENTS.md — https://docs.devin.ai/desktop/cascade/agents-md — Cognition — undated — accessed 2026-09-30 — Harness #34.
- Using Rules — https://zed.dev/docs/ai/rules — Zed Industries — undated — accessed 2026-09-30 — Harness #35.
- AGENTS.md — https://docs.factory.com/harness/agents-md — Factory — undated — accessed 2026-09-30 — Harness #36.
- Getting started (Include AGENTS.md file) — https://jules.google/docs/ — Google Jules — undated — accessed 2026-09-30 — Harness #37.
- Specifying coding conventions — https://aider.chat/docs/usage/conventions.html — Aider — undated — accessed 2026-09-30 — Harness #38.
- Rules — https://opencode.ai/docs/rules/ — OpenCode/Anomaly — last updated 2026-09-29 — accessed 2026-09-30 — Harness #39.
- Agent Skills specification — https://agentskills.io/specification — agentskills.io — undated — accessed 2026-09-30 — Harness #40.
- The State of AI Harness Engineering 2026 — https://marmelab.com/blog/2026/09/24/the-state-of-ai-harness-engineering-2026.html — marmelab — 2026-09-24 — accessed 2026-09-30 — Harness #41.
- Agent Harness Engineering — https://addyosmani.com/blog/agent-harness-engineering/ — Addy Osmani — 2026-04-19 — accessed 2026-09-30 — Harness #42.
- Harness engineering for coding agent users — https://martinfowler.com/articles/harness-engineering.html — Birgitta Böckeler, martinfowler.com — 2026-04-02 — accessed 2026-09-30 — Harness #43.
- Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents? — https://arxiv.org/abs/2602.11988 — Gloaguen, Mündler, Müller, Raychev, Vechev, arXiv — 2026-02-12, v2 2026-06-23 — accessed 2026-09-30 — Harness #44.
- dependency-cruiser — https://github.com/sverweij/dependency-cruiser — Sander Verweij (README) — undated — accessed 2026-09-30 — Harness #46.
- eslint-plugin-boundaries — https://github.com/javierbrea/eslint-plugin-boundaries — Javier Brea (README) — undated — accessed 2026-09-30 — Harness #47.
- no-restricted-imports — https://eslint.org/docs/latest/rules/no-restricted-imports — ESLint (v10.11.0 docs) — undated — accessed 2026-09-30 — Harness #48.
- no-restricted-syntax — https://eslint.org/docs/latest/rules/no-restricted-syntax — ESLint (v10.11.0 docs) — undated — accessed 2026-09-30 — Harness #49.
- Project References — https://www.typescriptlang.org/docs/handbook/project-references.html — Microsoft TypeScript — last updated 2026-09-28 — accessed 2026-09-30 — Harness #50.
- githooks (`core.hooksPath`) — https://git-scm.com/docs/githooks — Git — undated — accessed 2026-09-30 — Harness #51.
- git-worktree — https://git-scm.com/docs/git-worktree — Git — undated — accessed 2026-09-30 — Harness #52.
- Stacked pull requests are now in public preview — https://github.blog/changelog/2026-07-30-stacked-pull-requests-are-now-in-public-preview/ — GitHub Changelog — 2026-07-30 — accessed 2026-09-30 — Harness #53.

Not verifiable on 2026-09-30 and therefore not used as a source: arXiv 2608.23550 ("When 'Do
Not' Is Not Deny: Security Rules in CLAUDE.md vs Built-In Controls"), cited second-hand by the
marmelab survey; the fetched PDF returned no readable text (Harness, closing note).

## Game architecture

- Fix Your Timestep! — https://gafferongames.com/post/fix_your_timestep/ — Glenn Fiedler, Gaffer On Games (Game Physics series) — page undated; the series is dated 2004 on the category index — accessed 2026-09-30 — Architecture #1.
- Floating Point Determinism — https://gafferongames.com/post/floating_point_determinism/ — Glenn Fiedler, Gaffer On Games — undated — accessed 2026-09-30 — Architecture #2.
- Deterministic Lockstep — https://gafferongames.com/post/deterministic_lockstep/ — Glenn Fiedler, Gaffer On Games — undated — accessed 2026-09-30 (Architecture) and 2026-10-09 (Netcode) — Architecture #3; Netcode #11.
- Game Physics category index (lists "Networked Physics (2004)") — https://gafferongames.com/categories/game-physics/ — Gaffer On Games — undated — accessed 2026-09-30 — Architecture #4.
- Math.random() — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random — MDN Web Docs (Mozilla) — last modified Jul 10, 2025 — accessed 2026-09-30 — Architecture #5.
- Math — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math — MDN Web Docs (Mozilla) — last modified Jul 10, 2025 — accessed 2026-09-30 — Architecture #6.
- There's Math.random(), and then there's Math.random() — https://v8.dev/blog/math-random — Yang Guo, V8 blog — 17 Dec 2015 — accessed 2026-09-30 — Architecture #7.
- Array.prototype.sort() — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort — MDN Web Docs (Mozilla) — last modified Jul 20, 2025 — accessed 2026-09-30 — Architecture #8.
- Map — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map — MDN Web Docs (Mozilla) — last modified Aug 13, 2026 — accessed 2026-09-30 — Architecture #9.
- Pseudorandom number generators (PRNGs.md) — https://github.com/bryc/code/blob/master/jshash/PRNGs.md — bryc, GitHub — undated, public domain — accessed 2026-09-30 — Architecture #10.
- Component — https://gameprogrammingpatterns.com/component.html — Robert Nystrom, Game Programming Patterns — site (c) 2009-2021 — accessed 2026-09-30 — Architecture #11.
- Game Loop — https://gameprogrammingpatterns.com/game-loop.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #12.
- Evolve Your Hierarchy — https://cowboyprogramming.com/2007/01/05/evolve-your-heirachy/ — Mick West, Cowboy Programming — 5 Jan 2007 — accessed 2026-09-30 — Architecture #13.
- Entity Component System FAQ — https://raw.githubusercontent.com/SanderMertens/ecs-faq/master/README.md — Sander Mertens, GitHub README — undated — accessed 2026-09-30 — Architecture #14.
- Type Object — https://gameprogrammingpatterns.com/type-object.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #15.
- Subclass Sandbox — https://gameprogrammingpatterns.com/subclass-sandbox.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #16.
- Update Method — https://gameprogrammingpatterns.com/update-method.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #17.
- Event Queue — https://gameprogrammingpatterns.com/event-queue.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #18.
- Command — https://gameprogrammingpatterns.com/command.html (web edition) and https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/command.markdown (book source, `book/command.markdown`) — Robert Nystrom, Game Programming Patterns — undated web page; book published 2014 — accessed 2026-09-30 — Architecture #19 (web edition); Persistence #22 (book source).
- Observer — https://gameprogrammingpatterns.com/observer.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #20.
- State — https://gameprogrammingpatterns.com/state.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #21.
- Service Locator — https://gameprogrammingpatterns.com/service-locator.html — Robert Nystrom, Game Programming Patterns (the served page is an older "work in progress" draft) — undated — accessed 2026-09-30 — Architecture #22.
- Flyweight — https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/flyweight.markdown — Robert Nystrom, Game Programming Patterns (book source on GitHub; the web page returned empty during the session) — undated — accessed 2026-09-30 — Architecture #23.
- Dirty Flag — https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/dirty-flag.markdown — Robert Nystrom, Game Programming Patterns (book source on GitHub) — undated — accessed 2026-09-30 — Architecture #24.
- Object Pool — https://gameprogrammingpatterns.com/object-pool.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #25.
- Spatial Partition — https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/spatial-partition.markdown — Robert Nystrom, Game Programming Patterns (book source on GitHub; the web page returned empty during the session) — undated — accessed 2026-09-30 — Architecture #26.
- Data Locality — https://gameprogrammingpatterns.com/data-locality.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #27.
- Prototype — https://raw.githubusercontent.com/munificent/game-programming-patterns/master/book/prototype.markdown — Robert Nystrom, Game Programming Patterns (book source on GitHub) — undated — accessed 2026-09-30 — Architecture #28.
- Table of Contents — https://gameprogrammingpatterns.com/contents.html — Robert Nystrom, Game Programming Patterns — undated — accessed 2026-09-30 — Architecture #29.
- HMR API — https://vite.dev/guide/api-hmr — Vite (docs for Vite 8.3.1) — undated — accessed 2026-09-30 — Architecture #57.
- TypeScript 4.9 release notes — https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html — TypeScript (Microsoft) — page last updated Sep 28, 2026 — accessed 2026-09-30 — Architecture #58.
- Zod: Intro — https://zod.dev/ — Colin McDonnell (Zod 4 documentation) — undated — accessed 2026-09-30 — Architecture #59.
- Getting started — https://ajv.js.org/guide/getting-started.html — Ajv (v8 documentation) — undated — accessed 2026-09-30 — Architecture #60.
- Simulation System Architecture — https://trac.wildfiregames.com/wiki/SimulationArchitecture — Wildfire Games, 0 A.D. Trac wiki — last modified Apr 13, 2010 — accessed 2026-09-30 — Architecture #61.
- Coding Conventions — https://trac.wildfiregames.com/wiki/Coding_Conventions — Wildfire Games, 0 A.D. Trac wiki — last modified Mar 20, 2018 — accessed 2026-09-30 — Architecture #62.
- Glossary — https://www.openra.net/book/glossary.html — OpenRA, The OpenRA Book — undated — accessed 2026-09-30 — Architecture #63.
- Everything you always wanted to know about modding — https://github.com/OpenRA/OpenRA/wiki/Everything-you-always-wanted-to-know-about-modding — OpenRA wiki — edited Jan 5, 2019 — accessed 2026-09-30 — Architecture #64.
- ECS — https://excaliburjs.com/docs/entity-component-system/ — Excalibur.js documentation — site (c) 2026 — accessed 2026-09-30 — Architecture #65.
- Scenes — https://docs.phaser.io/phaser/concepts/scenes — Phaser documentation — (c) 2026 — accessed 2026-09-30 — Architecture #66.

## Performance

- Blazing Fast Neighbor Search with Spatial Hashing — https://matthias-research.github.io/pages/tenMinutePhysics/11-hashing.pdf — Matthias Muller, Ten Minute Physics (PDF) — undated — accessed 2026-09-30 — Architecture #36.
- 2D collision detection — https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection — MDN Web Docs (Mozilla) — last modified May 4, 2026 — accessed 2026-09-30 — Architecture #37.
- SAT (Separating Axis Theorem) — https://dyn4j.org/2010/01/sat/ — William Bittle, dyn4j — 1 Jan 2010 — accessed 2026-09-30 — Architecture #38.
- Box2D: Simulation — https://box2d.org/documentation/md_simulation.html — Erin Catto (Box2D 3.1.0 documentation) — undated — accessed 2026-09-30 — Architecture #39.
- Optimizing canvas — https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas — MDN Web Docs (Mozilla) — last modified Aug 25, 2026 — accessed 2026-09-30 — Architecture #40.
- Improving HTML5 Canvas performance — https://web.dev/articles/canvas-performance — Boris Smus, web.dev — last updated 2011-08-16 — accessed 2026-09-30 — Architecture #41.
- OffscreenCanvas — https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas — MDN Web Docs (Mozilla) — last modified Oct 26, 2024 — accessed 2026-09-30 — Architecture #42.
- Tiles and tilemaps overview — https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps — MDN Web Docs (Mozilla) — last modified Sep 13, 2026 — accessed 2026-09-30 — Architecture #43.
- Window: requestAnimationFrame() method — https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame — MDN Web Docs (Mozilla) — last modified Aug 21, 2026 — accessed 2026-09-30 — Architecture #44.
- Trash talk: the Orinoco garbage collector — https://v8.dev/blog/trash-talk — Peter Marshall, V8 blog — 3 Jan 2019 — accessed 2026-09-30 — Architecture #45.
- bitECS README — https://raw.githubusercontent.com/NateTheGreatt/bitECS/master/README.md — NateTheGreatt, GitHub — undated — accessed 2026-09-30 — Architecture #46.
- Optimize JavaScript execution — https://web.dev/articles/optimize-javascript-execution — Paul Lewis, web.dev — last updated 2015-03-20 — accessed 2026-09-30 — Architecture #47.
- Is postMessage slow? — https://surma.dev/things/is-postmessage-slow/ — Surma, surma.dev — 2019-07-15 — accessed 2026-09-30 — Architecture #54.
- Transferable objects — https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects — MDN Web Docs (Mozilla) — last modified Sep 18, 2025 — accessed 2026-09-30 — Architecture #55.
- SharedArrayBuffer — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer — MDN Web Docs (Mozilla) — last modified Feb 10, 2026 — accessed 2026-09-30 — Architecture #56.

## AI, pathfinding and steering

- Flow Field Pathfinding for Tower Defense — https://www.redblobgames.com/pathfinding/tower-defense/ — Amit Patel, Red Blob Games — created 6 Feb 2014, last modified 1 May 2026 — accessed 2026-09-30 — Architecture #30.
- Introduction to the A\* Algorithm — https://www.redblobgames.com/pathfinding/a-star/introduction.html — Amit Patel, Red Blob Games — created 26 May 2014, last modified 29 Sep 2026 — accessed 2026-09-30 — Architecture #31.
- Crowd Pathfinding and Steering Using Flow Field Tiles — http://www.gameaipro.com/GameAIPro/GameAIPro_Chapter23_Crowd_Pathfinding_and_Steering_Using_Flow_Field_Tiles.pdf — Elijah Emerson, Game AI Pro, chapter 23 (CRC Press; PDF) — 2013 — accessed 2026-09-30 — Architecture #32.
- How to RTS: Basic Flow Fields — https://howtorts.github.io/2014/01/04/basic-flow-fields.html — Dave Leaver, howtorts.github.io — 4 Jan 2014 — accessed 2026-09-30 — Architecture #33.
- Steering Behaviors For Autonomous Characters — https://www.red3d.com/cwr/steer/gdc99/ (online HTML edition); index https://www.red3d.com/cwr/steer/ ; citation page https://www.red3d.com/cwr/papers/1999/gdc99steer.html — Craig Reynolds, GDC 1999 — index page dated 6 Jun 2004, citation page 4 May 2003 — accessed 2026-09-30 — Architecture #34.
- Optimal Reciprocal Collision Avoidance (ORCA) — https://gamma.cs.unc.edu/ORCA/ — Jur van den Berg, Stephen J. Guy, Jamie Snape, Ming C. Lin, Dinesh Manocha, UNC Chapel Hill — undated page; publications 2008-2011 — accessed 2026-09-30 — Architecture #35.
- Behavior Selection Algorithms: An Overview — http://www.gameaipro.com/GameAIPro/GameAIPro_Chapter04_Behavior_Selection_Algorithms.pdf — Michael Dawe, Steve Gargolinski, Luke Dicken, Troy Humphreys, Dave Mark, Game AI Pro, chapter 4 (CRC Press; PDF) — 2013 — accessed 2026-09-30 — Architecture #48.
- The Behavior Tree Starter Kit — http://www.gameaipro.com/GameAIPro/GameAIPro_Chapter06_The_Behavior_Tree_Starter_Kit.pdf — Alex J. Champandard and Philip Dunstan, Game AI Pro, chapter 6 (CRC Press; PDF) — 2013 — accessed 2026-09-30 — Architecture #49.
- Goal-Oriented Action Planning (GOAP) — http://alumni.media.mit.edu/~jorkin/goap.html — Jeff Orkin, MIT Media Lab page — undated — accessed 2026-09-30 — Architecture #50.
- Minion — https://wiki.leagueoflegends.com/en-us/Minion — League of Legends Wiki (community wiki) — undated — accessed 2026-09-30 — Architecture #51.
- Turret — https://wiki.leagueoflegends.com/en-us/Turret — League of Legends Wiki (community wiki) — undated — accessed 2026-09-30 — Architecture #52.
- Lane Creeps — https://liquipedia.net/dota2/Lane_Creeps — Liquipedia (Dota 2 wiki) — undated — accessed 2026-09-30 — Architecture #53.

## Persistence

- Storage quotas and eviction criteria — https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria — MDN Web Docs (Mozilla) — last modified 2026-01-05 — accessed 2026-09-30 — Persistence #1.
- Using IndexedDB — https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB — MDN Web Docs (Mozilla) — last modified 2026-09-11 — accessed 2026-09-30 — Persistence #2.
- StorageManager: persist() method — https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist — MDN Web Docs (Mozilla) — last modified 2024-07-26 — accessed 2026-09-30 — Persistence #3.
- StorageManager: estimate() method — https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate — MDN Web Docs (Mozilla) — last modified 2025-10-31 — accessed 2026-09-30 — Persistence #4.
- The structured clone algorithm — https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm — MDN Web Docs (Mozilla) — last modified 2025-06-29 — accessed 2026-09-30 — Persistence #5.
- Origin private file system — https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system — MDN Web Docs (Mozilla) — last modified 2025-07-14 — accessed 2026-09-30 — Persistence #6.
- Storage for the web — https://web.dev/articles/storage-for-the-web — Pete LePage, web.dev (Google) — last updated 2024-09-23 — accessed 2026-09-30 — Persistence #7.
- Full Third-Party Cookie Blocking and More — https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ — John Wilander, WebKit blog (Apple) — 2020-03-24 — accessed 2026-09-30 — Persistence #8.
- Updates to Storage Policy — https://webkit.org/blog/14403/updates-to-storage-policy/ — Sihui Liu, WebKit blog (Apple) — 2023-08-10 — accessed 2026-09-30 — Persistence #9.
- Indexed Database API 3.0 — https://w3c.github.io/IndexedDB/ — W3C Editor's Draft — 2025-08-13 — accessed 2026-09-30 — Persistence #10.
- IDBDatabase: transaction() method — https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction — MDN Web Docs (Mozilla) — last modified 2025-06-23 — accessed 2026-09-30 — Persistence #11.
- idb: IndexedDB, but with promises (README, v8) — https://github.com/jakearchibald/idb — Jake Archibald, GitHub — undated — accessed 2026-09-30 — Persistence #12.
- Window: localStorage property — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage — MDN Web Docs (Mozilla) — last modified 2026-07-28 — accessed 2026-09-30 — Persistence #13.
- Cache — https://developer.mozilla.org/en-US/docs/Web/API/Cache — MDN Web Docs (Mozilla) — last modified 2026-09-11 — accessed 2026-09-30 — Persistence #14.
- Window: createImageBitmap() method — https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap — MDN Web Docs (Mozilla) — last modified 2025-06-23 — accessed 2026-09-30 — Persistence #15.
- BaseAudioContext: decodeAudioData() method — https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData — MDN Web Docs (Mozilla) — last modified 2024-07-29 — accessed 2026-09-30 — Persistence #16.
- Repository — https://martinfowler.com/eaaCatalog/repository.html — Edward Hieatt and Rob Mee, Patterns of Enterprise Application Architecture catalog, martinfowler.com — 2003-03-05 — accessed 2026-09-30 — Persistence #17.
- Unit of Work — https://martinfowler.com/eaaCatalog/unitOfWork.html — Martin Fowler, PoEAA catalog, martinfowler.com — 2003-03-05 — accessed 2026-09-30 — Persistence #18.
- Data Transfer Object — https://martinfowler.com/eaaCatalog/dataTransferObject.html — Martin Fowler, PoEAA catalog, martinfowler.com — 2003-03-05 (note added 2013-08-11) — accessed 2026-09-30 — Persistence #19.

## Input

- KeyboardEvent: code property — https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code — MDN Web Docs (Mozilla) — last modified 2025-10-13 — accessed 2026-09-30 — Persistence #23.
- KeyboardEvent.code — https://caniuse.com/keyboardevent-code — Can I use (Alexis Deveria) — usage data August 2026 — accessed 2026-09-30 — Persistence #24.
- Using the Gamepad API — https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API — MDN Web Docs (Mozilla) — last modified 2026-04-13 — accessed 2026-09-30 — Persistence #25.
- Gamepad — https://w3c.github.io/gamepad/ — W3C Editor's Draft (living document) — undated — accessed 2026-09-30 — Persistence #26.
- MouseEvent: button property — https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button — MDN Web Docs (Mozilla) — last modified 2026-02-13 — accessed 2026-09-30 — Persistence #27.
- Element: auxclick event — https://developer.mozilla.org/en-US/docs/Web/API/Element/auxclick_event — MDN Web Docs (Mozilla) — last modified 2026-08-15 — accessed 2026-09-30 — Persistence #28.
- Element: contextmenu event — https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event — MDN Web Docs (Mozilla) — last modified 2026-07-28 — accessed 2026-09-30 — Persistence #29.
- Pointer events — https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events — MDN Web Docs (Mozilla) — last modified 2026-08-28 — accessed 2026-09-30 — Persistence #30.
- KeyboardEvent: repeat property — https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat — MDN Web Docs (Mozilla) — last modified 2023-04-07 (Baseline 2025) — accessed 2026-09-30 — Persistence #31.
- Keyboard: lock() method — https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/lock — MDN Web Docs (Mozilla) — last modified 2026-08-22 — accessed 2026-09-30 — Persistence #32.
- Window: blur event — https://developer.mozilla.org/en-US/docs/Web/API/Window/blur_event — MDN Web Docs (Mozilla) — last modified 2026-08-21 — accessed 2026-09-30 — Persistence #33.
- Document: visibilitychange event — https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event — MDN Web Docs (Mozilla) — last modified 2026-02-20 — accessed 2026-09-30 — Persistence #34.
- Allow controls to be remapped / reconfigured — https://gameaccessibilityguidelines.com/allow-controls-to-be-remapped-reconfigured/ — Game Accessibility Guidelines — undated — accessed 2026-09-30 — Persistence #35.
- Input Prompts (v1.5a, CC0) — https://kenney.nl/assets/input-prompts — Kenney — first released 2024 — accessed 2026-09-30 — Persistence #36.

## Diagnostics

- Performance: measure() method — https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure — MDN Web Docs (Mozilla) — last modified 2026-09-02 — accessed 2026-09-30 — Persistence #37.
- Long animation frame timing — https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Long_animation_frame_timing — MDN Web Docs (Mozilla) — last modified 2026-03-27 — accessed 2026-09-30 — Persistence #38.
- Performance: measureUserAgentSpecificMemory() method — https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory — MDN Web Docs (Mozilla) — last modified 2025-11-30 — accessed 2026-09-30 — Persistence #39.
- Use of Assertions — https://blog.regehr.org/archives/1091 — John Regehr, Embedded in Academia — 2014-02-02 — accessed 2026-09-30 — Persistence #40.
- Design by contract — https://en.wikipedia.org/wiki/Design_by_contract — Wikipedia — undated (living article) — accessed 2026-09-30 — Persistence #41.
- Logs Data Model — https://opentelemetry.io/docs/specs/otel/logs/data-model/ — OpenTelemetry Specification 1.61.0 (status: Stable) — undated (versioned specification) — accessed 2026-09-30 — Persistence #42.

## Testing

- Determinism in League of Legends: Introduction — https://technology.riotgames.com/news/determinism-league-legends-introduction (Riot Games Technology Blog) and https://www.riotgames.com/en/news/determinism-league-legends-introduction (Riot Games news) — Rick Hoskinson, Riot Games — 2017-06-20 — accessed 2026-09-30 (Persistence) and 2026-10-10 (Netcode) — Persistence #20 (Technology Blog URL); Netcode #19 (news URL).
- Determinism in League of Legends: Fixing Divergences — https://technology.riotgames.com/news/determinism-league-legends-fixing-divergences — Rick Hoskinson, Riot Games Technology Blog — 2018-05-01 — accessed 2026-09-30 — Persistence #21.
- What is Property-Based Testing? — https://fast-check.dev/docs/introduction/what-is-property-based-testing/ — Nicolas Dubien, fast-check documentation — last updated 2026-02-07 — accessed 2026-09-30 — Persistence #43.
- Snapshot — https://vitest.dev/guide/snapshot — Vitest guide (v5.0.2), VoidZero and Vitest contributors — undated (versioned docs) — accessed 2026-09-30 — Persistence #44.
- testTimeout — https://vitest.dev/config/testtimeout — Vitest config reference (v5.0.2), VoidZero and Vitest contributors — undated (versioned docs) — accessed 2026-09-30 — Persistence #45.
- Vitest coverage config (thresholds, autoUpdate, perFile) — https://vitest.dev/config/coverage — Vitest (v5.0.2 docs) — undated (versioned docs) — accessed 2026-09-30 — Harness #45.
- Fowler-Noll-Vo hash function — https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function — Wikipedia — undated (living article) — accessed 2026-09-30 — Persistence #46.

## Multiplayer netcode

- ECMA-262 §21.3.2 "Function Properties of the Math Object" (note; `Math.hypot`, `sin`, `cos`, `atan2`, `exp`, `pow`, `sqrt`) — https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-function-properties-of-the-math-object — Ecma TC39, ECMA-262 (ECMAScript 2027 draft) — date not stated — accessed 2026-10-09 — Netcode #1.
- ECMA-262 §6.1.6.1 "The Number Type" (`Number::exponentiate`, `Number::add`, `Number::multiply`, `Number::toString` notes) — https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-exponentiate — Ecma TC39, ECMA-262 (ECMAScript 2027 draft) — date not stated — accessed 2026-10-09 — Netcode #2.
- Bug 531915 "Floating point differences between platforms" (fixed in Firefox 93) — https://bugzilla.mozilla.org/show_bug.cgi?id=531915 — Mozilla Bugzilla — date not stated — accessed 2026-10-10 — Netcode #3.
- Bug 1823880 "Make fdlibm (sin/cos/tan) fingerprinting resistance precise" (fixed in Firefox 113) — https://bugzilla.mozilla.org/show_bug.cgi?id=1823880 — Mozilla Bugzilla — date not stated — accessed 2026-10-09 — Netcode #4.
- Simulation diverges between JS engines: Math.sin/Math.cos in the per-step integrator (perplexdotgg/bounce issue #8) — https://codeberg.org/perplexdotgg/bounce/issues/8 — digitalbreed, Codeberg — 2026-08-03 — accessed 2026-10-09 — Netcode #5.
- Netcode Architectures Part 1: Lockstep — https://www.snapnet.dev/blog/netcode-architectures-part-1-lockstep/ — Jay Mattis, SnapNet blog — 2023-03-28 — accessed 2026-10-09 — Netcode #6.
- Netcode Architectures Part 2: Rollback — https://www.snapnet.dev/blog/netcode-architectures-part-2-rollback/ — Jay Mattis, SnapNet blog — 2023-04-18 — accessed 2026-10-09 — Netcode #7.
- Netcode Architectures Part 3: Snapshot Interpolation — https://www.snapnet.dev/blog/netcode-architectures-part-3-snapshot-interpolation/ — Jay Mattis, SnapNet blog — 2023-06-07 — accessed 2026-10-09 — Netcode #8.
- Netcode Architectures Part 4: Tribes — https://www.snapnet.dev/blog/netcode-architectures-part-4-tribes/ — Jay Mattis, SnapNet blog — 2023-09-27 — accessed 2026-10-09 — Netcode #9.
- What Every Programmer Needs To Know About Game Networking — https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking/ — Glenn Fiedler, Gaffer On Games — 2010-02-24 — accessed 2026-10-10 — Netcode #10.
- Snapshot Compression — https://gafferongames.com/post/snapshot_compression/ — Glenn Fiedler, Gaffer On Games — 2015-01-04 per Netcode; Scalability lists it as undated — accessed 2026-10-09 (Netcode) and 2026-10-09 or 2026-10-10 (Scalability) — Netcode #12; Scalability #23.
- Client-Side Prediction and Server Reconciliation (Fast-Paced Multiplayer part II) — https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html — Gabriel Gambetta — undated — accessed 2026-10-09 — Netcode #13.
- Entity Interpolation (Fast-Paced Multiplayer part III) — https://www.gabrielgambetta.com/entity-interpolation.html — Gabriel Gambetta — undated — accessed 2026-10-09 — Netcode #14.
- Lag Compensation (Fast-Paced Multiplayer part IV) — https://www.gabrielgambetta.com/lag-compensation.html — Gabriel Gambetta — undated — accessed 2026-10-10 — Netcode #15.
- 1500 Archers on a 28.8: Network Programming in Age of Empires and Beyond — https://www.gamedeveloper.com/programming/1500-archers-on-a-28-8-network-programming-in-age-of-empires-and-beyond — Paul Bettner and Mark Terrano, Game Developer — 2001-03-22 — accessed 2026-10-09 — Netcode #16.
- Mitigating information exposure to cheaters in real-time strategy games — https://research.ibm.com/publications/mitigating-information-exposure-to-cheaters-in-real-time-strategy-games — Chris Chambers, Wu-chang Feng, Wu-chi Feng, Debanjan Saha, NOSSDAV 2005 — 2005 — accessed 2026-10-10 — Netcode #17.
- Demolishing Wallhacks with VALORANT's Fog of War — https://www.riotgames.com/en/news/demolishing-wallhacks-valorants-fog-war — Paul Chamberlain, Riot Games — 2020-04-14 — accessed 2026-10-09 — Netcode #18.
- GGPO (README) — https://github.com/pond3r/ggpo — pond3r, GitHub (MIT) — date not stated; no releases, last push 2024-06-26 per Netcode #35 — accessed 2026-10-09 — Netcode #20.
- NetplayJS (README) — https://github.com/rameshvarun/netplayjs — Varun Ramesh, GitHub (ISC) — date not stated — accessed 2026-10-09 — Netcode #30.
- Window: setTimeout() method, section "Timeouts in inactive tabs" — https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout — MDN Web Docs (Mozilla) — last modified 2026-09-03 — accessed 2026-10-10 — Netcode #32.
- Fast-Paced Multiplayer (Part I): Client-Server Game Architecture — https://www.gabrielgambetta.com/fpm1.html — Gabriel Gambetta, gabrielgambetta.com — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #1.
- State Synchronization — https://gafferongames.com/post/state_synchronization/ — Glenn Fiedler, Gaffer On Games — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #17.

## Transports and server libraries

- WebTransport API — https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API — MDN Web Docs (Mozilla) — last modified 2026-09-25 — accessed 2026-10-09 — Netcode #21.
- WebKit Features for Safari 26.4 — https://webkit.org/blog/17862/webkit-features-for-safari-26-4/ — Jen Simmons, WebKit blog (Apple) — 2026-03-24 — accessed 2026-10-09 — Netcode #22.
- RTCPeerConnection: createDataChannel() method — https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel — MDN Web Docs (Mozilla) — last modified 2026-09-14 — accessed 2026-10-09 — Netcode #23.
- The WebSocket API (WebSockets) — https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API — MDN Web Docs (Mozilla) — last modified 2026-09-12 — accessed 2026-10-10 — Netcode #24.
- Network Traversal Service (STUN/TURN) — https://twilio.com/en-us/stun-turn — Twilio — undated (© 2026) — accessed 2026-10-09 — Netcode #25.
- geckos.io (README) — https://github.com/geckosio/geckos.io — Yannick Deubel, GitHub (BSD-3-Clause) — date not stated — accessed 2026-10-09 — Netcode #26.
- colyseus (README) — https://github.com/colyseus/colyseus — Colyseus, GitHub (MIT; "Authoritative Multiplayer Framework for Node.js") — date not stated in Netcode; undated in Scalability — accessed 2026-10-09 (Netcode) and 2026-10-09 or 2026-10-10 (Scalability) — Netcode #27; Scalability #50.
- Colyseus 0.18 is here — https://colyseus.io/blog/colyseus-018-is-here/ — Colyseus blog — 2026-08-20 — accessed 2026-10-09 — Netcode #28.
- Room — https://docs.colyseus.io/room — Colyseus documentation (0.18) — date not stated — accessed 2026-10-09 — Netcode #29.
- Global objects (`WebSocket`) — https://nodejs.org/api/globals.html — Node.js v26.11.1 documentation — date not stated — accessed 2026-10-10 — Netcode #31.
- Introduction — https://socket.io/docs/v4/ — Socket.IO (v4 documentation) — date not stated — accessed 2026-10-10 — Netcode #34.
- Package metadata for the server libraries — GitHub REST API (`https://api.github.com/repos/<owner>/<repo>` and `/releases/latest`) for colyseus/colyseus, websockets/ws, uNetworking/uWebSockets.js, geckosio/geckos.io, rameshvarun/netplayjs, murat-dogan/node-datachannel, shinyoshiaki/werift-webrtc, fails-components/webtransport, socketio/socket.io and pond3r/ggpo; npm registry (`https://registry.npmjs.org/<package>`) for the npm packages (`uWebSockets.js` returned "not found") — GitHub and npm — live API data — queried 2026-10-09 — Netcode #35.
- `ws` repository README (MIT licence) — https://github.com/websockets/ws — websockets, GitHub — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #14.
- WebSocket client (Learn) — https://nodejs.org/en/learn/getting-started/websocket — OpenJS Foundation, nodejs.org — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #15.
- `ws` API documentation (`doc/ws.md`) — https://github.com/websockets/ws/blob/master/doc/ws.md — websockets, GitHub — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #25.
- `uWebSockets.js` repository README — https://github.com/uNetworking/uWebSockets.js — uNetworking, GitHub — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #47.
- WebSockets — https://bun.com/docs/runtime/http/websockets — Oven, Bun documentation — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #48.
- Deno.upgradeWebSocket — https://docs.deno.com/api/deno/~/Deno.upgradeWebSocket — Deno, Deno API documentation — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #49.

## Server runtime, scaling and hosting

- Worker threads — https://nodejs.org/api/worker_threads.html — OpenJS Foundation, Node.js v26.11.1 documentation — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #2.
- Scalability — https://docs.colyseus.io/scalability — Colyseus 0.18 documentation — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #3.
- Modules: TypeScript — https://nodejs.org/docs/latest-v24.x/api/typescript.html — OpenJS Foundation, Node.js v24.21.0 documentation — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #12.
- Server-Side Rendering — https://vite.dev/guide/ssr — Vite (v8.3.4 documentation) — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #13.
- Performance measurement APIs (`monitorEventLoopDelay`) — https://nodejs.org/docs/latest-v24.x/api/perf_hooks.html — OpenJS Foundation, Node.js v24.21.0 documentation — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #16.
- Using WebSockets (Cloud Run) — https://docs.cloud.google.com/run/docs/triggering/websockets — Google Cloud — last updated 2026-10-07 — accessed 2026-10-09 or 2026-10-10 — Scalability #18.
- Dynamic request routing (`fly-replay`) — https://fly.io/docs/networking/dynamic-request-routing/ — Fly.io — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #19.
- Graceful Shutdown — https://docs.colyseus.io/server/graceful-shutdown — Colyseus documentation — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #20.
- App configuration (fly.toml): `kill_signal` and `kill_timeout` — https://fly.io/docs/reference/configuration/ — Fly.io — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #21.
- GameServerAllocation Specification — https://agones.dev/site/docs/reference/gameserverallocation/ — Agones, agones.dev — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #22.
- Always Free Resources — https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm — Oracle, OCI documentation — undated (copyright 2026) — accessed 2026-10-09 or 2026-10-10 — Scalability #34.
- Report on the Oracle Cloud Always Free Ampere A1 reduction effective 2026-06-15 — https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/ — InfoQ — 2026-07 (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #35.
- FAQ — https://docs.colyseus.io/faq — Colyseus 0.18 documentation — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #36.
- k6/websockets — https://grafana.com/docs/k6/latest/javascript-api/k6-websockets/ — Grafana Labs, k6 documentation (latest) — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #37.
- WebSocket engine reference — https://www.artillery.io/docs/reference/engines/websocket — Artillery, artillery.io — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #38.
- Node.js v24.12.0 (LTS) release notes — https://nodejs.org/blog/release/v24.12.0 — OpenJS Foundation — 2025-12-10 — accessed 2026-10-09 or 2026-10-10 — Scalability #39.
- Azure for Students — https://azure.microsoft.com/en-us/free/students — Microsoft, azure.microsoft.com — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #42.
- Deploy for Free — https://render.com/docs/free — Render docs — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #43.
- Free web services now remain active while receiving WebSocket messages — https://render.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages — Render changelog — 2026-02-24 — accessed 2026-10-09 or 2026-10-10 — Scalability #44.
- Resource pricing — https://docs.fly.io/about/pricing — Fly.io docs — undated (mentions 2026 snapshot charges) — accessed 2026-10-09 or 2026-10-10 — Scalability #45.
- Pricing (Durable Objects) — https://developers.cloudflare.com/durable-objects/platform/pricing/ — Cloudflare docs — last updated 2026-09-30 — accessed 2026-10-09 or 2026-10-10 — Scalability #46.

## Matchmaking and rating

- The Glicko system (web page; states that Glicko and Glicko-2 are public domain) — http://www.glicko.net/glicko.html — Mark Glickman — date not stated for the page; glicko2.pdf revised 2022-03-22 — accessed 2026-10-10 — Netcode #33.
- The Glicko system (paper, PDF) — http://www.glicko.net/glicko/glicko.pdf — Mark E. Glickman, glicko.net — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #4.
- Example of the Glicko-2 system — http://www.glicko.net/glicko/glicko2.pdf — Mark E. Glickman, glicko.net — 2022-03-22 — accessed 2026-10-09 or 2026-10-10 — Scalability #5.
- OpenSkill: A faster asymmetric multi-team, multiplayer rating system — https://joss.theoj.org/papers/10.21105/joss.05901 — Vivek Joshy, Journal of Open Source Software 9(93) 5901 — 2024-01-09 (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #6.
- Allow requirements to relax over time — https://docs.aws.amazon.com/gameliftservers/latest/flexmatchguide/match-rulesets-components-expansion.html — Amazon Web Services, Amazon GameLift Servers FlexMatch developer guide — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #7.
- instant-glicko-2 crate documentation — https://docs.rs/instant-glicko-2 — docs.rs (no author stated) — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #26.
- Rating systems — https://lichess.org/page/rating-systems — Lichess, lichess.org — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #27.
- TrueSkill(TM): A Bayesian Skill Rating System — https://www.microsoft.com/en-us/research/publication/trueskilltm-a-bayesian-skill-rating-system/ — Ralf Herbrich, Tom Minka, Thore Graepel, Advances in Neural Information Processing Systems 20, MIT Press — 2007-01 — accessed 2026-10-09 or 2026-10-10 — Scalability #28.
- US8538910B2 - Determining relative skills of players — https://patents.google.com/patent/US8538910B2/en — Google Patents (assignee Microsoft Technology Licensing, LLC) — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #29.
- TrueSkill 2: An improved Bayesian skill rating system — https://www.microsoft.com/en-us/research/publication/trueskill-2-improved-bayesian-skill-rating-system/ — Tom Minka, Ryan Cleven, Yordan Zaykov, Microsoft Research MSR-TR-2018-8 — 2018 (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #30.
- `openskill` (openskill.js, MIT) — https://npmjs.com/package/openskill — Philihp Busby et al., npm — undated (v4.1.x) (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #31.

## Identity, data and security

- Session Management Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html — OWASP Cheat Sheet Series — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #8.
- Password Storage Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html — OWASP Cheat Sheet Series — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #9.
- SQLite — https://nodejs.org/docs/latest-v24.x/api/sqlite.html — OpenJS Foundation, Node.js v24.21.0 documentation — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #10.
- Appropriate Uses For SQLite — https://sqlite.org/whentouse.html — SQLite, sqlite.org — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #11.
- WebSocket Security Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html — OWASP Cheat Sheet Series — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #24.
- Anonymous Sign-Ins — https://supabase.com/docs/guides/auth/auth-anonymous — Supabase docs — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #32.
- `lucia` repository README (deprecation notice) — https://github.com/lucia-auth/lucia — Lucia, GitHub — undated (read through search excerpts) — accessed 2026-10-09 or 2026-10-10 — Scalability #33.
- Pricing — https://supabase.com/pricing — Supabase, supabase.com — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #40.
- Pricing — https://neon.com/pricing — Neon, neon.com — undated — accessed 2026-10-09 or 2026-10-10 — Scalability #41.

## Related

- [`README.md`](README.md): the reports, the decisions they informed and how to add research
- [`agentic-harness-research.md`](agentic-harness-research.md), [`game-architecture-and-performance-research.md`](game-architecture-and-performance-research.md), [`persistence-input-diagnostics-research.md`](persistence-input-diagnostics-research.md), [`multiplayer-and-netcode-research.md`](multiplayer-and-netcode-research.md), [`server-scalability-and-matchmaking-research.md`](server-scalability-and-matchmaking-research.md): the reports whose lists are merged here
- [`../requirements/05-engineering-standards.md`](../requirements/05-engineering-standards.md) and [`../architecture/README.md`](../architecture/README.md): the docs that cite these sources
