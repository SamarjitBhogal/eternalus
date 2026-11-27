import { describe, expect, it } from 'vitest';

import { LEGEND_CLASSES } from '../legends/legendCatalogue';
import { STATUS_EFFECTS } from '../status-effects/statusEffectCatalogue';
import { ABILITIES } from './abilityCatalogue';
import type { AuthoredAbility, AuthoredEffectSpec } from './AbilityDefinition.types';
import { loadAbilities } from './loadAbilities';

/** Cost and cooldown of the abilities with no effects yet: balancing.md "Aether costs and cooldowns" (0 / 0 for an ultimate: the meter gates it; 0 / 0 for a passive: it is never cast). */
const UNBUILT = {
  veil: { cooldownSeconds: 20, aetherCost: 40, slot: 'ability' },
  hamstring: { cooldownSeconds: 9, aetherCost: 25, slot: 'ability' },
  'rip-and-tear': { cooldownSeconds: 10, aetherCost: 30, slot: 'ability' },
  'shield-wall': { cooldownSeconds: 18, aetherCost: 40, slot: 'ability' },
  berserk: { cooldownSeconds: 0, aetherCost: 0, slot: 'ultimate' },
  'wrecking-run': { cooldownSeconds: 0, aetherCost: 0, slot: 'passive' },
  sanctuary: { cooldownSeconds: 22, aetherCost: 60, slot: 'ability' },
  imbue: { cooldownSeconds: 20, aetherCost: 45, slot: 'ability' },
  'death-ray': { cooldownSeconds: 0, aetherCost: 0, slot: 'ultimate' },
} as const;

/** Every effect kind the framework builds (05 §3): PR 1's, then Fury's `buff`; a new kind is added here with its effect class. */
const BUILT_EFFECT_KINDS = ['damage', 'debuff', 'dash', 'knockback', 'buff'];

describe('ABILITIES', () => {
  it('lists the twelve kit abilities in class order, abilities before the ultimate, then the passives, then what the ultimate grants', () => {
    expect(ABILITIES.ids).toEqual([
      'blade-runner',
      'veil',
      'hamstring',
      'fury',
      'fury-dash',
      'slam',
      'rip-and-tear',
      'shield-wall',
      'berserk',
      'wrecking-run',
      'shockwave',
      'sanctuary',
      'imbue',
      'death-ray',
      'erudition',
      'necromancy',
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

  it('prices the abilities not built yet from balancing.md and gives them no effects; Wrecking Run has none (its movement is the class momentum)', () => {
    const unbuilt = ABILITIES.all().filter((ability) => ability.effects.length === 0);

    expect(unbuilt.map((ability) => ability.id)).toEqual(Object.keys(UNBUILT));
    for (const [id, expected] of Object.entries(UNBUILT)) {
      expect(ABILITIES.get(id)).toMatchObject({ ...expected, targeting: null });
    }
  });

  it('gives every ability a description and builds only the effect kinds the framework implements', () => {
    const kinds = ABILITIES.all().flatMap((ability) =>
      ability.effects.map((effect) => effect.kind),
    );

    expect(ABILITIES.all().filter((ability) => ability.description.length === 0)).toEqual([]);
    expect(kinds.filter((kind) => !BUILT_EFFECT_KINDS.includes(kind))).toEqual([]);
  });

  it('names a real debuff status in every debuff step, dash children included', () => {
    const debuffIds = (ability: AuthoredAbility): string[] =>
      ability.effects
        .flatMap((effect): readonly AuthoredEffectSpec[] =>
          effect.kind === 'dash' ? [...effect.onPath, ...effect.onEnd] : [effect],
        )
        .flatMap((effect) => (effect.kind === 'debuff' ? [effect.statusId] : []));

    expect(ABILITIES.all().flatMap(debuffIds)).toEqual(['stun', 'concussion']);
    for (const id of ABILITIES.all().flatMap(debuffIds)) {
      expect(STATUS_EFFECTS.has(id)).toBe(true);
    }
  });

  it("puts every kit ability in its class's pool, every passive in its passive options, and every entry of both in the catalogue", () => {
    const idsOf = (classId: string, isPassive: boolean): string[] =>
      ABILITIES.all()
        .filter(
          (ability) =>
            ability.classId === classId &&
            ability.slot !== 'granted' &&
            (ability.slot === 'passive') === isPassive,
        )
        .map((ability) => ability.id);

    for (const legend of LEGEND_CLASSES.all()) {
      expect(legend.abilityPool).toEqual(idsOf(legend.id, false));
      expect(legend.passiveOptions).toEqual(idsOf(legend.id, true));
    }
  });

  it('gives the Magus passives the numbers the owner chose (DEC-330) as permanent statuses put on at spawn', () => {
    for (const id of ['erudition', 'necromancy']) {
      expect(ABILITIES.get(id)).toMatchObject({
        classId: 'magus',
        slot: 'passive',
        aetherCost: 0,
        cooldownSeconds: 0,
        targeting: { kind: 'self' },
        effects: [{ kind: 'buff', statusId: id }],
      });
      expect(STATUS_EFFECTS.get(id)).toMatchObject({ durationSeconds: null, polarity: 'buff' });
    }
    expect(STATUS_EFFECTS.get('erudition').modifiers).toEqual([
      { stat: 'abilityDuration', op: 'mul', value: 1.2 },
      { stat: 'abilityPotency', op: 'mul', value: 1.1 },
      { stat: 'ultimateGain', op: 'mul', value: 1.25 },
    ]);
    expect(STATUS_EFFECTS.get('necromancy').modifiers).toEqual([
      { stat: 'damageDealt', op: 'mul', value: 1.3, byLostHealth: { fullAt: 0.15 } },
      { stat: 'damageTaken', op: 'mul', value: 0.85, byLostHealth: { fullAt: 0.15 } },
    ]);
  });

  it('leaves a granted ability out of every pool: only a status grants it (DEC-270)', () => {
    const granted = ABILITIES.all().filter((ability) => ability.slot === 'granted');

    expect(granted.map((ability) => ability.id)).toEqual(['fury-dash']);
    expect(STATUS_EFFECTS.get('fury').grants).toBe('fury-dash');
    expect(LEGEND_CLASSES.all().flatMap((legend) => legend.abilityPool)).not.toContain('fury-dash');
  });
});
