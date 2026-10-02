---
title: Controls
description: The default MVP key bindings, the requirement that no binding is hard-coded and every one is rebindable in settings, dynamic prompts that reflect the current bindings, and the post-MVP controller and first-person modes; read it before working on input mapping, the settings screen or any on-screen prompt.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-09-30
tags: [reference, game-design, controls, input, keybindings, settings]
paths: ['apps/client/src/game/input/**', 'apps/client/src/ui/screens/SettingsScreen*']
related:
  - 'docs/architecture/13-game-interface.md'
  - 'docs/architecture/09-hardware-abstraction.md'
  - 'docs/research/persistence-input-diagnostics-research.md'
---

# Controls

**Purpose.** Read this when you touch input: the default bindings, the `InputAction` list, the
settings screen that rebinds them, or any text on screen that names a key. The single hard rule
comes from the requirements doc: **no hard-coded controls; configurable controls via settings**,
and every prompt in the game reflects whatever the player chose "with no work needed from
anyone".

## Default bindings (MVP)

Top-down, single-character control. Defaults from both sources (all **MVP**):

| Action                          | Default                        | `InputAction` (proposed id)                       | Source                                |
| ------------------------------- | ------------------------------ | ------------------------------------------------- | ------------------------------------- |
| Move up / left / down / right   | W / A / S / D                  | `move-up`, `move-left`, `move-down`, `move-right` | requirements doc, game doc            |
| Attack                          | Mouse click                    | `attack`                                          | game doc ("Click to attack")          |
| Ability 1, 2, 3                 | 1, 2, 3                        | `ability-1`, `ability-2`, `ability-3`             | requirements doc, game doc            |
| Ultimate (ability 4)            | 4                              | `ultimate`                                        | requirements doc ("4 being ultimate") |
| Gadget 1 / gadget 2 (artifacts) | Z / C                          | `gadget-1`, `gadget-2`                            | requirements doc, game doc            |
| Sprint (Sentinel Wrecking Run)  | not specified                  | `sprint`                                          | game doc ("While holding sprint")     |
| Pick up / throw                 | not specified                  | `interact`                                        | game doc (default interactives)       |
| Turret: assume / exit control   | P                              | `turret-toggle`                                   | game doc (Turrets)                    |
| Turret: switch ammo type        | T                              | `turret-ammo`                                     | game doc (Turrets)                    |
| Fury dash direction             | WASD (or joystick) during Fury | reuses move actions                               | game doc (Fury)                       |

Defaults are data in `apps/client/src/game/input/keybindings.ts`; the table is the initial
content of that file, not a spec for code paths. Unspecified defaults (sprint, interact, Fury's
"[button]") are naming/binding to-dos (`12-open-questions.md`); `Recommendation:` Shift for
sprint, E or F for interact, and Space for the Fury dash, chosen to avoid the number row and
Z/C.

The game doc's pitch calls the MVP "point-and-click" while both sources fix WASD movement; read
it as WASD movement with mouse-click attacks and targeting.

## Nothing is hard-coded; everything is rebindable

From the requirements doc, quoted because it is the acceptance test:

> User wants to change their key bindings from WASD movement to arrow keys. They press Enter on
> "W", press Up Arrow on their keyboard, then press Enter to save. Done.

> Want to change their first gadget spot from "Z" to a button on the side of their mouse. Simple
> click and change in settings. Done.

> Any prompts that show up throughout game play (e.g., tutorials) change dynamically to reflect
> whatever keybindings they chose. No work needed from anyone.

Rules that follow (all **MVP**):

- Every action is an `InputAction` id; every binding is a data record `{ action, chords }` where
  a chord is a keyboard code, a mouse button (including side buttons 3 and 4) or, later, a gamepad
  button or axis. Bindings are persisted in the settings store as a versioned DTO
  (`../../research/persistence-input-diagnostics-research.md#b2-rebinding-ux-and-data-representation`).
- **Press-to-bind**: the settings screen lists actions; selecting one (Enter or click) enters
  listen mode; the next key press, mouse button or gamepad edge becomes the chord; Enter saves,
  Escape cancels. Conflicts are detected (refuse or swap) and every action has "reset to
  default", plus a global reset.
- The game never reads raw keys. Devices produce an input snapshot; the `InputMapper` turns it
  into `InputAction`s via the bindings; the player controller turns actions into `Command`s
  for the next tick. Bots produce the same `Command`s, which is why the sim mode
  (`11-mvp-scope.md`) can swap the human out.
- Bindings are per profile and saved through the `PersistenceController` (D3).

## Dynamic prompts

Any on-screen text that names a key is rendered from the current binding: HUD ability slots,
turret prompts ("press P to assume control"), tutorials, the loadout screen. In React that is
`<KeyGlyph action="turret-toggle" />`, which looks up the current chord's label (the key label
observed at bind time, or a gamepad glyph from a lookup table by controller family). Prompt
strings are written as templates such as `Press {action:turret-toggle} to assume control`, never
with a literal key. Status: **MVP**.

## Post-MVP

- **Controller support** ("added console controller key configs") — **post-MVP** (both
  sources). The binding data already allows gamepad chords, and `GamepadDevice` is an engine
  adapter, so this is an adapter plus glyph tables, not a redesign.
- **First-person view with a third-person option in settings**, view switching bindable to
  hotkeys — **post-MVP** (requirements doc long-term goal; game doc "first-person full game").
  The `Camera` and `Renderer` ports in the engine are the seam.
- Joystick guidance for Fury's dash — comes with controller support.

## Engineering notes

- Layering: `KeyboardDevice`, `MouseDevice`, `GamepadDevice` are L1 adapters in
  `apps/client/src/game/engine/input/`; `keybindings.ts` and `InputMapper` are L3 in
  `apps/client/src/game/input/`; the settings screen is L4 and edits bindings through the bridge
  store. Core never sees a key code.
- Single place of change: a new action is one `InputAction` id, one default binding, one
  `Command` mapping and (if it is shown) one glyph usage. Nothing else changes; in particular no
  system, screen or prompt references a key.
- Invariant/test: every `InputAction` has a default binding; no two defaults conflict; every
  prompt template resolves (no `{action:…}` left unrendered).

## Related

- [Architecture: game interface](../../architecture/13-game-interface.md)
- [Architecture: hardware abstraction](../../architecture/09-hardware-abstraction.md)
- [Research: input and keybindings](../../research/persistence-input-diagnostics-research.md#b-input-and-keybindings)
- [Structures and defences (turrets)](03-structures-and-defenses.md)
- [Weapons and artifacts (gadgets)](07-weapons-and-artifacts.md)
- [MVP scope](11-mvp-scope.md)
- [Open questions](12-open-questions.md)
- [Verbatim source: Movement and Controls](../source/game-project-eternalus-v2.md)
- [Verbatim requirements doc](../../requirements/source/requirements-of-architecture.md)
