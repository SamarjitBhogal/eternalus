# Architecture

This document describes how the code is layered and why. A few rules in §7 are enforced by
TypeScript or ESLint; the rest are checked in review.

> **Status: planned design.** Almost none of this exists yet. Today the client only mounts
> `<Provider store={store}><GameCanvas /></Provider>` (an empty canvas and a Redux store with no
> slices), and `@eternalus/core` has no code. Names such as `Simulation`, `GameLoop`, `Match`
> and `Renderer` describe what we will build; follow this design when adding code.

## 1. Packages and layers

```
┌───────────────────────────── apps/client (@eternalus/client) ─────────────────────────────┐
│                                                                                            │
│   ui/  (React: screens, hud, components)          game/  (Canvas engine side)              │
│        │ reads store selectors                        ├─ engine/   GameLoop, Renderer,     │
│        ▼                                               │            Camera, AssetLoader     │
│   bridge/  eventBus + Redux store  ◄───────────────────┤  views/    draw snapshots          │
│        ▲ (the ONLY link between React and the game)    ├─ input/    keys → Commands         │
│        │                                               ├─ Match.ts  wires it all together   │
│   main.tsx composes the screens and <GameCanvas/> (today: just <GameCanvas/>)              │
│                                                        │                                   │
└────────────────────────────────────────────────────────┼───────────────────────────────────┘
                                                         │ import from "@eternalus/core" only
┌──────────────────────── packages/core (@eternalus/core) ▼ ─────────────────────────────────┐
│  Simulation.ts ── systems/ ── ai/ ── commands/ ── state/ ── entities/ ── components/        │
│                                                     content/ (data)   utils/ (math, RNG)   │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **`@eternalus/core`** is the game simulation: pure, deterministic TypeScript with no DOM,
  React, Canvas or Node APIs. Its tsconfig has no DOM or Node type libraries, so browser APIs
  do not even typecheck there. Its public API is `packages/core/src/index.ts`.
- **`@eternalus/client`** is the Vite + React app. `game/` runs the engine around the
  simulation, `ui/` is React, and `bridge/` connects the two.
- Core is consumed as TypeScript source (its `package.json` `exports` points at `src/index.ts`)
  and compiled by Vite. `tsc -b` still typechecks it first through project references.

## 2. The fixed-timestep loop

The simulation advances only in whole ticks of `TICK_MS` (1000/30 ms). Rendering happens on
every animation frame and interpolates between the last two ticks.

```
requestAnimationFrame(t)
  accumulator += min(t - lastT, 5 * TICK_MS)   // clamp: a background tab can't freeze the game
  while accumulator >= TICK_MS:
      Match.tick()        // input → Command, Simulation.step(), keep previous + current snapshot
      accumulator -= TICK_MS
  Match.render(alpha = accumulator / TICK_MS)  // views lerp between previous and current
```

`GameLoop` (in `game/engine/`) takes a `FrameScheduler`, so tests drive it with fake frame
times instead of the real `requestAnimationFrame`.

## 3. Commands

Nothing outside core mutates game state. Player input and bots both produce **`Command`**
objects (a discriminated union in `core/commands/Command.ts`):

1. `KeyboardInput` tracks held keys (bindings live in `game/input/keybindings.ts`).
2. `PlayerCommandSource.poll()` turns a change in intent into a `move` or `stop` command.
3. `Match` calls `simulation.enqueueCommand(command)`.
4. On the next `Simulation.step()`, queued commands are applied first, then systems run, then
   the tick counter advances, then bots decide their commands for the _next_ tick.

Because every change enters through commands and randomness comes from one seeded RNG, the same
seed and the same command stream always produce the same match. That makes replays, bug
reproduction and deterministic tests possible.

## 4. Events

- **Inside core:** `GameEvents` is a typed, synchronous event channel owned by `GameState`.
  Systems emit events (`entity-moved`, `tick-completed`, ...) and other systems subscribe.
  Systems never import or call each other.
- **Core → client:** `Simulation.on(type, handler)` exposes the same events to the client.
- **Client:** `bridge/eventBus` is a separate `TypedEventBus<BridgeEventMap>` carrying
  display-ready data to React (and, later, UI intents back to the game).

## 5. The React ↔ game bridge

```
Simulation --tick-completed--> Match --(every 6th tick)--> eventBus.emit('match-clock')
     --> bridge listener --> store.dispatch(action) --> useSelector(selector) --> <MatchClock/>
```

- React never reads game state directly; it reads a **throttled** copy from the Redux store.
  `Match` decides how often to publish (5 times per second for the clock), so React re-renders
  at UI rates, not at 30 or 60 Hz.
- The game never imports React components. `main.tsx` composes the two sides (planned:
  `<GameScreen viewport={<GameCanvas />} />`; today it renders `<GameCanvas />` inside the Redux
  `<Provider>`).
- The event bus and the store are the only allowed singletons.

## 6. Content vs behaviour

Tuning numbers and display names live in `core/content/` as plain data keyed by stable
kebab-case IDs (`'hero'`, `'wanderer-bot'`). Behaviour code (systems, entity factories, bots)
looks data up by ID. Designers can tune without touching logic, IDs survive refactors, and
content can later move to JSON or a map editor.

## 7. Rules

| #   | Rule                                                                                           | Why                                                                                      | Enforced by                                                           |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | `core` imports nothing from React, the DOM, Canvas or Node                                     | The simulation must run anywhere (tests, workers, future replays) and stay deterministic | tsconfig libs, ESLint `no-restricted-imports`                         |
| 2   | Dependencies point `client → core` only                                                        | Keeps core independent and testable in isolation                                         | ESLint `no-restricted-imports`                                        |
| 3   | Import core only as `@eternalus/core`                                                          | `index.ts` is the contract; internals can change freely                                  | `exports` map                                                         |
| 4   | No import cycles                                                                               | Cycles hide bad layering and cause init-order bugs                                       | Review only                                                           |
| 5   | `ui/` imports only `bridge/`, `ui/`, `styles/`                                                 | React must not reach into the engine; one data path (store) keeps UI predictable         | Review only                                                           |
| 6   | `game/views/` never imports `core/systems` or mutates state                                    | Views are pure drawing; logic in views would desync rendering from the simulation        | Review only                                                           |
| 7   | Only `game/engine/Renderer` uses the Canvas 2D context                                         | One place to optimise, batch, or swap rendering; views stay testable                     | Review only                                                           |
| 8   | `core` never uses `Math.random`, `Date`, `performance.now`, `setTimeout`, `setInterval`        | Determinism: same seed + commands = same match                                           | ESLint (`Math.random`), tsconfig (no DOM/Node timers); rest in review |
| 9   | The simulation advances only in fixed ticks; input and bots produce Commands for the next tick | Frame-rate independence and determinism                                                  | Design (`Simulation.step`, `GameLoop`) + review                       |
| 10  | Game state is the single source of truth; React shows throttled snapshots                      | Avoids two sources of truth and 60 Hz React renders                                      | Design (`bridge/`) + review                                           |
| 11  | Tuning numbers and display names live in `content/`, looked up by ID                           | Tuning without code changes; stable IDs                                                  | Review only                                                           |
| 12  | Systems communicate through typed `GameEvents`, not direct calls                               | Systems stay independent, reorderable and testable                                       | Review only                                                           |

Other layering (no cycles, `bridge/` importing neither `game/` nor `ui/`, `game/` never
importing `ui/`, `game/engine/` staying generic, systems not importing each other) is checked
in review.

## 8. Adding a new folder

Domain folders (e.g. `core/src/abilities/`) are added by the team when needed:

1. Decide which layer it belongs to and what it may import.
2. If it has an import boundary worth protecting, add an ESLint `no-restricted-imports` rule.
3. Document it in the relevant package `AGENTS.md` folder table and here.
