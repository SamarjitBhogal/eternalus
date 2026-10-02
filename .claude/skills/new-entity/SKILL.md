---
name: new-entity
description: Add a new entity kind (Legend class, mob type, structure, obstacle, boss, zone) to packages/core following the entity architecture - files, content definition, registry line, tests, docs. Use when asked to add or scaffold any game entity.
---

# New entity

Follow `docs/architecture/04-entity-architecture.md` and the matching recipe in
`docs/architecture/17-extension-recipes.md`. Never invent a new family: pick one of `Unit`
(`Legend`, `Mob`, `Boss`), `Structure`, `Zone`, `Obstacle`, `Projectile`. Depth below `Entity`
is at most 3.

## Procedure

1. Read the nearest `AGENTS.md`, `docs/architecture/04-entity-architecture.md`, and the reference
   doc for the entity (`docs/reference/game-design/02-entities-and-units.md` or
   `03-structures-and-defenses.md`). Confirm the entity is **MVP** in
   `docs/requirements/06-mvp-requirements.md`; if it is post-MVP, stop and ask.
2. Content first: add `packages/core/src/content/<family>/<kebab-id>.ts` exporting an immutable
   definition (`satisfies <Family>Definition`). Display names, sizes, stats, `minimapGlyph` and
   every tuning number live here, marked `// TUNE:` if provisional. Never a magic number in code.
3. Class only if behaviour is unique: `packages/core/src/entities/<family>/<Name>.ts` containing
   only that class (companion `<Name>.types.ts` / `<Name>.constants.ts` when needed). Prefer a
   component or strategy over a subclass when the difference is data or a single behaviour.
4. Register: one line in `EntityRegistry` (kind -> factory). Nothing else in the codebase
   changes to make the entity exist. If you had to touch a second registry or a switch, stop:
   the design is wrong, report it.
5. Views: only if it draws differently, add `apps/client/src/game/views/<Name>View.ts` (views
   are plain classes, not React) and one line in `ViewRegistry`; otherwise the default
   `EntityView` renders the definition's sprite and the minimap uses `minimapGlyph`.
6. Tests next to the files: definition validation test, factory creates it with the right
   components, one behaviour test per unique behaviour, and (for structures/obstacles) the
   "appears on the minimap with no code change" test from `06-map-and-minimap.md`.
7. Docs: update the folder table in `packages/core/AGENTS.md` only if a new folder appeared;
   update `docs/reference/game-design/*` if the design changed; append an entry to
   `docs/plan/PROGRESS.md`.
8. Run `npm run check` and report the result verbatim. Do not commit unless asked.

## Done when

- `npm run check` passes; the registry line is the only cross-cutting change; every tuning
  number is in `content/`; tests exist for the behaviour; PROGRESS.md has an entry.
