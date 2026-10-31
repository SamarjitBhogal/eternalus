---
title: Game interface
description: The presentation layer of the client - React screens and HUD, the SessionController flow, the developer menu, the bridge between the simulation and the Redux store, the keybinding architecture with press-to-bind and dynamic key glyphs, styling and accessibility rules, and the tests that prove them; read this before adding a screen, a HUD element, an InputAction or a bridge event.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-10-17
tags: [architecture, ui, react, redux, hud, bridge, input, keybindings, developer-menu]
paths:
  [
    'apps/client/src/ui/**',
    'apps/client/src/bridge/**',
    'apps/client/src/game/input/**',
    'apps/client/src/game/settings/**',
  ]
related:
  [
    'docs/architecture/08-game-engine.md',
    'docs/architecture/09-hardware-abstraction.md',
    'docs/architecture/12-game-story-and-match-director.md',
    'docs/architecture/14-persistence-and-resources.md',
    'docs/architecture/15-diagnostics-and-runtime-testing.md',
    'docs/reference/game-design/09-controls.md',
    'docs/plan/phase-5-meta-ui-and-persistence.md',
  ]
---

# Game interface

**Purpose.** Read this when you touch what the player sees or presses outside the canvas: a React
screen or HUD element, the `SessionController` flow, the developer menu, a bridge event or Redux
slice, an `InputAction` or its binding. It fixes how the UI learns about the game (throttled
snapshots through one bus and one store, rule 10), how the UI talks back (intents that become
`Command`s, rule 9) and how controls stay data (requirements doc: "no hard-coded controls;
configurable via settings", and prompts that "change dynamically to reflect whatever keybindings
they chose"). React + Redux Toolkit + Vite are decided (D2, ADR 0004; confirmed with the
instructor, DEC-02). Code blocks below are **sketches**; §10 says what is built.

## 1. Where it sits

- `ui/` (L4) imports only `bridge/`, `ui/` and `styles/` (rule 5): it never sees `Simulation`,
  a device, a canvas or `PersistenceController`; it reads selectors and emits intents.
- `bridge/` (L3) is the one store and the one event bus, the two allowed singletons (rule D in
  [01](01-layered-oop-model.md) §4). It imports core as `import type` only and never `game/`,
  `ui/` or `data/`, so client-side display types it needs are defined in `bridge/` (§5).
- `game/input/` (L3) turns device snapshots into `InputIntent`s (§6); `game/SessionController.ts`,
  `game/MatchBridge.ts` ([12](12-game-story-and-match-director.md) §8) and
  `game/settings/SettingsController.ts` (§6.3) are the only producers of bridge events. `main.tsx` is the only place `game/` and `ui/` meet: it builds the
  controllers and mounts `<Provider store={store}><App viewport={<GameCanvas … />} /></Provider>`;
  `GameCanvas.tsx` (L3) owns the canvas elements and hands them to `SessionController`, `App`
  (`ui/App.tsx`) maps the session phase to a screen and passes the viewport into `MatchScreen`.

```text
ui/App.tsx            session phase → screen (the screens registry, 02 §9)
ui/screens/           *Screen.tsx (+ .module.css, .test.tsx, useXxx hooks)
ui/hud/               HealthBar, AetherBar, AbilityBar, MinimapPanel, MatchClock, Scoreboard, Announcer, DeveloperMenu, PerfOverlay
ui/components/        KeyGlyph, Prompt, Button, Dialog, ProgressBar, ErrorBoundary
ui/strings.ts         UI labels and prompt templates (Recommendation; game names stay in content)
bridge/               store.ts, eventBus.ts, events.ts, Binding.types.ts, chordKey.ts, slices/*, selectors/*, hooks.ts
game/input/           keybindings.ts, InputMapper.ts, BindingResolver.ts
```

## 2. `SessionController`

The session is a State pattern over `SessionPhase`; menu sub-screens are a `menuRoute` in the
store, not session states (plan Phase 5, sprint 5.2). `results` is a session phase, not a
`MatchPhase` ([12](12-game-story-and-match-director.md) §2).

```ts
// Sketch: apps/client/src/bridge/events.ts (types shared with ui/) and game/SessionController.ts
export type SessionPhase =
  | 'boot'
  | 'menu'
  | 'loading' // start-match loading: themed background, assets for the selection screens
  | 'character-select' // 60 s countdown; cancel to 'menu' if nothing selected (owner flow, 2026-10-03)
  | 'pre-launch' // 10 s reveal of the allied team (enemy team top right)
  | 'match-loading' // waits for the `match` asset group; both rosters shown
  | 'match'
  | 'results';
export type MenuRoute = 'main' | 'loadouts' | 'profile' | 'settings' | 'about';
export interface SessionState {
  readonly phase: SessionPhase;
  enter(ctx: SessionContext): Promise<void>;
  exit(ctx: SessionContext): Promise<void>;
}

export class SessionController {
  public constructor(deps: {
    bus: TypedEventBus<BridgeEventMap>;
    persistence: PersistenceController;
    resources: ResourceController;
    createMatch: (setup: MatchSetup) => Match; // Match stays the composition root of a match
    states: Readonly<Record<SessionPhase, SessionState>>; // defaultSessionStates.ts, the only file naming them
    logger: Logger;
  }) {}
  public start(): Promise<void>; // enters 'boot'
  public attachViewport(host: HTMLElement): void; // from GameCanvas.tsx
  private transition(to: SessionPhase): Promise<void>; // checks TRANSITIONS, exit → enter, emits 'session-phase'
}
```

| From               | To                          | Trigger                                                                                                                                    | Work done in `enter`/`exit`                                                                                                                                                                                 |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `boot`             | `menu`                      | manifest loaded (`boot` group), `persistence.open()` resolved (`ready` or `degraded`)                                                      | creates the default profile on first boot (settings and bindings load beside the phase machine, in `SettingsController`, §6.3); projects the content catalogue (`loadDefaultContent()`) into `contentSlice` |
| `menu`             | `loading`                   | `ui-intent { kind: 'start-match' }`                                                                                                        | builds `MatchSetup` (seed, `GameConfig` from the preset plus developer overrides, random `playerTeam`, the saved or auto-built `Loadout`)                                                                   |
| `loading`          | `character-select` / `menu` | selection-screen asset group loaded / cancelled or failed                                                                                  | loads the `selection` asset group (themed background set for the player's team) and shows `LoadingScreen`; the `MatchSetup` draft (seed, config, `playerTeam`) already exists from `menu`                   |
| `character-select` | `pre-launch` / `menu`       | player confirmed a class before the 60 s `SessionClock` countdown ended / countdown expired with no selection (`reason: 'select-timeout'`) | builds the rosters from content (allies + enemies), assigns `playerTeam` from the setup RNG stream, starts the countdown through the injected `SessionClock`                                                |
| `pre-launch`       | `match-loading`             | 10 s `SessionClock` reveal elapsed                                                                                                         | shows the allied team on pedestals and the enemy roster top right; no cancel                                                                                                                                |
| `match-loading`    | `match` / `menu`            | `match` asset group loaded / failed                                                                                                        | `createMatch(setup)`, `match.start()`; on failure logs and returns to `menu` with a banner                                                                                                                  |
| `match`            | `results` / `menu`          | `match-ended { result }` from `Simulation.on`, a `Simulation.step()` exception, `forfeit` / `leave-match`                                  | `persistence.saveMatchResult(…)` in one unit of work ([14](14-persistence-and-resources.md) §6); `match.destroy()` on exit: 0 listeners, 0 frames                                                           |
| `results`          | `menu` / `loading`          | `navigate` / `start-match` (rematch with the same setup, `Recommendation:`)                                                                | releases the `match` asset group                                                                                                                                                                            |

The three selection phases come from the owner's screen flow of 2026-10-03 ([reference 14](../reference/game-design/14-interface-and-screen-flow.md)); their countdowns are session time through the `SessionClock` port, never simulation ticks. Any other pair throws (`IllegalSessionTransition`): a wrong transition is a bug, not a state. The
table is the test (`SessionController.test.ts` walks every pair with fake states, a
`MemoryStorageAdapter` and a fake `ResourceController`).

## 3. Screens and HUD

Screens are function components that read memoised selectors through the typed hooks and emit
`ui-intent`s; they hold no game data of their own (rule 10). Every gameplay name and number they
show comes from content through the store (`contentSlice`, `matchSlice`), never from a literal.

| Screen                                                    | Reads (selectors)                                                                        | Emits (`ui-intent`)                                                                         | Status                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `BootScreen` (also the loading screen for `loading`)      | `selectLoadingProgress`, `selectPersistenceStatus`                                       | `retry-boot`                                                                                | **MVP** (requirements: "simple loading screen")                                   |
| `MainMenuScreen`                                          | `selectProfileSummary`, `selectMenuRoute`, `selectFactionBlurb`                          | `start-match`, `navigate`                                                                   | **MVP**; attract mode **MVP-if-time**                                             |
| `LoadoutScreen`                                           | `selectLoadoutsByClass`, `selectContentIndex`, `selectLoadoutProblems`                   | `edit-loadout` (validated in L3 by `validateLoadout`), `save-loadout`, `auto-build-loadout` | **MVP**                                                                           |
| `ProfileScreen` (themed name pending; Chronicle proposed) | `selectMatchHistory` (newest first), `selectAchievements`, `selectProfileStats`          | `export-profile`, `import-profile`                                                          | **MVP**; achievements panel **MVP-if-time** behind the `AchievementHook` registry |
| `SettingsScreen`                                          | `selectBindings`, `selectBindingConflicts`, `selectAudioSettings`, `selectStorageStatus` | `set-bindings`, `apply-binding-preset`, `save-settings`, `request-persistence`              | **MVP** (§6)                                                                      |
| `AboutScreen`                                             | `selectCredits` (generated from the manifest's `licence` and `source` fields)            | none                                                                                        | **MVP**                                                                           |
| `MatchScreen`                                             | `selectSessionPhase`; renders the `viewport` prop and the HUD                            | `leave-match`, `forfeit`                                                                    | **MVP**                                                                           |
| `ResultsScreen`                                           | `selectMatchResult`, `selectVerdictLine`                                                 | `navigate`, `start-match` (rematch)                                                         | **MVP**                                                                           |

| HUD element                | Source in the store                                                                        | Behaviour                                                                                                                                                                                                                   | Status  |
| -------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `HealthBar`, `AetherBar`   | `matchSlice.player` (from `hud-state`)                                                     | base bar plus one patterned segment per shield bar (never colour alone); `aether / maxAether` with level and XP-to-next                                                                                                     | **MVP** |
| `AbilityBar`               | `selectAbilitySlots` ([05](05-abilities-weapons-and-loadouts.md) §15)                      | one slot per `AbilitySlotSnapshot`: icon, cooldown sweep, ultimate charge, `blockedBy` hint, `<KeyGlyph action={slot.slot} />`                                                                                              | **MVP** |
| `MinimapPanel`             | `settingsSlice.hud.minimapVisible`                                                         | the frame around the `'minimap'` renderer layer that `GameCanvas.tsx` positions under it ([08](08-game-engine.md) §4); a click emits `minimap-click { u, v }` (normalised), which `Match` projects with `MinimapProjection` | **MVP** |
| `MatchClock`, `Scoreboard` | `matchSlice.clock` (5 Hz), `matchSlice.scoreboard` (1 Hz)                                  | `mm:ss` and the phase label; team scores, structures alive, per-Legend rows                                                                                                                                                 | **MVP** |
| `Announcer`                | `matchSlice.announcements` (from `announce`, [12](12-game-story-and-match-director.md) §8) | a queue with per-item TTL and `priority`; also the surface for live achievements and, post-MVP, tutorial dialogue                                                                                                           | **MVP** |
| `DeveloperMenu`            | `diagnosticsSlice`, `matchSlice`, `settingsSlice.developer`                                | §4                                                                                                                                                                                                                          | **MVP** |
| `PerfOverlay`              | `diagnosticsSlice.perf`, `diagnosticsSlice.violations`, `diagnosticsSlice.logTail`         | tick and frame histograms, last long animation frame, memory sample, log tail, violations with "copy repro" ([15](15-diagnostics-and-runtime-testing.md) §5)                                                                | **MVP** |

Announcer lines, verdict lines and faction blurbs are content in core
(`content/narrative/`); the HUD renders `displayName`s from the snapshot and the
content index. `ErrorBoundary` wraps every screen and the HUD (plan Phase 6, sprint 6.4): a
throw inside the match routes to `results` with a diagnostic, never a blank page.

## 4. The developer menu

`DeveloperMenu` (`ui/hud/`; Architect's Table is the proposed name) is enabled by the persisted
`settings.developer.menuEnabled` flag or the `?dev=1` query flag, opened with the rebindable
`toggle-developer-menu` action, and off in release builds unless the flag is set. The rule from
[mechanics-ideas §9](../reference/suggestions/mechanics-ideas.md#9-developer-menu-the-feature-list-all-replayable-commands):
anything that changes simulation state is a `Command` (`ui-intent { kind: 'dev-command' }` →
`Match` → `Simulation.enqueueCommand`), validated by `applyCommand` and therefore in the replay;
anything that only changes how the client shows or paces the simulation is a client toggle
(`ui-intent { kind: 'dev-toggle' }`) and deliberately not in the log.

| Control                                          | Message                                                                                                                                               | Cap or rule                                                                                        | Status                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------- |
| Add / remove a Legend                            | `dev-spawn-legend { team, definitionId, controllerId, at? }`, `dev-remove-legend { entityId }`                                                        | `maxLegendsPerTeam` (10, `TUNE`) → `command-rejected` shown inline; the human only in sim mode     | **MVP**                       |
| Spawn mobs from an origin                        | `dev-spawn-mobs { team, definitionId, count, origin }` (structure id, `{ lane, t }` or cursor), spawned as one horde ([18](18-minion-system.md) §3.5) | `maxUnitsPerTeam` (144, `TUNE`): clipped, `spawn-suppressed` counted in `TeamState`, never a crash | **MVP**                       |
| Sim mode: remove or add the human                | `dev-set-controller { entityId, controllerId }` (DISC-56)                                                                                             | at most one `player` controller (`SinglePlayerBrainInvariant`)                                     | **MVP**                       |
| Invariant level; timeline jump                   | `dev-set-assert-level { level, heavyEvery? }`; `dev-set-phase { phase }` (forward only)                                                               | —                                                                                                  | **MVP**; jump **MVP-if-time** |
| Pre-match config overrides                       | edits `GameConfig` on the menu's developer panel before `Simulation` exists                                                                           | `validateGameConfig` problems shown inline                                                         | **MVP**                       |
| Overlays, time scale, pause, step                | `dev-toggle { toggle: 'perf-overlay' \| 'diagnostics-overlay' \| 'time-scale' … }` → `GameLoop.setTimeScale`                                          | client-only; the simulation never knows                                                            | **MVP**                       |
| Hash now, dump replay, save as fixture, spectate | `dev-toggle` → `Simulation.hash()`, `exportReplay()`, `spectatedLegendId`                                                                             | read-only / client-only                                                                            | **MVP**                       |

The menu has no reference to `GameState`; its test spies on `Simulation.enqueueCommand` and
expects exactly one `Command` per gameplay button (plan Phase 5, sprint 5.5).

## 5. The bridge

```text
Simulation.on / snapshot → MatchBridge (throttle, project) → eventBus.emit → connectBusToStore → store slices
    → useAppSelector → screens and HUD → bus.emit('ui-intent') → SessionController / Match → Simulation.enqueueCommand
```

- **Game → UI.** `MatchBridge` subscribes to `Simulation.on` and reads the current `Snapshot`
  in `Match.tick()`; every `publishEveryTicks` (6 = 5 Hz, [08](08-game-engine.md) §7) it emits
  `match-clock` and `hud-state`, every 30 ticks `scoreboard` and `capture-state`, and on the
  event `announce`, `match-ended` and `diagnostic`. `connectBusToStore(bus, store)` in
  `bridge/store.ts` dispatches each event to its slice; components subscribe to memoised
  selectors (`createSelector`, ES-09), so React renders at UI rates, not 30 or 60 Hz.
- **UI → game.** A component emits one `ui-intent`; `SessionController` handles session and
  persistence intents, `SettingsController` the settings intents in every phase (§6.3), `Match`
  handles match intents and turns gameplay ones into `Command`s.
  `ui/` never writes the store directly, so every state change has one path.
- **Single place of change.** `bridge/events.ts` lists every message; `store.ts` lists every
  slice in `combineSlices(...)`; `hooks.ts` exports `useAppSelector`/`useAppDispatch` via
  `.withTypes<RootState, AppDispatch>()` (`apps/client/AGENTS.md`).

```ts
// Sketch: apps/client/src/bridge/events.ts — the ONLY list of game ↔ UI messages (02 §9)
export type BridgeEventMap = {
  'match-clock': {
    readonly tick: number;
    readonly phase: MatchPhase;
    readonly elapsedSeconds: number;
  };
  'hud-state': {
    readonly player: PlayerSnapshot | null;
    readonly spectatedLegendId: EntityId | null;
  };
  scoreboard: {
    readonly legends: readonly LegendStats[];
    readonly teams: Readonly<Record<PlayableTeam, TeamStats>>;
  };
  'capture-state': { readonly points: readonly CapturePointSnapshot[] };
  announce: {
    readonly id: AnnouncementId;
    readonly params: Readonly<Record<string, string>>;
    readonly tick: number;
  };
  'match-ended': { readonly result: MatchResult };
  diagnostic: { readonly record: LogRecord }; // violations and warnings for the overlay
  'perf-sample': PerfSample; // histograms, last long frame, memory (a bridge-defined type)
  'session-phase': { readonly phase: SessionPhase };
  'loading-progress': {
    readonly group: 'boot' | 'menu' | 'match';
    readonly loadedBytes: number;
    readonly totalBytes: number;
  };
  'persistence-status': {
    readonly status: 'opening' | 'ready' | 'degraded';
    readonly detail: string | null;
  };
  'ui-intent': UiIntent;
};

export type UiIntent =
  | { readonly kind: 'navigate'; readonly route: MenuRoute }
  | { readonly kind: 'start-match'; readonly setup: MatchSetupRequest }
  | { readonly kind: 'leave-match' }
  | { readonly kind: 'forfeit' }
  | { readonly kind: 'save-loadout'; readonly loadout: Loadout }
  | { readonly kind: 'set-bindings'; readonly bindings: readonly Binding[] }
  | {
      readonly kind: 'save-settings';
      readonly group: SettingsGroup;
      readonly value: SettingsGroupValue;
    }
  | { readonly kind: 'dev-command'; readonly command: Command } // replayable
  | { readonly kind: 'dev-toggle'; readonly toggle: DevToggle } // client-only
  | { readonly kind: 'minimap-click'; readonly u: number; readonly v: number }
  | { readonly kind: 'export-profile' }
  | { readonly kind: 'import-profile'; readonly json: string }
  | { readonly kind: 'retry-boot' }; // ... one member per screen intent named in §3
```

Slices (`bridge/slices/`): `sessionSlice` (phase, `menuRoute`, banners), `matchSlice` (clock,
player, scoreboard, capture points, announcements, result), `settingsSlice` (bindings, audio,
accessibility, developer, hud), `loadingSlice`, `persistenceSlice`, and the `Recommendation:`s
`contentSlice` (display-ready content index), `profileSlice` (summary, loadouts, history,
achievements) and `diagnosticsSlice` (perf samples, violations, log tail). Slice state is plain
data typed with core `import type`s (`PlayerSnapshot`, `MatchResult`, `Loadout`); the `data/`
vocabulary (persistence status, asset groups) is re-stated as string unions in `events.ts`
because `bridge/` may not import `data/`.

## 6. Keybindings

### 6.1 Data

```ts
// Sketch: apps/client/src/bridge/Binding.types.ts — the type contracts; the DEFAULTS live in game/input/keybindings.ts
export const INPUT_ACTIONS = [
  'move-up',
  'move-down',
  'move-left',
  'move-right',
  'attack',
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
  'sprint',
  'interact',
  'turret-toggle-control',
  'turret-switch-ammo',
  'camera-zoom-in',
  'camera-zoom-out',
  'toggle-minimap',
  'pause-menu',
  'toggle-developer-menu',
  'toggle-perf-overlay',
] as const;
export type InputAction = (typeof INPUT_ACTIONS)[number];
export type InputChord =
  | {
      readonly device: 'keyboard';
      readonly code: string;
      readonly label: string;
      readonly modifiers?: readonly string[];
    } // code + the key label seen at bind time
  | { readonly device: 'mouse'; readonly button: 0 | 1 | 2 | 3 | 4 }
  | { readonly device: 'gamepad'; readonly button: number } // post-MVP; 'gamepad-axis' as in 09 §3
  | {
      readonly device: 'gamepad-axis';
      readonly axis: number;
      readonly sign: -1 | 1;
      readonly deadzone: number;
    };
export type Binding = { readonly action: InputAction; readonly chords: readonly InputChord[] };

// Sketch: apps/client/src/game/input/keybindings.ts — the ONLY place a default key is written
export const DEFAULT_CHORDS: Readonly<Record<InputAction, readonly InputChord[]>> = {
  'move-up': [{ device: 'keyboard', code: 'KeyW', label: 'W' }],
  'ability-4': [{ device: 'keyboard', code: 'Digit4', label: '4' }], // 4 = the ultimate (game doc)
  attack: [{ device: 'mouse', button: 0 }],
  // ... one entry per action; a missing entry is a compile error
};
export const PRESETS: Readonly<Record<'wasd' | 'arrows', readonly Binding[]>>;
```

The shapes are the ones in [09](09-hardware-abstraction.md) §3 plus the keyboard `label`
([research B1](../research/persistence-input-diagnostics-research.md#b1-platform-facts): bind on
`KeyboardEvent.code`, display `KeyboardEvent.key`, fall back to `key` when `code` is `''`). The
type contracts sit in `bridge/` rather than `game/input/` ([02](02-code-structure.md) §3
and [09](09-hardware-abstraction.md) §3 agree) because `ui/` may not import `game/` and
`<KeyGlyph action="…"/>` needs the `InputAction` type. For the same reason `chordKey(chord)`, the
one definition of "the same physical input", is `bridge/chordKey.ts`: `game/input/`,
`settingsSlice` and the settings screen all identify chords through it.
Adding an action is one id in `INPUT_ACTIONS` and one `DEFAULT_CHORDS` entry (the record type
demands it); no screen, prompt or system names a key.

| `InputAction`                                        | Default (`TUNE`, [09-controls](../reference/game-design/09-controls.md)) | Effect                                                                                               | Status                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `move-up/down/left/right`                            | W S A D (`wasd`); arrows (`arrows`)                                      | `intent.move` axis, normalised                                                                       | **MVP**                                   |
| `attack`; `ability-1..3`, `ability-4`                | mouse 0; 1 2 3, 4 (ultimate)                                             | `intent.attack` edge with the aim; `intent.cast` slot (ids equal the `AbilitySlot` literals, 05 §15) | **MVP**                                   |
| `gadget-1`, `gadget-2`                               | Z, C                                                                     | `intent.cast` gadget slots → `cast-ability { slot: 'gadget-1' \| 'gadget-2' }` (DISC-61)             | **MVP** (artifacts **MVP-if-time**)       |
| `sprint`, `interact`                                 | `Recommendation:` Shift, E                                               | `intent.isSprinting`; pick-up/drop, enter a turret                                                   | **MVP** (pick-up **MVP-if-time**)         |
| `turret-toggle-control`, `turret-switch-ammo`        | P, T                                                                     | `intent.turretToggle`, `intent.turretAmmo`                                                           | **MVP-if-time** (manual turrets, 11 §4.5) |
| `camera-zoom-in/out`, `toggle-minimap`, `pause-menu` | `Recommendation:` `Equal`/`Minus`, M, Escape                             | client-only (camera, `settingsSlice.hud`, pause)                                                     | **MVP**                                   |
| `toggle-developer-menu`, `toggle-perf-overlay`       | `Recommendation:` Backquote, F9                                          | client-only, active only when the developer flag is on                                               | **MVP**                                   |
| gamepad chords, first-person view switch             | —                                                                        | `GamepadDevice` + glyph tables; `Camera` mode                                                        | **post-MVP** (D12)                        |

### 6.2 `InputMapper`

```ts
// Sketch: apps/client/src/game/input/InputMapper.ts
export type ActionState = {
  readonly held: ReadonlySet<InputAction>;
  readonly pressed: ReadonlySet<InputAction>;
  readonly released: ReadonlySet<InputAction>;
}; // pressed/released = edges this frame
export class InputMapper {
  public constructor(
    bindings: readonly Binding[],
    private readonly resolver: BindingResolver,
  ) {}
  public setBindings(bindings: readonly Binding[]): void; // rebuilds the chord index; called on every settings save
  public resolve(snapshot: InputSnapshot): ActionState; // an action is active if ANY chord of ANY device matches
  public toIntent(actions: ActionState, projection: Projection): InputIntent; // pointer → world through Camera.screenToWorld
  public clientActions(actions: ActionState): readonly InputAction[]; // the client-only edges (§6.1), handled by Match
}
```

`Match.tick()` polls the devices, calls `resolve` and `toIntent`, and enqueues one
`{ type: 'intent', actorId: humanLegendId, intent }` command when the intent changed;
`PlayerController.decide` turns it into `move`, `attack-target`, `cast-ability` (gadget slots
included), `pick-up`, `throw` ([11](11-game-ai.md) §4.1). `InputIntent` is a core type (public API,
[02](02-code-structure.md) §6) with no key names in it, so the replay log is device-agnostic and
bots and the human share one `Command` vocabulary. `BindingResolver` keys chords with
`chordKey(chord)` (`'keyboard:KeyW'`, `'mouse:3'`) in a `Map<string, readonly InputAction[]>`;
the same function detects conflicts in the settings screen.

### 6.3 Press-to-bind

`SettingsScreen` lists the actions with their current `<KeyGlyph/>`. Selecting a row (Enter or
click) enters listen mode in the `useBindingCapture` hook: the next React `keydown` (ignoring
`repeat`; `Escape` cancels; `Tab`, `F5`, `F12` and Ctrl/Meta chords excluded) or `pointerdown`
(buttons 0–4, so a mouse side button is `{ device: 'mouse', button: 3 }` with no special case;
`contextmenu` and `auxclick` suppressed) becomes an `InputChord`; Enter saves. A conflict
(`chordKey` already bound) is reported before saving and offers swap or refuse (`Recommendation:`
swap after a confirm); each row has reset-to-default, the screen a global reset and the presets.
**Invariant:** every edit (a rebind, however its conflict is resolved, or a reset of one action
or all) leaves no input bound to two actions; `BindingResolver.conflicts()` is the check, and the
defaults and presets are tested against it.

Settings are not a session phase: the menu's settings route and the in-match pause overlay change
them alike. So `SettingsController` (`game/settings/`), not `SessionController`, is their one
writer. At start it loads the saved settings through `PersistenceController`
([14](14-persistence-and-resources.md) §7), fills in defaults (from `keybindings.ts`) and
publishes the whole settings on the `settings` bus event; each settings intent from the UI
becomes new settings, published the same way and saved. The store follows through
`connectBusToStore`, and `Match` re-reads bindings on the same event
(`InputMapper.setBindings`). A load that fails starts from defaults with a warning; a save that
fails is logged. Bindings are per profile.

### 6.4 Dynamic prompts

`<KeyGlyph action="ability-1" />` reads `selectBindingLabel('ability-1')` and renders a `<kbd>`
with the first chord's label (keyboard `label`, a mouse glyph or, post-MVP, a gamepad glyph from
a table by controller family; Kenney's CC0 Input Prompts are the licensed source, research B2).
Prompt strings are templates with `{action:…}` placeholders (`Press
{action:turret-toggle-control} to assume control`) rendered by `<Prompt template="…" />`, which
inserts a `KeyGlyph` per placeholder. No component contains a key name, so a rebinding re-renders
every prompt with no code change: the requirements doc's acceptance test (§8).

## 7. Styling, accessibility and React rules

- **Styling.** CSS Modules with camelCase class names, one `.module.css` per component (ADR 0002).
  Design tokens are CSS custom properties in `styles/global.css` (`--color-bg`, `--color-text`,
  `--font-body` today; `TeamPalette` tokens `--team-light-*`, `--team-dark-*`, `--team-neutral-*`
  and spacing and z-index scales are `Recommendation:`s). No colour literal outside `global.css`;
  no inline `style` except runtime-computed values (bar widths, cooldown sweeps). HUD elements
  sit `position: absolute` over the canvas host with `pointer-events: none` unless interactive.
- **Accessibility minimums** (ES-11 and plan sprint 5.5, `Recommendation:` beyond the sources'
  remappable controls): every screen operable by keyboard alone with a visible focus ring; every
  interactive element has an accessible name; `prefers-reduced-motion` disables shake and flashes;
  HUD text contrast ≥ 4.5:1 and bars ≥ 3:1 from the tokens; team identity never signalled by
  colour alone (shape or outline too, on HUD and minimap glyphs); nothing flashes faster than
  3 Hz; the match pauses from `pause-menu`. Rebinding itself is "one of the best value
  accessibility features" ([research B2](../research/persistence-input-diagnostics-research.md#b2-rebinding-ux-and-data-representation)).
- **React rules** (`apps/client/AGENTS.md`): function components only; logic in co-located
  `useXxx.ts` hooks; one store, slices via `createSlice` registered in `combineSlices(...)`, never
  a second `configureStore`; typed hooks instead of the plain `react-redux` ones; one component
  per file plus its `.module.css` and `.test.tsx`; no `dangerouslySetInnerHTML` (ES-08); labels in
  one strings file; game names from content; `ui/` never imports `game/`, `data/` or core (rule
  5; the planned lint block is in [02](02-code-structure.md) §11).

## 8. Tests

- **Server-render tests in Node** (`react-dom/server`, no DOM): each screen and HUD element
  renders against a store seeded with fixture slices, at the states that matter (`BootScreen` at
  0 %, 50 %, error, "storage not persisted"); a walk over every interactive element asserts an
  accessible name.
- **Slices and selectors**: reducers are pure functions of bus payloads; `connectBusToStore` is
  tested with a fake bus (30 ticks of `match-clock` → 5 dispatches; `selectMatchClock` → `mm:ss`).
- **`InputMapper`**: any chord of any device activates an action; edges fire once; `toIntent`
  normalises diagonals; `chordKey` collisions surface as conflicts; every action has a default
  and no two defaults collide within a preset.
- **The requirements doc's scenario** (W → Up Arrow), the plan's acceptance test:

```ts
// Sketch: apps/client/src/ui/screens/SettingsScreen.rebind.test.tsx
it('rebinds move-up from W to Up Arrow and every prompt follows', () => {
  const store = makeTestStore({ settings: { bindings: PRESETS.wasd } });
  const mapper = new InputMapper(PRESETS.wasd, new BindingResolver());
  expect(render(<Prompt template="Move with {action:move-up}" />, store)).toContain('W');

  const next = rebind(PRESETS.wasd, 'move-up', { device: 'keyboard', code: 'ArrowUp', label: '↑' }); // what Enter, ArrowUp, Enter produces
  store.dispatch(settingsSlice.actions.bindingsChanged(next));
  mapper.setBindings(next);

  expect(render(<Prompt template="Move with {action:move-up}" />, store)).toContain('↑');
  expect(mapper.toIntent(mapper.resolve(snapshotWith({ keys: ['ArrowUp'] })), projection).move).toEqual({ x: 0, y: -1 });
  expect(mapper.resolve(snapshotWith({ keys: ['KeyW'] })).held.size).toBe(0);
});
```

- The Z → mouse side button scenario is the same test with `{ device: 'mouse', button: 3 }` on
  `gadget-1`; a template walk over `ui/strings.ts` asserts no `{action:…}` is left unrendered and
  that a grep for key names in `ui/` hits nothing.

## 9. Recipe: a screen, a HUD element, an action

| I am adding…                   | Files                                                                                                  | Plus                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| A screen                       | `ui/screens/<Name>Screen.tsx` + `.module.css` + `.test.tsx`; a `MenuRoute` literal or a `SessionPhase` | one line in `App.tsx`; selectors it needs; a `SessionState` class if it is a phase                           |
| A HUD element                  | `ui/hud/<Name>.tsx` + `.module.css` + `.test.tsx`                                                      | a selector; a slice field if new data; a `BridgeEventMap` entry and a `MatchBridge` publish if new game data |
| Data React needs from the game | `bridge/events.ts` entry, `slices/<name>Slice.ts` field, `selectors/select<Fact>.ts`                   | publish (throttled) from `MatchBridge`                                                                       |
| A UI action toward the game    | a `UiIntent` member                                                                                    | a handler in `SessionController` or `Match`; a `Command` member if it changes state                          |
| A player action                | one id in `INPUT_ACTIONS`, one `DEFAULT_CHORDS` entry                                                  | an `InputIntent` field and its `PlayerController` case, or a `clientActions` case; a `<KeyGlyph/>` use       |
| A developer-menu button        | a `dev-*` `Command` member and `applyCommand` case, or a `DevToggle` member                            | one button in `DeveloperMenu` and one line in the spy test                                                   |

Nothing else changes: the OCP litmus test holds because the registries (`App.tsx`, `events.ts`,
`combineSlices`, `INPUT_ACTIONS`) are the only lists.

## 10. Implementation status

Built (Sprint 1, sessions D and F): the bridge (`bridge/`), the session shell and menu screens,
and the keybinding and settings stack of §6: `keybindings.ts`, `BindingResolver`, `InputMapper`,
`KeyboardDevice` and `MouseDevice`, `SettingsController`, `settingsSlice`, `KeyGlyph`, `Prompt`,
`SettingsScreen` and `PauseOverlay`. Interim gaps:

- The live message list is `bridge/events.ts`; the §5 sketch predates the Sprint 1 contract
  (`docs/agents/prompts/2026-10-03-ultracode-sessions.md` §2.3). Settings travel as
  `update-binding { action, chord, onConflict: 'swap' | 'replace' }`, `reset-bindings { action }`
  and `update-settings { patch }`; the conflict dialog offers swap or replace, and Cancel refuses.
- `InputChord` is the contract's flat `{ device, code, label }` (a mouse chord's `code` is the
  button number) rather than §6.1's per-device union; modifiers and gamepad axes come with
  `GamepadDevice` (post-MVP).
- No presets on the settings screen yet (`PRESETS` exists in `keybindings.ts`) and no
  `clientActions`: `Match` reads client-only edges from `ActionState.pressed`.
- The developer-menu default is F1 (Sprint 1 brief), not Backquote.
- Boot does not wait for the settings: the store has no bindings until the first `settings`
  event; with the memory adapter that is immediate, with IndexedDB (S2) it needs a boot-time wait
  or the `degraded` path of [14](14-persistence-and-resources.md) §10.

## Related

- [08-game-engine.md](08-game-engine.md) and [09-hardware-abstraction.md](09-hardware-abstraction.md): `Match`, `GameCanvas`, devices, `InputSnapshot`, the mapping pipeline.
- [11-game-ai.md](11-game-ai.md) and [12-game-story-and-match-director.md](12-game-story-and-match-director.md): `PlayerController`, the `intent` command, sim mode, `MatchBridge`, announcements.
- [14-persistence-and-resources.md](14-persistence-and-resources.md) and [15-diagnostics-and-runtime-testing.md](15-diagnostics-and-runtime-testing.md): settings DTOs, loading progress, what the overlays expose.
- [../reference/game-design/09-controls.md](../reference/game-design/09-controls.md), [11-mvp-scope.md](../reference/game-design/11-mvp-scope.md) and [../reference/suggestions/mechanics-ideas.md](../reference/suggestions/mechanics-ideas.md): the source rules, the boot-menu structure, the developer menu list.
- [../plan/phase-5-meta-ui-and-persistence.md](../plan/phase-5-meta-ui-and-persistence.md): the sprints that build this.
- Research: [persistence B1, B2, C2](../research/persistence-input-diagnostics-research.md#b1-platform-facts).
