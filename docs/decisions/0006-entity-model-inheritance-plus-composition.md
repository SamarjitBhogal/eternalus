---
title: '0006. Entity model: shallow inheritance plus composition'
description: Reconciles the requirements doc's explicit Entity class tree with CONTRIBUTING's composition-first rule and three-level depth limit, and records team-as-property and data-driven sub-classes; read this before adding any entity family, component or strategy.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-29
tags: [adr, entities, oop, composition]
related:
  ['docs/architecture/04-entity-architecture.md', 'docs/reference/suggestions/discrepancies.md']
---

# 0006. Entity model: shallow inheritance plus composition

- Status: accepted (product owner decision 2026-09-30 for D4/D11; D10 confirmed 2026-10-03, DEC-03);
  amended by 0018: sub-classes are MVP; amended by 0021: the entity family `sovereign`
- Date: 2026-09-30

## Context

The requirements document prescribes an inheritance tree (`Entity` → user character →
Warrior/Sentinel/Magus/Arial; `Entity` → mob → heavy/medium/light; `Entity` → neutral entity →
camps and bosses → mini/greater boss) and wants "new idea? add a new class". `CONTRIBUTING.md`
§3 limits inheritance to three levels below the root and prefers composition for cross-cutting
behaviour. The game doc adds sub-classes (Assassin/Knight/Paladin, Colossus, Necromancer/Druid/
Mage, Hover/Strafe), which would be a fourth level, and mechanics where a unit changes team
(Necromancer revives fallen units "to fight for their team"; minions "ascend").

## Decision

1. **Taxonomy by inheritance, behaviour by composition.** `Entity` → `Unit` → `Legend`/`Mob`/
   `Boss`; `Entity` → `Structure`; `Entity` → `Zone`; `Entity` → `Obstacle`; `Entity` →
   `Projectile`. Concrete Legends (`Warrior`, `Sentinel`, `Magus`) and mobs (`LightMob`,
   `MediumMob`, `HeavyMob`) are leaves at depth 3. State lives in components (`Health`,
   `Movement`, `Combat`, `Team`, …); behaviour that varies by kind is a strategy chosen from
   content; per-tick logic lives in systems; the numbers live in Type Object definitions.
2. **Team is a property (`Team` component), not a class (D10).** The "neutral entity" branch
   becomes `team: 'neutral'` on units, a `Camp` structure that spawns them, and `Boss` units.
   A base class per team would make revives, ascension and captured buildings impossible
   without re-instantiating objects.
3. **Sub-classes are data first (D11).** `LegendSpecDefinition` specialisations consumed by the
   class (stats, ability set, sizes); a real subclass is added only for unique behaviour, and
   the depth limit still applies. Sub-classes are post-MVP.

## Consequences

- "Add a Legend" = one content file + (optional) one class file + one `EntityRegistry` line
  (`docs/architecture/17-extension-recipes.md`). Nothing else changes.
- Renaming is cheap: display names are content; a class rename is a file rename plus imports.
- The `switch (entity.kind)` pattern is forbidden in systems; strategies and registries carry
  the variation.
- If the product owner rejects D10, `Team` stays a component and a marker base class is added
  under `Unit`; the depth budget then forces bosses to be data-driven variants of one class.
