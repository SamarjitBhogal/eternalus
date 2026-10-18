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
      0.5, were answered by DEC-33 (demo-only; on `chore/sprint-1-audit`).
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
      class, and ids are never renamed once used (17 R26), so the card uses `flying`. A locked
      card never reaches a save, a loadout or a replay, so the id can still change until the
      class is built. Confirm `flying`, or say `harbinger` (then 04, 17 and plan 4.1 change). The
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
      after the pre-PR critic).** Your rule that `docs/architecture/`, `docs/decisions/` and
      `AGENTS.md` change only with your approval (audit AD-4) applies to: 13 §2 (the `menu` and
      `character-select` rows per DEC-34's delegated SD-2 text, plus the two steps; the DEC-50
      lifetime rows are written before the critic as owner-decided text), §3, §5, §6.4 and §9;
      05 §15 (the HUD kit is the selection joined with the loaded catalogue, with no `hud-kit`
      event; `loadDisplayContent()` as the display catalogue); 02 §3 (the key files of
      `data/resources/`: `loaders/UiImageLoader.ts`, `loaders/FontLoader.ts`), §6 and §10
      (`loadDisplayContent`); 14 §1 (the tree: the two loaders, and the port and its contract at
      `data/resources/loaders/AssetLoader.ts` and `AssetLoader.contract.ts`) and §11; 01 §3 (the
      `AssetLoader` port row naming those two paths); 01 §3 and 17 §11 A8 (the composition root:
      "`Match`, `main.tsx`, the match factory `main.tsx` binds, or a test"), with the 02 §3 tree
      line for `game/Match.ts` and the 13 §2 sketch comment on `createMatch`; 04 §5 (the
      `loadDisplayContent()` validation sentence); the 13 §2 boot row; 08 §7 and a draft amendment
      to 08 §11 in this file (no new 08 section before you approve it); the architecture README's
      D11 row; 17 R2's note naming `loadDisplayContent()` with its ADR 0018 cross-reference, and
      04 §9's sentence that the player already picks a Legend at character select; ADR 0018 and the
      FR-119 and FR-057 catalogue edit. Approve, or say which to change.
- [ ] **HC-B1 — Better than the design or new, for sign-off (`feat/hud-and-character-select`;
      asked after the pre-PR critic).** The critic's verdict is reconciled with the branch's
      deviation table (the DV rows in the pull request's description) before you are asked, and
      every item the critic confirms or adds joins this list. Known now: DV-01, the match world
      prepared in `match-loading` and the `Match` built from it when the viewport attaches
      (`createMatch(request, viewport)`, `attachViewport` returning its detach), a refinement of
      13 §2's sketch under DEC-50; DV-22 and DV-23, new bridge messages (`structure-state`,
      `asset-urls`, `credits`), the first definition of `CapturePointSnapshot`, and an
      `assetsSlice`; DV-39, images the DOM shows go through `ResourceController` and reach React as
      URLs through the store (14 §11 designed canvas bitmaps only); DV-40, a `font` asset type and
      `FontLoader` for Cinzel (DEC-51); DV-42 and DV-122, manifest entries with a 2x file and
      per-use renditions, the pixel density fixed per session; DV-46, layout-only art and the
      Figma plates in their own asset groups; DV-55 and DV-56, the selection screens as one
      1920 × 1080 artboard scaled as a whole and the HUD sized by its own unit, both with a text
      floor; DV-93, the structure strip, objective tracker and crystal. DV-132 to DV-136 are your
      own directions of 2026-10-17 (DEC-49, DEC-54, DEC-55), listed for the record and not asked
      again. Approve each, or say what to change.
- [ ] **HC-C1 — The differences from your Figma, for review (asked after the pre-PR critic).**
      Every place the build differs from your frames on purpose is registered in
      `docs/reference/game-design/15-figma-frames-and-creative-decisions.md` (DEC-53), so the
      visual audit does not flag it. Rows are `forced` (a binding rule), `fill-in` (a state your
      frames do not draw), `approximation` (an effect CSS cannot draw; your Figma's pixels where a
      render exists), `normalised` (sub-pixel), `conflict` (a Figma value that breaks a binding
      minimum) or `creative` (none on this branch; DEC-53 keeps your original live). Review CD-01
      to CD-27: keep, change or reject each. CD-12 and CD-20 are withdrawn; CD-25 applies only if
      the grain measurement finds no fixed grain field in your render; CD-21 is resolved by your
      answer to HC-Q13 (DEC-55), and CD-26 and CD-27 record your directions on the Legends (DEC-49)
      and the effects renderers (DEC-54). CD-26 includes one copy edit the recorder made as a
      consequence of the Oracle rename, not stated by you: the oracle description's "The Cantor
      bends…" reads "The Oracle bends…".
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
      (5) Accept ADR 0018 (`docs/decisions/0018-mvp-legend-pick-as-setup-data.md`, proposed): it
      records the Legend pick as MVP setup data, amends ADR 0006 point 3 and adds FR-119 with an
      FR-057 edit, as NFR-010 asks.
- [ ] **HC-Q2 — HUD rules your Figma implies (OQ-63 to OQ-66).** (1) Weapon level (62:258): what
      earns it, how many levels, what a level changes, per weapon or per match? No doc defines it.
      (2) Ultimate (62:246, 65:722): are Low, Mid and Max castable tiers, or one meter that must
      fill (05 §6)? What do the three charge pips count, and is the earlier draft's grey ultimate
      (8:2) the "not charged" look? (3) Objectives (62:425): does the bar under a shield show
      capture progress or hold strength, does it take the capturing team's colour, does it need
      checkpoint ticks, and how do a contested point and a point locked by a mini-boss look?
      (4) The clock "14:32" (65:604): elapsed match time (default, FR-010) or a countdown (to the
      gem or the score cap)? Does the crystal change during the match? (5) Is the glow the
      "ready" look of the ultimate and the gadgets only?
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
      but 10-art-and-lore and 11-mvp-scope list "High-quality character art on the selection
      screen" as post-MVP; the branch treats it as MVP because it is your own art (the recorder's
      reading, not your words): confirm or say otherwise. (2) The selection screens' asset groups
      are `selection` and its per-layout and plate groups (the code and 13 §2), not 14 §11's
      `menu` (audit AS-8): confirm. (3) The Cinzel OFL and Phosphor MIT texts sit beside their
      files in the repo; to ship them inside the built game the About screen lists the manifest's
      licences (13 §3, plan 5.3): do that now (default) or in 5.3, and how should the credits word
      your own art? (4) Should DEC-53's rule also be a line in `AGENTS.md`'s pre-PR gate? (5)
      Cinzel is used on the new screens only (token `--font-game`); should the menus switch to it
      too (default: no, they keep `--font-display`)?
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
      button-chrome plates. The branch reports the measured group sizes at device pixel ratios 1
      and 2, per effects renderer (`'css'` loads no plate). Accept them (default), or allow lossy
      1x files for named assets, with their regions listed as not exact?
- [ ] **HC-Q16 — Veridan's Dark name, "Nadirev" (flag; DEC-49).** That name is derived from your
      mirror rule (the Light name spelled backwards, as Elarion ↔ Noirale and Avedrin ↔ Nirdeva),
      not stated by you. The build ships it as content (`catalyst`'s `legendName.dark`, marked
      `TODO(sam)` in `packages/core/src/content/legends/specs/catalyst.ts`). Confirm it, or give
      the Dark name. No other name or title is flagged: the sub-class titles, Praetorian included,
      are used exactly as you gave them.
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
