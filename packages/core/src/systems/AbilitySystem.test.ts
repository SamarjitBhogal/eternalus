import { describe, expect, it } from 'vitest';

import { casterState, TEST_KIT } from '../abilities/__fixtures__/casterState';
import { RecordingEffect } from '../abilities/__fixtures__/RecordingEffect';
import {
  ABILITIES_WITH_FAKES,
  fakeAbility,
  testAbilityRegistry,
} from '../abilities/__fixtures__/fakeAbilities';
import { CastValidator } from '../abilities/CastValidator';
import { DamagePipeline } from '../combat/DamagePipeline';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Abilities } from '../components/Abilities';
import { Aether } from '../components/Aether';
import { StatusEffects } from '../components/StatusEffects';
import { ContentCatalogue } from '../content/ContentCatalogue';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { NullLogger } from '../diagnostics/NullLogger';
import type { GameState } from '../state/GameState';
import { AbilitySystem } from './AbilitySystem';

const STATUSES = loadStatusEffects(30, 2);
const AIM = { point: { x: 0, y: 5 }, targetId: null };

/** A system over a registry whose `fake-strike` and `fake-blast` record into one log. */
const setUp = () => {
  const { state, factory, caster } = casterState({
    ...TEST_KIT,
    abilities: ['fake-strike', 'fake-two-step', 'fake-dash'],
  });
  const strike = new RecordingEffect('fake-strike');
  const blast = new RecordingEffect('fake-blast', strike.log);
  const abilities = new ContentCatalogue([
    ...ABILITIES_WITH_FAKES.all(),
    fakeAbility({
      id: 'fake-two-step',
      effects: [{ kind: 'fake-blast' }, { kind: 'fake-strike' }],
    }),
  ]);
  const registry = testAbilityRegistry([strike, blast], abilities);
  const system = new AbilitySystem(
    registry,
    new CastValidator(registry),
    new DamagePipeline(),
    new StatusEffectApplier(STATUSES),
  );
  const events: string[] = [];
  state.events.on('ability-cast', ({ casterId, abilityId, slot }) =>
    events.push(`cast ${casterId} ${abilityId} ${slot}`),
  );
  state.events.on('command-rejected', ({ reason }) => events.push(`rejected ${reason}`));
  const run = (s: GameState = state): void => {
    system.update({ state: s, logger: new NullLogger() });
  };
  return { state, factory, caster, log: strike.log, events, run };
};

describe('AbilitySystem', () => {
  it('pays the price, stamps the cooldown from the cast tick, emits ability-cast and runs the steps', () => {
    const { state, caster, log, events, run } = setUp();
    const aether = caster.getComponent(Aether);
    const before = aether.current;
    const slot = caster.getComponent(Abilities).slot('ability-1');
    slot?.queue(AIM);

    run();

    expect(aether.current).toBe(before - 30);
    expect(slot?.cooldownUntilTick).toBe(state.tick + 90);
    expect(slot?.pendingCast).toBeNull();
    expect(events).toEqual(['cast entity-1 fake-strike ability-1']);
    expect(log).toHaveLength(1);
    expect(log[0]?.cast).toMatchObject({
      casterId: 'entity-1',
      abilityId: 'fake-strike',
      slot: 'ability-1',
      tick: state.tick,
      aim: AIM,
      direction: { x: 0, y: 1 },
      placement: { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } },
    });
  });

  it('runs an ability’s steps in list order', () => {
    const { caster, log, run } = setUp();
    caster.getComponent(Abilities).slot('ability-2')?.queue(AIM);

    run();

    expect(log.map(({ spec }) => spec.kind)).toEqual(['fake-blast', 'fake-strike']);
  });

  it('charges the concussed price (+25%)', () => {
    const { state, caster, run } = setUp();
    const aether = caster.getComponent(Aether);
    const before = aether.current;
    caster.getComponent(StatusEffects).apply(STATUSES.get('concussion'), null, state.tick);
    caster.getComponent(Abilities).slot('ability-1')?.queue(AIM);

    run();

    expect(aether.current).toBe(before - 37.5);
  });

  it('checks again and drops a cast that is no longer allowed, as command-rejected', () => {
    const { state, caster, log, events, run } = setUp();
    const aether = caster.getComponent(Aether);
    const before = aether.current;
    caster.getComponent(Abilities).slot('ability-1')?.queue(AIM);
    // Stunned between the command and the cast.
    caster.getComponent(StatusEffects).apply(STATUSES.get('stun'), null, state.tick);

    run();

    expect(events).toEqual(['rejected cannot-cast']);
    expect(log).toEqual([]);
    expect(aether.current).toBe(before);
    expect(caster.getComponent(Abilities).slot('ability-1')?.pendingCast).toBeNull();
  });

  it('casts for every caster in id order', () => {
    const { state, factory, caster, events, run } = setUp();
    const second = factory.create('warrior', 'warrior', { position: { x: 9, y: 9 }, team: 'dark' });
    const third = factory.create('warrior', 'warrior', { position: { x: 1, y: 9 }, team: 'dark' });
    expect([caster.id, second.id, third.id]).toEqual(['entity-1', 'entity-2', 'entity-3']);
    // The store holds them as 1, 3, 2.
    state.entities.add(third);
    state.entities.add(second);
    for (const entity of [caster, second, third]) {
      entity.getComponent(Abilities).slot('ability-1')?.queue(AIM);
    }

    run();

    expect(events).toEqual([
      'cast entity-1 fake-strike ability-1',
      'cast entity-2 fake-strike ability-1',
      'cast entity-3 fake-strike ability-1',
    ]);
  });
});
