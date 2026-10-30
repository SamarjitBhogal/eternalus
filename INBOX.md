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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): you ticked "Keep: timeout after a
    class starts with no Legend; bots get no Legend; LOCK IN ends the countdown" and wrote: "60
    seconds to select class and legend once the pre-game menu appears. Enemy bots are auto-chosen,
    with 3 Legionnaires, 3 Sentinels, 3 Magus, and 1 extra which mirrors what the player chose as
    their character. Friendly bots do the same, but without the mirror as that is filled by the
    player's choice. Locking in fills in the remaining bots (see how Smite bot games handle this).
    The countdown is always 60 seconds, even if the player locks a character and legend
    immediately." Recorded as DEC-60 (the countdown) and DEC-61 (the bots). Read: where the note and
    the ticked option differ, the note wins. (3) LOCK IN does not end the countdown, which always
    runs its 60 s; (2) the bots are chosen as your note says ("Legionnaires" are the Vanguards, your
    rename, DEC-58); (1) stands: a countdown that ends after a class but before a Legend starts the
    match with no Legend. **Open, for you:** which Legend does each bot get? Until you say, each bot
    gets a random Legend of its class when you lock in, and the enemy's tenth bot copies your class
    and your Legend. **Waits for the build:** the fixed countdown, the bots filled at LOCK IN and
    the locked view (HC-Q9). The doc rows for this flow (HC-T1 T-12 and T-75) are redrafted to match
    and are applied with that build.
  - Answered 2026-10-29 (build-plan question P3, in a dialog, and the review page, in chat):
    "Option 1, but if you timeout without picking a legend, you are returned to the home screen with
    a themed popup stating you did not select a legend and were returned to lobby"; the popup: title
    "Failed to Choose Legend", text "The countdown ended before you locked in a Legend. You have
    been returned to the lobby." Recorded as DEC-102, with notes on DEC-60 and DEC-61. So (1)
    changes: a countdown that ends before LOCK IN, with or without a class, starts no match; you
    return to the home screen and see that popup. (2): one Vanguard, one Sentinel and one Magus in
    each lane, and two bots may share a Legend; each bot's Legend stays a random one of its class
    (`Recommendation:`, DEC-61) unless you say otherwise. **Waits for the build**, with HC-T1 T-12,
    whose redraft changes again to this rule.
  - Built 2026-10-30 (`feat/hud-plan-b2`): the countdown always runs its 60 s, LOCK IN fills the
    bots (one Vanguard, one Sentinel and one Magus per lane, each with a random Legend of its class)
    and shows the locked view, and a countdown that ends before LOCK IN sends you home with the
    "Failed to Choose Legend" popup. HC-T1 T-10, T-12 and T-13 are redrafted to the built flow and
    wait for your approval. Still open: which Legend each bot gets (above).
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): you ticked "Use the id harbinger"
    and wrote: "Change the locked look. Make the option shadowed with a "coming soon..." name in
    place of the Harbinger text. It will appear as the church-window frame with a black interior
    that has white inner shadows to look like a cavernous opening. The "Coming Soon..." text should
    be in the same red as the countdown and use Cinzel. Lock icon shows on cursor during hover.
    Harbinger is the new name, not flying." Recorded as DEC-59. Your answer also approves the words
    that name the id in the entity architecture (its family table and its worked example), the "add
    a Legend class" recipe and the phase 4 plan's sprint 4.1 (HC-T1 T-158 to T-161); the same id
    appears in the open-questions list and the naming suggestions (T-162, T-163, for your approval).
    Read: "the new name, not flying" is taken as the id; the description "the flying class" in prose
    stays. **Waits for the build:** the content rename from `flying` to `harbinger` and the new
    locked look; then those rows are applied and register row CD-05 is updated.
  - Applied 2026-10-29: the content id is `harbinger` (`6ce2141`), and HC-T1 T-158 to T-163 are
    applied (`3849c8b`; you approved T-162 and T-163 on the review page: "approve both"), with T-180
    (04 §1's Status cell, round B20a); 04 §12's worked-example table waits for the HC-Q18 (2) build.
    The locked look is now DEC-104 (your build-plan answer P5 and the review page: only "Coming
    Soon...", a purple-to-black void in the church-window frame, a weathered CSS lock in the
    middle). **Waits for the build:** that look; then register row CD-05 is updated.
  - Built 2026-10-30 (`feat/hud-plan-b3b`, `180601d`): the locked card keeps the class frame, draws
    the void (purple at the frame, black inside, streaks of air) with a weathered lock, and shows
    only "Coming Soon..." in the countdown red; hovering it shows a lock cursor (DEC-104, DEC-59).
    Register row CD-05 got a dated note (reference 15; the row's own text is the history).
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep", with: "For now, both
    teams' options look nearly identical (except where legends have been given names; a config file
    should allow easy addition of new legend names as they are chosen and new artwork to be added
    for both light and dark). No subclasses outside of Magus have art, abilities, or legend names.
    These will be added as soon as they are chosen. Should not be difficult to do so. Also should be
    easy to add different Legend artwork for Dark team, and change the background image
    accordingly." Recorded in DEC-70. (2) and (3) are kept: "N Allies" stays a live count, both
    teams see your one backdrop and no pedestals until that art exists, and a new Legend name, Light
    or Dark art or a Dark backdrop stays a content addition. With your bot rosters (DEC-61) the ally
    tiles will show the bots' Legends. **Still open:** (1), the meaning of the other tile border
    colours and of the shadow; the decision page did not ask it.
- [x] **HC-F4 — Your pick reaches the match (default applied).** The class, team and seed of the
      match setup now flow into the match (`PlayerChoice`, `setup.seed`, `setup.playerTeam`),
      replacing the fixed seed 1 Light Warrior. Your Legend is recorded in the setup but changes no
      gameplay yet (DEC-49). Nothing to answer unless you want otherwise.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep", with: "Correct. Class and
    subclass chosen are what the user loads with; same with the 9 bots on the user's team and the 10
    bots on the other team -- whatever the bots are assigned is what they are spawned as and respawn
    as (currently cannot change character in-game. TBD on whether that changes; for now, you choose
    and you lock for the game)." Recorded in DEC-61: every pick, yours and the bots', holds for the
    whole match, at spawn and at every respawn. The bots' picks are built with HC-F1.
- [x] **HC-F5 — HUD colours and key glyphs (default applied; veto).** (1) The HUD uses absolute
      team colours (Light gold, white and blue; Dark red, black and purple: 10-art-and-lore,
      architecture 07 §12 and 13 §7). For a Light player this equals your Figma; for a Dark player
      the allied side shows Dark colours (register CD-19). Say if you want relative colours instead
      (allies always blue, enemies always red). (2) Who holds a capture point is also shown by an
      allegiance flag, never by colour alone (13 §7; register CD-03). (3) Every ability and gadget
      slot shows its key from your bindings (05 §15, 13 §3), so the two gadgets get key glyphs the
      Figma does not draw (CD-01), and the Figma's fixed "1" to "4" become live glyphs (CD-02).
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep", with: ""Light is gold,
    white and blue; Dark is red, black and purple" - yes. When you are on the dark team, your
    capture points and towers are red when they are yours (captured) or alive (not destroyed)."
    Recorded in DEC-62. The absolute colours already give that: on the Dark team, your side is drawn
    in the Dark colours. Nothing waits.
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep", with: "Keep. Empty frames
    for abilities that do not yet exist. Wuuthrad was used as weapon reference, so that artwork
    exists, as well as some ability artwork (not associated with real abilities yet). Empty frames,
    empty weapon container, empty shield (except Legionnaire class, who gets the helmet icon). Font
    is the same across classes, as is levelling. The shield with the ring and the text in the middle
    representing level stay across classes." Recorded in DEC-62 ("Legionnaire class" is the
    Vanguard, DEC-58). **Open, for you:** for the weapon panel, your answer to HC-Q22 ("Keep the
    per-class Figma art", DEC-57) and this note ("empty weapon container") differ. Until you say,
    the Vanguard keeps the battle axe your HUD frame draws, and the Sentinel and the Magus show an
    empty weapon container, which removes the staff a Magus player sees today (register row CD-38).
    **Waits for the build:** empty frames for abilities that do not exist yet, and an empty emblem
    shield on every class but the Vanguard (its helmet).
  - Answered 2026-10-29 (build-plan question P2): "Empty kit (Recommended)". Recorded as DEC-101:
    in a live match every class shows empty ability frames, an empty weapon slot and an empty
    shield, the Vanguard keeps its helmet, and the Figma comparison keeps your art. This replaces
    the interim above (the Vanguard's battle axe). **Waits for the build.**
  - Built 2026-10-30: the empty kit (`80a9689`, `feat/hud-plan-b3b`): every class's live kit has six
    empty ability and gadget frames, an empty weapon slot and an empty emblem shield; the Vanguard
    keeps its helmet. Then your answer to the pickup session (DEC-114, `1f5cb75`): "bring back the
    art only where it fits (e.g., courage for vanguard, wuuthraad for bulwark,staff icon for mage
    weapon, etc). for other areas, keep empty". The Vanguard's kit gets the Courage art in its
    first gadget slot (beside the helmet), the Magus kit gets the staff in the weapon slot, and the
    Bulwark gets Wuuthrad (your battle axe, 62:241) in the weapon slot. **Recommendation:** the four
    ability placeholders and the second gadget's sword stay empty (they are no Legend's art), and so
    do the weapon slots of the Colossus, Zealot, Templar and Paladin, which have no weapon art yet.
- [x] **HC-F7 — "Esc back" and "C view details" use existing bindings (default applied; veto).**
      The Legend step's Back prompt shows your `pause-menu` key and the alternate layout's View
      details shows your `gadget-2` key, both as live key glyphs that also answer a mouse binding;
      no new action is added, because a new Back action on Esc would bind one key to two actions
      (DEC-29). Say if you want binding contexts instead (menu keys separate from match keys: an
      architecture change to 13 §6.3), or other keys.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep the reused keys", with: "If
    this refers to which keys are used to navigate the character select menu, then yes, sharing keys
    here is fine. In-game, state changes and keys are assigned differently than in the pre-game,
    home screen, etc." It does: on the selection screens, Back uses your pause-menu key and View
    Details your second-gadget key. HC-T1 rows T-28 and T-90 are applied.
  - Note 2026-10-30 (the title above is the question as asked and is kept): View Details no longer
    uses your second-gadget key. It has its own key, V (DEC-103), on both class layouts and on the
    Legend step, and on the alternate layout it now opens the details screen instead of choosing
    the class (DEC-109). Back still uses your pause-menu key.
- [ ] **HC-F8 — Developer-only camera tools in a match, and leaving the cathedral (default
      applied; veto).** The free camera (drag and wheel zoom), the world overview, the explorer
      toolbar and the map legend show only with the developer flag (`?dev=1`, 13 §4), because
      DEC-32 makes the free camera and the overview demo-only; with the flag they sit at the top
      left, clear of the HUD. The cathedral click and a "Leave cathedral" button stay in normal
      play, because DEC-32 keeps the enterable interior in the design: the button shows only while
      you are inside, as an interim control in the game canvas styled from the theme tokens, and it
      becomes a HUD control with its own intent when the HUD gains an interior state (register
      CD-22). Say if the developer tools should go entirely, or stay visible for the course demo.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Show the developer tools for the
    course demo", with: "Make this a hotkey for developers, such as Command (Mac)/Control
    (Windows/Linux)+F3. Show or hide." Recorded as DEC-66. **Waits for the build:** the show-or-hide
    hotkey for the free camera, the overview, the explorer toolbar and the map legend; the map
    architecture's status note (06 §10) says it is not built yet.
  - Answered 2026-10-29 (build-plan question P6): "Cmd/Ctrl+Shift+F3 (Recommended)". Recorded as
    DEC-105: Cmd+Shift+F3 on a Mac and Ctrl+Shift+F3 on Windows and Linux (Cmd+F3 is the Mac's Show
    Desktop key), in every build. **Waits for the build.**
  - Built 2026-10-30 (`feat/hud-plan-b4`, `e84c8aa`): the action `toggle-developer-camera`, Ctrl+Shift+F3
    and Cmd+Shift+F3 by default, works in every build and shows or hides the free camera, the
    overview, the explorer toolbar and the map legend without rebuilding the match; `?dev=1` still
    starts a match with them shown. Keyboard chords gained optional modifiers. The map
    architecture's status row and the chord sketches wait in HC-T1 (T-195 to T-200).
- [x] **HC-F9 — When the selection art is freed (default applied).** The character-select art (the
      selection asset groups) is released when the match starts and loaded again for a rematch;
      13 §2 did not say. Nothing to answer unless you prefer to keep it loaded.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep". HC-T1 row T-16 is applied
    with your HC-Q8 answer.
- [ ] **HC-T1 — Approve the text of the design-doc edits (`feat/hud-and-character-select`; asked
      after the pre-PR critic).** **Your answers of 2026-10-28** (the PR register's section "Owner
      answers of 2026-10-28" lists them as D1 to D8): you approved group (i) ("Approve all 54", D1),
      so its 54 rows are applied (`b1121f5`). You approved HC-B1 (D3) and accepted ADR 0019 (D4), so
      the 24 rows whose only open basis was HC-B1 or DEC-50 are applied too (`e28854b`): T-07, T-08,
      T-09, T-14, T-15, T-21, T-25, T-27, T-30, T-32 to T-35, T-37, T-40, T-42 to T-45, T-48, T-51,
      T-55, T-86 and T-89. The table keeps each applied row as you saw it, with its line number from
      before the edit, and its status says "applied 2026-10-28" and which answer cleared it. **Still
      open, row by row (59 rows):** rows that also carry another open item: T-11, T-24 and T-31
      (HC-Q7 (2), the selection asset groups), T-16 (HC-F9 and HC-Q8; it is DEC-50's `match` row, so
      DEC-50's other rows were applied without it), T-23 (HC-Q2: the weapon-level bar and the
      ultimate's pips), T-29 (HC-Q14: the text floor) and T-90 (HC-F7: the prompts use the existing
      bindings); the rows on defaults (T-12, T-28, T-75); the branch's other deviations (T-05, T-10,
      T-13, T-17 to T-20, T-22, T-26, T-36, T-38, T-39, T-41, T-46, T-47, T-56 to T-59, T-79,
      T-153); phase-plan ticks, notes and two new tasks (T-80 to T-85, T-145, T-152); the optional
      rows (T-118, T-120, T-132, T-133); the id wording that waits for HC-Q18 (4) (T-100 to T-102,
      T-136 to T-144); and, new, T-155 to T-157, which bring references 10 and 11 in line with your
      HC-Q7 (1) answer (the selection-screen art is MVP; FR-111 is reworded, as HC-Q7 said your
      answer would decide). T-125 is SamarjitBhogal's. Your rule is that architecture docs, the
      `AGENTS.md` files and your reference docs change only with your approval (PR #31), each edit
      shown to you in a table (PR #33). So the branch splits its edits (OD-26). **Applied,
      append-only:** one Implementation-status note each in architecture 01 (new §8), 02 (new §12),
      05 (new §18), 06 §10, 13 §10, 14 §14 and 17 (new §12), recording what the branch built, and
      `last-reviewed` on each; on 2026-10-28 the notes of 01, 02, 13 and 17 were updated to say
      which of their rows are now in the design text. **Applied when you accepted ADR 0018 as you
      corrected it (DEC-56):** its amendments, rows T-49 to T-49b (17 R2), T-52 to T-53b (04 §9),
      T-60 and T-60a (the architecture README's D11 row), T-91 (ADR 0006's Status line), T-92 to
      T-97 (FR-057 keeps only class switching; the new FR-119 and its traceability) and T-98 and
      T-99 (the phase 2 and phase 4 plans); they left this table, and the PR register lists them.
      One of them is agent-written and needs your check: T-93a, the new acceptance sentence of
      FR-057 ("No MVP code path changes a Legend's class during a match; the switch and its ultimate
      penalty arrive post-MVP."), because its old acceptance was about sub-classes and moved to
      FR-119. **Not applied, for your approval:** the pending rows below, kept as a patch outside
      the repository until you approve them. T-80 to T-85 tick one phase-plan task whose test the
      branch meets and add notes to five others. T-100 to T-102 carry ADR 0018's point 5 into the id
      wording of `AGENTS.md`, architecture 04 §10 and 17 R26: until saves or a release exist, an id
      rename is a content refactor whose missed references fail the checks; T-136 to T-144 change
      "never renamed once used" to "never renamed once a save or a release stores it" elsewhere;
      their wording waits for your answer to HC-Q18 (4). No row copies the roster (ADR 0018 point
      4): a row that records a name decision cites DEC-48, DEC-49 or DEC-56 and points to the
      content file. A-1 and A-2 were merged earlier and stay unless you refuse them. T-79 drafts an
      08 §11 status section, which waits for you because an earlier one was removed for that reason;
      the critic's second run asks for that note (game-data-05), and T-79 names `createBrowserMatch`
      and `MatchHost`. T-125 changes architecture 18, which SamarjitBhogal owns, so it is his to
      approve, not yours. Two texts of yours are stale and flagged, not edited: CP-13's "Why" line
      (`docs/requirements/02-coding-principles.md`: placeholder names keep their "(rename pending)"
      note in docs and TSDoc) and phase 4's exit criterion 3 (every "(rename pending)" note still
      visible in content display names), both overtaken by DEC-48. T-145 schedules the replacement
      of the interim "Leave cathedral" control in Phase 2, sprint 2.8 (register CD-22; your PR #34
      rule that an interim ships only with its replacement scheduled). T-36 and T-41 add the
      bridge's per-team Legend name and its shared HUD layout geometry (02 §3). T-152 is the Phase
      6, sprint 6.3 task line for the UI enhancements follow-up: it was applied earlier (`97f801b`)
      although HC-S5 is unanswered, so it was taken out of the plan and waits here, like T-145,
      until you answer HC-S5. T-153 says that 14 §11's progress ends at the manifest sum only when
      every file loads; with a failed file it ends below the sum, as the code has done since the
      branch's foundation commit `4a6dec6` (a test pins it); the other choice, counting a failed
      file as loaded, is yours. ADR 0019 (DEC-50) and ADR 0020 (three test-configuration lines) are
      accepted (2026-10-28). Approve all, or name the rows to change or drop.
  - Answered 2026-10-28 (the non-blocking decision page, in chat; the PR register's section "Owner
    answers of 2026-10-28 (non-blocking)" lists every answer). The counts in the paragraph above are
    from before these answers; the table below is current: 127 rows applied, 16 pending.
    - The branch's 20 deviation rows: "Approve all 20": "Approved if they pass critical checks. Same
      parameters as usual; same as, as good as, better than. Never devolve or lose coding
      principles, etc etc etc." Each row was checked against your other answers of the day, and 18
      are applied. T-10 and T-13 are held: your character-select answer fills the bots at LOCK IN
      and gives the enemy a bot that mirrors you (DEC-61), which changes where the rosters are
      completed, so they are redrafted with that build. Each row's basis (the pre-PR critic's
      class, a decision or a fact) is in the table; no new critic run was made for this round, and
      the critic's check of the integration covers the applied text.
    - The plan ticks and notes, T-80 to T-85: "Approve all six" (the same condition): applied.
    - T-145, the real "Leave cathedral" control: "Approve": "If this is just task recording for
      already-finished work, I approve all items like this, and I don't care about their numbering;
      it means nothing to me." Applied. Note: T-145 schedules new work (a HUD control in Phase 2,
      sprint 2.8) rather than recording finished work; your "Approve" is taken as the answer.
    - T-153, loading progress when a file fails: "Approve: it ends lower" (the same condition), and
      "I don't know what 14 section 11 is.": it is section 11, "`ResourceController`", of the
      persistence-and-resources architecture (`docs/architecture/14-persistence-and-resources.md`),
      the part that loads the game's images and fonts. The row says that the loading bar ends below
      its full total when a file fails to load. Applied.
    - T-118, T-120, T-132 and T-133: "Approve all four", given with your rename (DEC-58). Applied:
      they point to the content files instead of listing class names, so the rename does not touch
      them.
    - T-100 to T-102 and T-136 to T-144: your "Every content id" (HC-Q18 (4)): applied.
    - T-11, T-24 and T-31 (HC-Q7 (2)), T-28 and T-90 (HC-F7), T-16 (HC-F9 and HC-Q8) and T-29
      (HC-Q14): applied with those answers.
    - T-23 (HC-Q2): its weapon-level row said MVP where your rules say probably post-MVP, so it is
      redrafted to your rules (DEC-62) and waits for your approval.
    - T-12 and T-75: redrafted to your fixed 60 s countdown and locked view (DEC-60); applied with
      that build.
    - T-152: waits for your list of enhancements (HC-S5); its wording now says "on by default".
    - A-1 and A-2: "Keep both": accepted.
    - T-155 to T-157: "Review them one by one first": "You need to tell me what these are/mean.
      "Reference 10" doesn't mean anything to me, and there's probably upwards of 1000 lines in the
      documents so I need more info to make a decision." Explained: "reference 10" is the
      art-and-lore reference (`docs/reference/game-design/10-art-and-lore.md`); its art table has
      the line "High-quality character art on the selection screen: post-MVP". "Reference 11" is the
      MVP-scope reference (`docs/reference/game-design/11-mvp-scope.md`); its table of controls, UI
      and presentation has the same line, and its list of the game doc's "MVP decisions so far" says
      "selection-screen art post-MVP". The three rows change only those three lines, to say that the
      art is MVP: your Figma art for now, until a digital artist is employed, as you answered on
      2026-10-28 (DEC-51's note; FR-111 already says so). Approve all three, or reject them.
    - New: T-158 to T-161, the words that name the locked class's id, approved with your Harbinger
      answer (HC-F2) and applied with the content rename; T-162 and T-163, the same id in the
      open-questions list and the naming suggestions, for your approval.
    - Still pending (16 rows): T-10, T-12, T-13, T-23, T-75, T-125 (SamarjitBhogal's), T-152, T-155
      to T-157 and T-158 to T-163.
    - Round B19 (2026-10-28): the architecture critic's check of the 49 rows applied above, loop 1
      of the three you allow (the PR register's section "The critic's check of round B18 (loop 1)").
      It found no blocker, 3 should-fix findings and 7 nits; all are fixed. New rows T-164 to T-179
      are applied, each correcting one applied row, which its status names. T-166 drops
      `cancel-match` from the character-select screen's messages: no screen sends it, and your
      DEC-60 takes Esc off the class step. T-169 and T-170 give the real reason the screens read the
      pause key: a paused match cannot read the key that resumes it. T-175 to T-179 cite ADR 0023, a
      new record of your HC-Q18 (4) answer ("Every content id"), which the coding-principles
      requirement CP-13 needed, because a requirement changes only through an ADR (NFR-010); the
      basis of T-100 to T-102 and T-136 to T-144 in the table now cites it too (it cited ADR 0018
      point 5, which covers Legend ids only). T-164, T-167, T-168 and T-169 note your Keep beside
      their `Recommendation:` labels, and T-168 names the text-floor token instead of copying 12 px.
      T-165 and T-171 to T-174 restore a dropped test target and fix interim wording, a grammar
      slip, a test name and a claim that held for non-test files only. **Flag, no answer needed
      now:** T-12's pending redraft still names `cancel-match` (a cancel from character select back
      to the home screen), which no screen sends; when T-12 is applied with the DEC-60 build, either
      the screen that sends it joins the screen table or the trigger is dropped. The counts above
      are from before this round: the table now holds 143 applied rows and 16 pending.
    - Round B20 (2026-10-29): T-155 to T-163 are applied (`3849c8b`): your build-plan answer P8
      ("Approve all three (Recommended)") approved T-155 to T-157, your review page ("approve both")
      T-162 and T-163, and T-158 to T-161 followed the content rename (`6ce2141`). Round B20a
      (2026-10-30, the critic's loop 2): new row T-180 changes the last `flying` in 04 §1 (approved
      with HC-F2, as T-158); T-155 keeps the row's `[STATUS: needs-planning]` marker; T-159 changed
      only the first line of 04 §12, and the worked example's table waits for the HC-Q18 (2) build.
      7 rows pending: T-10, T-12, T-13, T-23, T-75, T-125 and T-152; T-12 and T-152 predate DEC-102
      and DEC-100 (the PR register's section "Owner answers of 2026-10-29" says how). The table now
      holds 153 applied rows and 7 pending.
    - Round B21 (2026-10-30, the docs pass of batch 2, `feat/hud-plan-b2`): nothing applied; 17 rows
      pending. Redrafted, because the build now fills the bots at LOCK IN and a timeout before LOCK IN
      goes home: T-10, T-12 and T-13, the "menu → loading" and "character-select" rows of the session
      table in the game-interface architecture (`docs/architecture/13-game-interface.md`, §2), and
      T-75, the character-select row of the screen-flow reference
      (`docs/reference/game-design/14-interface-and-screen-flow.md`, §5). T-12 still names
      `cancel-match`, which no screen sends (the flag above stands). T-152's wait for your list is
      over (DEC-100); its text now says "the eleven enhancements the owner chose". New, each the
      design text the build overtook: T-181 to T-184 in the game-interface architecture (the
      character-select screen's row gains the locked view and View Details; the action list and its
      table gain `view-details`, "V"; the sentence that still says "the alternate class layout's View
      Details shows `<KeyGlyph action="gadget-2" />`" now says that View Details has its own key);
      T-185 to T-187 in the screen-flow reference (its line "if the player has not selected a
      character when it reaches 0, the match boot is **cancelled**" gains the locked view and the
      popup, and its "Rosters are data" and "Cancel-on-timeout" rules gain LOCK IN's fill and the
      popup); T-188, a row "View Details (character select)", default V, in the default bindings table
      of the controls reference (`docs/reference/game-design/09-controls.md`); T-189 and T-190 in the UI
      enhancements plan (the in-game reduce-motion setting also removes View Details' own interim
      reading of it; the lock-in flare, whose card the locked view no longer has, surrounds the
      standing Legend, a recommendation). The table now holds 153 applied rows and 17 pending.
    - Round B22 (2026-10-30, the architecture critic's loop 1 on batch 2): nothing applied; 18 rows
      pending. T-12 is redrafted without the cancel trigger: no screen sends `cancel-match` (your
      DEC-60 takes Esc off the class step, and after LOCK IN the session ignores every request from
      the screen), so the `character-select` row of the session table in the game-interface
      architecture (§2) no longer says "or `cancel-match` before LOCK IN"; this closes round B19's
      flag above. New: T-191 in the code-structure architecture
      (`docs/architecture/02-code-structure.md`, §6, "The public API rule"). Its list of what core
      exports says that `loadDisplayContent()` returns "the Legend and Legend-spec display data,
      validated through the content rules, and the map features' display names"; since batch 2 it
      also returns the bot roster (the lane bots' classes and the enemy Rover's rule, DEC-61,
      DEC-102), which is setup data rather than display data. The row adds it; the wording is yours.
      The table now holds 153 applied rows and 18 pending.
    - Round B24 (2026-10-30, the docs pass of batches 3 and 4, `feat/hud-plan-b3a`): nothing applied;
      35 rows pending. T-184 is redrafted: the screen-prompts sentence in the game-interface
      architecture (§6.4) says that while View Details is open "only a `pause-menu` key works"; a
      mouse button bound to `pause-menu` closes it too, and its release does not step the browser's
      history (DEC-112). New, each the design text the build overtook (T-192 to T-207): in the
      game-interface architecture, a recipe row "A view over a selection step" (§9, DEC-110), the
      first test bullet (§8) and the requirements' testing table row "Node, no DOM", for the
      happy-dom opt-in (DEC-111), `toggle-developer-camera` in the action list and table (§6.1), the
      `ChordModifier` type there and in the hardware-abstraction architecture (§3), `chordKey`
      with modifiers (§6.2), the map architecture's row "Free view and interior" ("only with the
      developer flag `?dev=1`", DEC-105), the engine architecture's `LoopTarget`, which gains
      `crashed` (§2), the interim bullet that says "Nothing catches an exception thrown by
      `Simulation.step()`" (§10) and the sentence that says a throw "routes to `results`" (§3), the
      phase 6 plan's sprint 6.4 line "moves the session to `results` with a diagnostic" (DEC-106 says
      the menu), the HUD contract's "icons are client-side asset ids" (05 §15; DEC-101, DEC-114),
      the entity architecture's "validates the display-only families" (04 §5, which leaves out the
      bot roster) and the `SessionController` deps sketch (13 §2; `createRng`, `createRosterRng`).
      T-208 puts "except the one `ErrorBoundary` class (ADR 0025)" into the rule "Function
      components only." of `apps/client/AGENTS.md`; it waits for your acceptance of that ADR
      (HC-Q27). No row for DEC-114: no architecture text says the HUD kit comes from the class
      only. The table now holds 153 applied rows and 35 pending.
    - Round B25 (2026-10-30, the critic's loop 1 on batches 3 and 4, and your answers
      HC-B3, HC-Q28 and HC-Q29): nothing applied; 39 rows pending. T-196 is redrafted: the row for
      `toggle-developer-camera` in the game-interface architecture's action table (§6.1) now says
      both chords are bound on every platform, the player's own first (DEC-118), and that the action
      is a one-shot press (DEC-117). New, each the design text the build overtook: T-209 in the
      same architecture (§6.2): its sentence "Two inputs are not read by `Match`" says three and
      names the one-shot actions that `MatchHost` runs, and a new paragraph gives your rule that a
      chord with modifiers is a one-shot press, matched on the key press with exactly its modifiers
      and never held (DEC-117); T-210, the comment in the §6.2 sketch ("handled by Match, except
      `pause-menu`"); T-211, the recipe table's row "A player action" (§9, "or a `clientActions`
      case"); T-212, the same words in the extension recipes' R21 "Add a keybinding action". The
      table now holds 153 applied rows and 39 pending.

  | #     | Where (doc §, line)                                                                                                                                                                                                                                          | Base design said                                                                                                                        | Branch says                                                                                                                                                                                                                      | Basis (DEC/DV/factual)                                                                                                                                                                                                   | Changes general design? y/n + why                                                                             | Status                                                                                                                                                                                 |
  | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | A-1   | 05 §15 sketch, `PlayerSnapshot.xp` and `xpToNext` (`docs/architecture/05-abilities-weapons-and-loadouts.md:825-826`, l.774-775 before the upstream sync), inside the sketch                                                                                  | no comments                                                                                                                             | comments: XP inside the current level; XP the level needs                                                                                                                                                                        | OD-9 (the owner's reading of the XP ring, 2026-10-18)                                                                                                                                                                    | n: comments only                                                                                              | applied in `b04da8f`; accepted 2026-10-28 (owner kept both)                                                                                                                            |
  | A-2   | 13 §10 Implementation status, the "HUD (2026-10-18)" paragraph at the section's end (not design text)                                                                                                                                                        | (none)                                                                                                                                  | the cooldown sweep is the owner's vertical fill (CD-28)                                                                                                                                                                          | OD-9                                                                                                                                                                                                                     | n: a status note                                                                                              | applied in `b04da8f`; accepted 2026-10-28 (owner kept both)                                                                                                                            |
  | T-01  | apps/client/AGENTS.md folder table, `game/GameCanvas.tsx` row (l.30) (`apps/client/AGENTS.md:30`)                                                                                                                                                            | `GameCanvas` owns the canvas and the `Match` lifetime                                                                                   | `GameCanvas` owns the canvas elements; `SessionController` owns the lifetime                                                                                                                                                     | DEC-50 (owner, 2026-10-17)                                                                                                                                                                                               | n: the owner's decision; 13 §1–§2 already designed it                                                         | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-02  | apps/client/AGENTS.md folder table, `game/engine/` row (l.25) (`apps/client/AGENTS.md:25`)                                                                                                                                                                   | `AssetLoader` is in `game/engine/`                                                                                                      | `AssetLoader` is in `data/resources/loaders/` (new row T-03)                                                                                                                                                                     | DV-138 (factual; 02 §3 and 14 §1/§11 already put it there)                                                                                                                                                               | n: aligns the table with 02 and 14                                                                            | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-03  | apps/client/AGENTS.md folder table, new `data/resources/` row (`apps/client/AGENTS.md:34`)                                                                                                                                                                   | (no row)                                                                                                                                | a row naming the resources folder                                                                                                                                                                                                | DV-138 (factual)                                                                                                                                                                                                         | n: names an existing folder of 02 §3                                                                          | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-04  | apps/client/AGENTS.md folder table, `assets/` row (l.36) (`apps/client/AGENTS.md:36`)                                                                                                                                                                        | `assets/` holds the asset manifest                                                                                                      | `assets/` holds the files; the manifest is in `data/resources/`                                                                                                                                                                  | DV-138 (factual; round-4 critic R4-08 keeps the planned `manifest.json`)                                                                                                                                                 | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-05  | apps/client/AGENTS.md folder table, `game/Match.ts` row (l.29) (`apps/client/AGENTS.md:29`)                                                                                                                                                                  | `Match` wires simulation, loop, renderer, input, views and bridge                                                                       | `Match` receives the adapters from the match factory                                                                                                                                                                             | DV-130 (acceptable; composition-root wording, HC-T1)                                                                                                                                                                     | n: `Match` stays the composition root of a match; the factory is bound by `main.tsx`                          | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-06  | apps/client/AGENTS.md "Adding code", new game → UI data (l.44-45) (`apps/client/AGENTS.md:44`)                                                                                                                                                               | publish from `Match.ts`                                                                                                                 | publish from `MatchBridge.ts` (13 §5, 12 §8)                                                                                                                                                                                     | factual (MatchBridge exists since this branch)                                                                                                                                                                           | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-07  | 13 §2 sketch, `SessionController` deps (`docs/architecture/13-game-interface.md:92`)                                                                                                                                                                         | `createMatch: (setup) => Match`                                                                                                         | `prepareWorld(seed)` plus `createMatch(request, viewport)` returning a `RunningMatch`                                                                                                                                            | DEC-50; DV-01 (better than the design, HC-B1)                                                                                                                                                                            | n: the lifetime is the owner's (DEC-50); the signature only splits world preparation from the viewport attach | applied 2026-10-28 (owner approved HC-B1, D3, and accepted ADR 0019, D4)                                                                                                               |
  | T-08  | 13 §2 sketch, `attachViewport` (`docs/architecture/13-game-interface.md:97`)                                                                                                                                                                                 | `attachViewport(host): void`                                                                                                            | `attachViewport(viewport): () => void`                                                                                                                                                                                           | DEC-50; DV-01 (HC-B1)                                                                                                                                                                                                    | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3, and accepted ADR 0019, D4)                                                                                                               |
  | T-09  | 13 §2 table, `boot` row (`docs/architecture/13-game-interface.md:104`)                                                                                                                                                                                       | `loadDefaultContent()` into `contentSlice`                                                                                              | `loadDisplayContent()` into `contentSlice`                                                                                                                                                                                       | DV-30 (acceptable, HC-T1); DEC-49, ADR 0018 (accepted, DEC-56)                                                                                                                                                           | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-10  | 13 §2 table, `menu` → `loading` row (`docs/architecture/13-game-interface.md:106`)                                                                                                                                                                           | builds `MatchSetup`                                                                                                                     | also builds the rosters there, by class; their Legends come at LOCK IN                                                                                                                                                           | DEC-34 (SD-2, delegated "whichever is cleaner"); DEC-61, DEC-102 (built in `4f1d2b5`, `4f6d69f`)                                                                                                                         | n: moves one step between two adjacent rows                                                                   | pending owner; redrafted with the bot-roster build (`4f6d69f`): `menu` builds the rosters by class, LOCK IN fills their Legends (DEC-61)                                               |
  | T-11  | 13 §2 table, `loading` row (`docs/architecture/13-game-interface.md:107`)                                                                                                                                                                                    | one `selection` group                                                                                                                   | the selection groups, chosen by layout and effects renderer                                                                                                                                                                      | DV-41, DV-46 (HC-B1); DEC-52, DEC-54                                                                                                                                                                                     | n                                                                                                             | applied 2026-10-28 (owner confirmed the selection asset groups, INBOX HC-Q7 (2))                                                                                                       |
  | T-12  | 13 §2 table, `character-select` row, trigger (`docs/architecture/13-game-interface.md:108`)                                                                                                                                                                  | confirm a class; timeout with no selection                                                                                              | the countdown always runs its 60 s; LOCK IN locks the pick, fills the bots, shows a locked view; ended after LOCK IN: pre-launch; before it: home with a popup                                                                   | DEC-49 (the Legend step); DEC-60, DEC-61 (the owner's answers of 2026-10-28, INBOX HC-F1 and HC-Q9); DEC-102 (2026-10-29: no match without LOCK IN); built in `4f6d69f`, `0044828`; no screen sends `cancel-match`       | n: the owner's decisions                                                                                      | pending owner; redrafted without the cancel trigger, which no screen sends (round B22); the DEC-102 flow is built (`4f6d69f`, `0044828`)                                               |
  | T-13  | 13 §2 table, `character-select` row, work (`docs/architecture/13-game-interface.md:108`)                                                                                                                                                                     | builds rosters, assigns the team, starts the countdown                                                                                  | records the two picks in `SessionController`; LOCK IN fills each bot's Legend and the enemy Rover's copy; the rosters' classes come from `menu`                                                                                  | DEC-34 SD-2; DEC-49; DEC-60, DEC-61, DEC-102 (built in `4f6d69f`, `fb3b8cd`); DV-03 (acceptable, HC-T1; INBOX "Session D (DEC-34)")                                                                                      | n                                                                                                             | pending owner; redrafted with the bot-roster build (`4f6d69f`): LOCK IN fills the bots (DEC-61, DEC-102) and shows the locked view (DEC-60)                                            |
  | T-14  | 13 §2 table, `match-loading` row, trigger (`docs/architecture/13-game-interface.md:109`)                                                                                                                                                                     | `match` group loaded                                                                                                                    | `match` group loaded and the world prepared                                                                                                                                                                                      | DEC-50                                                                                                                                                                                                                   | n                                                                                                             | applied 2026-10-28 (owner accepted ADR 0019, D4)                                                                                                                                       |
  | T-15  | 13 §2 table, `match-loading` row, work (`docs/architecture/13-game-interface.md:109`)                                                                                                                                                                        | `createMatch(setup)` and `match.start()` here                                                                                           | only the world is prepared here                                                                                                                                                                                                  | DEC-50 (owner)                                                                                                                                                                                                           | n: the owner's decision, which this section already sketched (`attachViewport`)                               | applied 2026-10-28 (owner accepted ADR 0019, D4)                                                                                                                                       |
  | T-16  | 13 §2 table, `match` row, work (`docs/architecture/13-game-interface.md:111`)                                                                                                                                                                                | save the result; destroy on exit                                                                                                        | create on attach, release selection art, pause for overlays, save, destroy                                                                                                                                                       | DEC-50; HC-F9 (default); DV-117 (HC-Q8)                                                                                                                                                                                  | n                                                                                                             | applied 2026-10-28 (owner kept INBOX HC-F9 and confirmed HC-Q8)                                                                                                                        |
  | T-17  | 13 §2, the paragraph after the table (`docs/architecture/13-game-interface.md:115`)                                                                                                                                                                          | `SessionController.test.ts` with a `MemoryStorageAdapter`                                                                               | the transitions test with a fake asset loader                                                                                                                                                                                    | factual                                                                                                                                                                                                                  | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-18  | 13 §3 screens table, new `CharacterSelectScreen` row (`docs/architecture/13-game-interface.md:138`)                                                                                                                                                          | (no row)                                                                                                                                | the two-step character-select screen                                                                                                                                                                                             | DEC-49, DEC-52; DV-26 (acceptable)                                                                                                                                                                                       | n: a screen of the existing `character-select` phase                                                          | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-19  | 13 §3 screens table, `MatchScreen` reads (`docs/architecture/13-game-interface.md:138`)                                                                                                                                                                      | `selectSessionPhase`; viewport and HUD                                                                                                  | overlay and bindings; the only screen with the viewport                                                                                                                                                                          | DEC-50; DV-98 (acceptable)                                                                                                                                                                                               | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-20  | 13 §3 screens table, `MatchScreen` emits (`docs/architecture/13-game-interface.md:138`)                                                                                                                                                                      | `leave-match`, `forfeit`                                                                                                                | adds the overlay intents                                                                                                                                                                                                         | factual (PauseOverlay, DV-101)                                                                                                                                                                                           | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-21  | 13 §3 HUD table, `HealthBar, AetherBar` row (`docs/architecture/13-game-interface.md:136`)                                                                                                                                                                   | level and XP-to-next on the aether bar                                                                                                  | level and XP in `LevelBadge`                                                                                                                                                                                                     | the owner's Figma 62:231 (DEC-53 register); DV-93 (HC-B1)                                                                                                                                                                | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-22  | 13 §3 HUD table, `AbilityBar` row (`docs/architecture/13-game-interface.md:144`)                                                                                                                                                                             | a cooldown sweep                                                                                                                        | the sweep is the owner's vertical fill; gadgets reuse the slot                                                                                                                                                                   | OD-9 (owner meanings, 2026-10-18), CD-28; DV-88                                                                                                                                                                          | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-23  | 13 §3 HUD table, new rows after `AbilityBar` (`docs/architecture/13-game-interface.md:145`)                                                                                                                                                                  | (no rows)                                                                                                                               | the HUD elements of the owner's HUD frame, with his HUD rules of 2026-10-28                                                                                                                                                      | DV-93, DV-19, DV-22 (new features, HC-B1); OQ-63, OQ-64; DEC-62 (the owner's HUD rules, 2026-10-28)                                                                                                                      | n: new leaves on the existing bridge pattern                                                                  | pending owner; redrafted to your HUD rules of 2026-10-28 (DEC-62)                                                                                                                      |
  | T-24  | 13 §5 sketch, `loading-progress` (`docs/architecture/13-game-interface.md:231`)                                                                                                                                                                              | `'boot'                                                                                                                                 | 'menu'                                                                                                                                                                                                                           | 'match'`                                                                                                                                                                                                                 | the asset groups of 14 §11                                                                                    | DV-41 (acceptable, HC-Q7 (2)); audit AS-8                                                                                                                                              | n                                                       | applied 2026-10-28 (owner confirmed the selection asset groups, INBOX HC-Q7 (2)) |
  | T-25  | 13 §5 sketch, new events (`docs/architecture/13-game-interface.md:210`)                                                                                                                                                                                      | (no such events)                                                                                                                        | `structure-state`, `asset-urls`, `credits`                                                                                                                                                                                       | DV-22 (new feature, HC-B1); DEC-51                                                                                                                                                                                       | n: new messages on the one bus                                                                                | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-26  | 13 §5 sketch, `UiIntent` (`docs/architecture/13-game-interface.md:259`)                                                                                                                                                                                      | (no member)                                                                                                                             | `clear-class-selection`                                                                                                                                                                                                          | DV-26 (acceptable)                                                                                                                                                                                                       | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-27  | 13 §5, slice list (`docs/architecture/13-game-interface.md:256`)                                                                                                                                                                                             | (no assets slice)                                                                                                                       | `assetsSlice`                                                                                                                                                                                                                    | DV-23 (new feature, HC-B1)                                                                                                                                                                                               | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-28  | 13 §6.4, appended sentence (`docs/architecture/13-game-interface.md:412`)                                                                                                                                                                                    | (nothing)                                                                                                                               | the two selection prompts reuse match bindings                                                                                                                                                                                   | HC-F7 (default for veto); DV-71                                                                                                                                                                                          | n                                                                                                             | applied 2026-10-28 (owner kept the reused keys, INBOX HC-F7)                                                                                                                           |
  | T-29  | 13 §7, styling bullet (`docs/architecture/13-game-interface.md:421`)                                                                                                                                                                                         | (no scaling rule)                                                                                                                       | the artboard, the HUD unit and the text floor                                                                                                                                                                                    | DV-55, DV-56 (better than the design, HC-B1); DV-121 (HC-Q14)                                                                                                                                                            | n                                                                                                             | applied 2026-10-28 (owner kept 12 px, INBOX HC-Q14)                                                                                                                                    |
  | T-30  | 14 §1 tree, `data/resources/` line (`docs/architecture/14-persistence-and-resources.md:49`)                                                                                                                                                                  | the canvas loaders only                                                                                                                 | adds the port, its contract and the two DOM loaders                                                                                                                                                                              | DV-39, DV-40 (new features, HC-B1); R3-08                                                                                                                                                                                | n: one facade and one manifest stay                                                                           | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-31  | 14 §11 sketch, `AssetType` and `AssetGroup` (`docs/architecture/14-persistence-and-resources.md:398`)                                                                                                                                                        | `'image'                                                                                                                                | 'audio'                                                                                                                                                                                                                          | 'json'`; `'boot'                                                                                                                                                                                                         | 'menu'                                                                                                        | 'match'`                                                                                                                                                                               | adds the DOM image and font types; the selection groups | DV-39, DV-40, DV-41, DV-46 (HC-B1, HC-Q7 (2)); DEC-51                            | n   | applied 2026-10-28 (owner confirmed the selection asset groups, INBOX HC-Q7 (2)) |
  | T-32  | 14 §11 sketch, manifest entry (`docs/architecture/14-persistence-and-resources.md:402`)                                                                                                                                                                      | one `url`                                                                                                                               | `file`, optional `file2x`, per-use `renditions` and an optional draw `box`                                                                                                                                                       | DV-42, DV-122 (HC-B1); the draw box: critic run 1 S4 and N9; critic run 2 game-data-12                                                                                                                                   | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-33  | 14 §11 sketch, loaders (`docs/architecture/14-persistence-and-resources.md:422`)                                                                                                                                                                             | (canvas loaders only)                                                                                                                   | `UiImageLoader`, `FontLoader`                                                                                                                                                                                                    | DV-39, DV-40 (HC-B1); DEC-51                                                                                                                                                                                             | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-34  | 14 §11, two bullets before the progress bullet (`docs/architecture/14-persistence-and-resources.md:443`)                                                                                                                                                     | (no DOM images or fonts)                                                                                                                | DOM images through the store; fonts as assets; per-session density; per-layout groups                                                                                                                                            | DV-39, DV-40, DV-42, DV-46 (HC-B1); DEC-51                                                                                                                                                                               | n: one facade, one manifest, ids not URLs in `ui/`                                                            | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-35  | 14 §13 recipe, asset row (`docs/architecture/14-persistence-and-resources.md:485`)                                                                                                                                                                           | one `ASSET_MANIFEST` line                                                                                                               | one line in the group's file                                                                                                                                                                                                     | DV-131 (acceptable; the ~300-line file rule)                                                                                                                                                                             | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-36  | 02 §3 tree, `bridge/` line (`docs/architecture/02-code-structure.md:95`)                                                                                                                                                                                     | (no display-type files)                                                                                                                 | the display types, the selection rule and the minimap ring                                                                                                                                                                       | DV-16, DV-25, DV-95 (acceptable)                                                                                                                                                                                         | n: shared types in `bridge/`, as 02 §5 plans                                                                  | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-37  | 02 §3 tree, `data/resources/` line (`docs/architecture/02-code-structure.md:97`)                                                                                                                                                                             | loaders/, AssetManifest                                                                                                                 | per-group manifest files; the port                                                                                                                                                                                               | DV-131, DV-39                                                                                                                                                                                                            | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-38  | 02 §3 tree, `assets/` line (`docs/architecture/02-code-structure.md:102`)                                                                                                                                                                                    | manifest in `assets/`                                                                                                                   | files in `assets/`, manifest in `data/resources/`                                                                                                                                                                                | DV-138 (factual; R4-08)                                                                                                                                                                                                  | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-39  | 02 §3 tree, new line after `game/Match.ts` (`docs/architecture/02-code-structure.md:89`)                                                                                                                                                                     | (no line)                                                                                                                               | the match factory                                                                                                                                                                                                                | DV-130 (acceptable, HC-T1); DEC-50                                                                                                                                                                                       | n: a composition-root helper bound only by `main.tsx`                                                         | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-40  | 02 §3 table, `data/resources/` key files (`docs/architecture/02-code-structure.md:117`)                                                                                                                                                                      | the canvas loaders                                                                                                                      | adds the port and the DOM loaders                                                                                                                                                                                                | DV-39, DV-40 (HC-B1)                                                                                                                                                                                                     | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-41  | 02 §3 table, `bridge/` key files (`docs/architecture/02-code-structure.md:116`)                                                                                                                                                                              | (no display-type files)                                                                                                                 | the display types, the selection rule, the per-team Legend name and the shared HUD layout geometry (the minimap ring)                                                                                                            | DV-16, DV-25, DV-95; critic run 2 core-bridge-09                                                                                                                                                                         | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-42  | 02 §6, the planned public surface (`docs/architecture/02-code-structure.md:167`)                                                                                                                                                                             | (no display loader)                                                                                                                     | `loadDisplayContent()`                                                                                                                                                                                                           | DV-30 (acceptable, HC-T1); DEC-49; ADR 0018 (accepted, DEC-56)                                                                                                                                                           | n: a read-only export of content                                                                              | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-43  | 02 §9, asset-manifest row (`docs/architecture/02-code-structure.md:223`)                                                                                                                                                                                     | one file; "An asset"                                                                                                                    | one list, one file per group; an entry's files, renditions and draw box                                                                                                                                                          | DV-131 (acceptable); DV-42, DV-122; critic run 2 game-data-12                                                                                                                                                            | n: still the only list                                                                                        | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-44  | 02 §10, asset row (`docs/architecture/02-code-structure.md:249`)                                                                                                                                                                                             | licence noted in the PR                                                                                                                 | licence and source in the entry; licence texts beside the files                                                                                                                                                                  | DEC-51; DV-131                                                                                                                                                                                                           | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-45  | 01 §3 ports table, new `AssetLoader` row (`docs/architecture/01-layered-oop-model.md:107`)                                                                                                                                                                   | (no row)                                                                                                                                | the asset-loader port                                                                                                                                                                                                            | DV-39 (new feature, HC-B1); R3-08                                                                                                                                                                                        | n: a port with a contract suite, as the table's rule asks                                                     | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-46  | 01 §3, composition-root sentence (`docs/architecture/01-layered-oop-model.md:121`)                                                                                                                                                                           | `Match`, `main.tsx` or a test                                                                                                           | adds the match factory                                                                                                                                                                                                           | DV-130 (HC-T1); DEC-50                                                                                                                                                                                                   | n: the factory is part of the composition root                                                                | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-47  | 17 §11, anti-recipe A8 (`docs/architecture/17-extension-recipes.md:552`)                                                                                                                                                                                     | outside `Match` or `main.tsx`                                                                                                           | outside the composition root, factory included                                                                                                                                                                                   | DV-130 (HC-T1)                                                                                                                                                                                                           | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-48  | 17 R1, files (`docs/architecture/17-extension-recipes.md:82`)                                                                                                                                                                                                | `AssetManifest.ts`                                                                                                                      | the group's manifest file                                                                                                                                                                                                        | DV-131                                                                                                                                                                                                                   | n                                                                                                             | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-50  | 04 §1 table, `Legend` row (`docs/architecture/04-entity-architecture.md:78`)                                                                                                                                                                                 | "rename pending"                                                                                                                        | the display names are decided and live in content (no name copied)                                                                                                                                                               | DEC-48 (owner); ADR 0018 point 4 (no roster copy)                                                                                                                                                                        | n: display names only; ids unchanged                                                                          | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-51  | 04 §5, after the validation paragraph (`docs/architecture/04-entity-architecture.md:221`)                                                                                                                                                                    | (one loader)                                                                                                                            | the display loader and its rule factory                                                                                                                                                                                          | DV-29, DV-30 (acceptable, HC-T1); ADR 0018 (accepted, DEC-56)                                                                                                                                                            | n: same validator, same rule pattern                                                                          | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-54  | 04 §12, first line (`docs/architecture/04-entity-architecture.md:300`)                                                                                                                                                                                       | "rename pending"                                                                                                                        | shown locked; the name is in content                                                                                                                                                                                             | DEC-48; ADR 0018 point 4                                                                                                                                                                                                 | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-55  | 05 §15, display names and icons (`docs/architecture/05-abilities-weapons-and-loadouts.md:839`)                                                                                                                                                               | resolved once at match start into the slice                                                                                             | joined by a selector from boot-time display content                                                                                                                                                                              | DV-21 (acceptable, HC-T1)                                                                                                                                                                                                | n: still never from entities                                                                                  | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-56  | 06 §10, "Minimap (§8)" row, Today (`docs/architecture/06-map-and-minimap.md:415`)                                                                                                                                                                            | layers draw their minimap                                                                                                               | clipped into the main canvas inside the HUD ring                                                                                                                                                                                 | DV-94, DV-95 (acceptable); OD-13                                                                                                                                                                                         | n: interim state, §8 unchanged                                                                                | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-57  | 06 §10, "Free view and interior" row, Today (`docs/architecture/06-map-and-minimap.md:421`)                                                                                                                                                                  | explorer in `Match`, always on                                                                                                          | in `MatchCamera`; developer flag for the free view                                                                                                                                                                               | DV-07 (acceptable, HC-F8); DV-119; DEC-32                                                                                                                                                                                | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-58  | 08 §7 sketch, `Match` deps (`docs/architecture/08-game-engine.md:195`)                                                                                                                                                                                       | (no world)                                                                                                                              | `world: PreparedWorld`                                                                                                                                                                                                           | DV-04 (acceptable); DEC-50                                                                                                                                                                                               | n                                                                                                             | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-79  | 08, new §11 Implementation status (the INBOX HC-T1 draft) (`docs/architecture/08-game-engine.md:281`)                                                                                                                                                        | (no §11; an earlier §11 was removed pending approval, `fb310c6`)                                                                        | a status note on `Match`'s deps, tick and minimap; names `createBrowserMatch` and `MatchHost`                                                                                                                                    | DV-04, DV-05, DV-15, DV-94, DV-130 (acceptable); DEC-50; critic run 2 game-data-05 (it asks for this note)                                                                                                               | n: status only; 08 §7 stays the design                                                                        | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-59  | 09 §2, focus loss (`docs/architecture/09-hardware-abstraction.md:95`)                                                                                                                                                                                        | `Match` subscribes and releases                                                                                                         | `MatchHost` subscribes and releases                                                                                                                                                                                              | DV-05 (acceptable); INBOX HC-Q8 (3) asks the owner (apply only if he keeps the release outside `Match`)                                                                                                                  | n: the boundary stays in L3 `game/`                                                                           | applied 2026-10-28 (owner approved the branch's deviation rows)                                                                                                                        |
  | T-61  | reference 01, classes table, Warrior (`docs/reference/game-design/01-classes-and-subclasses.md:31`)                                                                                                                                                          | "Warrior (formerly Assault)"                                                                                                            | the display name is decided and in content                                                                                                                                                                                       | DEC-48; ADR 0018 point 4                                                                                                                                                                                                 | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-62  | reference 01, classes table, Flying (`docs/reference/game-design/01-classes-and-subclasses.md:34`)                                                                                                                                                           | "rename pending"                                                                                                                        | the display name is decided and in content                                                                                                                                                                                       | DEC-48; ADR 0018 point 4                                                                                                                                                                                                 | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-63  | reference 01, notes, first bullet (`docs/reference/game-design/01-classes-and-subclasses.md:38`)                                                                                                                                                             | placeholders                                                                                                                            | decided names, pointed to in content                                                                                                                                                                                             | DEC-48; ADR 0018 point 4                                                                                                                                                                                                 | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-64  | reference 01, sub-classes intro, appended (`docs/reference/game-design/01-classes-and-subclasses.md:59`)                                                                                                                                                     | (post-MVP only)                                                                                                                         | the pick is setup data today; the roster is content; the game doc's list is in its transcription                                                                                                                                 | DEC-49; ADR 0018 (DEC-56; OD-36)                                                                                                                                                                                         | n: the owner's decision                                                                                       | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-65  | reference 01, sub-classes table, the eight rows of the playable classes (rows T-65 to T-72 merged into one) (`docs/reference/game-design/01-classes-and-subclasses.md:63`)                                                                                   | the game doc's eight sub-classes, all post-MVP                                                                                          | one row pointing to the content; the Flying rows stay                                                                                                                                                                            | DEC-49 (the owner's Legends); consequence of DEC-56 (owner, 2026-10-25); ADR 0018 point 4                                                                                                                                | n: the owner's decisions; the game doc's list stays in its transcription                                      | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-73  | reference 14 §2, item 2 (`docs/reference/game-design/14-interface-and-screen-flow.md:45`)                                                                                                                                                                    | sub-class slots shown but post-MVP                                                                                                      | sub-classes MVP; the locked card                                                                                                                                                                                                 | DEC-48, DEC-49; ADR 0018 (DEC-56; OD-36)                                                                                                                                                                                 | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-74  | reference 14 §3 (`docs/reference/game-design/14-interface-and-screen-flow.md:61`)                                                                                                                                                                            | a basic placeholder                                                                                                                     | the owner's Figma frames                                                                                                                                                                                                         | DEC-52, DEC-53 (the register)                                                                                                                                                                                            | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-75  | reference 14 §5, character-select row (`docs/reference/game-design/14-interface-and-screen-flow.md:83`)                                                                                                                                                      | one screen                                                                                                                              | two steps and a locked view; one fixed 60 s countdown; no match without LOCK IN                                                                                                                                                  | DEC-49; DEC-60 (the owner's character-select answers of 2026-10-28); DEC-102 (2026-10-29); built in `4f6d69f`, `fb3b8cd`                                                                                                 | n: the owner's decisions                                                                                      | pending owner; redrafted to your timeout answer of 2026-10-29 (DEC-102); the flow is built (`4f6d69f`, `fb3b8cd`)                                                                      |
  | T-76  | glossary, Warrior row (`docs/reference/glossary.md:46`)                                                                                                                                                                                                      | Vanguard proposed                                                                                                                       | decided, in content                                                                                                                                                                                                              | DEC-48; ADR 0018 point 4                                                                                                                                                                                                 | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-77  | glossary, Flying row (term and definition) (`docs/reference/glossary.md:92`)                                                                                                                                                                                 | "Flying (rename pending)"; Harrier proposed                                                                                             | the term "Flying"; decided, in content; shown locked                                                                                                                                                                             | DEC-48; ADR 0018 point 4                                                                                                                                                                                                 | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-78  | glossary, Sub-class row (`docs/reference/glossary.md:189`)                                                                                                                                                                                                   | post-MVP; the game doc's names                                                                                                          | MVP; points to the content instead of listing names                                                                                                                                                                              | DEC-49; ADR 0018 (DEC-56; OD-36)                                                                                                                                                                                         | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-80  | phase 1, sprint 1.4, "`Match` composition root + `MatchScreen` shell": ticked (`docs/plan/phase-1-simulation-kernel-and-world.md:202`)                                                                                                                       | [ ] open                                                                                                                                | [x], each "Test" and "Done when" mapped to the branch test that meets it                                                                                                                                                         | the item's own Test and Done when, met by the tests named in the note (OD-31)                                                                                                                                            | n: a progress record                                                                                          | applied 2026-10-28 (owner approved the plan ticks and notes)                                                                                                                           |
  | T-81  | phase 5, sprint 5.2, "`ResourceController` facade + `AssetCache` + `loadingSlice`": note only (`docs/plan/phase-5-meta-ui-and-persistence.md:114`)                                                                                                           | (no note)                                                                                                                               | what the branch built; stays open                                                                                                                                                                                                | OD-31; DV-41, DV-43                                                                                                                                                                                                      | n                                                                                                             | applied 2026-10-28 (owner approved the plan ticks and notes)                                                                                                                           |
  | T-82  | phase 5, sprint 5.2, "`SessionController`": note only (`docs/plan/phase-5-meta-ui-and-persistence.md:125`)                                                                                                                                                   | (no note)                                                                                                                               | what the branch built; stays open (no default profile yet)                                                                                                                                                                       | OD-31; DEC-50                                                                                                                                                                                                            | n                                                                                                             | applied 2026-10-28 (owner approved the plan ticks and notes)                                                                                                                           |
  | T-83  | phase 4, sprint 4.7, "`AbilityBar`, `AetherBar`, `HealthBar` HUD": note only (`docs/plan/phase-4-legends-abilities-and-loadouts.md:201`)                                                                                                                     | (no note)                                                                                                                               | what the branch built; stays open (no live data yet)                                                                                                                                                                             | OD-31; OD-9, CD-28                                                                                                                                                                                                       | n                                                                                                             | applied 2026-10-28 (owner approved the plan ticks and notes)                                                                                                                           |
  | T-84  | phase 3, sprint 3.5, "Match clock and phase on the HUD": note only (`docs/plan/phase-3-minions-hordes-and-ai.md:155`)                                                                                                                                        | (no note)                                                                                                                               | what the branch built; stays open (no phase yet)                                                                                                                                                                                 | OD-31                                                                                                                                                                                                                    | n                                                                                                             | applied 2026-10-28 (owner approved the plan ticks and notes)                                                                                                                           |
  | T-85  | phase 1, sprint 1.4, "Bridge event bus + first Redux slice (match clock)": note only, a second note beside the first (`docs/plan/phase-1-simulation-kernel-and-world.md:199`)                                                                                | [ ] with the session-shell note                                                                                                         | stays [ ]: the test parts are met, the done-when has no lint rule yet                                                                                                                                                            | OD-32: (1) `MatchBridge.test.ts` + `connectBusToStore.ts:49-50`; (2) `selectMatchClockText.test.ts`; (3) unmet: `eslint.config.js:49` is core's block only                                                               | n: a progress record                                                                                          | applied 2026-10-28 (owner approved the plan ticks and notes)                                                                                                                           |
  | T-86  | 13 §2, a DEC-50 paragraph after the table (moved out of the design text to §10 until sign-off, OD-33 S5); apply together with T-07, T-08 and T-14 to T-16 (`docs/architecture/13-game-interface.md:117`)                                                     | (no paragraph)                                                                                                                          | the owner's decision stated where the lifetime is designed                                                                                                                                                                       | DEC-50; critic S5                                                                                                                                                                                                        | n: the rows and sketch it states change in the same edit                                                      | applied 2026-10-28 (owner accepted ADR 0019, D4)                                                                                                                                       |
  | T-87  | 13 §7, a "Display switches" bullet (moved to §10 until sign-off, OD-33 S5) (`docs/architecture/13-game-interface.md:423`)                                                                                                                                    | (no bullet; the contrast minimums are a Recommendation)                                                                                 | the Figma look is the default; alternatives are content values                                                                                                                                                                   | DEC-53, DEC-54, DEC-55; critic S5, N24                                                                                                                                                                                   | n: data switches over the existing token and content rules                                                    | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-88  | 13 §9, a variant paragraph after the recipe table (moved to §10 until sign-off, OD-33 S5) (`docs/architecture/13-game-interface.md:471`)                                                                                                                     | (no paragraph)                                                                                                                          | variants chosen by one content value, the original kept live                                                                                                                                                                     | DEC-52, DEC-53; critic S5                                                                                                                                                                                                | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-89  | 02 §3 table, new `game/content/` row (its imports as built: `main.tsx` injects the known asset ids since the critic rework, NF3; only the test fixture `__fixtures__/shippedCatalogue.ts` reads the manifest) (`docs/architecture/02-code-structure.md:113`) | (no row; the folder predates the branch)                                                                                                | game/content as the client presentation layer                                                                                                                                                                                    | critic NF3 (new feature; the sign-off is this row only)                                                                                                                                                                  | n: names a folder; it keeps to its layer once the asset ids are injected                                      | applied 2026-10-28 (owner approved HC-B1, D3)                                                                                                                                          |
  | T-90  | 13 §6.2, a paragraph on the ui/ action-shortcut path (`docs/architecture/13-game-interface.md:379`)                                                                                                                                                          | (one path: `InputMapper` in `Match`)                                                                                                    | a second, ui-only path for prompts and the pause key                                                                                                                                                                             | critic NF5 (new feature); DV-71, DV-101; DEC-50                                                                                                                                                                          | n: no gameplay input passes through it; chords still compare by `chordKey`                                    | applied 2026-10-28 (owner kept the reused keys, INBOX HC-F7)                                                                                                                           |
  | T-100 | AGENTS.md, coding standards, naming (`AGENTS.md:153`)                                                                                                                                                                                                        | "never renamed once used"                                                                                                               | never renamed once a save or a release stores them; until then a checked refactor                                                                                                                                                | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only)                                                                                                       | n: the rule is unchanged once saves exist                                                                     | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-101 | 04 §10, the paragraph (`docs/architecture/04-entity-architecture.md:286`)                                                                                                                                                                                    | `displayName: 'Warrior (formerly Assault)'`; ids never change "once used"                                                               | each definition's `displayName`; ids fixed once a save or a release stores them, a checked refactor before                                                                                                                       | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only)                                                                                                       | n: the rule is unchanged once saves exist                                                                     | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-102 | 17 R26, files, content id (`docs/architecture/17-extension-recipes.md:517`)                                                                                                                                                                                  | "never once used"                                                                                                                       | never once a save or a release stores it; a checked refactor before                                                                                                                                                              | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only)                                                                                                       | n                                                                                                             | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-103 | reference 01, frontmatter description (`docs/reference/game-design/01-classes-and-subclasses.md:3`)                                                                                                                                                          | "their post-MVP sub-classes"                                                                                                            | sub-classes MVP; roster in content                                                                                                                                                                                               | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                                                | n: the owner's decision                                                                                       | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-104 | reference 01, sub-classes heading (`docs/reference/game-design/01-classes-and-subclasses.md:55`)                                                                                                                                                             | "(names pending) — post-MVP"                                                                                                            | "— MVP (DEC-56)"                                                                                                                                                                                                                 | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                                                | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-105 | reference 01, sub-classes intro, first sentence (`docs/reference/game-design/01-classes-and-subclasses.md:57`)                                                                                                                                               | **post-MVP**                                                                                                                            | **MVP**; D11's data-first model stands                                                                                                                                                                                           | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                                                | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-106 | reference 01, notes, the Flying bullet (`docs/reference/game-design/01-classes-and-subclasses.md:44`)                                                                                                                                                        | the flying class's sub-classes post-MVP                                                                                                 | unchanged for the flying class; says the playable classes' are MVP                                                                                                                                                               | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                                                | n: a clarification; the flying class stays post-MVP                                                           | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-115 | reference 01, the open question after the sub-classes table (`docs/reference/game-design/01-classes-and-subclasses.md:75`)                                                                                                                                   | describes the game doc's list                                                                                                           | points to the transcription and OQ-69                                                                                                                                                                                            | consequence of DEC-56 (owner, 2026-10-25); DEC-49; ADR 0018 point 4                                                                                                                                                      | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-107 | reference 10, placeholders table, sub-class names row (`docs/reference/game-design/10-art-and-lore.md:88`)                                                                                                                                                   | "Sub-classes (post-MVP)", open                                                                                                          | MVP; decided and in content for the playable classes                                                                                                                                                                             | consequence of DEC-56 (owner, 2026-10-25); DEC-49                                                                                                                                                                        | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-108 | glossary, `LegendSpecDefinition` row (`docs/reference/glossary.md:121`)                                                                                                                                                                                      | "consumes post-MVP"; `content/legends/` (post-MVP)                                                                                      | MVP; the specs folder                                                                                                                                                                                                            | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                                                | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-109 | naming suggestions, sub-classes heading (`docs/reference/suggestions/naming.md:49`)                                                                                                                                                                          | "(names pending) — post-MVP (D11)"                                                                                                      | decided; MVP                                                                                                                                                                                                                     | consequence of DEC-56 (owner, 2026-10-25); DEC-49                                                                                                                                                                        | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-110 | naming suggestions, sub-classes intro (`docs/reference/suggestions/naming.md:51`)                                                                                                                                                                            | (names pending)                                                                                                                         | decided, in content; the proposals kept as a record                                                                                                                                                                              | consequence of DEC-56 (owner, 2026-10-25); DEC-49; ADR 0018 point 4                                                                                                                                                      | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-111 | more abilities, frontmatter description (`docs/reference/suggestions/more-abilities.md:3`)                                                                                                                                                                   | sub-class ideas post-MVP                                                                                                                | sub-classes MVP                                                                                                                                                                                                                  | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                                                | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-112 | more abilities, §6 heading (`docs/reference/suggestions/more-abilities.md:155`)                                                                                                                                                                              | "— post-MVP (D11)"                                                                                                                      | "(D11)"                                                                                                                                                                                                                          | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                                                | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-113 | more abilities, §6 intro, last sentence (`docs/reference/suggestions/more-abilities.md:157`)                                                                                                                                                                 | "every row is **post-MVP**"                                                                                                             | MVP scope, phase open; the Flying row post-MVP                                                                                                                                                                                   | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                                                | n: proposals stay proposals                                                                                   | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-114 | backlog, post-MVP gameplay features, sub-classes row (`docs/plan/backlog-post-mvp.md:49`)                                                                                                                                                                    | the game doc's sub-classes, post-MVP, triggered after Phase 6.2                                                                         | MVP scope, phase open; leaves the backlog when the owner names the phase                                                                                                                                                         | consequence of DEC-56 (owner, 2026-10-25); ADR 0018 point 4                                                                                                                                                              | n: records the owner's scope decision; schedules nothing                                                      | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-116 | MVP requirements, coverage note, naming items (`docs/requirements/06-mvp-requirements.md:362`)                                                                                                                                                               | "rename Warrior and Flying"                                                                                                             | decided (DEC-48), held in content                                                                                                                                                                                                | roster audit (OD-38); DEC-48                                                                                                                                                                                             | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-117 | CP-13, requirement (`docs/requirements/02-coding-principles.md:218`)                                                                                                                                                                                         | "`Warrior` (rename pending)"                                                                                                            | a class such as `Warrior` (the class name is decided, DEC-48)                                                                                                                                                                    | roster audit (OD-38); DEC-48. CP-13's "Why" line (placeholder names keep their "(rename pending)" note) is the owner's own rule text and is now stale; flagged, not edited                                               | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-118 | MVP requirements, FR-047, statement (optional) (`docs/requirements/06-mvp-requirements.md:127`)                                                                                                                                                              | the class names listed                                                                                                                  | three classes, pointed to in content (the same requirement)                                                                                                                                                                      | roster audit (OD-38) (optional); DEC-48                                                                                                                                                                                  | n: wording only                                                                                               | applied 2026-10-28 (owner approved the optional rows)                                                                                                                                  |
  | T-119 | 04 §5, `EntityDefinitionBase` sketch comments (`docs/architecture/04-entity-architecture.md:183`)                                                                                                                                                            | 'warrior', never renamed once used; 'Warrior (formerly Assault)'                                                                        | points to 17 R26; no example name                                                                                                                                                                                                | roster audit (OD-38); DEC-48                                                                                                                                                                                             | n: comments only                                                                                              | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-120 | 04 §6, registry sketch (optional) (`docs/architecture/04-entity-architecture.md:238`)                                                                                                                                                                        | three class lines                                                                                                                       | one placeholder line                                                                                                                                                                                                             | roster audit (OD-38) (optional)                                                                                                                                                                                          | n: a sketch                                                                                                   | applied 2026-10-28 (owner approved the optional rows)                                                                                                                                  |
  | T-121 | 04 §13, shipped kinds (`docs/architecture/04-entity-architecture.md:341`)                                                                                                                                                                                    | the class ids listed                                                                                                                    | points to `LEGEND_KINDS`                                                                                                                                                                                                         | roster audit (OD-38)                                                                                                                                                                                                     | n: status text                                                                                                | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-122 | 05 §12 sketch, `Loadout.specId` (`docs/architecture/05-abilities-weapons-and-loadouts.md:672`)                                                                                                                                                               | "post-MVP specialisation; null in the MVP"                                                                                              | null until the gameplay is built; the pick is setup data elsewhere                                                                                                                                                               | consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                                                | n: a comment                                                                                                  | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-123 | 17 R26, when (`docs/architecture/17-extension-recipes.md:512`)                                                                                                                                                                                               | two decided names as placeholders                                                                                                       | generic                                                                                                                                                                                                                          | roster audit (OD-38); DEC-48                                                                                                                                                                                             | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-124 | 17 §11, anti-recipe A7 (`docs/architecture/17-extension-recipes.md:550`)                                                                                                                                                                                     | `Assassin extends Warrior`                                                                                                              | `<Legend> extends <Class>`                                                                                                                                                                                                       | roster audit (OD-38); ADR 0018 point 4                                                                                                                                                                                   | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-125 | architecture 18 §2 table, bot Legend row (owner SamarjitBhogal) (`docs/architecture/18-minion-system.md:51`)                                                                                                                                                 | the class ids listed                                                                                                                    | every playable class (`LEGEND_CLASSES`)                                                                                                                                                                                          | roster audit (OD-38); ADR 0018 point 4                                                                                                                                                                                   | n                                                                                                             | pending SamarjitBhogal (owner of architecture 18)                                                                                                                                      |
  | T-126 | backlog, Flying class row (`docs/plan/backlog-post-mvp.md:48`)                                                                                                                                                                                               | "(rename pending)"                                                                                                                      | shown locked; DEC-48                                                                                                                                                                                                             | roster audit (OD-38); DEC-48                                                                                                                                                                                             | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-127 | phase 4 plan, intro (`docs/plan/phase-4-legends-abilities-and-loadouts.md:24`)                                                                                                                                                                               | the three class names, one "(rename pending)"                                                                                           | points to content                                                                                                                                                                                                                | roster audit (OD-38); DEC-48. Exit criterion 3 (every "(rename pending)" note still visible in content display names) is stale after DEC-48; flagged, not edited                                                         | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-128 | reference 10, placeholders table, Warrior row (`docs/reference/game-design/10-art-and-lore.md:86`)                                                                                                                                                           | open                                                                                                                                    | decided; in content                                                                                                                                                                                                              | roster audit (OD-38); DEC-48                                                                                                                                                                                             | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-129 | reference 10, placeholders table, Flying row (`docs/reference/game-design/10-art-and-lore.md:87`)                                                                                                                                                            | open (idea-pending)                                                                                                                     | decided; in content                                                                                                                                                                                                              | roster audit (OD-38); DEC-48                                                                                                                                                                                             | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-130 | reference 11, scope table, the Flying, mounts and sub-classes row (`docs/reference/game-design/11-mvp-scope.md:65`)                                                                                                                                          | sub-classes post-MVP                                                                                                                    | a sub-classes row, MVP (DEC-56)                                                                                                                                                                                                  | roster audit (OD-38); consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n: the owner's decision                                                                                       | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-131 | reference 11, long-term list (`docs/reference/game-design/11-mvp-scope.md:155`)                                                                                                                                                                              | "needs a new name", sub-classes                                                                                                         | name decided; sub-classes dropped (MVP, DEC-56)                                                                                                                                                                                  | roster audit (OD-38); DEC-48; consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                  | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-132 | reference 11, scope table, classes row (optional) (`docs/reference/game-design/11-mvp-scope.md:64`)                                                                                                                                                          | the class names listed                                                                                                                  | points to content                                                                                                                                                                                                                | roster audit (OD-38) (optional)                                                                                                                                                                                          | n                                                                                                             | applied 2026-10-28 (owner approved the optional rows)                                                                                                                                  |
  | T-133 | glossary, Class row (optional) (`docs/reference/glossary.md:62`)                                                                                                                                                                                             | the class names listed                                                                                                                  | points to content                                                                                                                                                                                                                | roster audit (OD-38) (optional)                                                                                                                                                                                          | n                                                                                                             | applied 2026-10-28 (owner approved the optional rows)                                                                                                                                  |
  | T-134 | reference README, reference 01 entry (`docs/reference/README.md:36`)                                                                                                                                                                                         | "post-MVP sub-classes"                                                                                                                  | aligned with T-103                                                                                                                                                                                                               | roster audit (OD-38); consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-135 | reference README, more-abilities entry (`docs/reference/README.md:54`)                                                                                                                                                                                       | "post-MVP Flying and sub-class ideas"                                                                                                   | aligned with T-111                                                                                                                                                                                                               | roster audit (OD-38); consequence of DEC-56 (owner, 2026-10-25)                                                                                                                                                          | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-136 | CONTRIBUTING §2, naming table, content ids (`CONTRIBUTING.md:28`)                                                                                                                                                                                            | "never renamed once used"                                                                                                               | once a save or a release stores them                                                                                                                                                                                             | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); roster audit (OD-38) (its note on id permanence)                                                     | n: unchanged once saves exist                                                                                 | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-137 | CP-13, requirement, content ids (`docs/requirements/02-coding-principles.md:218`)                                                                                                                                                                            | "never renamed once used"                                                                                                               | once a save or a release stores them                                                                                                                                                                                             | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); roster audit (OD-38) (its note on id permanence)                                                     | n                                                                                                             | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-138 | 02 §4 naming table, content id (`docs/architecture/02-code-structure.md:130`)                                                                                                                                                                                | "never renamed once used"                                                                                                               | once a save or a release stores it                                                                                                                                                                                               | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); roster audit (OD-38) (its note on id permanence)                                                     | n                                                                                                             | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-139 | 05 §2 sketch, `AbilityDefinition.id` (`docs/architecture/05-abilities-weapons-and-loadouts.md:87`)                                                                                                                                                           | "never renamed once used"                                                                                                               | once a save or a release stores it                                                                                                                                                                                               | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); roster audit (OD-38) (its note on id permanence)                                                     | n: a comment                                                                                                  | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-140 | 16, skills table, `new-content` (`docs/architecture/16-agentic-harness.md:176`)                                                                                                                                                                              | "ids never renamed"                                                                                                                     | once a save or a release stores them                                                                                                                                                                                             | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); roster audit (OD-38) (its note on id permanence)                                                     | n                                                                                                             | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-141 | reference 08, a saved loadout with a renamed id (`docs/reference/game-design/08-loadout.md:85`)                                                                                                                                                              | "never renamed once used"                                                                                                               | once a save or a release stores them                                                                                                                                                                                             | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); roster audit (OD-38) (its note on id permanence)                                                     | n                                                                                                             | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-142 | suggestions README, rule 4 (`docs/reference/suggestions/README.md:46`)                                                                                                                                                                                       | "never renamed once used"                                                                                                               | once a save or a release stores them                                                                                                                                                                                             | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); roster audit (OD-38) (its note on id permanence)                                                     | n                                                                                                             | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-143 | naming suggestions, in-code convention, rule 3 (`docs/reference/suggestions/naming.md:317`)                                                                                                                                                                  | "never change once used"; IDs stored in saves, replays and test fixtures                                                                | once a save or a release stores them; until then a checked content refactor                                                                                                                                                      | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); roster audit (OD-38) (found when round B8 was checked)                                               | n: unchanged once saves exist                                                                                 | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-144 | naming suggestions, sketch, the `id` comment (`docs/reference/suggestions/naming.md:326`)                                                                                                                                                                    | "never renamed once used"                                                                                                               | once a save or a release stores it                                                                                                                                                                                               | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); roster audit (OD-38) (found when round B8 was checked)                                               | n: a comment in a sketch                                                                                      | applied 2026-10-28 (owner: every content id, INBOX HC-Q18 (4))                                                                                                                         |
  | T-145 | phase 2 plan, sprint 2.8, new task after the HUD `HealthBar` task (`docs/plan/phase-2-structures-and-combat.md:216`)                                                                                                                                         | (no task: the interim control has no scheduled replacement)                                                                             | a `ui/hud/` control and a `leave-interior` intent in sprint 2.8                                                                                                                                                                  | critic run 2 game-data-06; CD-22, DV-119; the owner's PR #34 review (an interim ships only with its replacement scheduled)                                                                                               | n: schedules the design's own path (13 §3, §5, §9); adds no gameplay                                          | applied 2026-10-28 (owner approved)                                                                                                                                                    |
  | T-146 | MVP requirements, FR-090, acceptance (`docs/requirements/06-mvp-requirements.md:192`)                                                                                                                                                                        | the display name in one place in `ui/`                                                                                                  | in one place, core content                                                                                                                                                                                                       | AGENTS.md rule 11 and 02 §7, §10 (display names are core content); critic run 2 game-data-02, reworked in `61401b2` and `e93e61e`                                                                                        | n: follows rule 11; the name itself stays a working name                                                      | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-147 | naming suggestions, Warrior section, a note under the heading (`docs/reference/suggestions/naming.md:24`)                                                                                                                                                    | a recommendation, proposed                                                                                                              | decided (DEC-48); the name is in content; the options kept as the record                                                                                                                                                         | DEC-48; ADR 0018 point 4; 17 R26 (its docs step records the pick in the naming suggestions); /pr-review (2026-10-27) pr-core-bridge-01                                                                                   | n: records the owner's decision                                                                               | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-148 | naming suggestions, Flying section, the heading and a note under it (`docs/reference/suggestions/naming.md:37`)                                                                                                                                              | "(rename pending)"; a recommendation, proposed                                                                                          | decided (DEC-48); the name is in content; still post-MVP                                                                                                                                                                         | DEC-48; ADR 0018 point 4; 17 R26 (its docs step records the pick in the naming suggestions); /pr-review (2026-10-27) pr-core-bridge-01                                                                                   | n: records the owner's decision                                                                               | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-149 | naming suggestions, summary table, Warrior (class) row, recommended pick (`docs/reference/suggestions/naming.md:276`)                                                                                                                                        | a recommended pick                                                                                                                      | decided (DEC-48), in content (the Warrior section names the file)                                                                                                                                                                | DEC-48; ADR 0018 point 4; 17 R26 (its docs step records the pick in the naming suggestions); /pr-review (2026-10-27) pr-core-bridge-01                                                                                   | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-150 | naming suggestions, summary table, Flying (class) row, recommended pick (`docs/reference/suggestions/naming.md:277`)                                                                                                                                         | a recommended pick                                                                                                                      | decided (DEC-48), in content (the Flying section names the file)                                                                                                                                                                 | DEC-48; ADR 0018 point 4; 17 R26 (its docs step records the pick in the naming suggestions); /pr-review (2026-10-27) pr-core-bridge-01                                                                                   | n                                                                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-151 | architecture README §4, D11 row, "Recorded in" (`docs/architecture/README.md:136`)                                                                                                                                                                           | ADR 0006                                                                                                                                | ADR 0006 and ADR 0018                                                                                                                                                                                                            | ADR 0018 "Documents amended on acceptance" (the D11 row; accepted as the owner corrected it, DEC-56); /pr-review (2026-10-27) pr-docs-process-14                                                                         | n: names the ADR the row already cites                                                                        | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-152 | phase 6 plan, sprint 6.3, new task after the "Audio and announcer" task (`docs/plan/phase-6-hardening-balance-and-release.md:143`)                                                                                                                           | (no task)                                                                                                                               | the UI enhancements follow-up task (`docs/plan/ui-enhancements-plan.md`): UE-03 first, then the eleven of DEC-100, on by default                                                                                                 | INBOX HC-S5 (2026-10-28: "Build these, switched on by default"; 2026-10-29: all eleven, DEC-100); OD-26 and OD-31 (a new task in his plan waits for him, as T-145 did); /pr-review (2026-10-27) pr-docs-process-05       | n: schedules a follow-up; adds no gameplay                                                                    | pending owner; your list came on 2026-10-29 (all eleven, DEC-100); the task line's text waits for your approval                                                                        |
  | T-153 | 14 §11, the progress bullet (`docs/architecture/14-persistence-and-resources.md:456`)                                                                                                                                                                        | "ends at the manifest sum"                                                                                                              | ends at the manifest sum when every file loads, below it if a file fails (only a loaded entry's loaded files count)                                                                                                              | factual: `ResourceController` since `4a6dec6`, pinned by the test "warns once for a failed rendition and serves its key with the entry url"; the review of the repairs                                                   | n: byte-based and monotonic stay. Your call: count a failed file as loaded instead                            | applied 2026-10-28 (owner approved: progress ends lower)                                                                                                                               |
  | T-154 | decisions log, DEC-49 row, "Affects" column (the core files) (`docs/reference/game-design/13-owner-decisions-log.md:55`)                                                                                                                                     | the content rules `defaultContentRules.ts` and `SpecClassExistsRule.ts`                                                                 | adds `RoleRatingRangeRule.ts`, the rule that keeps every Legend role rating from 0 to 1                                                                                                                                          | `42bb212` (/pr-review (2026-10-27) pr-ui-screens-04) checks DEC-49's Legend specs; the log's Purpose (a decision lists what it affects); 04 §5 (one rule class per check)                                                | n: a file pointer; the decision text is unchanged                                                             | applied 2026-10-28 (owner approved, D1)                                                                                                                                                |
  | T-155 | reference 10, art theme table, selection-screen art row (`docs/reference/game-design/10-art-and-lore.md:29`)                                                                                                                                                 | **post-MVP**                                                                                                                            | **MVP**: the owner's Figma art for now, until a digital artist is employed                                                                                                                                                       | consequence of the owner's answer to INBOX HC-Q7 (1) (2026-10-28, D2; DEC-51's note of that day)                                                                                                                         | n: records the owner's decision                                                                               | applied 2026-10-29 (owner: "Approve all three", build-plan answer P8; `3849c8b`)                                                                                                       |
  | T-156 | reference 11, controls, UI and presentation table, selection-screen art row (`docs/reference/game-design/11-mvp-scope.md:117`)                                                                                                                               | **post-MVP**                                                                                                                            | **MVP**, the owner's Figma art for now                                                                                                                                                                                           | consequence of the owner's answer to INBOX HC-Q7 (1) (2026-10-28, D2; DEC-51's note of that day)                                                                                                                         | n: records the owner's decision                                                                               | applied 2026-10-29 (owner: "Approve all three", build-plan answer P8; `3849c8b`)                                                                                                       |
  | T-157 | reference 11, the game doc's "MVP decisions so far", the art bullet (`docs/reference/game-design/11-mvp-scope.md:139`)                                                                                                                                       | selection-screen art **post-MVP**                                                                                                       | selection-screen art **MVP** since 2026-10-28                                                                                                                                                                                    | consequence of the owner's answer to INBOX HC-Q7 (1) (2026-10-28, D2; DEC-51's note of that day)                                                                                                                         | n: records the owner's decision                                                                               | applied 2026-10-29 (owner: "Approve all three", build-plan answer P8; `3849c8b`)                                                                                                       |
  | T-158 | 04 §1 table, `Legend` row (`docs/architecture/04-entity-architecture.md:78`)                                                                                                                                                                                 | `flying` reserved                                                                                                                       | `harbinger` reserved                                                                                                                                                                                                             | DEC-59 (the owner, 2026-10-28: "Use the id harbinger"; INBOX HC-F2 named these words)                                                                                                                                    | n: one id                                                                                                     | approved 2026-10-28 (your Harbinger id answer, INBOX HC-F2); applied with the content rename                                                                                           |
  | T-159 | 04 §12, the worked example's first line (`docs/architecture/04-entity-architecture.md:303`)                                                                                                                                                                  | `flying`                                                                                                                                | `harbinger`; the example table's file, constant and class names follow INBOX HC-Q18 (2) (class id or entity kind)                                                                                                                | DEC-59 (the owner, 2026-10-28: "Use the id harbinger"; INBOX HC-F2 named these words)                                                                                                                                    | n: one id                                                                                                     | first line applied 2026-10-29 (`3849c8b`); the worked-example table's file, constant and class names wait for the HC-Q18 (2) build                                                     |
  | T-160 | 17 R1, when (`docs/architecture/17-extension-recipes.md:76`)                                                                                                                                                                                                 | `flying`                                                                                                                                | `harbinger`                                                                                                                                                                                                                      | DEC-59 (the owner, 2026-10-28: "Use the id harbinger"; INBOX HC-F2 named these words)                                                                                                                                    | n: one id                                                                                                     | approved 2026-10-28 (your Harbinger id answer, INBOX HC-F2); applied with the content rename                                                                                           |
  | T-161 | phase 4 plan, sprint 4.1, the `Legend` task (`docs/plan/phase-4-legends-abilities-and-loadouts.md:49`)                                                                                                                                                       | `[Flying]` reserved as a content id                                                                                                     | `harbinger` reserved as a content id                                                                                                                                                                                             | DEC-59 (the owner, 2026-10-28: "Use the id harbinger"; INBOX HC-F2 named these words)                                                                                                                                    | n: one id                                                                                                     | approved 2026-10-28 (your Harbinger id answer, INBOX HC-F2); applied with the content rename                                                                                           |
  | T-162 | reference 12, OQ-02 (`docs/reference/game-design/12-open-questions.md:40`)                                                                                                                                                                                   | id `flying` (HC-F2)                                                                                                                     | id `harbinger` (DEC-59)                                                                                                                                                                                                          | consequence of DEC-59 (the owner, 2026-10-28: "Use the id harbinger"; INBOX HC-F2)                                                                                                                                       | n: one id                                                                                                     | applied 2026-10-29 (owner: "approve both", review page; `3849c8b`)                                                                                                                     |
  | T-163 | naming suggestions, Flying section, the decided note (`docs/reference/suggestions/naming.md:41`)                                                                                                                                                             | `locked/flying.ts`                                                                                                                      | `locked/harbinger.ts` (the file renamed with the id)                                                                                                                                                                             | consequence of DEC-59 (the owner, 2026-10-28: "Use the id harbinger"; INBOX HC-F2)                                                                                                                                       | n: a file path                                                                                                | applied 2026-10-29 (owner: "approve both", review page; `3849c8b`)                                                                                                                     |
  | T-164 | 13 §2 table, `match` row, work, the HC-F9 label (`docs/architecture/13-game-interface.md:111`)                                                                                                                                                               | `Recommendation:`, INBOX HC-F9 (T-16)                                                                                                   | `Recommendation:`, the owner's Keep of 2026-10-28, INBOX HC-F9                                                                                                                                                                   | INBOX HC-F9 ("Keep", 2026-10-28); architecture critic, loop 1 (2026-10-28) (nit)                                                                                                                                         | n: a label                                                                                                    | applied 2026-10-28 (critic loop 1; corrects T-16: notes your Keep, INBOX HC-F9)                                                                                                        |
  | T-165 | 13 §2, the paragraph after the table, the transitions test (`docs/architecture/13-game-interface.md:115`)                                                                                                                                                    | fake states and a fake asset loader (T-17)                                                                                              | fake states, a `MemoryStorageAdapter` and a fake asset loader: the target kept; 13 §10 says the session takes no persistence yet                                                                                                 | architecture critic, loop 1 (2026-10-28) (nit: T-17 described only today's test; OG-12)                                                                                                                                  | n: keeps the base design's target                                                                             | applied 2026-10-28 (critic loop 1; corrects T-17, which you approved if it passed the critic's check)                                                                                  |
  | T-166 | 13 §3 screens table, `CharacterSelectScreen` row, Emits (`docs/architecture/13-game-interface.md:138`)                                                                                                                                                       | `confirm-selection`, `cancel-match` (T-18)                                                                                              | no `cancel-match`: no `ui/` file emits it, and DEC-60 takes Esc off the class step                                                                                                                                               | architecture critic, loop 1 (2026-10-28) (should-fix); DEC-60                                                                                                                                                            | n: matches the code                                                                                           | applied 2026-10-28 (critic loop 1; corrects T-18, which you approved if it passed the critic's check)                                                                                  |
  | T-167 | 13 §6.4, the HC-F7 label (`docs/architecture/13-game-interface.md:422`)                                                                                                                                                                                      | `Recommendation:`, INBOX HC-F7 (T-28)                                                                                                   | `Recommendation:`, the owner's Keep of 2026-10-28, INBOX HC-F7                                                                                                                                                                   | INBOX HC-F7 ("Keep the reused keys", 2026-10-28); architecture critic, loop 1 (2026-10-28) (nit)                                                                                                                         | n: a label                                                                                                    | applied 2026-10-28 (critic loop 1; corrects T-28: notes your Keep, INBOX HC-F7)                                                                                                        |
  | T-168 | 13 §7, styling bullet, the text floor (`docs/architecture/13-game-interface.md:434`)                                                                                                                                                                         | `--text-min` (`Recommendation:` 12 px, INBOX HC-Q14) (T-29)                                                                             | `--text-min`, whose value `styles/global.css` sets; the owner's Keep of 2026-10-28 noted; no copied 12 px                                                                                                                        | INBOX HC-Q14 ("Keep 12 px", 2026-10-28); architecture critic, loop 1 (2026-10-28) (nit; OG-12: name where a value lives)                                                                                                 | n: names where the value lives                                                                                | applied 2026-10-28 (critic loop 1; corrects T-29: notes your Keep, INBOX HC-Q14)                                                                                                       |
  | T-169 | 13 §6.2, the ui/ action-shortcut paragraph (`docs/architecture/13-game-interface.md:383`)                                                                                                                                                                    | "Outside a match no `Match` reads input" (T-90)                                                                                         | the prompts: no `Match` outside a match; the pause key: a paused match's stopped loop cannot read it; the owner's Keep of 2026-10-28 noted                                                                                       | architecture critic, loop 1 (2026-10-28) (should-fix: it contradicted the sketch; ADR 0011); INBOX HC-F7 ("Keep the reused keys", 2026-10-28)                                                                            | n: the reason 13 §10 already gives                                                                            | applied 2026-10-28 (critic loop 1; corrects T-90, which you kept, INBOX HC-F7)                                                                                                         |
  | T-170 | 13 §6.2 sketch, the `clientActions` comment (`docs/architecture/13-game-interface.md:370`)                                                                                                                                                                   | "the client-only edges (§6.1), handled by Match"                                                                                        | the same, except `pause-menu`, which `ui/` reads                                                                                                                                                                                 | architecture critic, loop 1 (2026-10-28) (should-fix, with T-169)                                                                                                                                                        | n: a comment                                                                                                  | applied 2026-10-28 (critic loop 1; corrects T-90, which you kept, INBOX HC-F7)                                                                                                         |
  | T-171 | 02 §3 tree, `assets/` line (`docs/architecture/02-code-structure.md:103`)                                                                                                                                                                                    | "the generated manifest.json of 14 §11 stays planned" (T-38)                                                                            | the typed manifest's place only; the planned manifest.json moves to 02 §12's status note                                                                                                                                         | architecture critic, loop 1 (2026-10-28) (nit; OG-12, ADR 0011: no interim state in design text)                                                                                                                         | n                                                                                                             | applied 2026-10-28 (critic loop 1; corrects T-38, which you approved if it passed the critic's check)                                                                                  |
  | T-172 | 09 §2, focus loss, the sentence order (`docs/architecture/09-hardware-abstraction.md:97`)                                                                                                                                                                    | "so `Match` uses no browser API; because no `keyup` arrives" (T-59)                                                                     | releases held input because no `keyup` arrives; so `Match` uses no browser API                                                                                                                                                   | architecture critic, loop 1 (2026-10-28) (nit: a dangling clause)                                                                                                                                                        | n: grammar                                                                                                    | applied 2026-10-28 (critic loop 1; corrects T-59, which you approved if it passed the critic's check)                                                                                  |
  | T-173 | phase 1, sprint 1.4, the `Match` task's note, the test name (`docs/plan/phase-1-simulation-kernel-and-world.md:202`)                                                                                                                                         | "its subscription on destroy" (T-80)                                                                                                    | "its subscriptions on destroy", the name in `Match.lifecycle.test.ts`                                                                                                                                                            | architecture critic, loop 1 (2026-10-28) (nit)                                                                                                                                                                           | n: a progress record                                                                                          | applied 2026-10-28 (critic loop 1; corrects T-80, which you approved if it passed the critic's check)                                                                                  |
  | T-174 | phase 1, sprint 1.4, the bridge task's second note (`docs/plan/phase-1-simulation-kernel-and-world.md:199`)                                                                                                                                                  | "a scan finds no such import today" (T-85)                                                                                              | no such import in a non-test file; the test `SettingsScreen.rebind.test.tsx` has some                                                                                                                                            | architecture critic, loop 1 (2026-10-28) (nit)                                                                                                                                                                           | n: a progress record                                                                                          | applied 2026-10-28 (critic loop 1; corrects T-85, which you approved if it passed the critic's check)                                                                                  |
  | T-175 | AGENTS.md, coding standards, naming, the citation (`AGENTS.md:155`)                                                                                                                                                                                          | "ADR 0018" (T-100)                                                                                                                      | "ADR 0023, `INBOX.md` HC-Q18 (4)"                                                                                                                                                                                                | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); architecture critic, loop 1 (2026-10-28) (should-fix)                                                | n: a citation                                                                                                 | applied 2026-10-28 (critic loop 1; corrects T-100: cites ADR 0023, the record of your HC-Q18 (4) answer)                                                                               |
  | T-176 | 04 §10, the citation (`docs/architecture/04-entity-architecture.md:289`)                                                                                                                                                                                     | "(ADR 0018)" (T-101)                                                                                                                    | "(ADR 0023)"                                                                                                                                                                                                                     | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); architecture critic, loop 1 (2026-10-28) (should-fix)                                                | n: a citation                                                                                                 | applied 2026-10-28 (critic loop 1; corrects T-101: cites ADR 0023, the record of your HC-Q18 (4) answer)                                                                               |
  | T-177 | 17 R26, files, content id, the citation (`docs/architecture/17-extension-recipes.md:519`)                                                                                                                                                                    | "none yet, ADR 0018" (T-102)                                                                                                            | "none yet, ADR 0023"                                                                                                                                                                                                             | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); architecture critic, loop 1 (2026-10-28) (should-fix)                                                | n: a citation                                                                                                 | applied 2026-10-28 (critic loop 1; corrects T-102: cites ADR 0023, the record of your HC-Q18 (4) answer)                                                                               |
  | T-178 | CP-13, requirement, content ids, a citation (`docs/requirements/02-coding-principles.md:218`)                                                                                                                                                                | (no citation) (T-137)                                                                                                                   | "(ADR 0023; `INBOX.md` HC-Q18 (4))"                                                                                                                                                                                              | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); architecture critic, loop 1 (2026-10-28) (should-fix); NFR-010: a requirement changes only by an ADR | n: a citation                                                                                                 | applied 2026-10-28 (critic loop 1; corrects T-137: cites ADR 0023, the record of your HC-Q18 (4) answer)                                                                               |
  | T-179 | naming suggestions, in-code convention, rule 3, the citation (`docs/reference/suggestions/naming.md:317`)                                                                                                                                                    | "(ADR 0018 point 5)" (T-143)                                                                                                            | "(ADR 0023)"                                                                                                                                                                                                                     | ADR 0023 and INBOX HC-Q18 (4) (the owner, 2026-10-28: "Every content id"; ADR 0018 point 5 covers Legend ids only); architecture critic, loop 1 (2026-10-28) (should-fix)                                                | n: a citation                                                                                                 | applied 2026-10-28 (critic loop 1; corrects T-143: cites ADR 0023, the record of your HC-Q18 (4) answer)                                                                               |
  | T-180 | 04 §1 table, `Legend` row, Status (`docs/architecture/04-entity-architecture.md:78`)                                                                                                                                                                         | `flying` **post-MVP**                                                                                                                   | `harbinger` **post-MVP**                                                                                                                                                                                                         | DEC-59 (the owner, 2026-10-28: "Use the id harbinger"; INBOX HC-F2 named these words)                                                                                                                                    | n: one id                                                                                                     | approved 2026-10-28 (your Harbinger id answer, INBOX HC-F2); applied with the content rename                                                                                           |
  | T-181 | 13 §3 screens table, `CharacterSelectScreen` row, Screen and Reads (`docs/architecture/13-game-interface.md:138`)                                                                                                                                            | two steps; reads team, allies, selection, countdown                                                                                     | adds the locked view after LOCK IN (DEC-60) and View Details over both steps (DEC-103, DEC-109); reads the lock                                                                                                                  | DEC-60 (`fb3b8cd`); DEC-103, DEC-109 (`c7052fc`, `f6b1b5c`); factual (`matchSetupSlice` holds `isLockedIn`)                                                                                                              | n: new states of the existing screen                                                                          | pending owner; new 2026-10-30 (batch 2 docs pass): the locked view and View Details are built                                                                                          |
  | T-182 | 13 §6.1 sketch, `INPUT_ACTIONS` (`docs/architecture/13-game-interface.md:299`)                                                                                                                                                                               | (no `view-details`)                                                                                                                     | the `view-details` action                                                                                                                                                                                                        | DEC-103 (the owner, 2026-10-29: "V view details"; `d7b7b15`)                                                                                                                                                             | n: one action id (13 §9, "A player action")                                                                   | pending owner; new 2026-10-30 (batch 2 docs pass): V View Details is built (`d7b7b15`)                                                                                                 |
  | T-183 | 13 §6.1 actions table, new row after the `camera-zoom-in/out`, `toggle-minimap`, `pause-menu` row (`docs/architecture/13-game-interface.md:349`)                                                                                                             | (no row)                                                                                                                                | `view-details`: V, client-only, read in `ui/` by the prompt                                                                                                                                                                      | DEC-103 (`d7b7b15`, `c7052fc`)                                                                                                                                                                                           | n: a client-only action, like `pause-menu`                                                                    | pending owner; new 2026-10-30 (batch 2 docs pass): V View Details is built (`d7b7b15`)                                                                                                 |
  | T-184 | 13 §6.4, the selection prompts sentence (`docs/architecture/13-game-interface.md:421`)                                                                                                                                                                       | the alternate layout's View Details shows `gadget-2` (T-28, T-167)                                                                      | View Details has its own `view-details` action (V) on both class layouts and the Legend step; Back keeps `pause-menu`; only a `pause-menu` key or mouse button works while it is open, and its release does not step the history | DEC-103 (V replaces HC-F7's reused C); DEC-109 (the alternate layout); DEC-65 (only the Back key); DEC-112 (the owner, 2026-10-30: "guard it, please"; `b1fe73e`); INBOX HC-F7 ("Keep the reused keys", for Back)        | n: the owner's decisions                                                                                      | pending owner; redrafted 2026-10-30 (round B24): a mouse button bound to `pause-menu` closes the view too, and its release does not step the history (`b1fe73e`, DEC-112)              |
  | T-185 | reference 14 §2, item 2, the countdown (`docs/reference/game-design/14-interface-and-screen-flow.md:50`)                                                                                                                                                     | not selected a character at 0: cancelled, home                                                                                          | always 60 s; LOCK IN locks the pick and shows a locked view; not locked in at 0: cancelled, home, with a popup                                                                                                                   | DEC-60 (the owner, 2026-10-28: "The countdown is always 60 seconds"); DEC-102 (2026-10-29: "returned to the home screen with a themed popup")                                                                            | n: the owner's decisions                                                                                      | pending owner; new 2026-10-30 (batch 2 docs pass): your countdown and timeout answers are built                                                                                        |
  | T-186 | reference 14 §5, "Rosters are data" (`docs/reference/game-design/14-interface-and-screen-flow.md:98`)                                                                                                                                                        | built from content when the setup is created                                                                                            | adds: LOCK IN fills each bot's Legend, and the enemy's tenth bot copies the player's pick                                                                                                                                        | DEC-61 (the owner, 2026-10-28: "Locking in fills in the remaining bots"); DEC-102; built in `4f6d69f`                                                                                                                    | n: the owner's decisions                                                                                      | pending owner; new 2026-10-30 (batch 2 docs pass): the bots are filled at LOCK IN (`4f6d69f`)                                                                                          |
  | T-187 | reference 14 §5, "Cancel-on-timeout" (`docs/reference/game-design/14-interface-and-screen-flow.md:99`)                                                                                                                                                       | a transition with a reason                                                                                                              | adds: before LOCK IN, with or without a class; the home screen's popup                                                                                                                                                           | DEC-102 (the owner, 2026-10-29); built in `4f6d69f`, `0044828`                                                                                                                                                           | n: the owner's decision                                                                                       | pending owner; new 2026-10-30 (batch 2 docs pass): the timeout popup is built (`0044828`)                                                                                              |
  | T-188 | reference 09, default bindings table, new row after "Fury dash direction" (`docs/reference/game-design/09-controls.md:39`)                                                                                                                                   | (no row)                                                                                                                                | View Details: V, `view-details`                                                                                                                                                                                                  | DEC-103 (`d7b7b15`); 17 R21 (its docs step: the controls table)                                                                                                                                                          | n: one binding the owner chose                                                                                | pending owner; new 2026-10-30 (batch 2 docs pass): V View Details is built (`d7b7b15`)                                                                                                 |
  | T-189 | UI enhancements plan §3.1, UE-03, What changes and Component(s) (`docs/plan/ui-enhancements-plan.md:107`)                                                                                                                                                    | the module rules of `GradientLayer` and `ParticlesLayer`                                                                                | also removes View Details' interim reading of the setting (`data-reduce-motion` on its own root)                                                                                                                                 | factual: `c7052fc`, `6064f10` (the code names UE-03 as its replacement)                                                                                                                                                  | n: the plan names one more file                                                                               | pending owner; new 2026-10-30 (batch 2 docs pass): View Details reads the setting until UE-03 (`6064f10`)                                                                              |
  | T-190 | UI enhancements plan §3.2, UE-06, What changes, Component(s) and Parameters (`docs/plan/ui-enhancements-plan.md:115`)                                                                                                                                        | a flare on the picked Legend card (`LegendSelectCard`): its glow                                                                        | a flare around the locked Legend in the locked view (`LockedSelectStep`), which has no card; `Recommendation:` a glow in the Legend's accent                                                                                     | DEC-60, DEC-100 (UE-06 plays on the locked view); factual: the locked view has no card (`fb3b8cd`)                                                                                                                       | n: the same flare on the view that replaced the card                                                          | pending owner; new 2026-10-30 (batch 2 docs pass): the locked view has no card (`fb3b8cd`)                                                                                             |
  | T-191 | 02 §6, the planned public surface, `loadDisplayContent()` (`docs/architecture/02-code-structure.md:172`)                                                                                                                                                     | display data and the map features' display names                                                                                        | adds the bot roster, setup data the session builds the rosters from                                                                                                                                                              | factual: `loadDisplayContent()` and `contentSlice` carry the bot roster (`4f1d2b5`, `4f6d69f`); DEC-61, DEC-102; architecture critic, batch 2 loop 1 (nit)                                                               | n: one more content family through the same validated loader                                                  | pending owner; new 2026-10-30 (critic loop 1 on batch 2): the loader carries setup data too; the wording is yours                                                                      |
  | T-192 | 13 §9 recipe table, new row after "A screen" (`docs/architecture/13-game-interface.md:498`)                                                                                                                                                                  | (no row; a screen is a `MenuRoute` or a `SessionPhase`)                                                                                 | a row "A view over a selection step": the files, the hook that holds its open state, the key filter                                                                                                                              | DEC-110 (the owner, 2026-10-30: "sure"; signs off the pattern, INBOX HC-B2); built in `c7052fc`, `f6b1b5c`                                                                                                               | y: adds a third kind of screen to the recipe the owner signed off                                             | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): View Details is built as a view over a step (`c7052fc`); signed off in DEC-110, the wording is yours                        |
  | T-193 | 13 §8, first bullet (`docs/architecture/13-game-interface.md:462`)                                                                                                                                                                                           | no DOM in any client test                                                                                                               | adds: a file that needs a page opts in to happy-dom, one file at a time                                                                                                                                                          | DEC-111 (the owner, 2026-10-30: "sure as long as it doesn't negatively impact performance"; `8d33344`, `1662eb8`)                                                                                                        | n: the owner's decision                                                                                       | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): happy-dom is a dev dependency, opt-in per file (`8d33344`)                                                                  |
  | T-194 | requirements 05, ES-02 (the testing pyramid), the Client row, "How" (`docs/requirements/05-engineering-standards.md:56`)                                                                                                                                     | Node, no DOM                                                                                                                            | Node, no DOM unless a file opts in to happy-dom                                                                                                                                                                                  | DEC-111 (the owner, 2026-10-30); `8d33344`                                                                                                                                                                               | n: the owner's decision                                                                                       | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): happy-dom is a dev dependency, opt-in per file (`8d33344`)                                                                  |
  | T-195 | 13 §6.1 sketch, `INPUT_ACTIONS` (`docs/architecture/13-game-interface.md:301`)                                                                                                                                                                               | (no `toggle-developer-camera`)                                                                                                          | the `toggle-developer-camera` action                                                                                                                                                                                             | DEC-105 (the owner, 2026-10-29: "Cmd/Ctrl+Shift+F3 (Recommended)"; `e84c8aa`)                                                                                                                                            | n: one action id (13 §9, "A player action")                                                                   | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): the action is built (`e84c8aa`)                                                                                             |
  | T-196 | 13 §6.1 actions table, new row after the `toggle-developer-menu`, `toggle-perf-overlay` row (`docs/architecture/13-game-interface.md:350`)                                                                                                                   | (no row)                                                                                                                                | `toggle-developer-camera`: Cmd+Shift+F3 and Ctrl+Shift+F3 (own platform first), client-only one-shot, in every build                                                                                                             | DEC-105 (`e84c8aa`); DEC-117 and DEC-118 (the owner, 2026-10-30); amends DEC-66 (a hotkey, not only `?dev=1`)                                                                                                            | n: one binding the owner chose                                                                                | pending owner; redrafted 2026-10-30 (round B25): a one-shot press (DEC-117) and both chords bound on every platform, the player's own first (DEC-118); the action is built (`e84c8aa`) |
  | T-197 | 13 §6.1 sketch, `InputChord`, the keyboard chord (`docs/architecture/13-game-interface.md:304`)                                                                                                                                                              | `modifiers?: readonly string[]`                                                                                                         | `ChordModifier` (`Alt`, `Control`, `Meta`, `Shift`)                                                                                                                                                                              | DEC-105; factual: `bridge/Binding.types.ts` (`e84c8aa`)                                                                                                                                                                  | n: the sketch names the built type                                                                            | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): `ChordModifier` is built (`e84c8aa`)                                                                                        |
  | T-198 | 13 §6.2, the `BindingResolver` sentence (`docs/architecture/13-game-interface.md:380`)                                                                                                                                                                       | `chordKey` with `device` and `code` only                                                                                                | adds the modifiers, sorted, to the key                                                                                                                                                                                           | DEC-105; factual: `bridge/chordKey.ts` (`e84c8aa`)                                                                                                                                                                       | n: the key format the build uses                                                                              | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): `chordKey` takes modifiers (`e84c8aa`)                                                                                      |
  | T-199 | 06 §10 interim table, "Free view and interior" row, Today (`docs/architecture/06-map-and-minimap.md:421`)                                                                                                                                                    | drag pan, wheel zoom and the overview only with the developer flag `?dev=1`                                                             | shown or hidden by Cmd/Ctrl+Shift+F3 in any build; `?dev=1` starts a match with them shown                                                                                                                                       | DEC-105 (`e84c8aa`); amends DEC-66                                                                                                                                                                                       | n: the owner's decision                                                                                       | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): the hotkey is built (`e84c8aa`)                                                                                             |
  | T-200 | 09 §3, `InputChord`, the keyboard chord (`docs/architecture/09-hardware-abstraction.md:134`)                                                                                                                                                                 | `modifiers?: readonly string[]`                                                                                                         | `modifiers?: readonly ChordModifier[]`                                                                                                                                                                                           | DEC-105; factual: `bridge/Binding.types.ts` (`e84c8aa`)                                                                                                                                                                  | n: the sketch names the built type                                                                            | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): `ChordModifier` is built (`e84c8aa`)                                                                                        |
  | T-201 | 08 §2 sketch, `LoopTarget` (`docs/architecture/08-game-engine.md:64`)                                                                                                                                                                                        | `tick` and `render` only                                                                                                                | adds `crashed(error)`: the loop destroys itself and hands the error to the target                                                                                                                                                | DEC-106 (the owner, 2026-10-29: "Menu + message."); `cca838d`                                                                                                                                                            | n: how the build stops a crashed loop                                                                         | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): `LoopTarget.crashed` is built (`cca838d`)                                                                                   |
  | T-202 | 13 §10, the `character-select` status bullet, the failure sentences (`docs/architecture/13-game-interface.md:598`)                                                                                                                                           | nothing catches a `Simulation.step()` exception; no repro payload is logged; the reasons are `cancelled`, `match-failed`, `load-failed` | a loop crash ends the match and returns to `menu` with `match-crashed` and a FATAL log line; the reports are not built                                                                                                           | DEC-106 (`cca838d`); DEC-115, DEC-116 (not built)                                                                                                                                                                        | n: the interim-state bullet follows the build                                                                 | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): the loop crash path is built (`cca838d`); the reports wait for ADR 0025                                                     |
  | T-203 | phase 6 plan, sprint 6.4, "Error boundaries and loop safety" (`docs/plan/phase-6-hardening-balance-and-release.md:165`)                                                                                                                                      | "moves the session to `results` with a diagnostic"                                                                                      | "ends the match, returning the player to the menu with a message"                                                                                                                                                                | DEC-106 (the owner, 2026-10-29: "Menu + message."); built in `cca838d` for the loop                                                                                                                                      | n: the owner's decision                                                                                       | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): the loop crash path is built (`cca838d`)                                                                                    |
  | T-204 | 05 §15, the kit sentence (`docs/architecture/05-abilities-weapons-and-loadouts.md:923`)                                                                                                                                                                      | client-side asset ids until ability content exists                                                                                      | adds: a live match shows only the art that fits the picked Legend; every other frame stays empty                                                                                                                                 | DEC-101, DEC-114 (the owner, 2026-10-30: "bring back the art only where it fits ... for other areas, keep empty"); `80a9689`, `1f5cb75`                                                                                  | n: the owner's decisions                                                                                      | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): the live kit shows the art that fits the Legend (`1f5cb75`)                                                                 |
  | T-205 | 04 §5, the `loadDisplayContent()` sentence (`docs/architecture/04-entity-architecture.md:222`)                                                                                                                                                               | validates the display-only families (Legends and Legend specs)                                                                          | also the locked classes and the bot roster (setup data, not an entity family)                                                                                                                                                    | factual: `loadDisplayContent.ts` (`4f1d2b5`, `4f6d69f`); with T-191 (02 §6)                                                                                                                                              | n: the sentence lists what the loader validates                                                               | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): the loader carries the bot roster (`4f6d69f`); the carried item of round B22                                                |
  | T-206 | 13 §2 sketch, `SessionController` deps (`docs/architecture/13-game-interface.md:94`)                                                                                                                                                                         | no `createRng`, no `createRosterRng`                                                                                                    | adds the two random-stream factories the session takes (the sketch lists a part of the deps)                                                                                                                                     | factual: `SessionController.types.ts` (`519cdab`, `e7f7cf4`); DEC-61                                                                                                                                                     | n: the sketch names two more injected factories                                                               | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): the carried item of round B22 (`createRosterRng`, `e7f7cf4`)                                                                |
  | T-207 | 13 §3, after the HUD table (`docs/architecture/13-game-interface.md:154`)                                                                                                                                                                                    | a throw inside the match routes to `results` with a diagnostic                                                                          | a throw ends the match and returns to the menu with a message; `ErrorBoundary` is the one class component                                                                                                                        | DEC-106 (the owner, 2026-10-29: "Menu + message."); DEC-115 (the owner, 2026-10-30: "Allow one ErrorBoundary")                                                                                                           | n: the owner's decisions                                                                                      | pending owner; new 2026-10-30 (batches 3 and 4 docs pass): the loop crash path is built (`cca838d`)                                                                                    |
  | T-208 | apps/client/AGENTS.md, code rules, "Function components only." (`apps/client/AGENTS.md:42`)                                                                                                                                                                  | "Function components only."                                                                                                             | "Function components only, except the one `ErrorBoundary` class (ADR 0025)."                                                                                                                                                     | DEC-115 (the owner, 2026-10-30: "Allow one ErrorBoundary (Recommended)"); React error boundaries must be classes                                                                                                         | n: one recorded exception                                                                                     | pending owner; waits for your acceptance of ADR 0025 (the exception is written there); new 2026-10-30                                                                                  |
  | T-209 | 13 §6.2, the paragraph "Two inputs are not read by `Match`", and a new paragraph after it (`docs/architecture/13-game-interface.md:383`)                                                                                                                     | "Two inputs are not read by `Match`": the prompts and the pause key                                                                     | "Three": adds the one-shot actions, run by `MatchHost`; a chord with modifiers is a one-shot press, matched on the key press with exact modifiers, never held                                                                    | DEC-117 (the owner, 2026-10-30: "Adopt it (Recommended)"; the home of the client-only one-shot actions was delegated to the orchestrator)                                                                                | y: names a third input path and a rule for chords with modifiers; the owner adopted the rule                  | pending owner; new 2026-10-30 (critic loop 1 on batches 3 and 4): you adopted the rule (DEC-117); the one-shot table is built in `MatchHost`                                           |
  | T-210 | 13 §6.2 sketch, the comment on `clientActions` (`docs/architecture/13-game-interface.md:370`)                                                                                                                                                                | "handled by Match, except `pause-menu` (read in `ui/`, below)"                                                                          | also except the one-shot actions, run by `MatchHost`                                                                                                                                                                             | DEC-117 (the owner, 2026-10-30)                                                                                                                                                                                          | n: follows T-209                                                                                              | pending owner; new 2026-10-30 (critic loop 1 on batches 3 and 4): follows T-209                                                                                                        |
  | T-211 | 13 §9 recipe table, the "A player action" row, Plus cell (`docs/architecture/13-game-interface.md:502`)                                                                                                                                                      | "or a `clientActions` case"                                                                                                             | gains "or one entry in `MatchHost`'s one-shot table"                                                                                                                                                                             | DEC-117 (the owner, 2026-10-30)                                                                                                                                                                                          | n: follows T-209                                                                                              | pending owner; new 2026-10-30 (critic loop 1 on batches 3 and 4): follows T-209                                                                                                        |
  | T-212 | 17 R21 "Add a keybinding action", Files (`docs/architecture/17-extension-recipes.md:428`)                                                                                                                                                                    | "(or a `clientActions` case for a client-only action)"                                                                                  | names the one-shot table of `MatchHost` as the other home of a client-only action                                                                                                                                                | DEC-117 (the owner, 2026-10-30)                                                                                                                                                                                          | n: follows T-209                                                                                              | pending owner; new 2026-10-30 (critic loop 1 on batches 3 and 4): follows T-209                                                                                                        |

- [x] **HC-B1 — Better than the design, or new, for sign-off (`feat/hud-and-character-select`; asked
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
  - Your answer (chat, 2026-10-28): "Approve all" (D3). Applied the same day: the HC-T1 rows whose
    only open basis was HC-B1 (`e28854b`; HC-T1 lists them) and DEC-22's appended note (BD1: the
    Legends are validated by both loaders). Where an item's text also carries another open item, its
    row waits in HC-T1: NF2's asset groups (T-31, HC-Q7 (2)), NF5's paragraph (T-90, HC-F7), DV-55
    and DV-56's scaling bullet (T-29, HC-Q14) and DV-93's HUD rows (T-23, HC-Q2).
- [x] **HC-B2 — Better than the design, for sign-off: a view that opens over a selection step
      (`feat/hud-and-character-select`, batch 2; the architecture critic's loop 1, 2026-10-30).**
      The game-interface architecture (`docs/architecture/13-game-interface.md`, §9, "Recipe: a
      screen, a HUD element, an action") offers two kinds of screen: "a `MenuRoute` literal or a
      `SessionPhase`". View Details (DEC-103) is neither: it opens over the class step or the
      Legend step inside the one `character-select` phase. The branch builds it as a third
      pattern, which the critic rates better than the design: the step keeps it open or closed in
      its own state (`useViewDetails`); while it is open, one filter that runs before every other
      listener of the page (`useModalKeyFilter`) stops every key and every bound mouse button, and
      only a `pause-menu` key or button (Escape by default) closes it (DEC-65); and it stays
      mounted and `inert` while closed, so it can shrink and fade out (DEC-65). The recipe table
      has no row for it. Sign off the pattern, and name it: its files end in `Screen` today
      (`ViewDetailsScreen`, `ClassDetailsScreen`); `Overlay` is the other choice (the pause menu is
      `PauseOverlay`). Once you sign, a recipe row for it joins that table as an HC-T1 row, for your
      approval of its text. **Recommendation:** none on the name; your call.
  - Answered 2026-10-30 (in chat): "sure" (DEC-110). No name given, so the files keep `Screen`
    (full-screen layouts, as `ui/screens/` holds). The recipe row for 13 §9 is pending in HC-T1.
- [x] **HC-B3 — Better than the design, for sign-off: a key chord with modifiers is a one-shot
      press (`feat/hud-plan-b3a`; the architecture critic's loop 1, 2026-10-30).** The
      game-interface architecture (`docs/architecture/13-game-interface.md`, §6.2, "`InputMapper`")
      reads input one way: `Match.tick()` polls the devices and `resolve` turns the held keys into
      actions each tick. The branch adds `toggle-developer-camera`, whose chord is Ctrl+Shift+F3.
      The snapshot the tick reads carries key codes only, with no modifiers, so the build matches a
      chord with modifiers on the key press, with exactly the chord's modifiers, and never as held
      input (`InputMapper.isActionKey`, `bridge/chordKey.ts`). The critic rates that better than the
      design, which says nothing about it. Should the rule go into §6.1 and §6.2?
  - Answered 2026-10-30 (in chat): "Adopt it (Recommended)" (DEC-117). The wording for §6.1, §6.2
    and §9 of that architecture and for the extension recipes' R21 is pending in HC-T1 (T-196, T-209
    to T-212).
- [ ] **HC-B4 — Better than the design, for sign-off: an optional field that old saves lack needs
      no new save version (`feat/hud-plan-b3a`; the architecture critic's loop 1, item m2,
      2026-10-30).** The persistence architecture
      (`docs/architecture/14-persistence-and-resources.md`, §13, recipe row "A field or a settings
      group") says: "bump `schemaVersion`, extend `upgrade<Name>Dto` and the mappers". The branch
      added the optional `modifiers` list to a stored key chord (DEC-105) and kept the settings
      record at version 1: a save made before the change has no `modifiers` and still reads as it
      is, so a version 2 would only add an upgrade step that copies the record unchanged.
      `Recommendation:` adopt the rule "bump `schemaVersion` for a field old saves cannot satisfy
      (required, renamed or retyped); an optional field they simply lack needs no bump", worded into
      that recipe row as an HC-T1 row once you agree. If you keep the recipe as written, the
      settings record moves to version 2 with a pass-through upgrade and a test at version 1, in
      this lane.
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep every row"; and, with your
    Sprint 3 list: "Not sure what CD-25, CD-30 and CD-38 are." Every row is kept. Those three are
    explained under HC-U1, where they travel to Sprint 3; CD-38 also follows the weapon-panel
    question in HC-F6. Note: the kept CD-28 has the red cooldown fill shrinking towards the bottom;
    your Sprint 3 note 2 (HC-U1) asks for a fill that rises from the bottom and turns gold when
    ready, so that change is on your Sprint 3 list. **Open:** CD-25's mask on the level number,
    which the visual audit applies only once you sign it now that it is explained.
  - New rows, 2026-10-30 (batch 2): the Figma register
    (`docs/reference/game-design/15-figma-frames-and-creative-decisions.md`) gains CD-39 to CD-46:
    the Legend panel's four rows and its narrower header box; View Details (your frame "View Details
    Example", 145:2, now in the register's frame table): smaller icons, the Legends strip at its own
    size and flat dividers, no row descriptions (content has none yet), and the Legend version your
    frame does not draw; the V View Details prompts and their places; the alternate layout's Select
    Class button at the main layout's place; the locked view; the timeout popup. CD-09 and CD-10 gain
    dated notes: View Details' key is V, and on the alternate layout it no longer chooses the class
    (DEC-109). Each place or size the agents chose is marked as a recommendation. Keep, change or
    reject them as the other rows; nothing new to answer unless you want a row changed.
  - Notes, 2026-10-30 (the architecture critic's loop 1 on batch 2): two of those rows rest on the
    recorder's reading of your words, now marked so in the register. CD-42, a Legend's View
    Details, shows no rating bars: your DEC-103 says "no legends in the corner", which drops the
    Legends strip only; the bars are left out because your frame "View Details Example" draws none
    for a class (`Recommendation:`). CD-45, the locked view, shows the locked Legend's panel on the
    left, where your DEC-60 says "the details of the class still shown on the left"
    (`Recommendation:`). Keep, change or reject them with the other rows.
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Later", with: "Next sprint I am
    responsible for abilities and weapons. I will flesh these out then. Aside from art and legend
    names, the details are identical between light and dark. Description (lore) likely to change
    between light and dark, but for MVP, identical." Recorded in DEC-70. Your rename (DEC-58)
    changes the sub-class titles in (4) (Zealot, Templar, Paladin, Bulwark; Colossus stays), not the
    Legend names, which are still to come. Your class kits (DEC-63, HC-Q3) answer part of (2):
    Aetheric Recall is the Magus class's default ability, and the Legend step does not show it
    (DEC-65). **Open until next sprint:** (1), (2), (3) and the Legend names and art of (4).
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Rules in the note": "Weapons
    will level up throughout each game (probably not in MVP). Ultimate is an additional ability,
    mapped to key "4". Capture bars and health bars are handled by other devs' code this sprint
    (Gurshaan with building/object health, Aryan with capture points). Clock is game clock or
    changed to countdown to crystal eruption (may now be outside of MVP, but notes on counter are
    given earlier in this form)." Recorded in DEC-62. (1) a weapon levels up during each match,
    probably post-MVP; (2) the ultimate is an additional ability on the fourth ability key; (3) the
    capture bars and the structure health come from Aryan's capture-point work and Gurshaan's
    building and object health work this sprint; (4) the clock is the game clock, or a countdown to
    the crystal's eruption (your notes on it are in HC-U1). HC-T1 row T-23 is redrafted to these
    rules for your approval. **Open:** (2) what the ultimate's Low, Mid and Max tiers and its three
    pips mean; (4) the final choice for the clock; the HUD's link to the capture and health code
    when it lands.
- [ ] **HC-Q3 — Which abilities your Figma's icons and names are (OQ-68).** The HUD shows a
      Legionnaire with Meteor (a Sentinel ultimate in the docs), Atom, LinkBreak and Aperture
      (Phosphor placeholders), a battle axe and the gadgets "Courage" and "Sword". The class screens
      name Aetheric Recall, Staff Proficiency and Arcane Intellect (Magus) and Unison Ward and
      Severed Accord (the Figma's Cantor, now Oracle), none of which the docs have. Map each to a
      documented id (for example, is Aetheric Recall the Magus's Revive?), or confirm it is new;
      until then they are display data only. Also: the emblem, weapon and first-gadget art for the
      Sentinel's and the Magus's HUD, which the Figma draws only for the Legionnaire.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Some are new abilities (note)":
    "Arcane Recall is the temporary name for the Magus revive default skill. Default
    skills/abilities are an additional special feature each class has. Warrior == Inspire Allies
    (surrounding ally units get small boost to movement speed, damage done, and reduced effect of
    fear debuff). Sentinel Mountain Fall (TBD name change) == Inflict fear on nearby enemies + short
    burst to movement speed and acceleration. Magus == Aetheric Recall. Each class has a proficiency
    for one weapon class. Legionnaire Velite = Light weapon Proficiency (e.g., gauntlets (such as
    raptor claws), light bows, daggers, and short swords), Medium Legionnaire (cannot recall
    assigned name) == Medium Melee Proficiency (e.g., dual blades, short axe, spear, medium swords,
    Regular bows), Praetorians == Heavy Weapon Proficiency (e.g., Broad/Great Sword, Battle Axe,
    Heavy Bows, Mace, etc.). For Sentinels, Juggernaut == Breaker Proficiency (same as Praetorian,
    minus the bows, addition of Great Maces, Great Spears, Great Swords, Great Axes, etc). For
    Colossus, Strong-Arm (name pending) Proficiency (e.g., Bastions, Default Melee (fists), TBD on
    others). Magus == staff proficiency across all Legends. Majority of these will not be in the
    MVP, but should be documented regardless. Arcane Intellect is a passive buff. Each class has a
    passive buff. Arcane Intellect increases strength of abilities and reduces Aether cost for each
    ability as they level up. Legionnaires have Warriors Calling, which increases their damage
    output, movement speed, and health regeneration as they level up. Sentinels have Enduring
    \_\_\_\_ (TBD Full Name), which increases armour strength when near death (5 or 10% of health
    remaining) and increases health regeneration out of combat. They are immune to fear and take
    less poison damage." Recorded as DEC-63, with the new names (DEC-58). Readings to check: "Arcane
    Recall" is read as Aetheric Recall (your Figma's name, which you also write: "Magus == Aetheric
    Recall"); "raptor claws" as the Raptor Talons; "Medium Legionnaire (cannot recall assigned
    name)" as the Centurion, now Templar. Your HC-F6 note answers the art question: until art
    exists, the Sentinel's and the Magus's HUD show an empty emblem and empty frames. **Open, next
    sprint:** the names still to be decided (Mountain Fall's new name, Strong-Arm, the Sentinel
    passive's full name), the numbers, and which documented abilities the HUD's placeholder icons
    (Meteor, Atom, LinkBreak, Aperture, "Courage", "Sword") become.
- [ ] **HC-Q4 — The structure strip (62:303, 65:542).** (1) Are the names right? The HUD shows the
      Figma's layer names (Stronghold, "Production Tower" for the spawner tower, "Buff Tower" for
      the buff tower, one "Wall" tile for every wall segment and gate, Capture Point, Cathedral);
      gates have no name of their own and turrets are not shown. (2) How does a destroyed structure
      look, and should shield bars show? Neither is built until the game has the data. (3) Should
      the enemy bars fill right to left, mirroring their icons?
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Changes in the note": "Keep for
    MVP. When destroyed, simply apply a layer over the building's frame and some cracked lines in a
    lighter colour over the darkened frame. Health bar disappears. Use CSS for this rather than
    anything heavy." Recorded as DEC-69: the names and the bar direction stay as built for the MVP;
    a destroyed structure's tile gets a dark layer over its frame with lighter crack lines, in CSS,
    and its health bar disappears. **Waits for the build**, and for the structures' health data
    (HC-Q2 (3)).
  - Answered 2026-10-29 (build-plan question P11 and the review page): "When at least one segment
    has been breached"; "Wall tile breach: any wall segment or gate". Recorded as DEC-108: the one
    Wall tile shows destroyed as soon as any wall segment or gate is destroyed. **Waits for the
    build.**
  - Built 2026-10-30 (`feat/hud-plan-b3b`, `cf7efbe`): a structure at zero health draws its icon
    darkened towards the ground with two lighter crack lines (CSS), loses its health bar and reads
    "<name>, destroyed"; the one Wall tile shows destroyed as soon as one segment or gate is. Live
    matches still publish no structure health, so the look shows only once that data exists. Open
    for the phase-branch sync: a destroyed structure must stay published with health 0 (the PR
    register's "Integration recipe", 2026-10-30).
- [ ] **HC-Q5 — The alternate class layout (62:70, DEC-52).** It has no class cards, ally tiles or
      Select button: the build adds previous and next arrows, and View Details confirms the shown
      class (default; register CD-10). What should View Details open (no design exists)? Which
      Magus description is canonical, 72:748 (the primary layout's, used by default) or 62:82? The
      layout also has its own labels ("Signature / Proficiency / Specialty"): keep each layout's
      own text (default) or share one?
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Answers in the note": "Not sure
    what those numbers refer to in terms of their actual respective wording, but class and subclass
    have different descriptions, as each legend has its own description and their own abilities.
    Aetheric Recall is not included as an ability in the subclass select, and this is where the
    ultimate would go. We should actually add a fourth row to Signature / Specialty / Ultimate, and
    change the titles. It should be Ultimate / Abilities, where the ultimate is at the top, and
    abilities 1, 2, and 3 are in the rows below. We could adjust sizing to be able to fit all 4
    rows, leaving the ultimate as a larger row. View Details on the class selection opens a modal
    that takes up the whole page (blurs the rest of the screen and disables all keys except Escape),
    which shows all the details of the Default Ability, the Proficiency, and the Passive for each
    class. The icon on the left, and the description on the right. For the subclass, it shows each
    ability. Class example seen now in the Figma as View Details Example. Many items can be reused,
    other wording or titles can be found in these answers. No need for pixel perfect, same colours,
    font sizes, and a relatively close background blur should suffice. The modal can fade in quickly
    and fade out quickly, getting larger to fill the screen once loaded, and getting smaller to take
    up 80% of the screen when closed (obviously it becomes invisible and disabled when closed). Max
    3 loops on the critic check we blew out my weekly limit last week." Recorded as DEC-65; your
    limit of three critic loops is recorded in the PR register. **Open, asked by wording this
    time:** which Magus description should the class step use? The main layout shows "With a mastery
    of Aether, the Magus bends reality into torrents of destructive energy. Channeling natural and
    arcane forces to decimate the enemy from afar and enhance nearby allies."; the older alternate
    layout shows "The masters of Aether, Magus focus on the use of abilities, while providing buffs
    for allies, and de-buffing enemy units. Specializing in ranged attacks, Magus aim to keep their
    distance from enemies to dish out damage with high sustain." Today each layout shows its own.
    And do the class step's row titles (today "Signature", "Proficiency", "Specialty") become
    Default Ability, Proficiency and Passive, as in the View Details modal? **Waits for the build:**
    the four Legend rows and the modal.
  - Answered 2026-10-29 (build-plan question P4 and the review page; your words are in DEC-103):
    key V opens View Details as a full screen after your frame "View Details Example", built from
    the existing components, with a vignette backdrop; Oracle's "Unison Ward" is ability 1 as a
    preview until abilities are designed next sprint. Still open: the Magus description and the
    class step's row titles (above). **Waits for the build.**
  - Answered 2026-10-30 (in chat): "View details on class shows the class details. View details on
    the subclass shows the subclass details (e.g., abilities and lore). Similar screens for both.
    View details to open screen. Close screen. Select class. View details to see Legend details.
    Close screen. Select subclass. Lock in from selection screen." Recorded as DEC-109: the
    alternate layout shows "V View Details", which opens the same class details screen as the main
    layout, and gets the main layout's Select Class button; View Details never chooses. Built the
    same day (`f6b1b5c`); the button's place is a recommendation (register CD-44). **Still open:**
    this answer does not cover the Magus description or the class step's row titles (above), so the
    item stays open for those two.
- [x] **HC-Q6 — Visual details your frames leave open (defaults applied).** (1) The picked card is
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep all eight", with your
    "Eternalus Improvement Notes", which are your Sprint 3 list and are recorded in full in HC-U1.
    The eight defaults stay for now; your notes 1 (a local minimap view) and 2 (the gold glow only
    when an ability is ready; a red fill rising from the bottom) change default (4) and the cooldown
    look in Sprint 3.
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
  - Your answer (chat, 2026-10-28) to (1) and (3) (D2): "Art is MVP; terms and credit in the note";
    "The art will change when a real Digital Artist is found and employed for the project. For the
    time-being, the art in the Figma is what is included. More artwork will be uploaded in the
    future." **(1) is answered:** your art is the MVP's selection-screen art, interim until a
    digital artist is employed (DEC-51's note of 2026-10-28); FR-111 is reworded to match, and
    references 10 and 11 wait as HC-T1 T-155 to T-157. Still open in (1): the terms of the tools the
    art was made with, if you want them stated. **(3): the credit, drafted from your words, for you
    to confirm or reword:** "Art by Sam Holtzman from his Figma designs, made with Nano Banana
    (Gemini), Figma's image model and Figma; the Magus model rendered with Tripo Studio. Interim
    art: it will change when a digital artist is employed for the project, and more artwork will
    follow." Once you confirm it, it replaces the notice marked `TODO(sam)` in
    `apps/client/src/data/resources/assetLicences.ts` (a code change), which the About screen shows.
    (2), (4) and (5) stay open.
  - Answered 2026-10-28 (the non-blocking decision page, in chat), to (2) to (5) and the credit: you
    ticked "Change something (say what in the note)" and wrote: "Keep the credit, 2. If this doesn't
    mess with the architecture, 4. I don't know what this means? if you're asking if everything on
    the screen should change with different characters, then no. this is the screen for now. 5. No.
    Cinzel is our font for now. Everything in menus, selection screens, etc. should use it." So: (3)
    the About screen's credit as the decision page showed it, and as the code has it since
    `cd9a5da`, is kept: "Interim art by Sam Holtzman, made with Nano Banana (Gemini), Figma's image
    model and Figma; the Magus model rendered with Tripo Studio. It will be replaced when a digital
    artist is hired for the project." (2) yes: the selection asset groups fit the architecture (the
    pre-PR critic rated them acceptable, and you approved them in HC-B1), so HC-T1 rows T-11, T-24
    and T-31 are applied. (5) Cinzel everywhere, DEC-67; it waits for the build (the menus' font).
    Your note to (4) is recorded: the selection screen's layout does not change per character.
    FR-111: asked whether its rewording needed an ADR, you answered: "Again, not sure what this
    means. If you're asking about a number for a decision, work item, or PR, I don't care what
    number is used. If it's something else, then let me know." ADR 0022 records your art answer for
    FR-111 on that delegation; it adds nothing to it. **Open:** (1) the terms of the tools the art
    was made with (your note does not state them; say "unknown" and that is recorded); (4) asked
    again: DEC-53 says that every visual enhancement keeps your original Figma design available as a
    switchable option. Should that rule also be a line in the agents' instructions (the pre-PR
    checklist in `AGENTS.md`)? Yes or no; nothing changes until you say. New: FR-111's acceptance
    line ("no screen depends on a character portrait asset") was not reworded with its statement,
    and the selection screens show portraits: reword it, or keep it.
  - 2026-10-29: (4) answered (build-plan question P9: "No (Recommended)"): DEC-53 is not written
    into `AGENTS.md` (DEC-107). (5) applied: the menu and body font tokens are Cinzel (`d4cbc70`,
    DEC-67). Still open: (1) the tools' terms, and FR-111's acceptance line.
- [ ] **HC-Q8 — Match runtime (confirm).** Pause is built as ES-11 requires: in single player the
      pause overlay stops the simulation and the rendering, and held keys are released. Confirm.
      (1) Route `Simulation.step()` exceptions to the session next (audit AC-1 point 2)? (2) Accept
      audit AC-21 and the 09 §2 wording (the open item "F → session H / the `Match` owner" below)?
      (3) The open item "Session C → Sam (2026-10-08), better than the design? (a)" below: the
      release of held input on focus loss (blur, visibilitychange) stays outside `Match`, in
      `MatchHost`. Is that the answer (then 09 §2 says so), or should the release move into
      `Match`?
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Confirm pause; keep MatchHost;
    yes to (1) and (2)", with: "Make sure critics compare against architecture and approve of this
    as in line with, as good as, or better than the plan". So pause is confirmed; (3) the focus-loss
    release stays in `MatchHost`; (2) audit AC-21 and the hardware-abstraction architecture's
    focus-loss wording (09 §2) are accepted, which also answers the open item "F → session H / the
    `Match` owner" below. HC-T1 rows T-16 and T-59 are applied. **Waits for the build:** (1) a
    `Simulation.step()` error goes to the session; that work's critic checks it against the
    architecture, as you ask.
  - 2026-10-29 (build-plan question P7 and the review page): a crash in the game loop returns you
    to the menu with "The match stopped because of an error." and an optional note; every error and
    crash is saved as a traceable report in `logs/errors/` by the local server (option A). Recorded
    as DEC-106, with what each report holds. **Waits for the build**, with (1).
  - Built 2026-10-30 (`feat/hud-plan-b4`, `cca838d`): (1) and the menu-with-message part of DEC-106.
    A throw from a tick or a frame stops the game loop, ends the match and returns to the menu with
    "The match stopped because of an error."; the session logs a FATAL line with the error, its
    stack, the seed and the tick. **Waits for the build:** the traceable reports in `logs/errors/`,
    the note popup and the silent errors. Your answers of 2026-10-30 settle the way: one class
    `ErrorBoundary` (DEC-115) and a writer in the Vite dev and preview server (DEC-116); both wait
    for your acceptance of the crash-report ADR (HC-Q27).
- [ ] **HC-Q9 — Behaviour your frames do not show (defaults applied; veto).** Esc on the class step
      does nothing; the Legends strip on the class step is informational, not clickable; after
      LOCK IN the screen leaves at once, with no waiting state.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Veto one (note)": "Do not
    display the Esc option on the primary class select screen, as it does nothing. Display once user
    selects a subclass to allow back-out. Pressing lock-in disables the ability to change classes
    and keeps the user on their selected character screen. If the screen is already built, it should
    be the screen where all the frames are gone and the chosen Legend stands in the centre of the
    screen with the details of the class still shown on the left, the friendly Legends shown on the
    right, the countdown above, but the lock-in and Esc buttons hidden and their actions disabled."
    Recorded in DEC-60. Read: "Display once user selects a subclass" as "show Esc on the Legend
    step". The Legends strip on the class step stays information only. **Waits for the build:** no
    Esc on the class step, and the locked view after LOCK IN until the countdown ends.
  - Built 2026-10-30 (`feat/hud-plan-b2`, `fb3b8cd`): Esc (Back) shows on the Legend step only, and
    after LOCK IN the locked view stays until the countdown ends. Its layout is not in your Figma, so
    it is register row CD-45, for your review under HC-C1.
- [x] **HC-Q10 — New copy for your approval.** "Choose a class first.", "Choose a Legend to lock
      in.", "Legends to come", "You are on the {team} team", "1 Ally", "No data yet", "Match could
      not start.", "Loading failed.", "Leave cathedral". Keep each, or give your wording.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep all nine".
- [ ] **HC-Q11 — Only if a tooling check fails (asked only then).** If the test runner cannot read
      the asset files in its Node environment, approve an ADR adding a zero-dependency
      `scripts/assets/check-asset-manifest.mjs` to `npm run check`.
- [x] **HC-Q12 — Which class ids the match accepts.** `PlayerChoice.legend` takes the open class id
      (default, guarded by the catalogue check and a spawn test), or should core export its
      `LegendKind` values (a core API change)?
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep the open id with its
    checks", with: "Whichever makes the cleanest architecture but doesn't lock us into the current
    class names forever." Kept: the class names are display content, so your rename (DEC-58) changes
    no id.
- [x] **HC-Q14 — Minimum text size below 1080p.** Text never renders smaller than
      `--text-min: 12px` (default; ES-11 asks a minimum size for HUD text, and the selection
      screens follow it; register CD-23): keep 12 px, give another value, or none on the selection
      screens?
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep 12 px". HC-T1 row T-29 is
    applied.
- [x] **HC-Q15 — Exactness costs bytes.** Every 1x image file the visual audit compares is lossless
      (lossy WebP at quality 90 alone fails the backdrop), including the two row plates and the
      button-chrome plates. The branch reports the measured group sizes at device pixel ratios 1 and
      2, per effects renderer (`'css'` loads no plate). Accept them (default), or allow lossy 1x
      files for named assets, with their regions listed as not exact? Measured group sizes in bytes
      at device pixel ratio 1 / 2 (pinned in `ResourceController.manifest.test.ts`): boot 25,888 /
      25,888; selection 4,055,862 / 1,905,016; selection-primary 795,914 / 865,606;
      selection-alternate 456,024 / 587,480; selection-raster 867,022 / 243,798;
      selection-primary-raster 1,041,660 / 281,268; match 141,646 / 359,902 (with the battle axe's
      new grain, OD-28). The `'css'` effects renderer loads neither raster group.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Accept the lossless sizes",
    with: "Likely fine unless the lossy doesn't degrade the display a notable amount." Read: the
    lossless files stay; where a lossy file would not visibly degrade the display, it may replace
    one later (the load-on-demand work, HC-Q20, may look at sizes again).
  - Changed 2026-10-30 (batch 2, `feat/hud-plan-b2`): the three Legend mini portraits of the
    Legends strip moved from the selection-primary group to the selection group, because View
    Details now shows them on the alternate layout too (DEC-109), which does not load
    selection-primary. Selection now measures 4,105,368 / 2,023,392 and selection-primary 746,408 /
    747,230; the primary layout's total is unchanged, and the alternate layout's grows by 49,506 /
    118,376. The files are the same lossless ones (the coordinating session's decision OD-44).
- [x] **HC-Q16 — One Legend's Dark name is derived, not stated (flag; DEC-49).** The Dark name in
      `packages/core/src/content/legends/specs/catalyst.ts` (its `legendName.dark`, marked
      `TODO(sam)`) was derived from your mirror rule (the Light name spelled backwards); you stated
      the other named Legends' Dark names yourself (DEC-49). Confirm it, or give the Dark name. No
      other name or title is flagged: the sub-class titles in that folder are used exactly as you
      gave them.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Confirm Nadirev". Recorded in
    DEC-58 and in a note to DEC-49. **Waits for:** the `TODO(sam)` marker on it in
    `packages/core/src/content/legends/specs/catalyst.ts` to be removed (a code change).
  - Applied 2026-10-29: the `TODO(sam)` marker is removed (`6a3e437`), and the spec's TSDoc and the
    client test store's comment cite DEC-58 (`4fca16b`).
- [ ] **HC-Q17 — Sub-class gameplay: which phase builds it? (DEC-56, ADR 0018).** Sub-classes
      are MVP, and this branch ships the Legend pick as setup data only: nothing in a match reads
      it yet. Their gameplay (the `LegendSpecDefinition` fields a class consumes: stat modifiers,
      ability overrides, a pick-up and a skin; architecture 17 R2) is MVP scope, but no phase
      schedules it. `docs/plan/backlog-post-mvp.md` still lists sub-classes as post-MVP, and phase 4
      sprint 4.1 has only the extension point. Name the phase (and sprint), and agents add the
      tasks and move the backlog row.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Later", with: "They mostly just
    have different abilities, different Signature / Specialty / Ultimate, different
    sprites/skins/names, etc. They're just different iterations of the same class. Adjusted stats
    too. I see this could be a whole WI. For now we start building out the selection screen. Next
    sprint we do the rest." Recorded in DEC-70. **Waits for:** the next sprint's plan tasks for
    sub-class gameplay, which agents propose, and the backlog row's move.
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): (1) "Replace the prefix check":
    "Whatever makes it cleaner. One place to change; the rest of them inherit. OOP, DRY, and clean
    coding principles. Scalable, maintainable, etc." (2) no option ticked: "Whichever follows the
    architecture or is better than it. Have a researcher look at the active or in progress branches
    to see what other devs are doing, check to see if it matches, is as good as, or is better than
    the architecture, then do whichever implementation fits best, either matching what is built by
    the other devs, or using an alternative strategy that will force the other devs to fix their
    code." (3) no option ticked: "Whichever fits the architecture best." (4) "Every content id":
    "Whichever fits the architecture best." So: (4) every content id stays renamable until a save or
    a release stores it, and HC-T1 rows T-100 to T-102 and T-136 to T-144 are applied. (1) the
    art-id prefix check is replaced by the name guard, keeping the rest of I-82: waits for that code
    change. (2) waits for a researcher's look at the open branches; then agents choose spawning by
    kind or id equal to kind, by the architecture. (3) is left to the architecture: as built (the
    tests) until agents next change that content. **Open:** the code change of (1) and the research
    of (2).
    Round B19: (4) is recorded in ADR 0023, because CP-13 is a requirement and changes only through
    an ADR (NFR-010); CP-13, `AGENTS.md`, the entity architecture (04 §10), recipe R26 and the
    naming suggestions cite it.
  - 2026-10-29: (1) applied: the art-id prefix check is replaced by the content-driven name guard;
    the one-owner check and the exact count of Legend art owners stay (`b57b919`, `6a3e437`). (2)
    decided under your answer ("Whichever follows the architecture or is better than it"): option A,
    spawn by the definition's `kind`, which architecture 04 §6 already designs and the minion
    stack's `SpawnSystem` already does (the research of 2026-10-28, outside the repository), shown
    to you as build-plan step 14. Not built yet: it lands with the merge of the minion stack (the
    integration recipe), where the player's spawn moves to the same path.
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Keep canvas path; setting and M
    in sprint 5.4", with: "I don't know what setting and M key are." Explained: the setting is a
    switch in the Settings screen to show or hide the minimap (`minimapVisible`, planned in the
    game-interface architecture's HUD table); the M key is the default key of the "toggle minimap"
    action, which in a match shows or hides the minimap. Neither works yet: pressing M does nothing.
    Your tick keeps the canvas handling minimap clicks and schedules both for Phase 5, sprint 5.4
    (settings and keybindings). **Waits for:** that sprint 5.4 plan task and the design text for the
    canvas path (the game-interface architecture still describes a minimap-click message), both as
    doc rows for your approval; or say if you want neither the setting nor the key.
- [ ] **HC-Q20 — JavaScript bundle size (not urgent; decide in Sprint 3; pre-PR critic, run 2:
      build-01).** The boot bundle is 556.27 kB (gzip 173.96 kB) at `a9e8295`, against 385.94 kB at
      the branch's base, and Vite warns above 500 kB. Images are no longer inlined into it: each
      loads with its own asset group (architecture 14 §11). The rest of the growth is code: the
      asset manifest's data (about 65 kB) and the new screens, components and HUD (about 70 kB).
      Option: load the character-select and HUD code lazily (`React.lazy` or a dynamic import per
      screen), so the boot bundle holds only what the menus need. Recommendation: decide in Sprint
      3; it does not block the MVP.
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Load on demand now", with: "Home
    screen loads scaffold for each sub-page. Sub pages finish their load when opened and cache the
    home page. Moving back to home caches the sub-page. Pre-game class and subclass select load game
    scaffold. Post-selection, pre-game loading screen finishes game asset loading. Look ahead,
    remember behind." Recorded as DEC-68; it replaces the recommendation to decide in Sprint 3.
    **Waits for the build.**
  - 2026-10-29 (build-plan question P10): "Local only (Recommended)": the game is served locally
    for the demo, so load on demand needs no handling for a web host (DEC-107). **Waits for the
    build.**
- [x] **HC-Q21 — Merge order with the nine open sibling pull requests (decide before either side
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
  - Your answer (chat, 2026-10-28): "(b) Minions and weapons first; this branch resolves once" (D6).
    This branch now waits until the minion stack and `feat/weapons` have merged into
    `phase/2-sprint-2-work`. Then it merges `phase/2-sprint-2-work` once, resolves every conflict in
    one integration commit with the PR register's "Integration recipe", re-runs `npm run check` and
    has the critic check the integration change. You also chose a merge commit, not a squash, for
    this pull request (D7).
- [x] **HC-Q22 — The HUD's weapon art against `feat/weapons`' default weapons (decide when
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
  - Your answer (chat, 2026-10-28; D8): "Keep the per-class Figma art"; "Start for
    Warrior/Legionnaire is a great sword. Raptor talons are starter for Velite with a bow as a
    secondary weapon, Centurion is dual blades (two swords), Praetorian is great sword. Sentinel
    Juggernaut is wuuthrad, sentinel colossus is Bastions (walls strapped to each arm). Magus are
    all staffs." Recorded as DEC-57. (2): the HUD keeps the class-keyed art from your Figma, so this
    branch changes nothing. (1) answers point (2) of `feat/weapons`' INBOX item "Weapons — numbers
    and default weapons", which lives on that branch; the great sword, the dual blades, the bow and
    the Bastions have no weapon content on any branch yet.
  - Answered again 2026-10-28 (the non-blocking decision page, in chat, on DEC-57's start weapons
    against the weapons reference): "Same weapons, new names; Bastions move into the MVP", with:
    "The Bastions are the new name for Barricades. Everything else I noted (Raptor claws, short
    blades, bow, wuuthraad, etc) also in-scope. Mages all have staves, which have ranged attacks
    (default) and melee attacks (TBD how to trigger a different type of attack; likely copying
    whatever Battlefield does on PC for melee attacks)." Recorded as DEC-64 and in a note to DEC-57,
    whose names your rename replaces (DEC-58). Readings to check: "in-scope" as MVP scope; "Raptor
    claws" as the Raptor Talons; "wuuthraad" as Wuuthrad; the dual blades as the weapons reference's
    Short blades. The weapon panel's art is asked again in HC-F6.
- [x] **HC-Q23 — A DOM test environment: add it or not? (not urgent; the architecture critic's
      loop 1 on batch 2, 2026-10-30).** The client's tests run in Node with no browser page (the
      client rules, `apps/client/AGENTS.md`: "Tests run in Node (no DOM)"), so no test presses V or
      clicks the "V View Details" prompt to open View Details, or checks the focus it keeps and
      gives back; its open and closed renders are tested. Such a test needs a page for the test
      runner, jsdom or happy-dom, which is a new development dependency, and only you approve
      those (`AGENTS.md`: "No new dependencies without explicit human approval."). The
      hardware-abstraction architecture (`docs/architecture/09-hardware-abstraction.md`, §9)
      already plans one for the browser adapters' tests: "DOM-backed adapters run the suite under
      a `jsdom`/`happy-dom` environment in Vitest (**Recommendation:** needs the team's dependency
      approval)". Add one (which one), or keep the tests without a page? **Recommendation:** none;
      your call.
  - Answered 2026-10-30 (in chat): "sure as long as it doesn't negatively impact performance"
    (DEC-111). Built: happy-dom, opted into per test file; the bundle is unchanged and the suite's
    run time stayed within its spread. First page test: `ClassSelectStep.viewDetails.test.tsx`.
- [x] **HC-Q24 — Which HUD art shows in a live match? (the pickup session, 2026-10-30).** Your
      DEC-101 empties the ability frames, the weapon slot and the shield for every class; the build
      also emptied the two gadget slots, with their Courage and sword art. Which art stays?
  - Answered 2026-10-30 (in chat, the session's question): "bring back the art only where it fits
    (e.g., courage for vanguard, wuuthraad for bulwark,staff icon for mage weapon, etc). for other
    areas, keep empty" (DEC-114). Built in `1f5cb75`: Courage for the Vanguard, the staff for every
    Magus Legend, Wuuthrad for the Bulwark; "wuuthraad" is read as Wuuthrad. **Recommendation:** the
    placeholders no Legend owns stay empty (see HC-F6).
- [x] **HC-Q25 — One class component for screen crashes? (the pickup session, 2026-10-30).** A React
      error boundary must be a class component, and `apps/client/AGENTS.md` says "Function
      components only".
  - Answered 2026-10-30 (in chat, the session's question): "Allow one ErrorBoundary
    (Recommended)": one class `ErrorBoundary`, the exception recorded in the crash-report ADR
    (DEC-115). The line in `apps/client/AGENTS.md` waits for the ADR's acceptance (HC-T1 T-208).
- [x] **HC-Q26 — Who writes `logs/errors/`? (the pickup session, 2026-10-30).** A browser page
      cannot write a file (DEC-106).
  - Answered 2026-10-30 (in chat, the session's question): "Dev-server endpoint + ADR
    (Recommended)": an endpoint that runs only in the Vite dev and preview server and writes
    `logs/errors/` (kept out of git); a lane builds it after the ADR is accepted, in this order:
    the core replay export, the writer, the popup that replaces the banner (DEC-116).
- [ ] **HC-Q27 — Accept the crash-report ADR (crash reports through the dev and preview server;
      one class `ErrorBoundary`)?** It is ADR 0025, "Error reports through the local dev server"
      (`docs/decisions/0025-error-reports-through-the-local-dev-server.md`, proposed); it
      records your HC-Q25 and HC-Q26 answers, what a report holds, the endpoint's limits and a
      proposal for which logger warnings count as "silent errors" (DEC-106 names failed loads,
      broken saved data and runtime-check failures). Accept, change or reject it. On acceptance
      the lane builds, the line in `apps/client/AGENTS.md` changes (HC-T1 T-208) and the step-12
      reports follow. **Recommendation:** accept.
- [x] **HC-Q28 — Which developer camera chord does each operating system get? (the critic's loop
      1, 2026-10-30).** DEC-105 says Cmd+Shift+F3 on a Mac and Ctrl+Shift+F3 on Windows and Linux.
      The build binds both chords on every platform, and the Settings screen listed Ctrl first even
      on a Mac. The options were: both, the Mac chord first on a Mac; keep as built; one chord per
      platform.
  - Answered 2026-10-30 (in chat): "C: both, Mac chord first on Mac" (DEC-118). Built: the order is
    set once, when `keybindings.ts` loads (Apple devices: Cmd first; elsewhere: Ctrl first).
- [x] **HC-Q29 — Where is the developer camera hotkey handled? (the critic's loop 1, 2026-10-30).**
      The build reads it in a raw window key listener in `MatchHost`; the game-interface
      architecture (§6.2) sends client-only actions through `Match`'s `clientActions`. The options
      were: keep it in `MatchHost` as the documented home; route it through `clientActions`; hold.
  - Answered 2026-10-30 (in chat): "no tech-debt. if moving m1 is better, do it." The orchestrator
    decided, on that delegation: it stays in `MatchHost`, as one entry in a table of one-shot
    actions (DEC-117). The tick path's snapshot has no modifiers, the explorer belongs to
    `MatchHost`'s pointer controls, and `Match`'s loop stops while paused. `clientActions` stays for
    the client edges of state `Match` owns.
- [ ] **HC-S1 — Suggestion, not built: countdown urgency.** At 10 s or less, a stronger glow, a
      1 Hz pulse and screen-reader lines at 10 and 5 s. If you want it, it comes back as a
      `creative` row: a data-selectable variant with your static original kept live (DEC-53).
  - Answered 2026-10-28 with HC-S5 (below): on by default, once you name the enhancements.
  - 2026-10-29: chosen as UE-01, on by default, with a slightly larger pulse on the number from 5 s
    (HC-S5, DEC-100).
- [ ] **HC-S2 — Suggestion, not built: HUD value transitions.** 200 ms transitions on the bars, the
      cooldown sweeps and the XP ring between updates. If you want it, it comes back the same way
      as HC-S1, after a paint check on a slowed-down CPU.
  - Answered 2026-10-28 with HC-S5 (below): on by default, once you name the enhancements.
  - 2026-10-29: chosen as UE-02, on by default (HC-S5, DEC-100).
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
  - Answered 2026-10-28 with HC-S5 (below): on by default, once you name the enhancements.
  - 2026-10-29: chosen as UE-04, on by default (HC-S5, DEC-100).
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
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "Build these, switched on by
    default (note: UE ids)", with no note. So each enhancement you pick is switched on by default,
    with your Figma original kept live and selectable (DEC-53). **Open, for you:** which ones? The
    note was empty. Until you say, the plan keeps all eleven (UE-01 countdown urgency, UE-02 HUD
    value transitions, UE-04 your grain on the "42", UE-05 card hover lift, UE-06 lock-in flare,
    UE-07 low-health pulse, UE-08 idle shimmer, UE-09 panel cross-fade, UE-10 button motion, UE-11
    ready flash, UE-12 level-up flare), each on by default. (2) is answered by your locked view: the
    screen now stays after LOCK IN (DEC-60), so the flare plays there. (4) UE-07's threshold stays
    at the plan's 25 % unless you give another. HC-T1 row T-152 waits for your list; its wording now
    says "on by default".
  - Answered 2026-10-29 (build-plan question P1: "Please give me an HTML page to review decisions,
    as per spec"; then the review page, in chat): all eleven, "P1 low-health threshold: 25 %", and:
    "All approved. Minor changes: at 5 seconds remaining, urgency countdown should have a slightly
    larger pulse on the number. Idle shimmer should pulse every 5 seconds instead of 7. Level-up
    flare could be more dramatic and the colour should match the theme, not be light blue. We use
    gold, red, and bronze often." Recorded as DEC-100; `docs/plan/ui-enhancements-plan.md` now has
    your values for UE-01, UE-07, UE-08 and UE-12, and every enhancement on by default. **Waits for
    the build**, and HC-T1 T-152 for your approval.
- [ ] **HC-U1 — For Sprint 3: your functional UI/UX improvements to the HUD and character select
      (not urgent; you supply the list; OD-39).** On 2026-10-25 you judged the visuals good enough
      for the MVP and said your functional UI/UX improvements can wait for Sprint 3 (HC-C1). Send
      the list when Sprint 3 starts. It is not a defect list and does not block this pull request.
      Three visual residuals travel with it (reference 15): CD-25's mask on the level number
      (HC-C1 (1)), CD-30 (the glow floor and Select Class's open label-glow residual) and CD-38
      (the staff in a Magus player's weapon panel).
  - Answered 2026-10-28 (the non-blocking decision page, in chat): "List in the note": "Not sure
    what CD-25, CD-30 and CD-38 are." Your list came with the eight visual defaults (HC-Q6): "this
    may help: Eternalus Improvement Notes 1. Zoom the minimap so it fits the local area into the
    compass space, rather than placing the whole, zoomed-out map with black empty space around it.
    Local (seen) area + a reasonable amount of space outside of what the user can see (e.g., 400
    world units in every direction with the user in the centre, represented by a red, stylized
    chevron). 2. Ability cards glow gold when they're fully cooled down, not just all the time
    (e.g., ult and gadget 2). Red fill starts at the bottom of the frame and loads to fill the frame
    with red, turning gold and glowing when ready. Resets colours after ability is used. 3. prettier
    Esc menu 4. new area for match clock (top middle of screen? current clock is meant to act as a
    count-down until the crystal shatters. perhaps something needs to change here. maybe the crystal
    gets a CSS mask and starts almost fully see-through, then from the bottom to the top it becomes
    more visible as it loads toward explosion time (I think that's at 20 mins?)". These four notes
    are your Sprint 3 list. The three register rows that travel with it, explained: **CD-25**, the
    grain on the HUD's level number ("42"): your Figma draws it with a speckled noise that a browser
    cannot copy exactly, so the build draws a similar grain with a noise filter; the pixel audit
    leaves the number's area out (a "mask") once you sign the row (HC-C1); HC-S4 offers a closer
    option, your own grain painted through the digits. **CD-30**, the glows on LOCK IN, Select Class
    and the countdown: they use the blur the audit measured as closest to your Figma, and what is
    left is Figma's own dithered glow, which a browser cannot reproduce (a "floor"); Select Class's
    label glow is a little further off than the others and is listed as open. **CD-38**, the weapon
    panel of a Magus player: your HUD frame draws only the Vanguard's battle axe, so the build shows
    the staff from your alternate class layout; your HC-F6 note ("empty weapon container") may mean
    it should stay empty (asked in HC-F6).

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

- 2026-10-30 — **The critic's check of batches 3 and 4 (loop 1)** (`feat/hud-plan-b3a`): the code
  fixes (the one-shot table in `MatchHost`, the order of the two developer camera chords, a test
  that ties the stored chord modifiers to `ChordModifier`, a comment on the interim crash banner)
  and the docs: DEC-117 and DEC-118 in `docs/reference/game-design/13-owner-decisions-log.md`, with
  notes on DEC-57, DEC-62 and DEC-105; HC-B3, HC-Q28 and HC-Q29 are answered and ticked; HC-T1
  T-196 redrafted and T-209 to T-212 new (39 pending); status notes in architecture 13 §10, 06 §10
  and 14 §14; register row CD-47 (the destroyed structure look, DEC-69). Nothing new to decide.
- 2026-10-30 — **Your answers Q1 to Q3 to the pickup session, and batches 3 and 4 of the build
  plan** (`feat/hud-plan-b3a`): recorded as DEC-114 to DEC-116 in
  `docs/reference/game-design/13-owner-decisions-log.md` (DEC-113 is the game-loop plan's), with a
  note on DEC-101 and on register rows CD-05, CD-38 and OD-37, and under HC-F2, HC-F6, HC-F8, HC-Q4
  and HC-Q8; HC-Q24 to HC-Q26 are ticked. Built: the Coming Soon void (`180601d`), the empty live kit
  (`80a9689`), destroyed structures (`cf7efbe`), the crash returns to the menu (`cca838d`), the
  developer camera hotkey (`e84c8aa`) and the art that fits the Legend (`1f5cb75`). HC-T1: T-184
  redrafted and 17 new rows (T-192 to T-208), 35 pending. New for you: HC-Q27, the crash-report ADR.
- 2026-10-30 — **The critic's check of batch 2 (loop 1 of 3)** (`feat/hud-plan-b2`): the code
  fixes (the Legend portraits that View Details lacked on the alternate layout, a `pause-menu`
  mouse button while View Details is open, the roster's random stream, a class details test) and
  the docs: HC-T1 T-12 redrafted without `cancel-match` and T-191 new (18 pending); notes on
  register rows CD-42 and CD-45 (HC-C1) and on HC-Q15's sizes; two items in the PR register's
  "Integration recipe". New for you: HC-B2 (a view over a selection step, and its name) and HC-Q23
  (a DOM test environment).
- 2026-10-30 — **Your answer on the alternate class layout, and batch 2 of the build plan**
  (`feat/hud-plan-b2`): recorded as DEC-109 in `docs/reference/game-design/13-owner-decisions-log.md`,
  with notes on DEC-52 and DEC-109 and under HC-F1, HC-F7, HC-Q5, HC-Q9 and HC-C1. Built: the bot
  rosters, the timeout popup, the locked view, the Ultimate / Abilities rows and View Details on
  every layout. HC-T1: 5 rows redrafted and 10 new (T-181 to T-190), 17 pending; register rows
  CD-39 to CD-46. Nothing is ticked: HC-Q5 keeps two open points.
- 2026-10-29 — **Your answers to the build plan of `feat/hud-and-character-select`** (questions P1
  to P11 in three dialogs, and the enhancement review page in chat): recorded with your words as
  DEC-100 to DEC-108 in `docs/reference/game-design/13-owner-decisions-log.md` (numbering in its
  batch intro), with notes on DEC-48, DEC-51, DEC-53, DEC-57, DEC-59 to DEC-62, DEC-65, DEC-66 and
  DEC-69, and under HC-F1, HC-F2, HC-F6, HC-F8, HC-Q4, HC-Q5, HC-Q7, HC-Q8, HC-Q20 and HC-S1 to
  HC-S5. HC-T1 T-155 to T-163 and T-180 applied (7 rows pending); HC-Q16 ticked; HC-Q18 (1) applied.
  Your instruction: "Answers must be documented in the code so I do not need to make these decisions
  again."
- 2026-10-28 — **The critic's check of the doc rows applied on 2026-10-28 (loop 1 of 3)**: 3
  should-fix findings and 7 nits, all fixed as HC-T1 rows T-164 to T-179; ADR 0023 records your
  HC-Q18 (4) answer (every content id) for CP-13; DEC-61 and DEC-62 gain notes that label the
  recorder's interim defaults (the bots' random Legends, the weapon panel) `Recommendation:`.
  Nothing new to decide; HC-T1 flags T-12's `cancel-match`.
- 2026-10-28 — **Your 42 answers to the non-blocking questions of `feat/hud-and-character-select`**
  (a second decision page, answered in chat; the PR register lists every answer): recorded under
  each item above with your words, as DEC-58 to DEC-70 in
  `docs/reference/game-design/13-owner-decisions-log.md` (with notes on DEC-48, DEC-49, DEC-51 and
  DEC-57), and in ADR 0022 (FR-111). Ticked: HC-F4, HC-F5, HC-F7, HC-F9, HC-Q6, HC-Q10, HC-Q12,
  HC-Q14, HC-Q15. 49 more HC-T1 rows applied and A-1 and A-2 accepted; 16 rows pending. Open for
  you: the bots' Legends (HC-F1), the weapon panel (HC-F6), CD-25's mask (HC-C1), the Magus
  description (HC-Q5), HC-Q7 (1) and (4), which enhancements (HC-S5), HC-T1 T-155 to T-157 and
  T-162, T-163; the rest waits for the build or for next sprint. DEC-58 to DEC-70 and ADR 0022 were
  checked free on every branch.
- 2026-10-28 — **Your answers to the merge decisions of `feat/hud-and-character-select`** (a
  decision page, items D1 to D8, answered in chat): HC-T1 group (i) approved and applied, and 24
  more HC-T1 rows that HC-B1 and ADR 0019 cleared; HC-B1 approved (DEC-22's appended note); ADR 0019
  and ADR 0020 accepted; HC-Q7 (1) answered (DEC-51's appended note; FR-111 reworded); HC-Q21 (b),
  the minion stack and `feat/weapons` merge first; a merge commit for this pull request; HC-Q22
  answered (DEC-57, the start weapons). DEC-57 was re-checked free on every branch. Still open: the
  rest of HC-T1, HC-Q7 (1)'s tool terms, (2), (4), (5) and the credit drafted in (3) for your
  confirmation.
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
