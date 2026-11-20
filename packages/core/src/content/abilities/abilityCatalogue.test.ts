import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { STATUS_EFFECTS } from '../status-effects/statusEffectCatalogue';
import { ABILITIES } from './abilityCatalogue';
import type { AuthoredAbility } from './AbilityDefinition.types';
import { loadAbilities } from './loadAbilities';

/** Cost and cooldown of the nine abilities with no effects yet: balancing.md "Aether costs and cooldowns" (0 / 0 for an ultimate: the meter gates it). */
const UNBUILT = {
  veil: { cooldownSeconds: 20, aetherCost: 40, slot: 'ability' },
  hamstring: { cooldownSeconds: 9, aetherCost: 25, slot: 'ability' },
  fury: { cooldownSeconds: 0, aetherCost: 0, slot: 'ultimate' },
  'rip-and-tear': { cooldownSeconds: 10, aetherCost: 30, slot: 'ability' },
  'shield-wall': { cooldownSeconds: 18, aetherCost: 40, slot: 'ability' },
  berserk: { cooldownSeconds: 0, aetherCost: 0, slot: 'ultimate' },
  sanctuary: { cooldownSeconds: 22, aetherCost: 60, slot: 'ability' },
  imbue: { cooldownSeconds: 20, aetherCost: 45, slot: 'ability' },
  'death-ray': { cooldownSeconds: 0, aetherCost: 0, slot: 'ultimate' },
} as const;

/** Every effect kind the framework builds in PR 1 (05 §3); a new kind is added here with its effect class. */
const BUILT_EFFECT_KINDS = ['damage', 'debuff', 'dash', 'knockback'];

describe('ABILITIES', () => {
  it('lists the twelve kit abilities in class order, abilities before the ultimate', () => {
    expect(ABILITIES.ids).toEqual([
      'blade-runner',
      'veil',
      'hamstring',
      'fury',
      'slam',
      'rip-and-tear',
      'shield-wall',
      'berserk',
      'shockwave',
      'sanctuary',
      'imbue',
      'death-ray',
    ]);
  });

  it('loads and validates with the shipped statuses', () => {
    expect(() => loadAbilities(30)).not.toThrow();
  });

  it('gives Blade Runner its dash, path damage, knock-back and end stun (balancing.md:181)', () => {
    expect(ABILITIES.get('blade-runner')).toMatchObject({
      classId: 'warrior',
      slot: 'ability',
      cooldownSeconds: 12,
      aetherCost: 35,
      targeting: { kind: 'directional' },
      effects: [
        {
          kind: 'dash',
          distance: 8,
          durationSeconds: 0.3,
          onPath: [
            { kind: 'damage', amount: 120, damageType: 'physical', shape: { kind: 'path' } },
            { kind: 'knockback', distance: 2, shape: { kind: 'path' } },
          ],
          onEnd: [
            {
              kind: 'debuff',
              statusId: 'stun',
              durationSeconds: 0.5,
              shape: { kind: 'circle', radius: 1.5 },
            },
          ],
        },
      ],
    });
  });

  it('gives Slam its area damage, knock-up and 2.0 structure multiplier (balancing.md:185, :123)', () => {
    expect(ABILITIES.get('slam')).toMatchObject({
      classId: 'sentinel',
      cooldownSeconds: 16,
      aetherCost: 50,
      targeting: { kind: 'self' },
      effects: [
        {
          kind: 'damage',
          amount: 150,
          damageType: 'physical',
          structureMultiplier: 2,
          shape: { kind: 'circle', radius: 4 },
        },
        { kind: 'knockback', distance: 3, knockup: true, shape: { kind: 'circle', radius: 4 } },
      ],
    });
  });

  it('gives Shockwave its magical damage, knock-back and concussion (balancing.md:190)', () => {
    const area = { kind: 'circle', radius: 5 };

    expect(ABILITIES.get('shockwave')).toMatchObject({
      classId: 'magus',
      cooldownSeconds: 14,
      aetherCost: 50,
      effects: [
        { kind: 'damage', amount: 120, damageType: 'magical', shape: area },
        { kind: 'knockback', distance: 2.5, shape: area },
        { kind: 'debuff', statusId: 'concussion', durationSeconds: 3, shape: area },
      ],
    });
  });

  it('sets the structure multipliers the owner chose (DEC-209 (1)): 0.3 / 2.0 / 1.0', () => {
    // Blade Runner's 0.3 and Shockwave's 1.0 are the owner's answer (balancing.md:123); a damage step
    // with no `structureMultiplier` would mean 1, so each of the three states it.
    const structureMultiplierOf = (id: string): unknown => {
      const first = ABILITIES.get(id).effects[0];
      const step = first?.kind === 'dash' ? first.onPath[0] : first;
      return step?.kind === 'damage' ? step.structureMultiplier : undefined;
    };

    expect(['blade-runner', 'slam', 'shockwave'].map(structureMultiplierOf)).toEqual([0.3, 2, 1]);
  });

  it('prices the nine abilities not built yet from balancing.md and gives them no effects', () => {
    const unbuilt = ABILITIES.all().filter((ability) => ability.effects.length === 0);

    expect(unbuilt.map((ability) => ability.id)).toEqual(Object.keys(UNBUILT));
    for (const [id, expected] of Object.entries(UNBUILT)) {
      expect(ABILITIES.get(id)).toMatchObject({ ...expected, targeting: null });
    }
  });

  it('gives every ability a description and builds only the effect kinds PR 1 implements', () => {
    const kinds = ABILITIES.all().flatMap((ability) =>
      ability.effects.map((effect) => effect.kind),
    );

    expect(ABILITIES.all().filter((ability) => ability.description.length === 0)).toEqual([]);
    expect(kinds.filter((kind) => !BUILT_EFFECT_KINDS.includes(kind))).toEqual([]);
  });

  it('names a real debuff status in every debuff step, dash children included', () => {
    const debuffIds = (ability: AuthoredAbility): string[] =>
      ability.effects
        .flatMap((effect) =>
          effect.kind === 'dash' ? [...effect.onPath, ...effect.onEnd] : [effect],
        )
        .flatMap((effect) => (effect.kind === 'debuff' ? [effect.statusId] : []));

    expect(ABILITIES.all().flatMap(debuffIds)).toEqual(['stun', 'concussion']);
    for (const id of ABILITIES.all().flatMap(debuffIds)) {
      expect(STATUS_EFFECTS.has(id)).toBe(true);
    }
  });

  it("puts every ability in its class's pool and every pool entry in the catalogue", () => {
    for (const legend of LEGEND_CLASSES.all()) {
      const ofClass = ABILITIES.all()
        .filter((ability) => ability.classId === legend.id)
        .map((ability) => ability.id);

      expect(legend.abilityPool).toEqual(ofClass);
    }
  });
});
