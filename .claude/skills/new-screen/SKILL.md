---
name: new-screen
description: Add a React screen, HUD element or reusable UI component in apps/client/src/ui with a co-located CSS module, store selectors and server-render tests. Use when asked for menus, HUD, settings or any UI.
---

# New screen / HUD element / component

The UI never touches the game directly: it reads throttled snapshots from the Redux store via
selectors and sends intents that become `Command`s through the bridge. Follow
`docs/architecture/13-game-interface.md` and `apps/client/AGENTS.md`.

## Procedure

1. Decide the folder: `ui/screens/` (full-screen layout), `ui/hud/` (in-match overlay),
   `ui/components/` (reusable presentational). Name it `PascalCase.tsx` with a co-located
   `PascalCase.module.css` and `PascalCase.test.tsx`.
2. Data in: if the screen needs new game data, add the event to `bridge/events.ts`, publish it
   (throttled) from `game/Match.ts`, add or extend a slice in `bridge/slices/`, and read it with a
   selector via the typed hooks. `ui/` imports only `bridge/`, `ui/`, `styles/`.
3. Data out: user intents dispatch through the bridge (`eventBus`), never by importing `game/`
   or `@eternalus/core` (types via `import type` are fine).
4. Keys and prompts: any text that names a control uses `<KeyGlyph action="..."/>` so it reflects
   the player's bindings. Never hardcode "press W".
5. Styling: CSS Modules with camelCase class names; design tokens from `styles/global.css`; no
   inline styles except runtime values. Colour is never the only signal (accessibility).
6. Tests: server-render the component in Node (`react-dom/server`, see `GameCanvas.test.tsx`)
   with a store holding the state under test; assert the markup; test selectors/hooks separately.
7. Wire it into `SessionController`/`MainMenuScreen` navigation if it is a screen; add the HUD
   element to `MatchScreen` if it is HUD. One place each.
8. Append to `docs/plan/PROGRESS.md`; run `npm run check`; report verbatim. No commits unless
   asked.

## Done when

- No imports from `game/` or core values in `ui/`; bindings shown via `KeyGlyph`; tests render
  the component; `npm run check` passes.
