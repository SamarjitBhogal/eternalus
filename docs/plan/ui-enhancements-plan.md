---
title: UI enhancements plan
description: Specification of the follow-up pull request that adds data-selectable enhancements to the owner's Figma character-select screens and HUD (the in-game reduce-motion setting, countdown urgency, HUD value transitions, the level-number grain, card hover lift and rim light, a lock-in flare, a low-health pulse, idle shimmer and four smaller ones) with the Figma original kept live and the default; read this before building, reviewing or approving any of them.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-27
tags: [plan, ui, hud, character-select, accessibility, motion, follow-up]
related:
  - 'docs/reference/game-design/15-figma-frames-and-creative-decisions.md'
  - 'docs/reference/game-design/13-owner-decisions-log.md'
  - 'docs/architecture/13-game-interface.md'
  - 'docs/plan/phase-6-hardening-balance-and-release.md'
  - 'docs/plan/phase-5-meta-ui-and-persistence.md'
  - 'docs/requirements/06-mvp-requirements.md'
---

# UI enhancements plan

**Purpose.** Read this before you build, review or approve an enhancement to the character-select
screens or the HUD that `feat/hud-and-character-select` built from the owner's Figma frames. It
specifies one follow-up pull request: what each enhancement changes, where, when it plays, its
exact parameters, its accessibility limits, the data value that selects it and the tests that
accept it. It decides nothing: the owner chooses which enhancements to build and which become the
default (`INBOX.md` HC-S5). Until the owner chooses, every default stated here is the Figma
original.

## 1. Scope and status

- **Task line:** unscheduled; it waits on the owner's answer to `INBOX.md` HC-S5. The proposed line
  ("UI enhancements on the owner's Figma screens", in [Phase 6, sprint
  6.3](phase-6-hardening-balance-and-release.md#sprint-63--art-and-audio-pass)) is `INBOX.md` HC-T1
  row T-152, for his approval, because a new task in his plan needs it (build rulings OD-26 and
  OD-31). Once scheduled, the work may start before its sprint, in the phase branch open at the
  time, once `feat/hud-and-character-select` has merged ([README](README.md) §1, stacking). The
  owner's own functional UI/UX list is separate: it waits for Sprint 3 (`INBOX.md` HC-U1, build
  ruling OD-39).
- **Branch:** one task branch, `feat/ui-enhancements`, one pull request. UE-03 lands first, because
  every other enhancement relies on it.
- **Inputs:** owner decision DEC-53 (a creative change ships only beside a live original, through
  the same display-switch pattern as DEC-54 and DEC-55); `INBOX.md` HC-S1 to HC-S4, which this plan
  specifies; the register [reference
  15](../reference/game-design/15-figma-frames-and-creative-decisions.md); architecture [13
  §7](../architecture/13-game-interface.md#7-styling-accessibility-and-react-rules) and FR-084 and
  NFR-030 in [the MVP requirements](../requirements/06-mvp-requirements.md).
- **The owner's playtest (2026-10-24)** of the integrated screens found them working: character
  select (hover, arrow keys, Select Class, the Legend cards, LOCK IN), the HUD over the live map,
  and Esc pause, Resume and Leave match. Visual polish and HUD changes will follow later; he asked
  for nothing yet. His polish feedback, when it comes, is added here as new UE rows; nothing in this
  plan presumes it.
- **Out of scope:** game rules and anything the snapshot does not carry yet (shield amount, weapon
  level, ultimate pips, structure damage: OQ-63, OQ-64; INBOX HC-Q2); new art, except UE-04's grain
  field; the Figma frames themselves (DEC-54: agents never edit the original frames).

## 2. Rules every enhancement follows

1. **One data switch, the Figma original live.** A new content value `uiEnhancements`, a list of
   the ids in §3 (empty by default), sits beside `effectsRenderer` and `contrastMode` in
   `game/content/screenPresentation.ts` and travels the same way: through the display catalogue to
   `SessionController`, which writes it to `<html>` as `data-ui-enhancements` (a space-separated
   list), as it writes `data-contrast`. Each enhancement's CSS is scoped under
   `:root[data-ui-enhancements~='<id>']`, so with the list empty every module renders exactly the
   Figma original, and both stay live code (DEC-53; no commented-out code, nothing `knip` flags).
   For comparison only, `?dev=1&ui=<id>,<id>` overrides the list, like `fx=` for the effects
   renderer (`game/developerFlags.ts`). UE-03 is not an enhancement: it has no switch and is
   always on. A component reads the switch only where markup must change (a live region, a
   `key`); styling never branches in `ui/`.
2. **Registered.** Each enhancement the pull request builds adds a `creative` row to reference 15
   §3, citing its UE id, with the Figma original named under "Original kept as".
3. **Motion limits** (13 §7; FR-084; NFR-030; WCAG 2.2 SC 2.3.1 [T1]; the Game Accessibility
   Guidelines [T2]):
   - nothing flashes more than three times in any second; every loop runs at 1 Hz or slower;
   - a flare is one cycle, never a loop, and never a full-screen or saturated-red transition;
   - only `transform` and `opacity` animate [T4], except UE-02's registered properties; no
     `backdrop-filter` over the live canvas;
   - under `prefers-reduced-motion: reduce` **and** under the in-game setting (UE-03) there is no
     movement, scaling, loop or flare: state changes become instant and every change that carries
     information (a colour, a glyph, a number) stays [T3].
4. **Time from data.** An animation starts from published state: a `key` on the value
   (`key={seconds}`, `key={level}`) or a data attribute that changes. No `setTimeout` or
   `setInterval` in `ui/`; a HUD loop is paused with the match (`animation-play-state`), so a paused
   match freezes every HUD enhancement.
5. **Tokens.** Every colour, duration and blur is a token in `styles/global.css`. A new duration
   is a `--motion-*` token (`ui/motionTokens.test.ts` requires it); under both reduced-motion
   sources the new tokens are zero.
6. **Tests that now forbid the change** are replaced, never weakened: `Countdown.test.tsx` asserts
   no `data-urgent` and no `aria-live`, and `SegmentedBar.test.tsx` and `LevelBadge.test.tsx`
   assert no `transition` and no `@property` in their modules. Each assertion is kept for the
   Figma original (no attribute, no rule outside the enhancement's scope) and a new assertion
   covers the enhancement's scope.
7. **Performance.** With every enhancement on, the HUD soak scenario keeps a frame-interval p95 of
   16.7 ms or less, also with Chrome's CPU slowed fourfold (HC-S2's paint check).

## 3. The enhancements

Ids are `UE-nn` and never reused. "Default" is the value until the owner chooses (HC-S5).
Sources in brackets are listed in §5.

### 3.1 Accessibility foundation

| Id    | What changes                                                                                                                                                                                                                                                                                                                                      | Component(s)                                                                                                           | Trigger                   | Parameters                                                                                                                                       | Accessibility limits                                       | Switch and default                                            | Acceptance tests                                                                                                                                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UE-03 | The in-game "Reduce motion" setting (HC-S3, FR-084) reaches the page: `SettingsController` writes `data-reduce-motion` on `<html>` from `settings.accessibility.reduceMotion`, and every reduced-motion rule (the global motion tokens and each module's own, today `GradientLayer` and `ParticlesLayer`) applies under it as under the OS query. | `game/settings/SettingsController.ts`; `styles/global.css`; every `*.module.css` with a `prefers-reduced-motion` block | the setting's value, live | the zeroed set is the OS block's: `--motion-fast`, `--motion-medium` and every new `--motion-*` token at `0ms`, the background animations `none` | one mechanism for both sources; nothing about it can flash | none: always on (an accessibility requirement, not a variant) | Unit: toggling the setting sets and removes the attribute; a `?raw` scan of `ui/**/*.module.css` and `global.css` finds, for every `@media (prefers-reduced-motion: reduce)` rule, its `:root[data-reduce-motion]` twin with the same declarations, and fails on a missing one. Visual: the selection scenario with the setting on matches the OS-reduced shot. |

### 3.2 Character select (62:125, 62:70, 58:271)

| Id    | What changes                                                                                                                                                                                            | Component(s)                                                                                                                                  | Trigger                                                                                                                                                                                                                                                                                             | Parameters                                                                                                                                                                                                                                                                                                                                   | Accessibility limits                                                                                            | Switch and default                                                                        | Acceptance tests                                                                                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UE-01 | Countdown urgency (HC-S1): the numeral ticks once per second in the last 10 s, its glow strengthens in the last 5 s, and a screen reader hears two lines. The Figma red stays (HC-Q6 (3)) [R1, T1, T3]. | `ui/components/Countdown.tsx`, `CharacterSelectScreen`                                                                                        | `remainingSeconds` ≤ 10 (the tick), ≤ 5 (the glow), = 10 and = 5 (the lines); `data-urgent` on the numeral                                                                                                                                                                                          | tick: `scale` 1 → 1.08 → 1 over a new `--motion-tick` (300 ms), once per second change (`key={seconds}`), so 1 Hz; glow: a new token `--selection-countdown-urgent-glow`, the countdown glow's flood at opacity 0.30 instead of 0.15; lines: a new key `STRINGS.characterSelect.countdownAlert` ("{n} seconds left") in a polite live region | 1 Hz, small area, no colour change; reduced motion: no tick, the glow and the lines stay                        | `uiEnhancements` contains `'countdown-urgency'`; default off (the Figma's static numeral) | Unit: `data-urgent` from 10 s down and not at 11 s; the live region text only at 10 and 5 s; the tick rule exists only under the id scope and under no reduced-motion source; with the id absent, the existing assertions still hold. Visual: the Figma scenarios (the frames' 42 s and 31 s) are unchanged; a 9 s shot with the id on is reviewed. |
| UE-05 | Hover lift and rim light on the arch cards: an unpicked, available card rises and its rim brightens on hover or keyboard focus [R1, R4, T4, T11].                                                       | `ArchCard` through `ClassSelectCard` and `LegendSelectCard` (a sibling glow layer; the card root keeps no filter, opacity or transform, I-45) | `:hover` or `:focus-visible` on a card whose `data-look` is idle and that is not `aria-disabled`                                                                                                                                                                                                    | `translateY(-8px)` over `--motion-fast`; rim layer opacity +0.4; glow layer opacity 0 → 0.6 over `--motion-fast`                                                                                                                                                                                                                             | no lift under reduced motion (rim and glow change instantly); the locked card has no hover cue (register CD-05) | `'card-hover-lift'`; default off (the build's hover brightness, register CD-11)           | Unit: the lift rule targets only idle, enabled cards and only under the id scope; no transform on the card root. Visual: the Figma scenarios unchanged; hover and focus shots with the id on are reviewed on both renderers.                                                                                                                        |
| UE-06 | One lock-in confirmation flare on the picked Legend card [R1, R3, R7, T1].                                                                                                                              | `LegendSelectCard`, `LegendSelectStep`                                                                                                        | LOCK IN accepted. LOCK IN leaves the screen in the same click (`confirm-selection` → `pre-launch`, INBOX HC-Q9), so the flare needs one of two owner choices first (HC-S5 (2)): the session holds `character-select` for the flare's length, or the flare plays on the pre-launch screen's own tile | a flare layer (a copy of the card's glow) at opacity 0 → 0.8 → 0 over a new `--motion-emphasis` (600 ms), once; the halo's resting look is unchanged                                                                                                                                                                                         | one cycle; reduced motion: none, the locked state shows at once                                                 | `'lock-in-flare'`; default off                                                            | Unit: the flare plays once per lock-in and never loops (an `animation-iteration-count` of 1 in the scoped rule); reduced motion removes it. Visual: a frame-by-frame check of the 600 ms shows one luminance cycle.                                                                                                                                 |
| UE-08 | Idle shimmer on the picked class card's rim: a narrow highlight crosses the rim once every 7 s [R5, R4, T4].                                                                                            | `ClassSelectCard` (a masked highlight layer over the rim)                                                                                     | the card's `data-look` is picked                                                                                                                                                                                                                                                                    | sweep 900 ms by `translateX`, then a pause, over a new `--motion-shimmer` (7 s period), peak opacity 0.5                                                                                                                                                                                                                                     | 0.14 Hz; reduced motion: none                                                                                   | `'card-shimmer'`; default off                                                             | Unit: the loop's period token is at least 1 s and the layer animates only `transform`; none under reduced motion. Visual: the picked-card shot with the id on is reviewed.                                                                                                                                                                          |
| UE-09 | Selection-change cross-fade: the info panel's title, role line, description and detail rows fade in when the picked or previewed class or Legend changes, the rows 40 ms apart [R2].                    | `InfoPanel` and its rows                                                                                                                      | a change of the shown class or Legend (`key` on its id)                                                                                                                                                                                                                                             | opacity 0 → 1 over `--motion-fast`; a new `--motion-stagger` (40 ms) between rows                                                                                                                                                                                                                                                            | reduced motion: instant                                                                                         | `'panel-crossfade'`; default off                                                          | Unit: the fade rule is scoped and keyed; no transform. Visual: the Figma scenarios unchanged.                                                                                                                                                                                                                                                       |
| UE-10 | Select Class and LOCK IN hover and press: on hover the glow rises and the bracket ornaments move 3 px outward; on press the button sinks 1 px [R8].                                                     | `GlowButton`                                                                                                                                  | pointer hover and press, keyboard focus                                                                                                                                                                                                                                                             | glow opacity +0.25 and braces `translateX(±3px)` over `--motion-fast`; press `translateY(1px)`                                                                                                                                                                                                                                               | reduced motion: no movement, the glow change stays                                                              | `'button-motion'`; default off                                                            | Unit: the scoped rules exist only on enabled buttons. Visual: the hover and press shots with the id on are reviewed on both renderers.                                                                                                                                                                                                              |

### 3.3 HUD (62:231)

| Id    | What changes                                                                                                                                                                                                                                      | Component(s)                                                         | Trigger                                                                                                                                                                   | Parameters                                                                                                                                                                                                                                                                                                                                                                                                         | Accessibility limits                                                                                                       | Switch and default                                                   | Acceptance tests                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UE-02 | HUD value transitions (HC-S2): the health and aether fills, the cooldown fills and the XP ring glide between published values instead of stepping [H4, T7, T4].                                                                                   | `SegmentedBar` (via `ResourceBar`), `AbilitySlotFrame`, `LevelBadge` | a new published value (`hud-state`, every 6 ticks = 200 ms)                                                                                                               | each runtime custom property the components already set (`--segmented-bar-fill`, `--level-badge-progress`; for the cooldown fill, the SVG rect's `y` and `height`, if Chrome interpolates them as CSS properties, else a `scaleY` from the bottom under the id scope) is registered with `@property` under a component prefix and transitions over a new `--motion-publish` (200 ms, linear), one publish interval | follows pause and time scale, because it follows published state only; reduced motion: no transition (the values step)     | `'hud-transitions'`; default off (the Figma's stepped values)        | Unit: the registered properties and transitions exist only under the id scope; the Figma state renders byte-identical markup with the id off; a cooldown at fraction 1, 0.5 and 0 draws the same fill heights as today. Visual: the 7 HUD scenarios unchanged with the id off. Performance: rule 7 with the id on. |
| UE-04 | The level number's grain from the owner's own render ("option A", HC-S4, OD-3): the frame's grain field, rendered again from the owner's file on the scratch page (DEC-54), painted through the digits, in place of CD-25's SVG noise filter [F]. | `LevelBadge` (+ one asset in the `match` group)                      | always, while the id is on                                                                                                                                                | one grain image, 1,194 B at 1x and 3,022 B at 2x when last built (re-measured on re-export), masked by the digits                                                                                                                                                                                                                                                                                                  | static; nothing moves                                                                                                      | `'level-grain-figma'`; default off (CD-25's filter, the build today) | Unit: the grain layer appears only under the id; the filter stays the default. Visual: on the Figma's "42" the level-number region (80, 807, 72 × 63) matches the frame exactly; another number is reviewed.                                                                                                       |
| UE-07 | Low-health pulse: a new glow layer under the health bar breathes while health is low; the bar and its numeral keep their Figma colours [H7, T12, T2].                                                                                             | `ResourceBar` (health), `HealthBar`                                  | `health / maxHealth` at or below a threshold in content (`hudPresentation.ts`, `// TUNE:`; `Recommendation:` 0.25, for the owner to confirm in HC-S5), as `data-critical` | glow opacity 0.6 ↔ 1 at 1 Hz over a new `--motion-pulse` (1 s), paused (`animation-play-state`) while the match is paused, keyed on the overlay state `MatchScreen` already reads; no screen-edge vignette                                                                                                                                                                                                         | 1 Hz on the bar only; never a full-screen effect; reduced motion: a static critical outline token and the number, no pulse | `'low-health-pulse'`; default off                                    | Unit: `data-critical` at the threshold and not above it; the pulse rule only under the id and no reduced-motion source. Visual: a critical-health scenario shot with the id on is reviewed.                                                                                                                        |
| UE-11 | Ready flash: when a slot's cooldown ends, its gold glow fades in with one flash [H5, H6].                                                                                                                                                         | `AbilitySlot`, `AbilitySlotFrame`                                    | the slot's `data-look` changes from cooldown to ready                                                                                                                     | the resting gold glow appears as today; a flash layer over it goes 0 → 0.8 → 0 over a new `--motion-flash` (300 ms), once                                                                                                                                                                                                                                                                                          | one cycle; reduced motion: the ready glow appears at once                                                                  | `'ready-flash'`; default off                                         | Unit: the flash plays once per transition, keyed on the look. Visual: reviewed on a cooldown-to-ready sequence.                                                                                                                                                                                                    |
| UE-12 | Level-up flare: one ring flare and a numeral pop when the level rises [H4, H3].                                                                                                                                                                   | `LevelBadge`                                                         | a new `level` (`key={level}`)                                                                                                                                             | a ring flare layer at opacity 0 → 0.8 → 0 and the numeral's `scale` 1 → 1.12 → 1 over `--motion-emphasis` (600 ms), once; the ring's resting look is unchanged                                                                                                                                                                                                                                                     | one cycle; reduced motion: none, the new number shows at once                                                              | `'level-up-flare'`; default off                                      | Unit: keyed on `level`, one cycle. Visual: reviewed on a level change; becomes visible only when XP is live (Phase 4, sprint 4.5).                                                                                                                                                                                 |

## 4. Order of work and done when

1. UE-03, with its twin-rule scan (it also discharges the reduced-motion part of [Phase 5, sprint
   5.5](phase-5-meta-ui-and-persistence.md#sprint-55--match-results-and-developer-menu-completion)'s
   "Accessibility minimums").
2. The switch of §2 rule 1 (`uiEnhancements`, the attribute, the developer override) with its
   tests, and no enhancement yet: every visual scenario is byte-identical to the merged branch.
3. The enhancements the owner chose in HC-S5, one commit each, with its reference 15 row.

**Done when:** `npm run check` passes; each built enhancement has its unit tests, its visual
scenario reviewed by the owner and its `creative` row; every Figma scenario with an empty
`uiEnhancements` is byte-identical to the shots of the merged `feat/hud-and-character-select`;
rule 7's performance check is recorded in `PROGRESS.md`. The visual tests run on the audit
toolchain kept outside the repository (the harness, `shoot.ts` and `vdiff.py` of the HUD and
character-select work); the pull request quotes their results.

## 5. Sources

From the research done for the HUD and character-select work (2026-10-16). Where a page could
not be opened, the claim rests on a search summary, marked "(summary)".

- **[R1]** League of Legends, champion select: declaring intent, then locking in; a timeout
  disbands the selection. https://wiki.leagueoflegends.com/en-us/Draft
- **[R2]** Dota 2 7.00 pick phase: the info panel's abilities, strengths and description.
  https://dota2.com/700/pregame
- **[R3]** SMITE 2: the god locked first, the aspect chosen under the same timer (summary).
  https://dotesports.com/smite/news/all-aspects-and-how-they-work-in-smite-2
- **[R4]** VALORANT interface preview: per-agent colour fields and motion design.
  https://playvalorant.com/en-us/news/game-updates/preview-the-future-of-valorant-s-interface/
- **[R5]** Diablo IV 2.0: an animated class selection screen (summary).
  https://icy-veins.com/d4/news/the-campfire-is-gone-diablo-4-2-0-has-a-new-character-creation-screen
- **[R7]** Paladins: reviewers disliked dead countdown time (summary).
  https://vooks.net/paladins-switch-review
- **[R8]** Predecessor UI overhaul: the call to action built to hold attention (summary).
  https://www.predecessorgame.com/news/notices/ui-overhaul
- **[H3]** Destiny 2 HUD: buffs, the Super meter (summary of secondary sources).
  https://www.pcgamesn.com/destiny-2/ui-buffs-debuffs
- **[H4]** Overwatch: the ultimate as a ring meter, expended at once (Patch 1.16).
  https://liquipedia.net/overwatch/Patch_1.16
- **[H5]** VALORANT HUD: ready as a distinct steady state.
  https://geniusguide.evilgeniuses.gg/p/screen-studies-valorant
- **[H6]** SMITE HUD: a lit diamond when ready, wedges while charging (summary).
  https://smite.fandom.com/wiki/HUD
- **[H7]** Elden Ring and Dark Souls: a minimal HUD; the damage "ghost" on the health bar
  (summary; the ghost is general knowledge, not verified).
  https://kotaku.com/elden-ring-ui-ux-user-experience-interface-fromsoftware-1848637410
- **[T1]** WCAG 2.2, Understanding SC 2.3.1, Three Flashes or Below Threshold.
  https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- **[T2]** Game Accessibility Guidelines, basic level.
  https://gameaccessibilityguidelines.com/basic/
- **[T3]** MDN, `prefers-reduced-motion`: scaling and panning as vestibular triggers.
  https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- **[T4]** web.dev, high-performance CSS animations: `transform` and `opacity` only.
  https://web.dev/articles/animations-guide
- **[T7]** MDN, `@property`: animating a registered percentage.
  https://developer.mozilla.org/en-US/docs/Web/CSS/@property
- **[T11]** Josh W. Comeau, designing shadows: `drop-shadow` follows the alpha shape.
  https://www.joshwcomeau.com/css/designing-shadows/
- **[T12]** Low-health feedback: pulse the health element with a readable value, keep any vignette
  optional (summary of opinion pieces).
  https://giantbomb.com/users/4289/articles/a-discussion-on-the-proper-display-of-health-in-vi
- **[F]** The owner's Figma, frame 62:231, and the grain measurement of 2026-10-18 (OD-3,
  reference 15 CD-25).

## Related

- [../reference/game-design/15-figma-frames-and-creative-decisions.md](../reference/game-design/15-figma-frames-and-creative-decisions.md): the frames and the register each enhancement joins.
- [../reference/game-design/13-owner-decisions-log.md](../reference/game-design/13-owner-decisions-log.md): DEC-53 to DEC-55.
- [../architecture/13-game-interface.md](../architecture/13-game-interface.md): §7 styling, accessibility and the display switches.
- [phase-6-hardening-balance-and-release.md](phase-6-hardening-balance-and-release.md): sprint 6.3, where the proposed task line would go (unscheduled; it waits on `INBOX.md` HC-S5).
- [phase-5-meta-ui-and-persistence.md](phase-5-meta-ui-and-persistence.md): sprint 5.5's accessibility minimums.
