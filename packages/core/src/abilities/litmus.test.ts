import { describe, expect, it } from 'vitest';

import { ABILITIES } from '../content/abilities/abilityCatalogue';
import type { AuthoredAbilityWith } from '../content/abilities/AbilityDefinition.types';
import { loadAbilities } from '../content/abilities/loadAbilities';
import type { AbilityDisplayStep } from '../content/loadDisplayContent';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { NullLogger } from '../diagnostics/NullLogger';
import { Simulation } from '../Simulation';
import type { AbilityEffect, CastContext } from './AbilityEffect.types';
import { unitsWithWarriorKit } from './__fixtures__/casterState';
import { testAbilityRegistry } from './__fixtures__/fakeAbilities';

/** The throwaway effect kind: damages every enemy in a circle. */
type FakeBoltSpec = {
  readonly kind: 'fake-bolt';
  readonly amount: number;
  readonly shape: { readonly kind: 'circle'; readonly radius: number };
};

/** A new effect class nothing in core knows about. */
class FakeBoltEffect implements AbilityEffect<FakeBoltSpec> {
  public readonly kind = 'fake-bolt';

  public validate(spec: FakeBoltSpec): readonly string[] {
    return spec.amount > 0 ? [] : ['fake-bolt amount must be positive'];
  }

  /** The overlay's rows are typed by the shipped kinds; a test kind draws nothing. */
  public describe(): readonly AbilityDisplayStep[] {
    return [];
  }

  public apply(spec: FakeBoltSpec, cast: CastContext): void {
    for (const targetId of cast.targets(spec.shape, { team: 'enemies' })) {
      cast.damage.apply(cast.state, targetId, spec.amount, {
        attackerId: cast.casterId,
        kind: 'ability',
        definitionId: cast.abilityId,
      });
    }
  }
}

const BOLT: FakeBoltSpec = { kind: 'fake-bolt', amount: 25, shape: { kind: 'circle', radius: 4 } };

/** A new ability, as content is authored (`content/abilities/<camelId>.ts`: times in seconds). */
const FAKE_BOLT: AuthoredAbilityWith<FakeBoltSpec> = {
  id: 'fake-bolt',
  displayName: 'Fake Bolt',
  description: 'A bolt that exists only in this test.',
  classId: 'warrior',
  slot: 'ability',
  aetherCost: 20,
  cooldownSeconds: 2,
  targeting: { kind: 'self' },
  effects: [BOLT],
  restrictions: [],
  scaling: {},
};

describe('the ability framework litmus (architecture 05 §16, Phase 4.2 metric)', () => {
  it('casts a new ability added as content plus one registry line, with no other change', () => {
    // The content: Fake Bolt authored as every ability is and loaded with the shipped ones by the
    // unchanged `loadAbilities`, and a Warrior kit that holds it. The one registry line: the
    // registry's own strategies plus `FakeBoltEffect` (`createDefaultAbilityRegistry` would refuse
    // Fake Bolt at boot, since its kind has no line in `defaultAbilityRegistry.ts`).
    const abilities = loadAbilities(30, [...ABILITIES.all(), FAKE_BOLT]);
    const registry = testAbilityRegistry([new FakeBoltEffect()], abilities);

    const sim = new Simulation({
      config: createDefaultGameConfig(),
      seed: 7,
      logger: new NullLogger(),
      content: unitsWithWarriorKit({
        abilities: ['fake-bolt', 'veil', 'hamstring'],
        ultimate: 'fury',
      }),
      abilities: registry,
    });
    const spawned: string[] = [];
    const cast: unknown[] = [];
    const rejected: unknown[] = [];
    sim.on('entity-spawned', ({ entityId }) => spawned.push(entityId));
    sim.on('ability-cast', (payload) => cast.push(payload));
    sim.on('command-rejected', (payload) => rejected.push(payload));
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: { x: 50, y: 50 },
      count: 1,
    });
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind: 'light-mob',
      definitionId: 'training-dummy',
      team: 'dark',
      at: { x: 52, y: 50 },
      count: 1,
    });
    do {
      sim.step(); // past the countdown, which refuses casts (DEC-88)
    } while (sim.snapshot().match.phase === 'countdown');
    const [casterId, dummyId] = spawned;

    sim.enqueueCommand({
      type: 'cast-ability',
      actorId: casterId ?? '',
      slot: 'ability-1',
      aim: { point: { x: 52, y: 50 }, targetId: null },
    });
    sim.step();

    const entity = (id: string | undefined) => sim.snapshot().entities.find((e) => e.id === id);
    expect(rejected).toEqual([]);
    expect(cast).toEqual([{ casterId, abilityId: 'fake-bolt', slot: 'ability-1' }]);
    expect(entity(dummyId)?.health?.current).toBe(75);
    expect(entity(casterId)?.aether?.current).toBeLessThan(100);
    expect(abilities.get('fake-bolt').cooldownTicks).toBe(60); // 2 s at 30 ticks per second
  });
});
