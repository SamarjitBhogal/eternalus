# AGENTS.md: `@eternalus/client`

Package-specific rules. The root `AGENTS.md` still applies.

## Boundaries

- Import core only as `@eternalus/core`.
- `ui/` (React) never imports `game/` or core. It reads data with store selectors from `bridge/`.
- `game/` never imports `ui/`. It publishes to the event bus in `bridge/`.
- `bridge/` imports neither `game/` nor `ui/`.
- Only `game/engine/render/Canvas2dRenderer.ts` may call `getContext` or use
  `CanvasRenderingContext2D`. Views type against the `Renderer` port (`render/Renderer.ts`).
- `game/views/` uses `import type` only from core, and draws through `Renderer` methods.
- `game/engine/` is generic: it never imports views, input, `Match`, or bridge.

## Folders

**Today**: the source tree, not this file, shows what exists;
`docs/architecture/06-map-and-minimap.md` §10 lists the map slice's interim pieces.

**Planned** layout (create folders as code is added):

| Folder                | Holds                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| `game/engine/`        | `GameLoop` (fixed 30 TPS + interpolation), `Renderer`, `Camera`, `AssetLoader` |
| `game/views/`         | Drawing code. `SceneView.draw` is the single place that defines draw order     |
| `game/input/`         | `keybindings.ts` (the only place keys are bound), input → `Command`            |
| `game/Match.ts`       | Wires simulation, loop, renderer, input, views and bridge together             |
| `game/GameCanvas.tsx` | The React component that owns the canvas and the `Match` lifetime              |
| `ui/screens/`         | Full-screen layouts                                                            |
| `ui/hud/`             | In-game overlay elements                                                       |
| `ui/components/`      | Reusable presentational components                                             |
| `bridge/`             | `store` (Redux), event bus and event types                                     |
| `styles/`             | Global CSS variables and reset only                                            |
| `assets/`             | Asset manifest (licensed or team-made assets only)                             |

## Adding code

- React component: create `<Name>.tsx`, a co-located `<Name>.module.css`, and a test.
- Function components only. Put logic in custom hooks (`useXxx.ts`) next to the component.
- Styles in the co-located `.module.css` with camelCase class names. No inline `style` except
  for values computed at runtime.
- New game → UI data: add the event to `bridge/events.ts`, publish it (throttled) from
  `Match.ts`, copy it into the store in `bridge/store.ts`, read it with a selector.
- Redux: there is exactly **one** store, `bridge/store.ts` (Redux Toolkit). Add state as a slice
  (`createSlice`) in `bridge/`, registered in the store's `combineSlices(...)`. Never call
  `configureStore` anywhere else. With the first slice, add `RootState`/`AppDispatch` types and
  typed hooks (`useAppSelector`, `useAppDispatch` via `.withTypes`) and use them instead of the
  plain `react-redux` hooks.
- Engine objects expose `destroy()` and are destroyed by their owner.

## Tests

- Each test sits next to its source file (`Foo.tsx` + `Foo.test.tsx`). Tests run in Node (no
  DOM): render components with `react-dom/server` (see `GameCanvas.test.tsx`), and drive the
  planned game loop with a fake frame scheduler.
- Coverage thresholds live in `vitest.config.ts` and only go up.
