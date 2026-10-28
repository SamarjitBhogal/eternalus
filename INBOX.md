# INBOX — product owner ⇄ agent queue

**Protocol.** Sam (product owner + lead architect) writes requests, feedback and decisions in
this file, then says **"file updated"** in chat. The agent reads this file and treats the open
items as its prompt, in order. An item may be removed **only** after the agent has implemented
it and confirmed it is done; it then moves to _Done_ with the date and the commit/PR. Items the
agent cannot finish stay open with a note. Every session starts by reading this file
(`scripts/hooks/session-start.mjs` reports the number of open items).

Format: one checkbox per item. Put decisions under "Decisions", tasks under "Requests",
review comments under "Feedback". Answered decisions are recorded in
`docs/reference/game-design/13-owner-decisions-log.md` and then moved to _Done_ here.

## Decisions needed from Sam

Each item below lists only what your 2026-10-09 answer left open, with your answer kept under it.
Reply inline (`Decision: …`).

- [ ] **DEC-42 — still open after your answer** (recorded as DEC-42 in
      `docs/reference/game-design/13-owner-decisions-log.md`, 2026-10-16; questions from PR
      #35). (1) Can a stunned unit still act while its aim wobbles, or does stun keep "cannot
      move, attack, cast or interact"? (2) Do the per-source stuns in `balancing.md` (0.5–1 s)
      stand, with 2 s only the default? (3) How large is the wobble ("slightly")? (4) Does
      blind's white vignette replace more-abilities §7's −70% vision radius, or come on top of
      it, and does its 2–3 s fade start when blind lands or when it ends?
  - Your answer (chat, 2026-10-16): "2 seconds. blind makes aim slightly wobbly (like stun), but
    also causes the screen to have a heavy white vignette that dissipates over 2-3 seconds. yes,
    aimed projectiles miss too"; picks: "Stun default", "Wobble causes misses", "Yes, stun
    wobbles too".
- [ ] **DEC-36 / DEC-37 — accept ADR 0016 and answer the plan §9 questions.** The course
      instructor's two new requirements, Duel multiplayer (DEC-36) and a server for hundreds or
      thousands of concurrent players (DEC-37), are planned now; must be implemented by the end of
      Sprint 3 (2026-11-13). The proposed design is
      `docs/decisions/0016-multiplayer-server-authoritative-duel.md` (draft): accept, change or
      reject it. The consolidated questions about the Duel mode and the server are in
      `docs/plan/multiplayer-and-scalability-plan.md` §9; answer them there or inline here.
- [ ] **DEC-11 — still open after your answer** (the approvals are recorded as DEC-11 in
      `docs/reference/game-design/13-owner-decisions-log.md`, 2026-10-10; your chat clarifications
      of 2026-10-10 answered the former (1) and (2), see Done). (3) Your Roar row says Legends only
      get the slow — does that hold in Duels too, and what does `feared` do to bots? Does
      `control-immune` cover fear? The same row cites `mechanics-ideas.md` for "Fear is bot-only in
      the MVP", but that file has no such text: what is the source? (4) Costs, cooldowns and
      magnitudes for the newly approved abilities, or may agents put `TUNE` placeholders in
      content?
  -     Hamstring ability approved for Warrior class. Fan of Sorrows also approved. Eclipse alternate ultimate approved for MVP
    - Shield wall, Sunder, and Colossus Roar approved for Sentinel class. Avalanche approved as alternate ultimate for MVP
    - Sanctuary and Aether Lance approved for Magus class (Enemy Sentinel's Sunder should shatter Sanctuary). Last Rites alternate ultimate approved for MVP.
- [ ] **DEC-11 — architecture approvals (impact review AB-3…AB-5).** The approved abilities need
      edits to architecture 05 that wait for your approval: §8, add `feared` (Colossus Roar) and
      `insanity` (DEC-12) to the status ids; §17, move `summon` (Shield Wall) from MVP-if-time to
      MVP and `reveal` (Aether Lance) from post-MVP to MVP, add the continuous `dash` that
      Avalanche needs, make combos MVP for "Sunder shatters Sanctuary", and list the class pools in
      its kit row (it still says "third abilities and ultimate picks: INBOX"). Approve, or say
      which to change; 05 stays as it is until then.
- [ ] **DEC-12 — volatile crystals, still open after your answer** (the timers and the volatile
      rule are recorded as DEC-12, 2026-10-10). (1) Does "once the centre boss spawns" mean the
      moment the boss is summoned or the mid-game mark? If the GreaterBoss (MVP-if-time) is cut,
      do the crystals ever turn volatile? (2) What does `insanity` do? Its name is yours, and its
      description and a placeholder icon may be added now, as you said. (3) The shockwave's radius
      and damage and the debuff's duration (or `TUNE` placeholders); does the shockwave hit every
      team; does a destroyed camp stay gone for the rest of the match? (4) How much health does a
      volatile crystal have, and who can break it (either team? damage only?) (Corner camps are
      first in the cut order, so this only matters if time allows.)
  -     Approved with this caveat: Onc the centre boss spawns, the outer camp's crystals become "volatile" and are now breakable but when they die, they release a shockwave destroying the camp and dealing massive AOE damage and temporary insanity debuff (TBD on what it does but the effect description/icon can be added with no actual effects applied)
- [ ] **DEC-13 — score cap, still open after your answer** (30-minute planned match recorded as
      DEC-13, 2026-10-10; the quarter mark and mid-game scale with it). Your "Accept after
      scaling" scales the proposal's optional score cap too: 2700 s for a 1200 s match becomes
      **4050 s** for 30 minutes (2.25 × the planned match). Confirm 4050 s, or give another value.
      The balance anchors tied to the old length (boss levels at the two marks, the match-length
      metrics in `balancing.md`, the soak length) also need your numbers.
  -     Accept after scaling to planned match time = 30 mins
- [ ] **Aether (MP) pool sizes per class.** The game doc gives no aether numbers. Branch
      `feat/legend-aether` adds the `Aether` component (MP) to every Legend, with `baseAether` taken
      from `suggestions/balancing.md` (level 1: Warrior 100, Sentinel 80, Magus 140; +10 per level,
      `TUNE`). Confirm the pool sizes or give your own. (Regen rate is a Phase 4 concern, not set
      yet.) The same branch adds Legend progression with balancing.md's other `Recommendation:`
      values, also for you to confirm: level cap 10, `xpToNext = 100 + 50·(L−1)`, +8% base health
      and +10 aether per level, Legend kill 150 + 25 × victim level, minion kill 20 / 45 / 120.
  - Update after your PR #31 review (O1–O8): cap 50 (O6). **Income estimate to check:**
    balancing.md says its XP sources take an active Legend to 2,700 XP in 18–22 minutes, about
    135 XP/min (minions about 110 XP/min, the rest kills and objectives). Keeping that income and
    balancing.md's curve shape (growth = half the first step), the cap-50 curve is
    `xpToNext(L) = 4 + 2·(L − 1)`, 2,548 XP to level 50, reached around minute 19. Kills are
    re-priced on the same scale: a Legend kill is 150 + 5 × victim level (a level-L victim is worth
    what a level-L/5 one was on the cap-10 curve; 400 XP at level 50). Mob XP is each mob's
    `xpValue` (light minion 20, training dummy 0, O8). If your income figure differs, the curve
    scales linearly: say the XP/min and I resize it. Still yours to sign off: `level-matches-xp`
    runs every tick, not heavy (05 §16), because rules 2–4 read this tick's `xp-gained` events.
    Also on the cap-10 scale: balancing.md's bosses' "expected Legend level" (4 and 7) need
    rescaling to cap 50 (×5 would give 20 and 35); say if you want that.

- [ ] **DEC-15 — camp placement, still open after your answer** (the rule is recorded as DEC-15,
      2026-10-10). (1) Does the random, parity-checked placement also apply to the corner camps?
      (2) Is parity per side only, or also per corridor? Only counts are matched, so one side's
      camps may sit nearer its lanes or Stronghold than the other's: acceptable? (3) The rule
      exempts camps from ADR 0009's mirror invariant, so it needs your sign-off on the amending
      ADR 0017 (next item) before the generator changes. (4) From ADR 0017: which classes does a
      corridor get when it holds other than three camps?
  -     Accepted " keep depth-based weights but define the classes by position in the corridor" where the vertical line down the centre of the map defines the division. RNG determines the location of the camps on each side so both sides are different, but they must equate in terms of overall difficulty (1 light on left means 1 light on right; not necessarily in mirrored locations but the same amount of weighted camps on left team and right team's sides)
- [ ] **DEC-15 — accept ADR 0017.** `docs/decisions/0017-balanced-asymmetric-camp-placement.md`
      (draft) amends ADR 0009 for forest camps only: the seeded RNG places them per side with
      equal counts per weight class, and everything else stays mirrored. Accept, change or reject
      it; the generator does not change until you accept it. Its open questions are DEC-15 (1),
      (2) and (4) above.
- [ ] **Session D (DEC-34) — the text of the delegated edits.** You delegated both items to the
      cleaner long-term design (recorded as DEC-34). The impact review proposes the text in
      `docs/reviews/2026-10-10-new-requirements-impact.md` §5.4: SD-1, option (a), no
      `useAppDispatch` and the UI emits intents (edits architecture 13 §5 and
      `apps/client/AGENTS.md`); SD-2, the 13 §2 `character-select` row records the class choice and
      starts the countdown while `menu` keeps building `MatchSetup`. Approve that text, or confirm
      that agents may apply it as delegated.
  -     Accept recommended option if it is cleaner long-term. For D, set to whichever is cleaner in the long-term.
  - On `feat/hud-and-character-select`, SD-2's text for the 13 §2 `menu` and `character-select`
    rows is rows T-10 and T-13 of HC-T1, not applied until you approve it. SD-1 is not touched.
- [ ] **Minion system (PR #33 review) — two decisions still open.** (1) **The worst lane
      (MS-9):** doc 18 §3.3 now scores your game doc's terms (structure damage not dealt,
      structures lost, pushed back), as one `LaneAssessment` shared by the heavy horde and the
      corner-camp reward wave, with a worked example. Sign off the terms, the weights and the tie-break (ties go to
      the middle lane, so the first heavy horde goes down it), or name others. (2) **Horde size and cadence (your M7):** size from (a) `hordeSizes` in config only,
      (b) each spawner's wave table only, or (c) a horde definition in content; cadence per
      spawner or one interval for all. Until you answer, M1 reads `hordeSizes` and the spawner
      cadences (plan §2 stand-in). Details: doc 18 §10.
- [ ] **PROTO-01 — still open after your answer** (deletion recorded as DEC-35, 2026-10-10,
      amending DEC-33). (1) Is the escort deleted before real hordes exist (no minions on the map
      for a while) or together with them (Phase 2.7 `SpawnSystem` plus Phase 3.1 hordes)? Which
      sprint is "this sprint": S1, which ends 2026-10-16, or S2? (2) Your bot-AI system: may its
      file live under `systems/`, or must it stay in `ai/`? (Today it is in `ai/`, because core
      `AGENTS.md` forbids `systems/` importing `ai/`, which 02 §2 allows; audit A23-18.) (3) Add
      the `PROTOTYPE(<id>) TEMPORARY` marker convention to `AGENTS.md` so every future prototype
      uses it (audit A23-17)? **Finding the code:** every prototype piece carries `PROTOTYPE(PROTO-01) TEMPORARY` and
      what replaces it; `git grep -n 'PROTOTYPE(PROTO-01)'` lists them. Agents: do not build on or
      extend marked code. The two departures you were asked to confirm, speed 5.4 m/s and mass
      0.5, were answered by DEC-33 (demo-only; on `chore/sprint-1-audit`). **Agent note
      (2026-10-17):** (1) is answered by your reply below and DEC-35: the escort goes together
      with the real hordes, in minion plan phase M1, whose done-when is "no `PROTOTYPE(PROTO-01)`
      marker remains in code". (2) and (3) are still open; (2) decides doc 18 §2's folder list.
  -     Escorts to be deleted this sprint in favour of real hoards. The ai system mentioned here is unrelated to CLAUDE.md and AGENTS.md, but is instead meant as a stand-in for the Bot AI that will power the actions of the bots, neutral camps, bosses, and mobs
- [ ] **HC-F1 — Character select: two steps in one phase (default applied; veto or change;
      `feat/hud-and-character-select`).** The class step (Figma 62:125) and then the Legend step
      (58:271) are built inside the one `character-select` phase, with no new session phase. The
      step follows the session's selection: no class chosen → class step; a class chosen →
      Legend step. On both steps the cards form a radio group: clicking a card or moving to it
      with the arrow keys picks it (the usual radio-group keyboard pattern), and hover and focus
      preview a card. On the class step nothing is sent until **Select Class**, which stays
      disabled until a class is picked; there is no default pick (the pre-selected Warrior is
      removed). On the Legend step **LOCK IN** confirms and needs a Legend unless the class has
      none available; **Back** clears the class, returns to the class step and puts the focus
      back on the picked class card. One 60 s countdown spans both steps and the timeout rule is
      unchanged: a class chosen → pre-launch, none → home ("select-timeout"). Open: (1) if the
      countdown ends after a class but before a Legend, does the match go ahead with no Legend
      (default), with a default Legend, or cancel? (2) Which Legend do bots get (default: none)?
      (3) Does LOCK IN end the countdown early (today's behaviour; audit AS-10)?
- [ ] **HC-F2 — Harbinger is a locked card, with the content id `flying` (default applied, with
      one correction).** The fourth card shows "Harbinger" (DEC-48) as locked: `aria-disabled`, a
      lock glyph and the word "Locked" (never colour alone), no hover emphasis, refused by the
      session and never given to a bot (tested). The workflow's default id was `harbinger`, but
      architecture 04 §2 and §12, 17 R1 and plan sprint 4.1 already reserve **`flying`** for this
      class, so the card uses `flying`. Under ADR 0018 point 5 an id can still change until a save
      or a release stores it, and none does: a locked card never reaches a save, a loadout or a
      replay. A change to `harbinger` is a content refactor that the checks catch if it is
      incomplete, plus one word in 04, 17 R1 and plan 4.1. Confirm `flying`, or say `harbinger`. The
      Figma draws no locked look: approve the treatment (register CD-05) or describe yours.
- [ ] **HC-F3 — Ally tiles on the selection screens, your team and the backdrop (default applied;
      veto).** The right-hand column (62:201, 58:342) shows your team from the match setup (team
      size from config): your own tile highlighted as drawn (a cream border and the sigil of your
      pick); an ally bot that has a Legend shows the Legend's portrait with that Legend's accent
      border; other bots show their class sigil. "N Allies" on a class card counts the allied
      bots on that class now, you excluded ("1 Ally" in the singular). Your team (Light or Dark)
      is shown by a small badge at the top right (register CD-06). Open: (1) what do the other
      border colours mean (#990000 on Ally 2, #8FD694 on Ally 4, cream on Ally 1), and should
      every Legend tile cast the shadow? (2) Is "N Allies" a live count (default) or a recommended
      composition (OQ-70)? (3) Reference 14 §2 makes the background and the allied pedestals
      team-specific, but no Dark or pedestal art exists, so both teams see the one Figma backdrop
      and no pedestals are drawn until that art exists (register CD-24); the backdrop sets stay
      keyed by team in content, so the art drops in as data. Confirm, or say what to show.
- [ ] **HC-F4 — Your pick reaches the match (default applied).** The class, team and seed of the
      match setup now flow into the match (`PlayerChoice`, `setup.seed`, `setup.playerTeam`),
      replacing the fixed seed 1 Light Warrior. Your Legend is recorded in the setup but changes no
      gameplay yet (DEC-49). Nothing to answer unless you want otherwise.
- [ ] **HC-F5 — HUD colours and key glyphs (default applied; veto).** (1) The HUD uses absolute
      team colours (Light gold, white and blue; Dark red, black and purple: 10-art-and-lore,
      architecture 07 §12 and 13 §7). For a Light player this equals your Figma; for a Dark player
      the allied side shows Dark colours (register CD-19). Say if you want relative colours instead
      (allies always blue, enemies always red). (2) Who holds a capture point is also shown by an
      allegiance flag, never by colour alone (13 §7; register CD-03). (3) Every ability and gadget
      slot shows its key from your bindings (05 §15, 13 §3), so the two gadgets get key glyphs the
      Figma does not draw (CD-01), and the Figma's fixed "1" to "4" become live glyphs (CD-02).
- [ ] **HC-F6 — HUD numbers come only from the game (default applied).** In a live match the HUD
      shows what the simulation really has: your health, the match clock, the structures of the
      generated map (their health is not simulated yet) and the capture points (owner neutral).
      Everything else shows a "no data yet" state. The Figma's sample values (level 42, 1850,
      4700, 14:32, partial bars, two of three pips) appear only in tests and the visual-audit
      scenarios. What the weapon level, the ultimate's tiers and pips, the capture bars and the
      timer mean is asked in HC-Q2.
  - Since the sync with `phase/2-sprint-2-work` (2026-10-24), core has the `Aether` and
    `Progression` components, but its entity snapshot still carries only health, so the HUD's
    aether, level and XP keep their "no data yet" state until core publishes the player snapshot
    (architecture 05 §15 and §18; Phase 4, sprints 4.5 and 4.7). Nothing to answer.
- [ ] **HC-F7 — "Esc back" and "C view details" use existing bindings (default applied; veto).**
      The Legend step's Back prompt shows your `pause-menu` key and the alternate layout's View
      details shows your `gadget-2` key, both as live key glyphs that also answer a mouse binding;
      no new action is added, because a new Back action on Esc would bind one key to two actions
      (DEC-29). Say if you want binding contexts instead (menu keys separate from match keys: an
      architecture change to 13 §6.3), or other keys.
- [ ] **HC-F8 — Developer-only camera tools in a match, and leaving the cathedral (default
      applied; veto).** The free camera (drag and wheel zoom), the world overview, the explorer
      toolbar and the map legend show only with the developer flag (`?dev=1`, 13 §4), because
      DEC-32 makes the free camera and the overview demo-only; with the flag they sit at the top
      left, clear of the HUD. The cathedral click and a "Leave cathedral" button stay in normal
      play, because DEC-32 keeps the enterable interior in the design: the button shows only while
      you are inside, as an interim control in the game canvas styled from the theme tokens, and it
      becomes a HUD control with its own intent when the HUD gains an interior state (register
      CD-22). Say if the developer tools should go entirely, or stay visible for the course demo.
- [ ] **HC-F9 — When the selection art is freed (default applied).** The character-select art (the
      selection asset groups) is released when the match starts and loaded again for a rematch;
      13 §2 did not say. Nothing to answer unless you prefer to keep it loaded.
- [ ] **HC-T1 — Approve the text of the design-doc edits (`feat/hud-and-character-select`; asked
      after the pre-PR critic).** **Approve group (i) in one go: it is the merge precondition
      (pre-PR critic, run 2: C-01, core-bridge-01).** Group (i) only records what you already
      decided (DEC-48 to DEC-56; ADR 0018 as you accepted it) or aligns `apps/client/AGENTS.md`,
      FR-090 and DEC-49's file list with the design and rules you already approved (02 §3, 12 §8, 13
      §5, 14 §1 and §11; rule 11; the decisions log's purpose): T-01 to T-04, T-06, T-50, T-54, T-61
      to T-65, T-73, T-74, T-76 to T-78, T-87, T-88, T-103 to T-117, T-119, T-121 to T-124, T-126 to
      T-131, T-134, T-135, T-146, T-147 to T-151 and T-154 (54 rows, marked "group (i)" in the
      table; their patch also applies on its own). Group (ii) needs your judgement row by row:
      DEC-50's sketch, table rows and paragraph, which also carry HC-B1's DV-01, HC-F9 and HC-Q8
      (T-07, T-08, T-14 to T-16 and T-86, applied together); the rows on defaults (T-12, T-28,
      T-75); the branch's deviations and new features (T-05, T-09 to T-11, T-13, T-17 to T-27, T-29
      to T-48, T-51, T-55 to T-59, T-79, T-153); the critic's new items (T-89, T-90); phase-plan
      ticks, notes and two new tasks (T-80 to T-85, T-145, T-152); the optional rows (T-118, T-120,
      T-132, T-133); and the id wording that waits for HC-Q18 (4) (T-100 to T-102, T-136 to T-144).
      The critic's minimum also named T-05 and DEC-50's rows; they are in group (ii) because of
      those open items. T-125 is SamarjitBhogal's. Nothing is ticked. Your rule is that architecture
      docs, the `AGENTS.md` files and your reference docs change only with your approval (PR #31),
      each edit shown to you in a table (PR #33). So the branch splits its edits (OD-26). **Applied,
      append-only:** one Implementation-status note each in architecture 01 (new §8), 02 (new §12),
      05 (new §18), 06 §10, 13 §10, 14 §14 and 17 (new §12), recording what the branch built (13 §10
      also lists your decisions DEC-50 and DEC-52 to DEC-55, whose design text waits as T-86 to
      T-88); and `last-reviewed` on each. **Applied when you accepted ADR 0018 as you corrected it
      (DEC-56):** its amendments, rows T-49 to T-49b (17 R2), T-52 to T-53b (04 §9), T-60 and T-60a
      (the architecture README's D11 row), T-91 (ADR 0006's Status line), T-92 to T-97 (FR-057 keeps
      only class switching; the new FR-119 and its traceability) and T-98 and T-99 (the phase 2 and
      phase 4 plans); they left this table, and the pull request's description lists them. One of
      them is agent-written and needs your check: T-93a, the new acceptance sentence of FR-057 ("No
      MVP code path changes a Legend's class during a match; the switch and its ultimate penalty
      arrive post-MVP."), because its old acceptance was about sub-classes and moved to FR-119.
      **Not applied, for your approval:** every other change to existing text, the rows below. T-80
      to T-85 tick one phase-plan task whose test the branch meets and add notes to five others.
      T-86 to T-88 restore three paragraphs in architecture 13 (§2 DEC-50, §7 the display switches,
      §9 the variants) that the pre-PR critic asked to keep in §10 until you approve them, applied
      together with the §2 row and sketch rows T-07, T-08 and T-14 to T-16; T-89 and T-90 are the
      critic's new items NF3 and NF5 (HC-B1). T-100 to T-102 carry ADR 0018's point 5 into the id
      wording of `AGENTS.md`, architecture 04 §10 and 17 R26: until saves or a release exist, an id
      rename is a content refactor whose missed references fail the checks. No row copies the roster
      (ADR 0018 point 4): a row that records a name decision cites DEC-48, DEC-49 or DEC-56 and
      points to the content file; T-65 now replaces the eight sub-class rows of reference 01 with
      one row pointing to the content (rows T-66 to T-72 merged into it). T-103 to T-115 are
      consequences of DEC-56 (2026-10-25) in your reference docs and plans, for one sign-off:
      reference 01 (description, sub-classes heading and intro, the Flying note, the open question),
      reference 10's sub-class names row, the glossary's `LegendSpecDefinition` row, the naming
      suggestions' and more-abilities' sub-class sections, and the backlog's sub-class row, which
      now says MVP scope with the phase open (HC-Q17). They are kept as a patch outside the
      repository until you approve them, and the pull request's description repeats this table. A-1
      and A-2 were merged earlier and stay unless you refuse them. T-79 drafts an 08 §11 status
      section, which waits for you because an earlier one was removed for that reason; the critic's
      second run asks for that note (game-data-05), and T-79 now names `createBrowserMatch` and
      `MatchHost`. **Round B8 (the roster audit, OD-38):** T-116 to T-135 remove the remaining
      copies of class names and "post-MVP sub-classes" from your requirements, architecture, plans
      and reference docs and point to the content files; T-118, T-120, T-132 and T-133 are optional.
      T-125 changes architecture 18, which SamarjitBhogal owns, so it is his to approve, not yours.
      T-100 to T-102 and T-136 to T-144 change "never renamed once used" to "never renamed once a
      save or a release stores it"; their wording waits for your answer to HC-Q18 (4). Two texts of
      yours are stale and flagged, not edited: CP-13's "Why" line
      (`docs/requirements/02-coding-principles.md`: placeholder names keep their "(rename pending)"
      note in docs and TSDoc) and phase 4's exit criterion 3 (every "(rename pending)" note still
      visible in content display names), both overtaken by DEC-48. **Round B10 (the critic's second
      run):** T-145 schedules the replacement of the interim "Leave cathedral" control in Phase 2,
      sprint 2.8 (register CD-22; your PR #34 rule that an interim ships only with its replacement
      scheduled); T-32 and T-43 add the manifest entry's draw box, files and renditions (14 §11, 02
      §9), and T-36 and T-41 add the bridge's per-team Legend name and its shared HUD layout
      geometry (02 §3). **Round B11:** T-146 corrects FR-090's acceptance, which put the profile
      screen's display name in `ui/`; the critic's rework moved it into core content (your rule 11),
      so T-146 joins group (i). **Round B13 (the /pr-review of 2026-10-27):** T-147 to T-150 record
      DEC-48 in the naming suggestions (the Warrior and Flying sections and their two summary rows
      still showed open recommendations; architecture 17 R26 records the pick there), pointing to
      the content files as T-76 and T-77 do; T-151 adds ADR 0018 to the D11 row's "Recorded in"; all
      five are in group (i). T-152 is the Phase 6, sprint 6.3 task line for the UI enhancements
      follow-up: it was applied earlier (`97f801b`) although HC-S5 is unanswered, so it is taken out
      of the plan and waits here, like T-145, until you answer HC-S5. Two ADRs are drafted for you
      to accept (both proposed): ADR 0019 records DEC-50, the basis of T-07, T-08, T-14 to T-16 and
      T-86 (`docs/decisions/0019-session-controller-owns-the-match.md`); ADR 0020 records three
      test-configuration lines the branch changed without one
      (`docs/decisions/0020-client-test-configuration.md`). **Round B14 (the /pr-review's code
      repairs):** T-153 says that 14 §11's progress ends at the manifest sum only when every file
      loads; with a failed file it ends below the sum, as the code has done since the branch's
      foundation commit `4a6dec6` (a test pins it). It is in group (ii) because the other choice,
      counting a failed file as loaded, is yours. T-154 adds `RoleRatingRangeRule.ts`, the new
      content rule that keeps every Legend role rating from 0 to 1, to DEC-49's "Affects" cell
      beside `SpecClassExistsRule.ts`; it only records where DEC-49's content is checked, so it is
      in group (i). Approve all, or name the rows to change or drop.

  | #     | Where (doc §, line)                                                                                                                                                                                                                                          | Base design said                                                          | Branch says                                                                                                                | Basis (DEC/DV/factual)                                                                                                                                                                             | Changes general design? y/n + why                                                                             | Status                                                              |
  | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
  | A-1   | 05 §15 sketch, `PlayerSnapshot.xp` and `xpToNext` (`docs/architecture/05-abilities-weapons-and-loadouts.md:825-826`, l.774-775 before the upstream sync), inside the sketch                                                                                  | no comments                                                               | comments: XP inside the current level; XP the level needs                                                                  | OD-9 (the owner's reading of the XP ring, 2026-10-18)                                                                                                                                              | n: comments only                                                                                              | applied in `b04da8f`, pending owner acceptance; reverted if refused |
  | A-2   | 13 §10 Implementation status, the "HUD (2026-10-18)" paragraph at the section's end (not design text)                                                                                                                                                        | (none)                                                                    | the cooldown sweep is the owner's vertical fill (CD-28)                                                                    | OD-9                                                                                                                                                                                               | n: a status note                                                                                              | applied in `b04da8f`, pending owner acceptance; reverted if refused |
  | T-01  | apps/client/AGENTS.md folder table, `game/GameCanvas.tsx` row (l.30) (`apps/client/AGENTS.md:30`)                                                                                                                                                            | `GameCanvas` owns the canvas and the `Match` lifetime                     | `GameCanvas` owns the canvas elements; `SessionController` owns the lifetime                                               | DEC-50 (owner, 2026-10-17)                                                                                                                                                                         | n: the owner's decision; 13 §1–§2 already designed it                                                         | pending owner; group (i), for the merge                             |
  | T-02  | apps/client/AGENTS.md folder table, `game/engine/` row (l.25) (`apps/client/AGENTS.md:25`)                                                                                                                                                                   | `AssetLoader` is in `game/engine/`                                        | `AssetLoader` is in `data/resources/loaders/` (new row T-03)                                                               | DV-138 (factual; 02 §3 and 14 §1/§11 already put it there)                                                                                                                                         | n: aligns the table with 02 and 14                                                                            | pending owner; group (i), for the merge                             |
  | T-03  | apps/client/AGENTS.md folder table, new `data/resources/` row (`apps/client/AGENTS.md:34`)                                                                                                                                                                   | (no row)                                                                  | a row naming the resources folder                                                                                          | DV-138 (factual)                                                                                                                                                                                   | n: names an existing folder of 02 §3                                                                          | pending owner; group (i), for the merge                             |
  | T-04  | apps/client/AGENTS.md folder table, `assets/` row (l.36) (`apps/client/AGENTS.md:36`)                                                                                                                                                                        | `assets/` holds the asset manifest                                        | `assets/` holds the files; the manifest is in `data/resources/`                                                            | DV-138 (factual; round-4 critic R4-08 keeps the planned `manifest.json`)                                                                                                                           | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-05  | apps/client/AGENTS.md folder table, `game/Match.ts` row (l.29) (`apps/client/AGENTS.md:29`)                                                                                                                                                                  | `Match` wires simulation, loop, renderer, input, views and bridge         | `Match` receives the adapters from the match factory                                                                       | DV-130 (acceptable; composition-root wording, HC-T1)                                                                                                                                               | n: `Match` stays the composition root of a match; the factory is bound by `main.tsx`                          | pending owner                                                       |
  | T-06  | apps/client/AGENTS.md "Adding code", new game → UI data (l.44-45) (`apps/client/AGENTS.md:44`)                                                                                                                                                               | publish from `Match.ts`                                                   | publish from `MatchBridge.ts` (13 §5, 12 §8)                                                                               | factual (MatchBridge exists since this branch)                                                                                                                                                     | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-07  | 13 §2 sketch, `SessionController` deps (`docs/architecture/13-game-interface.md:92`)                                                                                                                                                                         | `createMatch: (setup) => Match`                                           | `prepareWorld(seed)` plus `createMatch(request, viewport)` returning a `RunningMatch`                                      | DEC-50; DV-01 (better than the design, HC-B1)                                                                                                                                                      | n: the lifetime is the owner's (DEC-50); the signature only splits world preparation from the viewport attach | pending owner                                                       |
  | T-08  | 13 §2 sketch, `attachViewport` (`docs/architecture/13-game-interface.md:97`)                                                                                                                                                                                 | `attachViewport(host): void`                                              | `attachViewport(viewport): () => void`                                                                                     | DEC-50; DV-01 (HC-B1)                                                                                                                                                                              | n                                                                                                             | pending owner                                                       |
  | T-09  | 13 §2 table, `boot` row (`docs/architecture/13-game-interface.md:104`)                                                                                                                                                                                       | `loadDefaultContent()` into `contentSlice`                                | `loadDisplayContent()` into `contentSlice`                                                                                 | DV-30 (acceptable, HC-T1); DEC-49, ADR 0018 (accepted, DEC-56)                                                                                                                                     | n                                                                                                             | pending owner                                                       |
  | T-10  | 13 §2 table, `menu` → `loading` row (`docs/architecture/13-game-interface.md:105`)                                                                                                                                                                           | builds `MatchSetup`                                                       | also builds the rosters there                                                                                              | DEC-34 (SD-2, delegated "whichever is cleaner")                                                                                                                                                    | n: moves one step between two adjacent rows                                                                   | pending owner                                                       |
  | T-11  | 13 §2 table, `loading` row (`docs/architecture/13-game-interface.md:106`)                                                                                                                                                                                    | one `selection` group                                                     | the selection groups, chosen by layout and effects renderer                                                                | DV-41, DV-46 (HC-B1); DEC-52, DEC-54                                                                                                                                                               | n                                                                                                             | pending owner                                                       |
  | T-12  | 13 §2 table, `character-select` row, trigger (`docs/architecture/13-game-interface.md:107`)                                                                                                                                                                  | confirm a class; timeout with no selection                                | LOCK IN after the Legend step; timeout with a class goes on; cancel                                                        | DEC-49 (the Legend step); HC-F1 (default, timeout rule unchanged)                                                                                                                                  | n                                                                                                             | pending owner                                                       |
  | T-13  | 13 §2 table, `character-select` row, work (`docs/architecture/13-game-interface.md:107`)                                                                                                                                                                     | builds rosters, assigns the team, starts the countdown                    | records the two picks in `SessionController`; the rosters come from `menu`                                                 | DEC-34 SD-2; DEC-49; DV-03 (acceptable, HC-T1; INBOX "Session D (DEC-34)")                                                                                                                         | n                                                                                                             | pending owner                                                       |
  | T-14  | 13 §2 table, `match-loading` row, trigger (`docs/architecture/13-game-interface.md:109`)                                                                                                                                                                     | `match` group loaded                                                      | `match` group loaded and the world prepared                                                                                | DEC-50                                                                                                                                                                                             | n                                                                                                             | pending owner                                                       |
  | T-15  | 13 §2 table, `match-loading` row, work (`docs/architecture/13-game-interface.md:109`)                                                                                                                                                                        | `createMatch(setup)` and `match.start()` here                             | only the world is prepared here                                                                                            | DEC-50 (owner)                                                                                                                                                                                     | n: the owner's decision, which this section already sketched (`attachViewport`)                               | pending owner                                                       |
  | T-16  | 13 §2 table, `match` row, work (`docs/architecture/13-game-interface.md:110`)                                                                                                                                                                                | save the result; destroy on exit                                          | create on attach, release selection art, pause for overlays, save, destroy                                                 | DEC-50; HC-F9 (default); DV-117 (HC-Q8)                                                                                                                                                            | n                                                                                                             | pending owner                                                       |
  | T-17  | 13 §2, the paragraph after the table (`docs/architecture/13-game-interface.md:114`)                                                                                                                                                                          | `SessionController.test.ts` with a `MemoryStorageAdapter`                 | the transitions test with a fake asset loader                                                                              | factual                                                                                                                                                                                            | n                                                                                                             | pending owner                                                       |
  | T-18  | 13 §3 screens table, new `CharacterSelectScreen` row (`docs/architecture/13-game-interface.md:131`)                                                                                                                                                          | (no row)                                                                  | the two-step character-select screen                                                                                       | DEC-49, DEC-52; DV-26 (acceptable)                                                                                                                                                                 | n: a screen of the existing `character-select` phase                                                          | pending owner                                                       |
  | T-19  | 13 §3 screens table, `MatchScreen` reads (`docs/architecture/13-game-interface.md:131`)                                                                                                                                                                      | `selectSessionPhase`; viewport and HUD                                    | overlay and bindings; the only screen with the viewport                                                                    | DEC-50; DV-98 (acceptable)                                                                                                                                                                         | n                                                                                                             | pending owner                                                       |
  | T-20  | 13 §3 screens table, `MatchScreen` emits (`docs/architecture/13-game-interface.md:131`)                                                                                                                                                                      | `leave-match`, `forfeit`                                                  | adds the overlay intents                                                                                                   | factual (PauseOverlay, DV-101)                                                                                                                                                                     | n                                                                                                             | pending owner                                                       |
  | T-21  | 13 §3 HUD table, `HealthBar, AetherBar` row (`docs/architecture/13-game-interface.md:136`)                                                                                                                                                                   | level and XP-to-next on the aether bar                                    | level and XP in `LevelBadge`                                                                                               | the owner's Figma 62:231 (DEC-53 register); DV-93 (HC-B1)                                                                                                                                          | n                                                                                                             | pending owner                                                       |
  | T-22  | 13 §3 HUD table, `AbilityBar` row (`docs/architecture/13-game-interface.md:137`)                                                                                                                                                                             | a cooldown sweep                                                          | the sweep is the owner's vertical fill; gadgets reuse the slot                                                             | OD-9 (owner meanings, 2026-10-18), CD-28; DV-88                                                                                                                                                    | n                                                                                                             | pending owner                                                       |
  | T-23  | 13 §3 HUD table, new rows after `AbilityBar` (`docs/architecture/13-game-interface.md:137`)                                                                                                                                                                  | (no rows)                                                                 | the HUD elements of the owner's 62:231                                                                                     | DV-93, DV-19, DV-22 (new features, HC-B1); OQ-63, OQ-64                                                                                                                                            | n: new leaves on the existing bridge pattern                                                                  | pending owner                                                       |
  | T-24  | 13 §5 sketch, `loading-progress` (`docs/architecture/13-game-interface.md:221`)                                                                                                                                                                              | `'boot'                                                                   | 'menu'                                                                                                                     | 'match'`                                                                                                                                                                                           | the asset groups of 14 §11                                                                                    | DV-41 (acceptable, HC-Q7 (2)); audit AS-8                           | n                                                       | pending owner                                         |
  | T-25  | 13 §5 sketch, new events (`docs/architecture/13-game-interface.md:210`)                                                                                                                                                                                      | (no such events)                                                          | `structure-state`, `asset-urls`, `credits`                                                                                 | DV-22 (new feature, HC-B1); DEC-51                                                                                                                                                                 | n: new messages on the one bus                                                                                | pending owner                                                       |
  | T-26  | 13 §5 sketch, `UiIntent` (`docs/architecture/13-game-interface.md:249`)                                                                                                                                                                                      | (no member)                                                               | `clear-class-selection`                                                                                                    | DV-26 (acceptable)                                                                                                                                                                                 | n                                                                                                             | pending owner                                                       |
  | T-27  | 13 §5, slice list (`docs/architecture/13-game-interface.md:256`)                                                                                                                                                                                             | (no assets slice)                                                         | `assetsSlice`                                                                                                              | DV-23 (new feature, HC-B1)                                                                                                                                                                         | n                                                                                                             | pending owner                                                       |
  | T-28  | 13 §6.4, appended sentence (`docs/architecture/13-game-interface.md:401`)                                                                                                                                                                                    | (nothing)                                                                 | the two selection prompts reuse match bindings                                                                             | HC-F7 (default for veto); DV-71                                                                                                                                                                    | n                                                                                                             | pending owner                                                       |
  | T-29  | 13 §7, styling bullet (`docs/architecture/13-game-interface.md:410`)                                                                                                                                                                                         | (no scaling rule)                                                         | the artboard, the HUD unit and the text floor                                                                              | DV-55, DV-56 (better than the design, HC-B1); DV-121 (HC-Q14)                                                                                                                                      | n                                                                                                             | pending owner                                                       |
  | T-30  | 14 §1 tree, `data/resources/` line (`docs/architecture/14-persistence-and-resources.md:49`)                                                                                                                                                                  | the canvas loaders only                                                   | adds the port, its contract and the two DOM loaders                                                                        | DV-39, DV-40 (new features, HC-B1); R3-08                                                                                                                                                          | n: one facade and one manifest stay                                                                           | pending owner                                                       |
  | T-31  | 14 §11 sketch, `AssetType` and `AssetGroup` (`docs/architecture/14-persistence-and-resources.md:398`)                                                                                                                                                        | `'image'                                                                  | 'audio'                                                                                                                    | 'json'`; `'boot'                                                                                                                                                                                   | 'menu'                                                                                                        | 'match'`                                                            | adds the DOM image and font types; the selection groups | DV-39, DV-40, DV-41, DV-46 (HC-B1, HC-Q7 (2)); DEC-51 | n   | pending owner |
  | T-32  | 14 §11 sketch, manifest entry (`docs/architecture/14-persistence-and-resources.md:402`)                                                                                                                                                                      | one `url`                                                                 | `file`, optional `file2x`, per-use `renditions` and an optional draw `box`                                                 | DV-42, DV-122 (HC-B1); the draw box: critic run 1 S4 and N9; critic run 2 game-data-12                                                                                                             | n                                                                                                             | pending owner                                                       |
  | T-33  | 14 §11 sketch, loaders (`docs/architecture/14-persistence-and-resources.md:422`)                                                                                                                                                                             | (canvas loaders only)                                                     | `UiImageLoader`, `FontLoader`                                                                                              | DV-39, DV-40 (HC-B1); DEC-51                                                                                                                                                                       | n                                                                                                             | pending owner                                                       |
  | T-34  | 14 §11, two bullets before the progress bullet (`docs/architecture/14-persistence-and-resources.md:443`)                                                                                                                                                     | (no DOM images or fonts)                                                  | DOM images through the store; fonts as assets; per-session density; per-layout groups                                      | DV-39, DV-40, DV-42, DV-46 (HC-B1); DEC-51                                                                                                                                                         | n: one facade, one manifest, ids not URLs in `ui/`                                                            | pending owner                                                       |
  | T-35  | 14 §13 recipe, asset row (`docs/architecture/14-persistence-and-resources.md:485`)                                                                                                                                                                           | one `ASSET_MANIFEST` line                                                 | one line in the group's file                                                                                               | DV-131 (acceptable; the ~300-line file rule)                                                                                                                                                       | n                                                                                                             | pending owner                                                       |
  | T-36  | 02 §3 tree, `bridge/` line (`docs/architecture/02-code-structure.md:95`)                                                                                                                                                                                     | (no display-type files)                                                   | the display types, the selection rule and the minimap ring                                                                 | DV-16, DV-25, DV-95 (acceptable)                                                                                                                                                                   | n: shared types in `bridge/`, as 02 §5 plans                                                                  | pending owner                                                       |
  | T-37  | 02 §3 tree, `data/resources/` line (`docs/architecture/02-code-structure.md:97`)                                                                                                                                                                             | loaders/, AssetManifest                                                   | per-group manifest files; the port                                                                                         | DV-131, DV-39                                                                                                                                                                                      | n                                                                                                             | pending owner                                                       |
  | T-38  | 02 §3 tree, `assets/` line (`docs/architecture/02-code-structure.md:102`)                                                                                                                                                                                    | manifest in `assets/`                                                     | files in `assets/`, manifest in `data/resources/`                                                                          | DV-138 (factual; R4-08)                                                                                                                                                                            | n                                                                                                             | pending owner                                                       |
  | T-39  | 02 §3 tree, new line after `game/Match.ts` (`docs/architecture/02-code-structure.md:89`)                                                                                                                                                                     | (no line)                                                                 | the match factory                                                                                                          | DV-130 (acceptable, HC-T1); DEC-50                                                                                                                                                                 | n: a composition-root helper bound only by `main.tsx`                                                         | pending owner                                                       |
  | T-40  | 02 §3 table, `data/resources/` key files (`docs/architecture/02-code-structure.md:117`)                                                                                                                                                                      | the canvas loaders                                                        | adds the port and the DOM loaders                                                                                          | DV-39, DV-40 (HC-B1)                                                                                                                                                                               | n                                                                                                             | pending owner                                                       |
  | T-41  | 02 §3 table, `bridge/` key files (`docs/architecture/02-code-structure.md:115`)                                                                                                                                                                              | (no display-type files)                                                   | the display types, the selection rule, the per-team Legend name and the shared HUD layout geometry (the minimap ring)      | DV-16, DV-25, DV-95; critic run 2 core-bridge-09                                                                                                                                                   | n                                                                                                             | pending owner                                                       |
  | T-42  | 02 §6, the planned public surface (`docs/architecture/02-code-structure.md:167`)                                                                                                                                                                             | (no display loader)                                                       | `loadDisplayContent()`                                                                                                     | DV-30 (acceptable, HC-T1); DEC-49; ADR 0018 (accepted, DEC-56)                                                                                                                                     | n: a read-only export of content                                                                              | pending owner                                                       |
  | T-43  | 02 §9, asset-manifest row (`docs/architecture/02-code-structure.md:223`)                                                                                                                                                                                     | one file; "An asset"                                                      | one list, one file per group; an entry's files, renditions and draw box                                                    | DV-131 (acceptable); DV-42, DV-122; critic run 2 game-data-12                                                                                                                                      | n: still the only list                                                                                        | pending owner                                                       |
  | T-44  | 02 §10, asset row (`docs/architecture/02-code-structure.md:249`)                                                                                                                                                                                             | licence noted in the PR                                                   | licence and source in the entry; licence texts beside the files                                                            | DEC-51; DV-131                                                                                                                                                                                     | n                                                                                                             | pending owner                                                       |
  | T-45  | 01 §3 ports table, new `AssetLoader` row (`docs/architecture/01-layered-oop-model.md:107`)                                                                                                                                                                   | (no row)                                                                  | the asset-loader port                                                                                                      | DV-39 (new feature, HC-B1); R3-08                                                                                                                                                                  | n: a port with a contract suite, as the table's rule asks                                                     | pending owner                                                       |
  | T-46  | 01 §3, composition-root sentence (`docs/architecture/01-layered-oop-model.md:120`)                                                                                                                                                                           | `Match`, `main.tsx` or a test                                             | adds the match factory                                                                                                     | DV-130 (HC-T1); DEC-50                                                                                                                                                                             | n: the factory is part of the composition root                                                                | pending owner                                                       |
  | T-47  | 17 §11, anti-recipe A8 (`docs/architecture/17-extension-recipes.md:551`)                                                                                                                                                                                     | outside `Match` or `main.tsx`                                             | outside the composition root, factory included                                                                             | DV-130 (HC-T1)                                                                                                                                                                                     | n                                                                                                             | pending owner                                                       |
  | T-48  | 17 R1, files (`docs/architecture/17-extension-recipes.md:82`)                                                                                                                                                                                                | `AssetManifest.ts`                                                        | the group's manifest file                                                                                                  | DV-131                                                                                                                                                                                             | n                                                                                                             | pending owner                                                       |
  | T-50  | 04 §1 table, `Legend` row (`docs/architecture/04-entity-architecture.md:78`)                                                                                                                                                                                 | "rename pending"                                                          | the display names are decided and live in content (no name copied)                                                         | DEC-48 (owner); ADR 0018 point 4 (no roster copy)                                                                                                                                                  | n: display names only; ids unchanged                                                                          | pending owner; group (i), for the merge                             |
  | T-51  | 04 §5, after the validation paragraph (`docs/architecture/04-entity-architecture.md:221`)                                                                                                                                                                    | (one loader)                                                              | the display loader and its rule factory                                                                                    | DV-29, DV-30 (acceptable, HC-T1); ADR 0018 (accepted, DEC-56)                                                                                                                                      | n: same validator, same rule pattern                                                                          | pending owner                                                       |
  | T-54  | 04 §12, first line (`docs/architecture/04-entity-architecture.md:300`)                                                                                                                                                                                       | "rename pending"                                                          | shown locked; the name is in content                                                                                       | DEC-48; ADR 0018 point 4                                                                                                                                                                           | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-55  | 05 §15, display names and icons (`docs/architecture/05-abilities-weapons-and-loadouts.md:839`)                                                                                                                                                               | resolved once at match start into the slice                               | joined by a selector from boot-time display content                                                                        | DV-21 (acceptable, HC-T1)                                                                                                                                                                          | n: still never from entities                                                                                  | pending owner                                                       |
  | T-56  | 06 §10, "Minimap (§8)" row, Today (`docs/architecture/06-map-and-minimap.md:415`)                                                                                                                                                                            | layers draw their minimap                                                 | clipped into the main canvas inside the HUD ring                                                                           | DV-94, DV-95 (acceptable); OD-13                                                                                                                                                                   | n: interim state, §8 unchanged                                                                                | pending owner                                                       |
  | T-57  | 06 §10, "Free view and interior" row, Today (`docs/architecture/06-map-and-minimap.md:421`)                                                                                                                                                                  | explorer in `Match`, always on                                            | in `MatchCamera`; developer flag for the free view                                                                         | DV-07 (acceptable, HC-F8); DV-119; DEC-32                                                                                                                                                          | n                                                                                                             | pending owner                                                       |
  | T-58  | 08 §7 sketch, `Match` deps (`docs/architecture/08-game-engine.md:195`)                                                                                                                                                                                       | (no world)                                                                | `world: PreparedWorld`                                                                                                     | DV-04 (acceptable); DEC-50                                                                                                                                                                         | n                                                                                                             | pending owner                                                       |
  | T-79  | 08, new §11 Implementation status (the INBOX HC-T1 draft) (`docs/architecture/08-game-engine.md:281`)                                                                                                                                                        | (no §11; an earlier §11 was removed pending approval, `fb310c6`)          | a status note on `Match`'s deps, tick and minimap; names `createBrowserMatch` and `MatchHost`                              | DV-04, DV-05, DV-15, DV-94, DV-130 (acceptable); DEC-50; critic run 2 game-data-05 (it asks for this note)                                                                                         | n: status only; 08 §7 stays the design                                                                        | pending owner                                                       |
  | T-59  | 09 §2, focus loss (`docs/architecture/09-hardware-abstraction.md:95`)                                                                                                                                                                                        | `Match` subscribes and releases                                           | `MatchHost` subscribes and releases                                                                                        | DV-05 (acceptable); INBOX HC-Q8 (3) asks the owner (apply only if he keeps the release outside `Match`)                                                                                            | n: the boundary stays in L3 `game/`                                                                           | pending owner                                                       |
  | T-61  | reference 01, classes table, Warrior (`docs/reference/game-design/01-classes-and-subclasses.md:31`)                                                                                                                                                          | "Warrior (formerly Assault)"                                              | the display name is decided and in content                                                                                 | DEC-48; ADR 0018 point 4                                                                                                                                                                           | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-62  | reference 01, classes table, Flying (`docs/reference/game-design/01-classes-and-subclasses.md:34`)                                                                                                                                                           | "rename pending"                                                          | the display name is decided and in content                                                                                 | DEC-48; ADR 0018 point 4                                                                                                                                                                           | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-63  | reference 01, notes, first bullet (`docs/reference/game-design/01-classes-and-subclasses.md:38`)                                                                                                                                                             | placeholders                                                              | decided names, pointed to in content                                                                                       | DEC-48; ADR 0018 point 4                                                                                                                                                                           | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-64  | reference 01, sub-classes intro, appended (`docs/reference/game-design/01-classes-and-subclasses.md:59`)                                                                                                                                                     | (post-MVP only)                                                           | the pick is setup data today; the roster is content; the game doc's list is in its transcription                           | DEC-49; ADR 0018 (DEC-56; OD-36)                                                                                                                                                                   | n: the owner's decision                                                                                       | pending owner; group (i), for the merge                             |
  | T-65  | reference 01, sub-classes table, the eight rows of the playable classes (rows T-65 to T-72 merged into one) (`docs/reference/game-design/01-classes-and-subclasses.md:63`)                                                                                   | the game doc's eight sub-classes, all post-MVP                            | one row pointing to the content; the Flying rows stay                                                                      | DEC-49 (the owner's Legends); consequence of DEC-56 (owner, 2026-10-25); ADR 0018 point 4                                                                                                          | n: the owner's decisions; the game doc's list stays in its transcription                                      | pending owner; group (i), for the merge                             |
  | T-73  | reference 14 §2, item 2 (`docs/reference/game-design/14-interface-and-screen-flow.md:45`)                                                                                                                                                                    | sub-class slots shown but post-MVP                                        | sub-classes MVP; the locked card                                                                                           | DEC-48, DEC-49; ADR 0018 (DEC-56; OD-36)                                                                                                                                                           | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-74  | reference 14 §3 (`docs/reference/game-design/14-interface-and-screen-flow.md:61`)                                                                                                                                                                            | a basic placeholder                                                       | the owner's Figma frames                                                                                                   | DEC-52, DEC-53 (the register)                                                                                                                                                                      | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-75  | reference 14 §5, character-select row (`docs/reference/game-design/14-interface-and-screen-flow.md:78`)                                                                                                                                                      | one screen                                                                | two steps, one countdown                                                                                                   | DEC-49; HC-F1 (default)                                                                                                                                                                            | n                                                                                                             | pending owner                                                       |
  | T-76  | glossary, Warrior row (`docs/reference/glossary.md:46`)                                                                                                                                                                                                      | Vanguard proposed                                                         | decided, in content                                                                                                        | DEC-48; ADR 0018 point 4                                                                                                                                                                           | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-77  | glossary, Flying row (term and definition) (`docs/reference/glossary.md:92`)                                                                                                                                                                                 | "Flying (rename pending)"; Harrier proposed                               | the term "Flying"; decided, in content; shown locked                                                                       | DEC-48; ADR 0018 point 4                                                                                                                                                                           | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-78  | glossary, Sub-class row (`docs/reference/glossary.md:189`)                                                                                                                                                                                                   | post-MVP; the game doc's names                                            | MVP; points to the content instead of listing names                                                                        | DEC-49; ADR 0018 (DEC-56; OD-36)                                                                                                                                                                   | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-80  | phase 1, sprint 1.4, "`Match` composition root + `MatchScreen` shell": ticked (`docs/plan/phase-1-simulation-kernel-and-world.md:202`)                                                                                                                       | [ ] open                                                                  | [x], each "Test" and "Done when" mapped to the branch test that meets it                                                   | the item's own Test and Done when, met by the tests named in the note (OD-31)                                                                                                                      | n: a progress record                                                                                          | pending owner                                                       |
  | T-81  | phase 5, sprint 5.2, "`ResourceController` facade + `AssetCache` + `loadingSlice`": note only (`docs/plan/phase-5-meta-ui-and-persistence.md:114`)                                                                                                           | (no note)                                                                 | what the branch built; stays open                                                                                          | OD-31; DV-41, DV-43                                                                                                                                                                                | n                                                                                                             | pending owner                                                       |
  | T-82  | phase 5, sprint 5.2, "`SessionController`": note only (`docs/plan/phase-5-meta-ui-and-persistence.md:125`)                                                                                                                                                   | (no note)                                                                 | what the branch built; stays open (no default profile yet)                                                                 | OD-31; DEC-50                                                                                                                                                                                      | n                                                                                                             | pending owner                                                       |
  | T-83  | phase 4, sprint 4.7, "`AbilityBar`, `AetherBar`, `HealthBar` HUD": note only (`docs/plan/phase-4-legends-abilities-and-loadouts.md:201`)                                                                                                                     | (no note)                                                                 | what the branch built; stays open (no live data yet)                                                                       | OD-31; OD-9, CD-28                                                                                                                                                                                 | n                                                                                                             | pending owner                                                       |
  | T-84  | phase 3, sprint 3.5, "Match clock and phase on the HUD": note only (`docs/plan/phase-3-minions-hordes-and-ai.md:155`)                                                                                                                                        | (no note)                                                                 | what the branch built; stays open (no phase yet)                                                                           | OD-31                                                                                                                                                                                              | n                                                                                                             | pending owner                                                       |
  | T-85  | phase 1, sprint 1.4, "Bridge event bus + first Redux slice (match clock)": note only, a second note beside the first (`docs/plan/phase-1-simulation-kernel-and-world.md:199`)                                                                                | [ ] with the session-shell note                                           | stays [ ]: the test parts are met, the done-when has no lint rule yet                                                      | OD-32: (1) `MatchBridge.test.ts` + `connectBusToStore.ts:49-50`; (2) `selectMatchClockText.test.ts`; (3) unmet: `eslint.config.js:49` is core's block only                                         | n: a progress record                                                                                          | pending owner                                                       |
  | T-86  | 13 §2, a DEC-50 paragraph after the table (moved out of the design text to §10 until sign-off, OD-33 S5); apply together with T-07, T-08 and T-14 to T-16 (`docs/architecture/13-game-interface.md:117`)                                                     | (no paragraph)                                                            | the owner's decision stated where the lifetime is designed                                                                 | DEC-50; critic S5                                                                                                                                                                                  | n: the rows and sketch it states change in the same edit                                                      | pending owner                                                       |
  | T-87  | 13 §7, a "Display switches" bullet (moved to §10 until sign-off, OD-33 S5) (`docs/architecture/13-game-interface.md:423`)                                                                                                                                    | (no bullet; the contrast minimums are a Recommendation)                   | the Figma look is the default; alternatives are content values                                                             | DEC-53, DEC-54, DEC-55; critic S5, N24                                                                                                                                                             | n: data switches over the existing token and content rules                                                    | pending owner; group (i), for the merge                             |
  | T-88  | 13 §9, a variant paragraph after the recipe table (moved to §10 until sign-off, OD-33 S5) (`docs/architecture/13-game-interface.md:471`)                                                                                                                     | (no paragraph)                                                            | variants chosen by one content value, the original kept live                                                               | DEC-52, DEC-53; critic S5                                                                                                                                                                          | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-89  | 02 §3 table, new `game/content/` row (its imports as built: `main.tsx` injects the known asset ids since the critic rework, NF3; only the test fixture `__fixtures__/shippedCatalogue.ts` reads the manifest) (`docs/architecture/02-code-structure.md:113`) | (no row; the folder predates the branch)                                  | game/content as the client presentation layer                                                                              | critic NF3 (new feature; the sign-off is this row only)                                                                                                                                            | n: names a folder; it keeps to its layer once the asset ids are injected                                      | pending owner                                                       |
  | T-90  | 13 §6.2, a paragraph on the ui/ action-shortcut path (`docs/architecture/13-game-interface.md:368`)                                                                                                                                                          | (one path: `InputMapper` in `Match`)                                      | a second, ui-only path for prompts and the pause key                                                                       | critic NF5 (new feature); DV-71, DV-101; DEC-50                                                                                                                                                    | n: no gameplay input passes through it; chords still compare by `chordKey`                                    | pending owner                                                       |
  | T-100 | AGENTS.md, coding standards, naming (`AGENTS.md:153`)                                                                                                                                                                                                        | "never renamed once used"                                                 | never renamed once a save or a release stores them; until then a checked refactor                                          | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist                                                                                  | n: the rule is unchanged once saves exist                                                                     | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-101 | 04 §10, the paragraph (`docs/architecture/04-entity-architecture.md:283`)                                                                                                                                                                                    | `displayName: 'Warrior (formerly Assault)'`; ids never change "once used" | each definition's `displayName`; ids fixed once a save or a release stores them, a checked refactor before                 | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist                                                                                  | n: the rule is unchanged once saves exist                                                                     | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-102 | 17 R26, files, content id (`docs/architecture/17-extension-recipes.md:516`)                                                                                                                                                                                  | "never once used"                                                         | never once a save or a release stores it; a checked refactor before                                                        | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist                                                                                  | n                                                                                                             | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-103 | reference 01, frontmatter description (`docs/reference/game-design/01-classes-and-subclasses.md:3`)                                                                                                                                                          | "their post-MVP sub-classes"                                              | sub-classes MVP; roster in content                                                                                         | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n: the owner's decision                                                                                       | pending owner; group (i), for the merge                             |
  | T-104 | reference 01, sub-classes heading (`docs/reference/game-design/01-classes-and-subclasses.md:55`)                                                                                                                                                             | "(names pending) — post-MVP"                                              | "— MVP (DEC-56)"                                                                                                           | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-105 | reference 01, sub-classes intro, first sentence (`docs/reference/game-design/01-classes-and-subclasses.md:57`)                                                                                                                                               | **post-MVP**                                                              | **MVP**; D11's data-first model stands                                                                                     | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-106 | reference 01, notes, the Flying bullet (`docs/reference/game-design/01-classes-and-subclasses.md:44`)                                                                                                                                                        | the flying class's sub-classes post-MVP                                   | unchanged for the flying class; says the playable classes' are MVP                                                         | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n: a clarification; the flying class stays post-MVP                                                           | pending owner; group (i), for the merge                             |
  | T-115 | reference 01, the open question after the sub-classes table (`docs/reference/game-design/01-classes-and-subclasses.md:75`)                                                                                                                                   | describes the game doc's list                                             | points to the transcription and OQ-69                                                                                      | consequence of DEC-56 (owner, 2026-10-25); DEC-49; ADR 0018 point 4                                                                                                                                | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-107 | reference 10, placeholders table, sub-class names row (`docs/reference/game-design/10-art-and-lore.md:88`)                                                                                                                                                   | "Sub-classes (post-MVP)", open                                            | MVP; decided and in content for the playable classes                                                                       | consequence of DEC-56 (owner, 2026-10-25); DEC-49                                                                                                                                                  | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-108 | glossary, `LegendSpecDefinition` row (`docs/reference/glossary.md:121`)                                                                                                                                                                                      | "consumes post-MVP"; `content/legends/` (post-MVP)                        | MVP; the specs folder                                                                                                      | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-109 | naming suggestions, sub-classes heading (`docs/reference/suggestions/naming.md:49`)                                                                                                                                                                          | "(names pending) — post-MVP (D11)"                                        | decided; MVP                                                                                                               | consequence of DEC-56 (owner, 2026-10-25); DEC-49                                                                                                                                                  | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-110 | naming suggestions, sub-classes intro (`docs/reference/suggestions/naming.md:51`)                                                                                                                                                                            | (names pending)                                                           | decided, in content; the proposals kept as a record                                                                        | consequence of DEC-56 (owner, 2026-10-25); DEC-49; ADR 0018 point 4                                                                                                                                | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-111 | more abilities, frontmatter description (`docs/reference/suggestions/more-abilities.md:3`)                                                                                                                                                                   | sub-class ideas post-MVP                                                  | sub-classes MVP                                                                                                            | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-112 | more abilities, §6 heading (`docs/reference/suggestions/more-abilities.md:155`)                                                                                                                                                                              | "— post-MVP (D11)"                                                        | "(D11)"                                                                                                                    | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-113 | more abilities, §6 intro, last sentence (`docs/reference/suggestions/more-abilities.md:157`)                                                                                                                                                                 | "every row is **post-MVP**"                                               | MVP scope, phase open; the Flying row post-MVP                                                                             | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n: proposals stay proposals                                                                                   | pending owner; group (i), for the merge                             |
  | T-114 | backlog, post-MVP gameplay features, sub-classes row (`docs/plan/backlog-post-mvp.md:49`)                                                                                                                                                                    | the game doc's sub-classes, post-MVP, triggered after Phase 6.2           | MVP scope, phase open; leaves the backlog when the owner names the phase                                                   | consequence of DEC-56 (owner, 2026-10-25); ADR 0018 point 4                                                                                                                                        | n: records the owner's scope decision; schedules nothing                                                      | pending owner; group (i), for the merge                             |
  | T-116 | MVP requirements, coverage note, naming items (`docs/requirements/06-mvp-requirements.md:362`)                                                                                                                                                               | "rename Warrior and Flying"                                               | decided (DEC-48), held in content                                                                                          | roster audit (OD-38); DEC-48                                                                                                                                                                       | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-117 | CP-13, requirement (`docs/requirements/02-coding-principles.md:218`)                                                                                                                                                                                         | "`Warrior` (rename pending)"                                              | a class such as `Warrior` (the class name is decided, DEC-48)                                                              | roster audit (OD-38); DEC-48. CP-13's "Why" line (placeholder names keep their "(rename pending)" note) is the owner's own rule text and is now stale; flagged, not edited                         | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-118 | MVP requirements, FR-047, statement (optional) (`docs/requirements/06-mvp-requirements.md:127`)                                                                                                                                                              | the class names listed                                                    | three classes, pointed to in content (the same requirement)                                                                | roster audit (OD-38) (optional); DEC-48                                                                                                                                                            | n: wording only                                                                                               | pending owner (optional)                                            |
  | T-119 | 04 §5, `EntityDefinitionBase` sketch comments (`docs/architecture/04-entity-architecture.md:183`)                                                                                                                                                            | 'warrior', never renamed once used; 'Warrior (formerly Assault)'          | points to 17 R26; no example name                                                                                          | roster audit (OD-38); DEC-48                                                                                                                                                                       | n: comments only                                                                                              | pending owner; group (i), for the merge                             |
  | T-120 | 04 §6, registry sketch (optional) (`docs/architecture/04-entity-architecture.md:235`)                                                                                                                                                                        | three class lines                                                         | one placeholder line                                                                                                       | roster audit (OD-38) (optional)                                                                                                                                                                    | n: a sketch                                                                                                   | pending owner (optional)                                            |
  | T-121 | 04 §13, shipped kinds (`docs/architecture/04-entity-architecture.md:341`)                                                                                                                                                                                    | the class ids listed                                                      | points to `LEGEND_KINDS`                                                                                                   | roster audit (OD-38)                                                                                                                                                                               | n: status text                                                                                                | pending owner; group (i), for the merge                             |
  | T-122 | 05 §12 sketch, `Loadout.specId` (`docs/architecture/05-abilities-weapons-and-loadouts.md:672`)                                                                                                                                                               | "post-MVP specialisation; null in the MVP"                                | null until the gameplay is built; the pick is setup data elsewhere                                                         | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n: a comment                                                                                                  | pending owner; group (i), for the merge                             |
  | T-123 | 17 R26, when (`docs/architecture/17-extension-recipes.md:512`)                                                                                                                                                                                               | two decided names as placeholders                                         | generic                                                                                                                    | roster audit (OD-38); DEC-48                                                                                                                                                                       | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-124 | 17 §11, anti-recipe A7 (`docs/architecture/17-extension-recipes.md:550`)                                                                                                                                                                                     | `Assassin extends Warrior`                                                | `<Legend> extends <Class>`                                                                                                 | roster audit (OD-38); ADR 0018 point 4                                                                                                                                                             | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-125 | architecture 18 §2 table, bot Legend row (owner SamarjitBhogal) (`docs/architecture/18-minion-system.md:51`)                                                                                                                                                 | the class ids listed                                                      | every playable class (`LEGEND_CLASSES`)                                                                                    | roster audit (OD-38); ADR 0018 point 4                                                                                                                                                             | n                                                                                                             | pending SamarjitBhogal (owner of architecture 18)                   |
  | T-126 | backlog, Flying class row (`docs/plan/backlog-post-mvp.md:48`)                                                                                                                                                                                               | "(rename pending)"                                                        | shown locked; DEC-48                                                                                                       | roster audit (OD-38); DEC-48                                                                                                                                                                       | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-127 | phase 4 plan, intro (`docs/plan/phase-4-legends-abilities-and-loadouts.md:24`)                                                                                                                                                                               | the three class names, one "(rename pending)"                             | points to content                                                                                                          | roster audit (OD-38); DEC-48. Exit criterion 3 (every "(rename pending)" note still visible in content display names) is stale after DEC-48; flagged, not edited                                   | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-128 | reference 10, placeholders table, Warrior row (`docs/reference/game-design/10-art-and-lore.md:86`)                                                                                                                                                           | open                                                                      | decided; in content                                                                                                        | roster audit (OD-38); DEC-48                                                                                                                                                                       | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-129 | reference 10, placeholders table, Flying row (`docs/reference/game-design/10-art-and-lore.md:87`)                                                                                                                                                            | open (idea-pending)                                                       | decided; in content                                                                                                        | roster audit (OD-38); DEC-48                                                                                                                                                                       | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-130 | reference 11, scope table, the Flying, mounts and sub-classes row (`docs/reference/game-design/11-mvp-scope.md:65`)                                                                                                                                          | sub-classes post-MVP                                                      | a sub-classes row, MVP (DEC-56)                                                                                            | roster audit (OD-38); consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                    | n: the owner's decision                                                                                       | pending owner; group (i), for the merge                             |
  | T-131 | reference 11, long-term list (`docs/reference/game-design/11-mvp-scope.md:155`)                                                                                                                                                                              | "needs a new name", sub-classes                                           | name decided; sub-classes dropped (MVP, DEC-56)                                                                            | roster audit (OD-38); DEC-48; consequence of DEC-56 (owner, 2026-10-25)                                                                                                                            | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-132 | reference 11, scope table, classes row (optional) (`docs/reference/game-design/11-mvp-scope.md:64`)                                                                                                                                                          | the class names listed                                                    | points to content                                                                                                          | roster audit (OD-38) (optional)                                                                                                                                                                    | n                                                                                                             | pending owner (optional)                                            |
  | T-133 | glossary, Class row (optional) (`docs/reference/glossary.md:62`)                                                                                                                                                                                             | the class names listed                                                    | points to content                                                                                                          | roster audit (OD-38) (optional)                                                                                                                                                                    | n                                                                                                             | pending owner (optional)                                            |
  | T-134 | reference README, reference 01 entry (`docs/reference/README.md:36`)                                                                                                                                                                                         | "post-MVP sub-classes"                                                    | aligned with T-103                                                                                                         | roster audit (OD-38); consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                    | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-135 | reference README, more-abilities entry (`docs/reference/README.md:54`)                                                                                                                                                                                       | "post-MVP Flying and sub-class ideas"                                     | aligned with T-111                                                                                                         | roster audit (OD-38); consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                    | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-136 | CONTRIBUTING §2, naming table, content ids (`CONTRIBUTING.md:28`)                                                                                                                                                                                            | "never renamed once used"                                                 | once a save or a release stores them                                                                                       | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist; roster audit (OD-38) (its note on id permanence)                                | n: unchanged once saves exist                                                                                 | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-137 | CP-13, requirement, content ids (`docs/requirements/02-coding-principles.md:218`)                                                                                                                                                                            | "never renamed once used"                                                 | once a save or a release stores them                                                                                       | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist; roster audit (OD-38) (its note on id permanence)                                | n                                                                                                             | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-138 | 02 §4 naming table, content id (`docs/architecture/02-code-structure.md:129`)                                                                                                                                                                                | "never renamed once used"                                                 | once a save or a release stores it                                                                                         | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist; roster audit (OD-38) (its note on id permanence)                                | n                                                                                                             | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-139 | 05 §2 sketch, `AbilityDefinition.id` (`docs/architecture/05-abilities-weapons-and-loadouts.md:87`)                                                                                                                                                           | "never renamed once used"                                                 | once a save or a release stores it                                                                                         | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist; roster audit (OD-38) (its note on id permanence)                                | n: a comment                                                                                                  | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-140 | 16, skills table, `new-content` (`docs/architecture/16-agentic-harness.md:176`)                                                                                                                                                                              | "ids never renamed"                                                       | once a save or a release stores them                                                                                       | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist; roster audit (OD-38) (its note on id permanence)                                | n                                                                                                             | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-141 | reference 08, a saved loadout with a renamed id (`docs/reference/game-design/08-loadout.md:85`)                                                                                                                                                              | "never renamed once used"                                                 | once a save or a release stores them                                                                                       | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist; roster audit (OD-38) (its note on id permanence)                                | n                                                                                                             | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-142 | suggestions README, rule 4 (`docs/reference/suggestions/README.md:46`)                                                                                                                                                                                       | "never renamed once used"                                                 | once a save or a release stores them                                                                                       | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist; roster audit (OD-38) (its note on id permanence)                                | n                                                                                                             | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-143 | naming suggestions, in-code convention, rule 3 (`docs/reference/suggestions/naming.md:313`)                                                                                                                                                                  | "never change once used"; IDs stored in saves, replays and test fixtures  | once a save or a release stores them; until then a checked content refactor                                                | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist; roster audit (OD-38) (found when round B8 was checked)                          | n: unchanged once saves exist                                                                                 | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-144 | naming suggestions, sketch, the `id` comment (`docs/reference/suggestions/naming.md:322`)                                                                                                                                                                    | "never renamed once used"                                                 | once a save or a release stores it                                                                                         | ADR 0018 point 5 (DEC-56; OD-36): no saves or release yet, so an id rename is a content refactor until they exist; roster audit (OD-38) (found when round B8 was checked)                          | n: a comment in a sketch                                                                                      | pending owner; the wording waits for INBOX HC-Q18 (4)               |
  | T-145 | phase 2 plan, sprint 2.8, new task after the HUD `HealthBar` task (`docs/plan/phase-2-structures-and-combat.md:216`)                                                                                                                                         | (no task: the interim control has no scheduled replacement)               | a `ui/hud/` control and a `leave-interior` intent in sprint 2.8                                                            | critic run 2 game-data-06; CD-22, DV-119; the owner's PR #34 review (an interim ships only with its replacement scheduled)                                                                         | n: schedules the design's own path (13 §3, §5, §9); adds no gameplay                                          | pending owner                                                       |
  | T-146 | MVP requirements, FR-090, acceptance (`docs/requirements/06-mvp-requirements.md:192`)                                                                                                                                                                        | the display name in one place in `ui/`                                    | in one place, core content                                                                                                 | AGENTS.md rule 11 and 02 §7, §10 (display names are core content); critic run 2 game-data-02, reworked in `61401b2` and `e93e61e`                                                                  | n: follows rule 11; the name itself stays a working name                                                      | pending owner; group (i), for the merge                             |
  | T-147 | naming suggestions, Warrior section, a note under the heading (`docs/reference/suggestions/naming.md:24`)                                                                                                                                                    | a recommendation, proposed                                                | decided (DEC-48); the name is in content; the options kept as the record                                                   | DEC-48; ADR 0018 point 4; 17 R26 (its docs step records the pick in the naming suggestions); /pr-review (2026-10-27) pr-core-bridge-01                                                             | n: records the owner's decision                                                                               | pending owner; group (i), for the merge                             |
  | T-148 | naming suggestions, Flying section, the heading and a note under it (`docs/reference/suggestions/naming.md:37`)                                                                                                                                              | "(rename pending)"; a recommendation, proposed                            | decided (DEC-48); the name is in content; still post-MVP                                                                   | DEC-48; ADR 0018 point 4; 17 R26 (its docs step records the pick in the naming suggestions); /pr-review (2026-10-27) pr-core-bridge-01                                                             | n: records the owner's decision                                                                               | pending owner; group (i), for the merge                             |
  | T-149 | naming suggestions, summary table, Warrior (class) row, recommended pick (`docs/reference/suggestions/naming.md:276`)                                                                                                                                        | a recommended pick                                                        | decided (DEC-48), in content (the Warrior section names the file)                                                          | DEC-48; ADR 0018 point 4; 17 R26 (its docs step records the pick in the naming suggestions); /pr-review (2026-10-27) pr-core-bridge-01                                                             | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-150 | naming suggestions, summary table, Flying (class) row, recommended pick (`docs/reference/suggestions/naming.md:277`)                                                                                                                                         | a recommended pick                                                        | decided (DEC-48), in content (the Flying section names the file)                                                           | DEC-48; ADR 0018 point 4; 17 R26 (its docs step records the pick in the naming suggestions); /pr-review (2026-10-27) pr-core-bridge-01                                                             | n                                                                                                             | pending owner; group (i), for the merge                             |
  | T-151 | architecture README §4, D11 row, "Recorded in" (`docs/architecture/README.md:136`)                                                                                                                                                                           | ADR 0006                                                                  | ADR 0006 and ADR 0018                                                                                                      | ADR 0018 "Documents amended on acceptance" (the D11 row; accepted as the owner corrected it, DEC-56); /pr-review (2026-10-27) pr-docs-process-14                                                   | n: names the ADR the row already cites                                                                        | pending owner; group (i), for the merge                             |
  | T-152 | phase 6 plan, sprint 6.3, new task after the "Audio and announcer" task (`docs/plan/phase-6-hardening-balance-and-release.md:143`)                                                                                                                           | (no task)                                                                 | a task for the UI enhancements follow-up (`docs/plan/ui-enhancements-plan.md`): UE-03 first, then the ones picked in HC-S5 | INBOX HC-S5 (unanswered); OD-26 and OD-31 (a new task in the owner's plan waits for him, as T-145 does); /pr-review (2026-10-27) pr-docs-process-05 (applied in `97f801b`, taken out in round B13) | n: schedules a follow-up; adds no gameplay                                                                    | pending owner; waits for INBOX HC-S5                                |
  | T-153 | 14 §11, the progress bullet (`docs/architecture/14-persistence-and-resources.md:443`)                                                                                                                                                                        | "ends at the manifest sum"                                                | ends at the manifest sum when every file loads, below it with a failed file (only a loaded entry's loaded files count)     | factual: `ResourceController` since `4a6dec6`, pinned by the test "warns once for a failed rendition and serves its key with the entry url"; the /pr-review's repair-delta review                  | n: byte-based and monotonic stay. Your call: count a failed file as loaded instead                            | pending owner                                                       |
  | T-154 | decisions log, DEC-49 row, "Affects" column (the core files) (`docs/reference/game-design/13-owner-decisions-log.md:55`)                                                                                                                                     | the content rules `defaultContentRules.ts` and `SpecClassExistsRule.ts`   | adds `RoleRatingRangeRule.ts`, the rule that keeps every Legend role rating from 0 to 1                                    | `42bb212` (/pr-review (2026-10-27) pr-ui-screens-04), a rule on the Legend specs DEC-49 added; the log's Purpose (a decision lists what it affects); 04 §5 (one rule class per check)              | n: a file pointer; the decision text is unchanged                                                             | pending owner; group (i), for the merge                             |

- [ ] **HC-B1 — Better than the design, or new, for sign-off (`feat/hud-and-character-select`; asked
      after the pre-PR critic).** Reconciled on 2026-10-24 with the branch's deviation table (the DV
      rows in `docs/changelog/pr-feat-hud-and-character-select.md`) and with the pre-PR critic's first run, whose ids (BD
      better than the design, NF new feature) come first where both name an item. **Asked here:**
      BD1, `loadDisplayContent()` replaces `loadDefaultContent()` as the client's display source, a
      new public core export that validates the Legends and the Legend specs; Legends are then
      validated in two places, so DEC-22's "runs once" wording gets an appended note if you approve
      (the log is never rewritten); text: HC-T1 T-09, T-42, T-51, T-55. BD2, the asset manifest
      split into one file per asset group, still one `ASSET_MANIFEST` with tests for the joining and
      the hashes (DV-131; T-35, T-43, T-44, T-48). NF2, the `ResourceController` surface, which
      differs from 14 §11's sketch: `urls`, `isLoaded` and `progress`, the `ui-image` and `font`
      asset types (DV-39 images the DOM shows reach React as URLs through the store; DV-40 a `font`
      type and `FontLoader` for Cinzel, DEC-51), seven asset groups with layout-only art and the
      Figma plates in their own groups (DV-46), entries with a 2x file and per-use renditions and
      the pixel density fixed per session (DV-42, DV-122), an injected warning callback, and no
      `get` or `AssetCache` yet; a failed asset is warned about, not raised as a typed error
      (architecture 14 §14; T-30 to T-34). NF3, `game/content/` as the client's presentation layer:
      the code fix that keeps it inside its layer is done (`main.tsx` passes the asset ids in), so
      you sign only its 02 §3 row (T-89). NF5, a second, ui-only path that matches the current bindings for screen prompts and
      the pause key, because no `Match` exists outside the match (T-90). DV-01, the match world
      prepared in `match-loading` and the `Match` built from it when the viewport attaches,
      `attachViewport` returning its detach (a refinement of 13 §2's sketch under DEC-50; T-07,
      T-08). DV-22 and DV-23, new bridge messages (`structure-state`, `asset-urls`, `credits`), the
      first definition of `CapturePointSnapshot`, and an `assetsSlice`. DV-55 and DV-56, the
      selection screens as one 1920 × 1080 artboard scaled as a whole and the HUD sized by its own
      unit, both with a text floor. DV-93, the structure strip, objective tracker and crystal.
      **Asked in another item**, listed so that nothing is missed: NF1, the weapon-level bar and the
      ultimate's pips, which show "no data" until OQ-63 and OQ-64 give them a rule (DV-19; HC-Q2);
      NF4, the alternate layout's previous and next arrows, View Details confirming the shown class
      and answering your `gadget-2` key, provisional defaults until you answer (DV-37, DV-70, DV-71;
      HC-Q5, HC-F7); DV-65 (the arrow keys move focus and pick, HC-F1); DV-69 (Legend tiles bordered
      by the Legend's accent, HC-F3); DV-79 and DV-82 (one- and two-Legend layouts and the states
      your frames do not draw, HC-C1); DV-104 (the new reference doc 15, HC-T1). **New since the
      table, for the record:** the bar fades are colour functions over tokens kept in
      `styles/global.css` (relative colour for health and aether, `color-mix` for the cream bars;
      OD-25), so the modules still name tokens only; the minimap ring is written once in `bridge/`
      and passed into the canvas view (OD-13). DV-132 to DV-136 are your own directions of
      2026-10-17 (DEC-49, DEC-54, DEC-55), listed for the record and not asked again. Approve each,
      or say what to change. **Since the `/pr-review` of 2026-10-27, this item is a merge
      precondition** (pr-docs-process-09): ADR 0010 and the pull request template expect
      better-than-design items to be signed off and folded into the docs within the pull request.
      Sign it before the merge, or defer it explicitly; the pull request's description then says so.
- [ ] **HC-C1 — The differences from your Figma, for review (asked after the pre-PR critic).** Every
      place the build differs from your frames on purpose is registered in
      `docs/reference/game-design/15-figma-frames-and-creative-decisions.md` (DEC-53), so the visual
      audit does not flag it. Rows are `forced`, `fill-in`, `approximation`, `normalised`,
      `conflict`, `creative` (none on this branch) or, new, `floor`: a rendering difference between
      Chrome and Figma that no code value can reach, listed with its numbers. Review CD-01 to CD-38:
      keep, change or reject each. CD-12 and CD-20 are withdrawn. In particular: (1) **CD-25:** no
      render outside your frame reproduces the level number's grain, so the "42" grain is drawn by
      an SVG noise filter. Please sign off CD-25 and its mask on the level number (80, 807, 72 ×
      63): the visual audit applies that mask only after you sign, and until then reports the "42"
      unmasked (10.98 % of its pixels over the threshold; its ink box and colour are exact). A
      closer option is offered in HC-S4. (2) **CD-26 and your 58:271:** since you edited the frame
      (between 2026-10-17 and 2026-10-18), its card title 55:257 reads "Oracle", but the panel
      subtitle 57:35 ("Cantor · Support") and the description 56:35 ("… The Cantor bends the Aether
      …") still say Cantor. The audit follows your current frame and masks the panel subtitle,
      because the role line is built from the shipped title. Should those two read Oracle? Then the
      audit's 56:35 override and the 57:35 mask go. CD-26 also includes one copy edit the recorder
      made as a consequence of the Oracle rename, not stated by you: the shipped description reads
      "The Oracle bends…". (3) **CD-28:** your slot meanings of 2026-10-18 (red fill = on cooldown,
      gold glow = ready); the default to confirm is that the red fill shrinks towards the bottom as
      the cooldown runs. (4) **Floors, CD-29 to CD-35**, with every number in reference 15 §4: 50
      text regions (OD-18); 11 glow regions after the measured blur (OD-27); 7 thin-stem text
      regions; the three objective letters, up to a pixel low; the two small Legends-strip names; 9
      hairline strokes; and 35 containers that differ only by the text they hold. One region is not
      a floor: Select Class's label glow (p95 7.81, above the glow floor's 5.5 bound) is listed as
      an open residual; accept it as it is, or ask for a fix. Every other region of your four frames
      has a ruling. (5) **CD-36:** a panel title too wide for its panel (three of today's titles,
      measured in reference 15) shrinks to fit, never below 64 px. (6) **CD-37:** the battle axe now carries the
      Noise grain you added after 2026-10-19, taken from your own frame's pixels; a later edit to
      62:241 needs a new extraction. (7) **CD-38:** a Magus player's weapon panel shows the staff
      art, centred at its native size in the weapon art's box (OD-37); your HUD frame draws only
      one class's weapon, so there is no original to keep live. Keep it, or say if the panel should
      stay empty. CD-21 is resolved by your answer to HC-Q13 (DEC-55), and CD-27
      records your direction on the effects renderers (DEC-54). The agents' scratch nodes 140:2 and
      140:3 on page 96:2 join the others there for you to delete with the page. On 2026-10-25,
      having viewed the live host on 2026-10-24, you said: "if the pixel match is looking at what
      i already saw in the live hosted preview, then i think the output is good enough for the
      MVP. i have some functional UI/UX improvements i would like to make but they can wait for
      sprint 3" (OD-39). You then looked at the live host on the current head and confirmed it
      (OD-39a): the axe re-export (CD-37) is "fine as is", and the measured glow is fine for the
      MVP. At your "sure, check it", the Legend title centring was checked: the title is centred,
      and its ink box matches your 58:271 on all four sides. CD-25's mask, CD-30 and CD-38 go to
      Sprint 3 with your UI/UX list (HC-U1). The rows still wait for your keep, change or reject;
      tick this item when you have reviewed them.
- [ ] **HC-Q1 — The Legends (DEC-49), still open after your answer of 2026-10-17** (the answered
      part is in Done). (1) Do the game doc's Magus focuses carry over to the new Legends
      (reference 01's Necromancer "debuff focus", Druid's buffs, Mage's self focus), and what role
      labels do Catalyst and Necromancer get (Oracle's is "Support", from the Figma's Cantor)?
      (OQ-69) (2) Descriptions and detail rows (Signature, Specialty, Ultimate) for Catalyst and
      Necromancer: is Aetheric Recall every Magus Legend's signature? (3) The Damage, Support and
      Control ratings: the build carries the Figma's Cantor values on Oracle as `TUNE` placeholders
      (about 0.38, 0.84 and 0.51); keep them, and what are the other Legends' ratings? (OQ-67)
      (4) Names for the Legionnaire's Legends (Velite, Centurion, Praetorian) and the Sentinel's
      (Colossus, Juggernaut): none exist yet, so their cards show the sub-class title alone. Give
      each Legend's Light name when you have it (and its Dark name, or confirm that it is the Light
      name spelled backwards), and the art they should use (stand-ins until then). (OQ-69)
      (5) ADR 0018: answered 2026-10-24 and corrected 2026-10-25, accepted as corrected (DEC-56;
      Done).
- [ ] **HC-Q2 — HUD rules your Figma implies (OQ-63 to OQ-66).** (1) Weapon level (62:258): what
      earns it, how many levels, what a level changes, per weapon or per match? No doc defines it.
      (2) Ultimate (62:246, 65:722): are Low, Mid and Max castable tiers, or one meter that must
      fill (05 §6)? What do the three charge pips count, and how does an ultimate that is not
      charged look? Default (CD-28): the plain frame with its icon dimmed, and the red fill only
      while a cooldown runs. (3) Objectives (62:425): does the bar under a shield show
      capture progress or hold strength, does it take the capturing team's colour, does it need
      checkpoint ticks, and how do a contested point and a point locked by a mini-boss look?
      (4) The clock "14:32" (65:604): elapsed match time (default, FR-010) or a countdown (to the
      gem or the score cap)? Does the crystal change during the match? (5) Answered by your slot
      meanings of 2026-10-18 (OD-9, register CD-28): the gold glow is the "ready" look of every
      slot, abilities included, and the red fill is the cooldown.
- [ ] **HC-Q3 — Which abilities your Figma's icons and names are (OQ-68).** The HUD shows a
      Legionnaire with Meteor (a Sentinel ultimate in the docs), Atom, LinkBreak and Aperture
      (Phosphor placeholders), a battle axe and the gadgets "Courage" and "Sword". The class screens
      name Aetheric Recall, Staff Proficiency and Arcane Intellect (Magus) and Unison Ward and
      Severed Accord (the Figma's Cantor, now Oracle), none of which the docs have. Map each to a
      documented id (for example, is Aetheric Recall the Magus's Revive?), or confirm it is new;
      until then they are display data only. Also: the emblem, weapon and first-gadget art for the
      Sentinel's and the Magus's HUD, which the Figma draws only for the Legionnaire.
- [ ] **HC-Q4 — The structure strip (62:303, 65:542).** (1) Are the names right? The HUD shows the
      Figma's layer names (Stronghold, "Production Tower" for the spawner tower, "Buff Tower" for
      the buff tower, one "Wall" tile for every wall segment and gate, Capture Point, Cathedral);
      gates have no name of their own and turrets are not shown. (2) How does a destroyed structure
      look, and should shield bars show? Neither is built until the game has the data. (3) Should
      the enemy bars fill right to left, mirroring their icons?
- [ ] **HC-Q5 — The alternate class layout (62:70, DEC-52).** It has no class cards, ally tiles or
      Select button: the build adds previous and next arrows, and View Details confirms the shown
      class (default; register CD-10). What should View Details open (no design exists)? Which
      Magus description is canonical, 72:748 (the primary layout's, used by default) or 62:82? The
      layout also has its own labels ("Signature / Proficiency / Specialty"): keep each layout's
      own text (default) or share one?
- [ ] **HC-Q6 — Visual details your frames leave open (defaults applied).** (1) The picked card is
      the enlarged one, hover and focus preview a card, and there is no default pick: right? Is the
      hover cue the same look as selected, and is the focus ring right (drawn over the backdrop,
      never on the cream outline)? (2) Does the Select Class glow follow the class colour (default:
      fixed blue, as drawn)? (3) Is the countdown always red? (4) The minimap circle: the whole map
      inscribed (default), a cover crop, or centred on you? (5) Health and aether: the current value
      only (as drawn) or current/max? (6) Avedrin's border: #9b32f3 (on screen; default) or
      #8a898f (the stand-alone portrait)? (7) The Legend role line takes the Legend's accent and
      the rating fills end at a fixed colour, as drawn (defaults); one refraction art per Legend, or
      the Figma's for every Legend (default until more art exists)? (8) Keep the frames'
      hand-placed offsets and asymmetries (default) or tidy them?
- [ ] **HC-Q7 — Scope and docs questions from this branch.** (1) Your Figma art ships now (DEC-51),
      but 10-art-and-lore and 11-mvp-scope list "High-quality character art on the selection screen"
      as post-MVP, and the MVP requirements' FR-111 says that art "is not built"; the branch treats
      it as MVP because it is your own art (the recorder's reading, not your words): confirm or say
      otherwise. Your answer also decides FR-111's wording. The pre-PR critic's second run makes
      this a merge precondition (C-02, ui-hud-components-assets-04) and asks that DEC-51 or the
      About screen's credit state the terms of the tools the art was made with (Nano Banana
      (Gemini), Figma's image model and Tripo Studio, as the credit names them): which terms apply?
      (2) The selection screens' asset groups are `selection` and its per-layout and plate groups
      (the code and 13 §2), not 14 §11's `menu` (audit AS-8): confirm. (3) The Cinzel OFL and
      Phosphor MIT texts sit beside their files in the repo; to ship them inside the built game the
      About screen lists the manifest's licences (13 §3, plan 5.3): do that now (default) or in 5.3,
      and how should the credits word your own art? (4) Should DEC-53's rule also be a line in
      `AGENTS.md`'s pre-PR gate? (5) Cinzel is used on the new screens only (token `--font-game`);
      should the menus switch to it too (default: no, they keep `--font-display`)? **Since the
      `/pr-review` of 2026-10-27** (pr-ui-hud-components-assets-03), the credit wording in (3) goes
      with (1) before the merge: it replaces the agent-drafted notice marked `TODO(sam)` in the
      About screen's credits (`apps/client/src/data/resources/assetLicences.ts`).
- [ ] **HC-Q8 — Match runtime (confirm).** Pause is built as ES-11 requires: in single player the
      pause overlay stops the simulation and the rendering, and held keys are released. Confirm.
      (1) Route `Simulation.step()` exceptions to the session next (audit AC-1 point 2)? (2) Accept
      audit AC-21 and the 09 §2 wording (the open item "F → session H / the `Match` owner" below)?
      (3) The open item "Session C → Sam (2026-10-08), better than the design? (a)" below: the
      release of held input on focus loss (blur, visibilitychange) stays outside `Match`, in
      `MatchHost`. Is that the answer (then 09 §2 says so), or should the release move into
      `Match`?
- [ ] **HC-Q9 — Behaviour your frames do not show (defaults applied; veto).** Esc on the class step
      does nothing; the Legends strip on the class step is informational, not clickable; after
      LOCK IN the screen leaves at once, with no waiting state.
- [ ] **HC-Q10 — New copy for your approval.** "Choose a class first.", "Choose a Legend to lock
      in.", "Legends to come", "You are on the {team} team", "1 Ally", "No data yet", "Match could
      not start.", "Loading failed.", "Leave cathedral". Keep each, or give your wording.
- [ ] **HC-Q11 — Only if a tooling check fails (asked only then).** If the test runner cannot read
      the asset files in its Node environment, approve an ADR adding a zero-dependency
      `scripts/assets/check-asset-manifest.mjs` to `npm run check`.
- [ ] **HC-Q12 — Which class ids the match accepts.** `PlayerChoice.legend` takes the open class id
      (default, guarded by the catalogue check and a spawn test), or should core export its
      `LegendKind` values (a core API change)?
- [ ] **HC-Q14 — Minimum text size below 1080p.** Text never renders smaller than
      `--text-min: 12px` (default; ES-11 asks a minimum size for HUD text, and the selection
      screens follow it; register CD-23): keep 12 px, give another value, or none on the selection
      screens?
- [ ] **HC-Q15 — Exactness costs bytes.** Every 1x image file the visual audit compares is lossless
      (lossy WebP at quality 90 alone fails the backdrop), including the two row plates and the
      button-chrome plates. The branch reports the measured group sizes at device pixel ratios 1 and
      2, per effects renderer (`'css'` loads no plate). Accept them (default), or allow lossy 1x
      files for named assets, with their regions listed as not exact? Measured group sizes in bytes
      at device pixel ratio 1 / 2 (pinned in `ResourceController.manifest.test.ts`): boot 25,888 /
      25,888; selection 4,055,862 / 1,905,016; selection-primary 795,914 / 865,606;
      selection-alternate 456,024 / 587,480; selection-raster 867,022 / 243,798;
      selection-primary-raster 1,041,660 / 281,268; match 141,646 / 359,902 (with the battle axe's
      new grain, OD-28). The `'css'` effects renderer loads neither raster group.
- [ ] **HC-Q16 — One Legend's Dark name is derived, not stated (flag; DEC-49).** The Dark name in
      `packages/core/src/content/legends/specs/catalyst.ts` (its `legendName.dark`, marked
      `TODO(sam)`) was derived from your mirror rule (the Light name spelled backwards); you stated
      the other named Legends' Dark names yourself (DEC-49). Confirm it, or give the Dark name. No
      other name or title is flagged: the sub-class titles in that folder are used exactly as you
      gave them.
- [ ] **HC-Q17 — Sub-class gameplay: which phase builds it? (DEC-56, ADR 0018).** Sub-classes
      are MVP, and this branch ships the Legend pick as setup data only: nothing in a match reads
      it yet. Their gameplay (the `LegendSpecDefinition` fields a class consumes: stat modifiers,
      ability overrides, a pick-up and a skin; architecture 17 R2) is MVP scope, but no phase
      schedules it. `docs/plan/backlog-post-mvp.md` still lists sub-classes as post-MVP, and phase 4
      sprint 4.1 has only the extension point. Name the phase (and sprint), and agents add the
      tasks and move the backlog row.
- [ ] **HC-Q18 — Making roster changes cheap: four decisions (not urgent; they save time later;
      OD-38).** An audit renamed a sub-class title, a Legend name, a class display name and a
      Legend id on scratch copies to see what each change touches. The cheap fixes are now built in
      this pull request (team names, name guards and test pins read from content; a stale or
      unknown id fails loudly). Four need you:
      (1) **The art-id prefix guard.** A test in `game/content/coreCatalogue.test.ts` requires every
      Legend art id to start with its Legend's id (plan ruling I-82). Before the fixes, the audit
      found that renaming one of the named Legends' ids touches 39 files (23 text files and 16
      renamed images), all failing loudly until fixed. Recommendation: replace only that prefix
      check with the content-driven name guard this branch adds, keep the rest of I-82, and record
      the change. Agents may not change a guardrail without you. A trial after the fixes found a
      limit: once `oracle` stops being an id, the new name guard sees "oracle" only as a title, so
      it flags every `oracle-*` art id and the `--legend-oracle-accent` colour token, which is 7
      asset ids in 20 image files and 1 token (the audit counted 5 ids and 16 files). Replacing
      only the prefix check would not shorten that rename (inferred, not run). The same holds for
      `catalyst` and `necromancer`, whose ids equal their lower-cased titles. The recommendation
      shortens a rename only when the id and the title change together.
      (2) **Class id versus entity kind.** Today a class's content id is also the entity kind that
      spawns it. Option A: spawn by the definition's `kind`, as the mobs already do (the
      `light-minion` definition has kind `light-mob`), so renaming a class id is a content edit plus
      one presentation key. Option B: keep id = kind and enforce it with a content rule.
      Recommendation: A. Until you answer, a player spawn the match refuses logs an error naming
      the class id instead of failing silently.
      (3) **Prose that names itself.** Some content text repeats a name it belongs to (the
      `oracle` spec's description; the Magus class file's copy). The content tests now fail if a
      rename leaves the old word behind. The alternative is to fill the name into the prose from
      content, but "Magus focus" shows why that may not read well. Your call.
      (4) **How far "renamable until a save or a release stores it" reaches.** ADR 0018 point 5
      says it for Legend ids. Does it cover every content id? Your answer decides the wording of
      HC-T1 rows T-100 to T-102 and T-136 to T-144 (`AGENTS.md`, `CONTRIBUTING.md` and the docs
      that say "never renamed once used"). The fixes already apply point 5 to the locked class's
      id too (the TSDoc in `packages/core/src/content/legends/locked/lockedClasses.types.ts`,
      citing HC-F2), so your answer may change that comment as well.
      No answer needed: the About screen's provenance strings and credits stay as the record of
      where the art came from (DEC-51), and the asset `legionnaire-legend-portrait` is renamed to
      `warrior-legend-portrait` (its four files moved with checksums).
- [ ] **HC-Q19 — The minimap's click intent, its visibility setting and the M key (not urgent;
      pre-PR critic, run 2: ui-hud-components-assets-02).** (1) A click on the minimap is handled by
      the canvas, which moves the camera there (`Match`), because the canvas draws the minimap
      inside the HUD's ring (architecture 06 §10). Architecture 13 §3 and §5 design a
      `minimap-click` intent from `MinimapPanel` instead. Keep the canvas path (its design text then
      changes, a row for your approval) or build the intent? (2) The `minimapVisible` setting (13
      §3, `settingsSlice.hud`) is not built, and the `toggle-minimap` binding (M) has no handler, so
      pressing M does nothing; no plan task builds either. Which sprint? Recommendation: (1) keep
      the canvas path, because the canvas draws the minimap and hit-tests the click; (2) Phase 5,
      sprint 5.4 (settings and keybindings), with the M handler in the same task.
- [ ] **HC-Q20 — JavaScript bundle size (not urgent; decide in Sprint 3; pre-PR critic, run 2:
      build-01).** The boot bundle is 556.27 kB (gzip 173.96 kB) at `a9e8295`, against 385.94 kB at
      the branch's base, and Vite warns above 500 kB. Images are no longer inlined into it: each
      loads with its own asset group (architecture 14 §11). The rest of the growth is code: the
      asset manifest's data (about 65 kB) and the new screens, components and HUD (about 70 kB).
      Option: load the character-select and HUD code lazily (`React.lazy` or a dynamic import per
      screen), so the boot bundle holds only what the menus need. Recommendation: decide in Sprint
      3; it does not block the MVP.
- [ ] **HC-Q21 — Merge order with the nine open sibling pull requests (decide before either side
      merges; /pr-review of 2026-10-27: pr-integration-04).** Besides this one, nine open pull
      requests target `phase/2-sprint-2-work`: the minion stack (`feat/minion-m1-marching`,
      `feat/minion-m2a-brains-perception`, `docs/minion-plan-all-enemy-ai`,
      `feat/minion-m2b-minion-controller`, `feat/minion-m3-bot-laners`,
      `feat/minion-m4-flow-fields`, `feat/minion-m5a-modifiers`, `feat/minion-m8-rover-astar`; M1 is
      under all of them, M8 is built on M3) and `feat/weapons` (#42). This branch conflicts with all
      nine. The text conflicts are `Match.ts`, `Match.constants.ts`, `Match.test.ts` and
      `useMatch.ts` (deleted here, changed there) on every minion branch, `PROGRESS.md` on all nine,
      `last-reviewed` in architecture 05 and 06, and an import block in `defaultContentRules.ts`
      with `feat/weapons`. Three conflicts no typecheck or test catches: the map handed to the
      simulation (M1), the bots' roster source and a bot Rover keyed to a fixed team (M3, M8), and
      the HUD's weapon art (`feat/weapons`, HC-Q22). The PR register's "Integration recipe"
      (`docs/changelog/pr-feat-hud-and-character-select.md`) gives the resolution of each. Options:
      (a) this pull request merges first, and the minion author resolves at M1, M3 and M8 (plus
      `PROGRESS.md` in all nine), learning `SessionController`, `MatchHost` and `createBrowserMatch`
      from the recipe; (b) the minion stack (M1, M2a, the plan, M2b, M3, M4, M5a, M8) and
      `feat/weapons` merge first, then this branch merges `phase/2-sprint-2-work` once and resolves
      everything in one integration commit (about 3 to 4 hours with the tests, the reviewer's
      estimate, not measured), re-runs `npm run check` and has the critic check the integration
      change. **Recommendation: (b).** The author of this branch wrote the structure that replaces
      `useMatch.ts` and the match setup's rosters, which M8's own plan says replace its placeholder
      roster, so one resolver who knows both sides does it once. Merging is your call (`AGENTS.md`,
      git workflow §4). Either way, `feat/weapons` and the minion stack also conflict with each
      other in core files this branch does not touch.
- [ ] **HC-Q22 — The HUD's weapon art against `feat/weapons`' default weapons (decide when
      `feat/weapons` merges; /pr-review of 2026-10-27: pr-integration-03).** The HUD's weapon panel
      shows art per class, from your Figma (`apps/client/src/game/content/hudPresentation.ts`): the
      `warrior` class shows the battle axe your HUD frame draws (62:241), `sentinel` shows no weapon
      (no art exists yet) and `magus` the staff. `feat/weapons` gives each class a default weapon in
      content: `warrior` the `raptor-talons` (a glove), `sentinel` the `wuuthrad` (a battle axe) and
      `magus` the `magus-staff`, each marked `TUNE` until you pick, and its own INBOX item ("Weapons
      — numbers and default weapons", point 2) asks you which weapon each Legend spawns with. Once
      both are merged, the HUD would show the battle axe for a `warrior` fighting with talons and no
      weapon for a `sentinel` holding the axe, and the weapon's name stays empty, because the
      display content carries no weapons. Architecture 05 §15 already says the HUD's names and icons
      come from the content catalogue resolved at match start, so following the equipped weapon is
      the existing design; the open part is the start weapons. (1) Which weapon does each class
      start with? Your answer also answers point (2) of `feat/weapons`' item. (2) Should the HUD
      show the equipped weapon's art and name (05 §15) instead of art per class? **Recommendation:**
      once `feat/weapons` lands, the HUD follows the equipped weapon (`loadDisplayContent()` carries
      the weapons, the art is keyed by weapon id and the name comes from core); until then it keeps
      the class-keyed Figma art.
- [ ] **HC-S1 — Suggestion, not built: countdown urgency.** At 10 s or less, a stronger glow, a
      1 Hz pulse and screen-reader lines at 10 and 5 s. If you want it, it comes back as a
      `creative` row: a data-selectable variant with your static original kept live (DEC-53).
- [ ] **HC-S2 — Suggestion, not built: HUD value transitions.** 200 ms transitions on the bars, the
      cooldown sweeps and the XP ring between updates. If you want it, it comes back the same way
      as HC-S1, after a paint check on a slowed-down CPU.
- [ ] **HC-S3 — For Phase 5 sprint 5.5 (architecture 13 §7 schedules the accessibility minimums
      there): the in-game reduced-motion setting.** Apply the setting (FR-084) to every
      reduced-motion rule, including the background layers' own rules (today `ThemedBackground`'s),
      not only the global `--motion-*` tokens: one mechanism for the OS and the in-game source,
      with a test that each module's media rule has its in-game twin. Nothing to answer now.
- [ ] **HC-S4 — Better than the design, not built: the level number's grain from your own render
      (OD-3).** CD-25 draws the "42" grain with an SVG noise filter, which cannot place your
      speckles. The asset work of 2026-10-18 also built and measured a hybrid grain field ("option
      A"): your frame's grain, rendered from your file and painted through the digits. On your
      frame's "42" it equals your render, by construction (its glyph pixels are solved from that
      render); on any other number it shows the grain of a duplicate, with your noise's settings
      and statistics but the speckles in other places. When built, it added 1,194 B to the match
      assets (3,022 B at device pixel ratio 2). If you want it, it comes back as a data-selectable
      variant with CD-25's filter kept live (DEC-53), rendered again from your file, because the
      agents' scratch copy no longer exists. Nothing to answer unless you want it.
- [ ] **HC-S5 — The UI enhancements follow-up: choose what to build (pointer).** Your playtest of
      2026-10-24 found the screens working and left visual polish and HUD changes for later (see
      Done). The enhancements suggested so far (HC-S1 to HC-S4 and the research's ideas) are
      specified in `docs/plan/ui-enhancements-plan.md`, each with its trigger, timings,
      accessibility limits, data switch and tests, for one follow-up pull request (unscheduled: its
      task line for Phase 6, sprint 6.3 waits for your answer here as HC-T1 row T-152; your own
      UI/UX list is separate, for Sprint 3, HC-U1). Each keeps your Figma original live, and the
      original stays the default until you say otherwise (DEC-53). (1) Which do you want: UE-01
      countdown urgency, UE-02 HUD value transitions, UE-04 your own grain on the "42", UE-05 card
      hover lift, UE-06 one lock-in flare, UE-07 low-health pulse, UE-08 idle shimmer, UE-09 panel
      cross-fade, UE-10 button motion, UE-11 ready flash, UE-12 level-up flare? UE-03 (your in-game
      reduce-motion setting applied everywhere, HC-S3) comes first whatever you choose. (2) LOCK IN
      leaves the screen in the same click, so UE-06 needs the screen to stay for its 0.6 s, or plays
      on the pre-launch screen instead: which? (3) For each one you want: on by default, or your
      original by default? (4) UE-07's low-health threshold: 25 % (the plan's recommendation) or
      your value? Your polish notes, when you have them, become new rows in the same plan.
- [ ] **HC-U1 — For Sprint 3: your functional UI/UX improvements to the HUD and character select
      (not urgent; you supply the list; OD-39).** On 2026-10-25 you judged the visuals good enough
      for the MVP and said your functional UI/UX improvements can wait for Sprint 3 (HC-C1). Send
      the list when Sprint 3 starts. It is not a defect list and does not block this pull request.
      Three visual residuals travel with it (reference 15): CD-25's mask on the level number
      (HC-C1 (1)), CD-30 (the glow floor and Select Class's open label-glow residual) and CD-38
      (the staff in a Magus player's weapon panel).

- [ ] **Combat — friendly fire (PR #34, `feat/combat-damage-pipeline`).** No reference doc says
      whether allies can hurt each other. The combat pipeline ships `FriendlyFireStep` as the
      default: no damage between entities on the same team (Legends never hurt allies; neutral
      bosses and camps never hurt each other); environment damage and teamless targets (trees)
      always pass. Confirm, or say which hits should go through. Removing it is one line in
      `combat/defaultDamageSteps.ts`.
- [ ] **Combat — better than the design, for sign-off (PR #34).** (1) 05 §9's fixed named
      stages are a list of `DamageStep`s whose order is `combat/defaultDamageSteps.ts`, so a new
      rule is one class and one line; (2) `defaultStrategyRegistry.ts` is a typed record per
      behaviour instead of `registry.register()`, so a missing strategy does not compile;
      (3) `DamagePipeline.apply` takes `GameState`, not `SystemContext`, so handlers and listeners
      can call it. 02, 04, 05 and 17 already describe the built version; approve or say what to
      change.
- [ ] **Combat — `no-death-without-killer` checks a different hole than 15 §3 (PR #34).** The
      15 §3 row checks that every `entity-died` carries a resolvable `DamageSource` (the type
      already forces one). The built invariant checks that every `died` removal had an
      `entity-died` with its killer this tick, which catches `Health` written around the damage
      pipeline (the requirements' "dies without another entity or a defensive tower killing it").
      Proposal: the 15 §3 row covers both, (a) now and (b) "the attacker resolves in the store"
      with abilities. Approve, or say what to change.
- [ ] **Status effects — numbers and rules to confirm (SCRUM-228, PR #35).** Modifiers now
      multiply (`op: 'mul'`, 05 §8), per your review. (1) If you want additive stacking
      instead, say so: it is one line in `StatusEffects.recompute`. (2) `stun` defaults to 1 s
      (more-abilities §7 says 0.5–1 s per source); each ability will pass its own once abilities
      land. (3) Blind spends a basic attack as a miss (`attack-missed`); ability damage still
      lands. (4) Better than the design, for sign-off: the component caches its multiplier
      table when its list changes (05 §8 recomputes per tick), and `StatusEffectApplier` is the
      one way in (05 §3 has effects call `StatusEffects.apply`; 03 names `StatusEffectSystem` as
      the `status-applied` emitter). (5) Not built yet: `polarity`, `controlClass` /
      `control-immune` (stun-lock risk once a producer reapplies stun), `onExpire` (crushed →
      slowed), bleed ignoring shields, concussion's aether cost, blind's vision cut, a max-health
      stat for the FR-029 aura. Confirm or correct.
  - Decision: DEC-40 to DEC-42 (`docs/reference/game-design/13-owner-decisions-log.md`,
    2026-10-16, PR #36). DEC-42's open questions are their own item (PR #36).

## Requests for the agent - THESE SESSIONS ARE NO LONGER AROUND; THESE DECISIONS MUST BE MADE BY UPCOMING SESSIONS

- [ ] **Session C → Sam (2026-10-08, `feat/player-input`):** the keyboard now produces an
      `InputIntent`, but core's `intent` command is still `UnsupportedCommandHandler`
      (`TODO(sholtzman)`), so `Match` turns the intent into `move`/`stop` itself (09 §11). Should I
      write `PlayerController` + the `intent` handler (11 §4.1) in core, or is it yours? Either is
      fine; until then WASD works through `move`/`stop`.
- [ ] **Session C → Sam (2026-10-08), better than the design? (optional, no pressure):** (a) the
      focus-loss release (`blur`/`visibilitychange`) lives in `useMatch` instead of `Match`
      (09 §2), so `Match` uses no browser API (09 §10); (b) devices are polled and mapped inside
      `DeviceIntentSource` behind `Match`'s `IntentSource` port instead of in `Match.tick()`
      (13 §6.2), so `Match` never knows which devices exist. Yes → I update 09 §2 and 13 §6.2;
      no → I move both into `Match`.

- [ ] **Session A (from session B, updated 2026-10-07):** PR #13 merged the phase branch with
      `feat/map-generator`: B's files and `components/TeamMembership.ts` now use `Team` from
      `teams/teams.types.ts`, `polarPoint` and the wall-ring test call
      `utils/deterministicMath.ts`, and `index.ts` exports only `config/`'s `MapConfig`. Left for
      session A, the stand-in swap: `DEFAULT_MAP_CONFIG` → `createDefaultGameConfig().map`;
      `validateMapConfig` → `validateGameConfig` (same rules plus `navCellSize`); `MapRandom` /
      `map/Rng.types.ts` → `SeededRandom` and `utils/Rng.types.ts` (`next()` is `nextFloat()`);
      `DEFAULT_MAP_LAYOUT.navCellSize` → `config.map.navCellSize`; then delete the local
      `MapConfig` in `map/MapGenerator.types.ts`.
- [ ] **Session C (from session B, 2026-10-07; owner-approved, DEC-20):** the simulation kernel
      (PR #13) leaves these to session C. The B-owned lines named here are C's to change, an
      exception to the ownership table (`docs/agents/prompts/2026-10-03-ultracode-sessions.md`
      §2.6). Read 03 §12 and 15 §13 ("Implementation status") first.
      (1) `Simulation.ts`: pass `createDefaultEntityRegistry()` to its `EntityFactory` (marked
      `TODO`) so `dev-spawn` finds kinds; make `systems/defaultSystemPipeline.ts` (02 §9) the
      default of its `systems` parameter; wire `DebugConfig` there too, and if that takes the
      constructor past four parameters switch to `SimulationOptions` (03 §6, CONTRIBUTING §4)
      and tell session H in this file.
      (2) `commands/defaultCommandHandlers.ts` and `commands/handlers/`: replace the
      `UnsupportedCommandHandler` lines for `move` and `stop` with real handlers when
      `MovementSystem` lands (recipe R16); the other unsupported commands wait for their systems.
      `commands/` may not import `components/` (02 §2): reach `Movement` through a `state/`
      helper, as `EntityStore.countOnTeam` reaches `TeamMembership`, or ask Sam here to widen
      `commands/`'s imports first.
      (3) `commands/handlers/DevRemoveEntityHandler.ts`: hand removal to your `DeathSystem` (marked
      `TODO`; 03 §4 makes it the only `entity-removed` emitter). `DevSpawnHandler` keeps spawning
      directly until `SpawnSystem` exists (a later phase).
      (4) `state/StateHasher.ts`: add every new component's simulation fields to `fieldsOf`
      (03 §9).
      (5) `entities/EntityFactory.ts`: take ids from `utils/IdGenerator` (03 §2).
      (6) With the `InvariantRunner`: add `GameState.recentCommands` (recorded by
      `Simulation.step()`), typed structurally like `GameEventMap`'s `command-rejected`
      (`{ tick: number; command: { readonly type: string } }`) because `state/` may not import
      `commands/` (03 §4); add `LogRecord.context` in `diagnostics/Logger.types.ts`; report
      violations with the `invariant-violated` `DiagnosticEvent` already declared (15 §4–§5).
      (7) `state/GameEvents.types.ts`: import `ShieldBar` from `components/Health.types.ts` once
      `Health` has shields.
      **Status (session C, 2026-10-07, branch `feat/entity-systems`):** (1), (2), (4), (5), (6)
      and (7) done. `Simulation` now takes `SimulationOptions` (`config`, `seed`, `logger`,
      `systems?`, `debug?`, `content?`) and builds `DefaultSystemPipeline` (movement, death,
      invariants) when `systems` is omitted; its factory uses `createDefaultEntityRegistry()` and
      `loadDefaultContent()` (PR #14, DEC-21/22). (2) steers through
      `EntityStore.steer`; new reject reasons `invalid-direction` and `not-movable`. (6) ships
      `no-removal-without-cause`, `health-within-bounds` and `finite-transforms` (the 15 §3 name
      for the prompt's NaN-transform check). **(3) is still open**: see the request below.
- [ ] **Session C → Sam (2026-10-07): deferring `dev-remove-entity` to `DeathSystem`.** Routing
      the removal through `DeathSystem` (a removal request in `state/`, drained by the system)
      changes when the entity leaves within the tick, so `wanderSeed7.replay.ts` checkpoints
      change. Options: (a) **Recommended** — do it and re-record the fixture in the same PR;
      (b) keep the handler's immediate removal (today; `DeathSystem` removes only the dead).
      Also a question: the invariants in `diagnostics/` read `components/` (`Health`,
      `Transform`, `Movement`), which 15 §3 needs but 02 §2 does not list. May `diagnostics/`
      import `components/`? If yes, I'll update 02 §2 and the core folder table together.
- [ ] **Session C → session H (2026-10-07): `Simulation` takes one options object.** Call
      `new Simulation({ config, seed, logger })` instead of passing four arguments; omit
      `systems` to get the default pipeline and pass `debug` for the invariant level (architecture
      03 §6, 15 §2). Branch `feat/entity-systems`.

- [ ] **Session C → Sam (2026-10-07, PR #17): 2 optional ideas, no pressure.** Yes, no or "not
      now" are all fine; a no means I switch back to the documented design. 1. **`DefaultSystemPipeline` and `DefaultInvariantRunner` are classes** instead of the
      `defaultSystemPipeline.ts` / `createDefaultInvariants()` functions in 02 §9 and 15 §2. 2. **`InvariantViolationError` carries the seed, and each `Violation` its severity**, so a
      test failure prints everything needed to reproduce it (15 §2).

- [ ] **Session C → Sam (2026-10-08, PR #14 review): proposed, design text unchanged until you
      answer.** Each one is how the code works today; say yes (I update the doc) or no (I change
      the code).
  - (1) `passiveOptions`: a class chooses between passives (Magus: Studious or Necromancy),
    while 04 §5 has a single `passiveId`.
  - (2) `obstacleType`: `ObstacleDefinition.kind` stays `'obstacle'` (the entity class) and
    tree/rock/bridge go to `obstacleType`. It fixes the conflict between 04 §1/§5 and 07 §9.
  - (3) `Collider` fields: 04 §3 → 10 §4's `isStatic`/`isEnabled`/`isUnbreakable`.
  - (4) Shield naming: 04 §3 → 07 §2's `shields`/`addShield`/`removeShield`.
  - (5) **Doc conflict:** 10 §4 puts collider shapes in `physics/`, but 02 §2 forbids
    `components/` → `physics/`. Meanwhile they stay in `components/Collider.types.ts`.
  - (6) `packages/core/AGENTS.md` folder table: `content/` is "Data only", but it now also has
    `ContentCatalogue`, the validator and `loadDefaultContent()`. Proposed wording: "Definitions
    keyed by kebab-case id, plus the catalogue, its rules and the loader".
  - (7) 03 §12 "Implementation status" is out of date, and PRs #14 and #17 leave it unchanged
    until you approve new text. Proposed replacement for its bullets:
    - `Simulation` takes `SimulationOptions` (`config`, `seed`, `logger`, `systems?`, `debug?`,
      `content?`); `content` is a `DefinitionSource`, `loadDefaultContent(config.tickRate)` by
      default. Its `EntityFactory` uses `createDefaultEntityRegistry()`; omitting `systems` gives
      `DefaultSystemPipeline` (movement, death, invariants). No `exportReplay()` or `dispose()`.
    - `move` and `stop` steer through `EntityStore.steer`; `attack-target`, `cast-ability`,
      `intent` and `dev-set-controller` stay `not-supported` until their systems exist.
    - `DeathSystem` removes only entities whose health reached 0 until `dev-remove-entity` is
      routed through it (open below) and `SpawnSystem` exists.
    - `Movement` works per tick: `advance()` accelerates along the heading with no `|dv|` clamp,
      and without a heading slows by `acceleration` per tick instead of friction (10 §2);
      impulses, friction and the clamp arrive with knockback (Phase 2).
    - `GameState` keeps `recentCommands` and the seed for diagnostic reports; no `world`,
      `teams` or `hordes` yet.
  - (8) The core lint (ADR 0013) comes back as its own PR with an ADR for your sign-off, encoding
    02 §2's per-folder import lists, not rings.
  - (9) 07 §13 still says shield bars stay in "source id order"; per your optional item they now
    keep tower creation order (DEC-20). Proposed: reword that note.
  - (10) 04 §13: `EntityFactory.create(kind, definitionId, placement)` stands in for 04 §6's
    `spawn` (it resolves the definition and checks its kind once; adding to the store stays with
    the caller until `SpawnSystem`). Proposed: add that as an implementation-status note.

- [ ] **Session H → Sam and session F (2026-10-07, PR #18): two notes, no pressure.** (1) The log
      sinks (`SinkLogger`, `ConsoleSink`, `RingBufferSink`) are new files in
      `apps/client/src/data/logging/`, where 15 §4 puts them; that folder is session F's, so F
      should know they exist. (2) `GameLoop`'s first frame only sets the time origin, so 08 §3's
      `runFrames(2, 16.7)` example gives 0 ticks, not 1 (recorded in 08 §11). OK to keep?

- [ ] **Session C/H → Sam (2026-10-09, PRs #18 and #19): proposed "Implementation status" notes
      for 08 (§11) and 09 (§11).** AGENTS.md asks for one, your #14 rule asks for approval first,
      so the docs stay unchanged until you say yes. Interim differences in #18:
  - `FrameScheduler`, `RafFrameScheduler`, `FakeFrameScheduler` and `GameLoop` live in
    `game/engine/loop/`; the `Clock` is session D's `SessionClock`. `useMatch` stamps log
    records with `performance.now()` until it is wired.
  - `Camera` keeps `lookAt`/`visibleArea` and adds `track`, `zoomTo` (clamped), `contains` and
    `worldToScreen`/`screenToWorld` with an explicit `Viewport`; `MinimapProjection` arrives
    with the minimap work (SCRUM-151), which also draws entity markers.
  - `ViewRegistry` resolves kind, then family, then `DefaultEntityView` and reports each
    unknown kind once (built by `views/defaultViewRegistry.ts`); `LegendView` is a placeholder.
  - `Match` takes the player's intent through an `IntentSource` port; no `MatchBridge`,
    `PerfMonitor` or `MatchScreen` yet. `GameCanvas` owns the `Match` through `useMatch`. The
    player's Legend spawns with `dev-spawn` until `SpawnSystem` exists.
  - The first frame after `start()` only sets the time origin (asked below).
  - `Match.destroy()` stops the loop and its subscription; `useMatch` destroys the injected
    renderer and camera. `EntityLayer` does not cull yet.
  - The log sinks live in `data/logging/` (15 §4); the overlay cannot read the ring buffer yet.
  - `Canvas2dRenderer` scales X and Y separately, so a window that is not 16:9 stretches the
    64 × 36 m view.

  In #19 (input), 08 §11 would add that `Match` implements input's `Projection` port
  (`screenToWorld` only) over the camera and takes the intent from `DeviceIntentSource`; and 09
  §11 would record:
  - `InputSnapshot` has `keys`, `keyLabels`, `mouseButtons` and `pointer`; `wheel` and
    `gamepads` come with what needs them. No `poll()` and no `FakeInputDevice` yet; the
    `describeInputDevice` contract suite runs for both devices.
  - `InputMapper` indexes chords by `chordKey` itself (no injected `BindingResolver`) and has no
    `clientActions` yet. `Projection` lives in `engine/input/` with only `screenToWorld`
    (02 §3 lets `game/input/` import `engine/input/` types only). `ActionState` carries the
    pointer so `toIntent` can project it.
  - `Match` turns the intent's `move` into `move`/`stop` and drops `aim` and `triggered` until
    core's `PlayerController` handles `intent` (11 §4.1).
  - `useMatch` releases the devices on `blur`/hidden `visibilitychange` and binds the `wasd`
    preset until settings supply saved bindings. A minimap click is also an `attack` press until
    the minimap consumes its clicks (SCRUM-151).

- [ ] **F → G (2026-10-06): mount the pause overlay.** `ui/screens/MatchScreen.tsx` renders
      `<PauseOverlay />` from `ui/hud/PauseOverlay.tsx` unconditionally; it renders nothing
      unless `session.overlay` is `'pause'` or `'settings'`.
- [ ] **F → session H / the `Match` owner (2026-10-09): settings in the match.** PR #19 merged
      before F, so F's merge took F's input layer (DEC-26) and adapted `DeviceIntentSource` to its
      snapshot (`mouseButtons` is a `Set` of `MouseEvent.button` numbers, no `keyLabels`). Left
      for `Match`/`useMatch`: start from the player's bindings instead of `PRESETS.wasd`, re-read
      them on each `settings` bus event (`mapper.setBindings(s.bindings)`), and toggle the pause
      overlay on a `pause-menu` press edge (`open-overlay` / `close-overlay`), so the pause key is
      the player's binding.

## Feedback

- [ ] Answered below questions, or called out in section header.
- NEW REQUIREMENTS:
  - By the end of Sprint 3, two new items must be implemented, and therefore we must plan for them:
    - 1. Multiplayer support
      - We must be able to have at least 1 player playing against another.
      - We have decided the best way to have this work is to do a second game mode called "Duel"
      - Duel has matchmaking, looking for any other player currently waiting in a Duel queue
      - Duel spawns both players inside the Cathedral where the doors are closed and the surrounding world is deactivated to no longer spawn units or carry structures (environmental buildings, trees, etc., unaffected)
      - The players compete in a 1v1, first-to-10-kills match with a match-point system
      - After each kill, like in a standard fighting game, the players reset. any damage done to the map during this battle remains in place; only the players reset.
      - Ultimate abilities have continuous cooldown, while other abilities do not
        - Meaning: Your cooldown for an ultimate persists through life and death, where your other abilities have standard cooldown and reset to fully cooled down upon death
      - We would like to set up a simple database in the future where we can track player's profiles, game IDs, stats, etc
      - Tracking stats / history will allow us to also implement performance-based matchmaking, prioritizing better players against better players (more wins against better players, fewer losses against worse players, win streak, losing streak, number of total matches played online and offline, etc)
    2. Speed and Support
    - Our second requirement is to make a server capable of supporting hundreds or thousands of concurrent players
    - This would mean that scalability is now something that needs to be considered
    - e.g., 50 players doing solo 10v10 battles against bots, 10 players in 1v1 duels, 6 players idle on home screen, 3 logging in, 1 logging off, etc.
    - Prep for this will also put us on the right track to eventually have the 10 v 10 games being all players, while still supporting the large legions of mobs.
    - This should actively be planned for, but is not yet a hard requirement (not until sprint 3)

## Done

- 2026-10-25 — **Sub-classes are MVP: you accepted ADR 0018 as you corrected it** (HC-Q1 (5)),
  recorded as DEC-56 in `docs/reference/game-design/13-owner-decisions-log.md` with your words.
  You chose "Accept (Recommended)" on 2026-10-24, when the coordinating session put the pre-PR
  critic's blocker on the Legend pick to you, and corrected the draft on 2026-10-25: "Sub-classes
  are not post-mvp. We allow them to be selected today"; "these may change again in the future so
  they (and the subclass legend names e.g. Elarion) should not be a difficult thing to alter.
  Changing a roster, for example, is reflected where the roster is mentioned"; "code may use them,
  but right now there are no saves, nor any release. if i choose to change them next week, nothing
  should explode". ADR 0018 is retitled "Sub-classes (Legends) are MVP" and accepted. Applied on
  `feat/hud-and-character-select`: ADR 0006's Status line ("amended by 0018: sub-classes are
  MVP"); FR-057 keeps only mid-match class switching, and the new FR-119 (MVP) covers sub-classes
  with its traceability rows, naming the content files instead of the roster; architecture 04 §9,
  17 R2 and the architecture README's D11 row; the phase 2 and phase 4 plan items (HC-T1 rows
  T-49 to T-49b, T-52 to T-53b, T-60, T-60a and T-91 to T-99). Still open: the phase for sub-class
  gameplay (HC-Q17) and the id wording of `AGENTS.md`, 04 §10 and 17 R26 (HC-T1 T-100 to T-102).
  FR-119 and DEC-56 were re-checked free on every branch on 2026-10-25.
- 2026-10-24 — **Your playtest of the integrated character select and HUD**
  (`feat/hud-and-character-select` with both screens registered): character select works
  (hover, the arrow keys, Select Class, the Legend cards, LOCK IN), the HUD shows over the live
  map, and Esc pause, Resume and Leave match work. You said visual polish and some HUD changes
  will follow later, nothing for now (HC-S5). Recorded as acceptance of the flow in play, not of
  the final look.
- 2026-10-17 — **The owner's decisions for the Figma character select and HUD (chat 2026-10-16
  and 2026-10-17)** recorded in `docs/reference/game-design/13-owner-decisions-log.md` (batch
  2026-10-17): DEC-48 (display names; Harbinger shown locked), DEC-49 (the Legend pick, and the
  Legends' ids, sub-class titles and names), DEC-50 (`SessionController` owns the `Match`
  lifetime; answers audit AS-7 C2 / AC-25 and plan question 46), DEC-51 (asset provenance,
  Phosphor MIT, Cinzel OFL), DEC-52 (62:70 as a data-selected alternate), DEC-53 (creative changes
  only beside a live original), DEC-54 (Figma renders on a scratch page; two effects renderers)
  and DEC-55 (two contrast sets). Numbered from DEC-48 because DEC-43 to DEC-47 are the minion
  rulings on `docs/minion-system-design` (PR #33). Recorded on `feat/hud-and-character-select`,
  with the proposed ADR 0018 and the register
  `docs/reference/game-design/15-figma-frames-and-creative-decisions.md`. What each still needs
  is open above (HC-F1 to HC-S3).
  - **HC-A1, may an agent write to your Figma file** (answered 2026-10-17, DEC-54): yes, on one
    new page only, `zz agent scratch - R1 exports (safe to delete)`, holding duplicates of
    62:125, 62:70, 58:271 and 62:231; the original frames and every other page are never
    modified, and every write and export is logged. Both paths are built: Figma's own renders as
    plates, and a CSS approximation, chosen by the content value `effectsRenderer`
    (`'figma-raster'` by default, or `'css'`), with `?dev=1&fx=css` or `fx=raster` to compare
    them. The raster path is held to the pixel audit; the CSS path is audited and reported beside
    it. No fallback masks.
  - **HC-Q13, the HUD colours below the contrast minimums** (answered 2026-10-17, DEC-55): both.
    The Figma colours are the default (`contrastMode: 'figma'`), with the failing pairs listed as
    exceptions: letters A 2.52:1, B 3.02:1 and C 4.09:1 on their shields; health fill against its
    rest 1.34:1 and aether 1.41:1 (the 1.4 px marker carries the level, 9.13:1 against the rest);
    the white value numeral on the health peak 3.89:1 and on the aether peak 3.08:1; status fill
    against its track 2.10:1; the enemy structure icon 1.14:1 (register CD-21). The
    `contrastMode: 'minimums'` set, also chosen by the OS setting `prefers-contrast: more`, swaps
    only those tokens for values meeting architecture 13 §7 (4.5:1 text, 3:1 bars and icons); the
    branch adds the values and their ratios to CD-21.
  - **HC-Q1, the answered part: the Legends** (answered 2026-10-17, DEC-49). Ids and sub-class
    titles: Magus `catalyst` Catalyst, `oracle` Oracle (replaces Cantor, with the Figma's Cantor
    data), `necromancer` Necromancer (replaces Gravecaller); Legionnaire `assassin` Velite,
    `knight` Centurion, `paladin` Praetorian; Sentinel `colossus` Colossus and the new
    `juggernaut` Juggernaut, with your descriptions. Sub-class titles are the same on both teams.
    Legend names exist only for the three Magus Legends and differ by team (mirror universes: the
    Dark name is the Light name spelled backwards): Elarion / Noirale and Avedrin / Nirdeva as you
    stated them; Veridan's Dark name is asked in HC-Q16. The Legionnaire and Sentinel Legends have
    no names yet, only their class and sub-class titles, so their cards show the title alone (what
    is still open is HC-Q1 above). Your words: "this should only apply to the "names" not the
    subclass "titles". Praetorian is a subclass title. I have no names for [any] Legionnaire or
    Sentinel Legend, only the class and subclass titles. the names of the characters have only
    been provided for Magus".
- 2026-10-10 — **Your chat clarifications of 2026-10-10 (DEC-11) and the source of the new
  requirements** recorded in `docs/reference/game-design/13-owner-decisions-log.md` (appended to
  DEC-11, DEC-36 and DEC-37) and applied to reference 01, 06, 08, 11, `more-abilities.md` and
  `docs/plan/legend-team-brief-2026-10-10.md`. Branch `docs/sprint-2-requirements-and-planning`,
  on top of `8d0d308` (your answers), `045ecc3` (the DEC records and the brief) and `3923124`
  (proposed ADR 0016 and ADR 0017, and the multiplayer plan).
  - **DEC-11 (1), pool or rule change, and does Sentinel keep Rip & Tear** (impact Q3): confirmed
    in chat, "a player chooses 3 abilities and 1 ultimate from the set of abilities and ultimates
    that are available to their class when selecting/creating their loadout". The "3 + 1" rule
    stands and the class set is a pool. Rip & Tear stays: the approvals come "on top of the
    abilities that i had originally put forward in the reference docs".
  - **DEC-11 (2), do Meteor Fall and Nova stay MVP** (impact Q4): confirmed in chat, yes. Every
    class keeps its game-doc kit (Warrior Veil, Blade Runner, Fury; Sentinel Rip & Tear, Slam,
    Berserk, Meteor Fall; Magus Imbue, Shockwave, Death Ray, Nova), all MVP, next to Eclipse,
    Avalanche and Last Rites.
  - **MVP status of Fan of Sorrows, Sunder, Colossus Roar, Aether Lance and the Sunder–Sanctuary
    combo:** confirmed in chat, "all of these for MVP".
  - **DEC-36 and DEC-37** were set by the course instructor ("our prof", an intentional
    curveball): planned now; must be implemented by the end of Sprint 3 (2026-11-13).
  - **Correction to the entry below:** the Session D follow-up (approving the SD-1/SD-2 text) was
    left only in Done; it is now an open item above. The open items above also gain the DEC-11
    architecture approvals, ADR 0016 and ADR 0017.
- 2026-10-10 — **The owner's answers of 2026-10-09 (`8d0d308`)** recorded in
  `docs/reference/game-design/13-owner-decisions-log.md` (batch 2026-10-10) and folded into the
  reference docs and `docs/plan/legend-team-brief-2026-10-10.md`. Branch
  `docs/sprint-2-requirements-and-planning`. What each item still needs stays open above.
  - **Session D — no `useAppDispatch`, and the 13 §2 `character-select` row** (DEC-34), fully
    answered: "Accept recommended option if it is cleaner long-term. For D, set to whichever is
    cleaner in the long-term." The edits to architecture 13 §2, §5 and `apps/client/AGENTS.md`
    wait for your approval of their text (impact review SD-1, SD-2).
  - **DEC-11**, the answered part: Hamstring and Fan of Sorrows (Warrior), Shield Wall, Sunder and
    Colossus Roar with fear (Sentinel), Sanctuary and Aether Lance (Magus), the alternate
    ultimates Eclipse, Avalanche and Last Rites, and "Sunder shatters Sanctuary", all MVP.
  - **DEC-12**, the answered part: both crystal timers are `TUNE` starting values; crystals turn
    volatile once the centre boss spawns; `insanity` is a description and an icon only for now.
  - **DEC-13**, the answered part: the planned match is 30 minutes, no hard time limit.
    `plannedMatchSeconds` in `packages/core/src/config/defaultGameConfig.ts` is not changed by this
    docs branch.
  - **DEC-15**, the answered part: camp classes by position in the corridor, positions drawn per
    side, equal counts per class on each side.
  - **PROTO-01**, the answered part (DEC-35): the escort is deleted this sprint in favour of real
    hordes; `AiSystem` means the game's bot AI.
  - **New requirements** (Feedback): Duel multiplayer (DEC-36) and server scalability (DEC-37)
    recorded; their questions are in `docs/plan/multiplayer-and-scalability-plan.md`.
- 2026-10-09 — **PR #24 review (SamarjitBhogal), reuse requests**: approved by sholtzman in chat
  for whatever is in line with or better than the architecture. Recorded as DEC-30 (`chordKey`
  moves to `bridge/`, better than the design) and DEC-31 (one shared `readOrQuarantine` instead of
  14 §8's private method per repository, also better than the design). The shared DTO helpers
  (`dto/dtoCheck.ts`) wait for S2's second DTO, as the review suggests; only `DtoCheck<T>` moved
  now, because `readOrQuarantine` needs it.
- 2026-10-09 — **Session C → session F: `Binding.types.ts` has the 13 §6.1 shapes** (PR #19):
  superseded by DEC-26 in F's merge `a82e098`. F's flat `InputChord` is kept, `INPUT_ACTIONS`
  lives in `game/input/keybindings.ts`, and #19's `DeviceIntentSource` builds F's snapshot.
- 2026-10-08 — **Session F owner decisions DEC-25…DEC-29** (agent pushes, canonical input layer,
  `SettingsController`, snapshot shape, conflict-free edits) recorded in
  `docs/reference/game-design/13-owner-decisions-log.md` and folded into ADR 0015 and
  architecture 02, 09 and 13 on `feat/settings-keybindings`.
- 2026-10-08 — **F → D: settings wiring in `main.tsx` and `ui/App.tsx`**: done on
  `feat/settings-keybindings` (owner-approved: the second branch to merge adds it, PR #12).
- 2026-10-08 — **F → D: settings intents and the `settings` event** (session F's request of
  2026-10-06): `update-binding` `onConflict`, per-action `reset-bindings`, `update-settings`,
  `BridgeEventMap.settings` and the `connectBusToStore` line landed in D's 5accc85 (PR #12).
- 2026-10-08 — **Session C's optional ideas** answered in the PR #14 review and done: one
  `EntityModule` per family declined (back to `createDefaultEntityRegistry()`, DEC-21);
  `ContentValidator` with rule classes accepted with fixes (rules get the catalogue, listed in
  `content/defaultContentRules.ts`, run once from `loadDefaultContent()`, DEC-22, folded into 04 §5
  and 05 §2–§3); `applyDamage` returning `{ toShields, toBase, overflow }` accepted (DEC-23, 07 §2);
  ADR 0013 split into its own PR (DEC-24). Recorded in
  `docs/reference/game-design/13-owner-decisions-log.md`. Branch
  `feat/entity-collider-and-concrete-kinds` (PR #14).
- 2026-10-08 — **DEC-16** (lint ignores agent worktrees) accepted by the owner in chat:
  `eslint.config.js` adds `.worktrees/` and `.claude/worktrees/` to `globalIgnores`; recorded in
  `docs/reference/game-design/13-owner-decisions-log.md` and ADR 0014. Branch
  `chore/lint-ignore-worktrees` (PR #20).
- 2026-10-07 — **Session B's simulation kernel items** signed off and done: the snapshot shape
  (DEC-17) and the `makeLogRecord` options object (DEC-18) folded into 03 §5 and 15 §4; the
  determinism lint (DEC-19, ADR 0012) added; the kernel's design differences (DEC-20) folded into
  02, 03, 15 and 17 R16, with "Implementation status" sections in 03 and 15; the replay fixture
  format written into 15 §7. Recorded in `docs/reference/game-design/13-owner-decisions-log.md`.
  Branch `feat/sim-kernel` (PR #13).
- 2026-10-07 — **Session A's requests to session B** done: `utils/deterministicMath.ts` (now used
  by `polarPoint`), `GameConfig.map` keeps the field names of the map's local `MapConfig`, and the
  nav cell size lives in `config.map.navCellSize`. Branch `feat/sim-kernel` (PR #13).
- 2026-10-06 — **DEC-14** (map generator refinements a–d) signed off by the owner; recorded in
  `docs/reference/game-design/13-owner-decisions-log.md` and folded into
  `docs/architecture/06-map-and-minimap.md`. Branch `feat/map-generator` (PR #8).
- 2026-10-03 — **DEC-01…DEC-10 and the discrepancy answers** recorded in
  `docs/reference/game-design/13-owner-decisions-log.md`; plan re-cut to four two-week sprints
  ending 2026-11-27 (`docs/plan/README.md` §0); ADR 0004/0006/0009 statuses updated; 32
  discrepancy rows marked decided; the owner's interface flow written up in
  `docs/reference/game-design/14-interface-and-screen-flow.md`; `SessionPhase` extended with
  `character-select` / `pre-launch` / `match-loading` in `docs/architecture/13-game-interface.md`;
  Assault → **Warrior** adopted (class `Warrior`, content id `warrior`); new ideas (Tower
  Guardians, weapon upgrades, level visuals, team skins) logged with MVP status. Branch
  `docs/inbox-decisions-2026-10-03`.
- 2026-09-30 — Phase 0 documentation + harness written on `docs/phase-0-foundation`
  (merged as PR #3; see `docs/changelog/2026-09-30-phase-0-foundation.md`).
