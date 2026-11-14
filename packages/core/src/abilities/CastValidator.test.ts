import { describe, expect, it } from 'vitest';

import { applyCommand } from '../commands/applyCommand';
import type { AbilitySlot, Aim, Command } from '../commands/Command.types';
import { createDefaultCommandHandlers } from '../commands/defaultCommandHandlers';
import { Abilities } from '../components/Abilities';
import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import type { AbilityKit } from '../content/abilities/AbilityDefinition.types';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { casterState, TEST_KIT } from './__fixtures__/casterState';
import { RecordingEffect } from './__fixtures__/RecordingEffect';
import { testAbilityRegistry } from './__fixtures__/fakeAbilities';
import { CastValidator } from './CastValidator';

const STATUSES = loadStatusEffects(30, 2);
const AIM_EAST: Aim = { point: { x: 5, y: 0 }, targetId: null };

/** A caster with `kit`, the real `cast-ability` handler over a `CastValidator`, and what it rejected. */
const setUp = (kit: AbilityKit = TEST_KIT) => {
  const { state, factory, caster } = casterState(kit);
  const validator = new CastValidator(testAbilityRegistry([new RecordingEffect('fake-strike')]));
  const handlers = createDefaultCommandHandlers(validator);
  const rejected: string[] = [];
  state.events.on('command-rejected', ({ reason }) => rejected.push(reason));
  const cast = (slot: AbilitySlot, aim: Aim = AIM_EAST, actorId = caster.id): void => {
    const command: Command<'cast-ability'> = { type: 'cast-ability', actorId, slot, aim };
    applyCommand(command, handlers, { state, factory });
  };
  const runtime = (slot: AbilitySlot) => caster.getComponent(Abilities).slot(slot);
  return { state, factory, caster, validator, cast, rejected, runtime };
};

describe('CastValidator through the cast-ability command', () => {
  it('accepts a ready cast: no rejection, and the cast waits on its slot', () => {
    const { cast, rejected, runtime } = setUp();

    cast('ability-1');

    expect(rejected).toEqual([]);
    expect(runtime('ability-1')?.pendingCast).toEqual(AIM_EAST);
  });

  it('rejects an unknown caster as unknown-entity', () => {
    const { cast, rejected } = setUp();
    cast('ability-1', AIM_EAST, 'entity-404');
    expect(rejected).toEqual(['unknown-entity']);
  });

  it('rejects a dead caster as dead', () => {
    const { caster, cast, rejected } = setUp();
    caster.getComponent(Health).applyDamage(1_000_000);
    cast('ability-1');
    expect(rejected).toEqual(['dead']);
  });

  it('rejects a slot that holds nothing, and a caster with no ability bar, as empty-slot', () => {
    const { state, factory, cast, rejected } = setUp();
    const dummy = factory.create('light-mob', 'training-dummy', {
      position: { x: 3, y: 3 },
      team: 'dark',
    });
    state.entities.add(dummy);

    cast('gadget-1');
    cast('ability-1', AIM_EAST, dummy.id);

    expect(rejected).toEqual(['empty-slot', 'empty-slot']);
  });

  it('rejects an ability that is in the kit but not built (effects: []) as unavailable', () => {
    const { cast, rejected } = setUp();
    cast('ability-2'); // Veil
    expect(rejected).toEqual(['unavailable']);
  });

  it('rejects a second cast in the same tick as casting', () => {
    const { cast, rejected } = setUp();
    cast('ability-1');
    cast('ability-3');
    expect(rejected).toEqual(['casting']);
  });

  it('rejects a caster under a cannot-cast status (staggered) as cannot-cast', () => {
    const { state, caster, cast, rejected } = setUp();
    caster.getComponent(StatusEffects).apply(STATUSES.get('staggered'), null, state.tick);
    cast('ability-1');
    expect(rejected).toEqual(['cannot-cast']);
  });

  it('rejects every cast while the match holds units idle (the countdown, DEC-88) as cannot-cast', () => {
    const { state, caster, cast, rejected, runtime } = setUp();
    state.match.holdIdle(true);

    cast('ability-1');
    expect(rejected).toEqual(['cannot-cast']);
    expect(runtime('ability-1')?.pendingCast).toBeNull();
    expect(caster.getComponent(Aether).current).toBe(caster.getComponent(Aether).max);

    state.match.holdIdle(false);
    cast('ability-1');
    expect(rejected).toEqual(['cannot-cast']);
    expect(runtime('ability-1')?.pendingCast).toEqual(AIM_EAST);
  });

  it('rejects a slot whose cooldown runs as on-cooldown, and accepts it on the tick it ends', () => {
    const { state, cast, rejected, runtime } = setUp();
    runtime('ability-1')?.recordCast(state.tick, 1);

    cast('ability-1');
    state.advanceTick();
    cast('ability-1');

    expect(rejected).toEqual(['on-cooldown']);
  });

  it('rejects an ultimate whose meter is not full as not-charged, and accepts a full one', () => {
    const { cast, rejected, runtime } = setUp();

    cast('ability-4');
    const ultimate = runtime('ability-4');
    if (ultimate !== undefined) ultimate.charge = 1;
    cast('ability-4');

    expect(rejected).toEqual(['not-charged']);
  });

  it('rejects a cast the aether does not cover as not-enough-aether', () => {
    const { caster, cast, rejected } = setUp();
    const aether = caster.getComponent(Aether);
    aether.spend(aether.current - 29); // the strike costs 30

    cast('ability-1');

    expect(rejected).toEqual(['not-enough-aether']);
  });

  it('prices a cast 25% higher under concussion (more-abilities.md §7)', () => {
    const { state, caster, cast, rejected, validator } = setUp();
    const aether = caster.getComponent(Aether);
    aether.spend(aether.current - 30);
    caster.getComponent(StatusEffects).apply(STATUSES.get('concussion'), null, state.tick);

    cast('ability-1');

    expect(rejected).toEqual(['not-enough-aether']);
    expect(validator.priceOf(state, caster.id, 'fake-strike')).toBe(37.5);
  });

  it('rejects a directional cast aimed at the caster itself as no-target', () => {
    const { cast, rejected } = setUp();
    cast('ability-3', { point: { x: 0, y: 0 }, targetId: null });
    cast('ability-3', { point: { x: Number.NaN, y: 0 }, targetId: null });
    expect(rejected).toEqual(['no-target', 'no-target']);
  });

  it('rejects a cast a restriction forbids (min-level 5 at level 1) as restricted', () => {
    const { cast, rejected } = setUp({
      ...TEST_KIT,
      abilities: ['fake-gated', 'veil', 'fake-dash'],
    });
    cast('ability-1');
    expect(rejected).toEqual(['restricted']);
  });
});

describe('CastValidator.slotBlockedBy (the slot alone, for the player snapshot)', () => {
  it('judges a directional slot ready with no aim at all, where the full check needs one', () => {
    const { state, caster, validator } = setUp();
    const onCaster: Aim = { point: { x: 0, y: 0 }, targetId: null };

    expect(validator.slotBlockedBy(state, caster.id, 'ability-3')).toBeNull();
    expect(validator.blockedBy(state, caster.id, 'ability-3', onCaster)).toBe('no-target');
  });

  it('gives every other reason the full check gives, in the same order', () => {
    const { state, caster, validator } = setUp();
    const reasons = (): readonly unknown[] =>
      (['ability-1', 'ability-2', 'ability-4', 'gadget-1'] as const).map((slot) => [
        validator.slotBlockedBy(state, caster.id, slot),
        validator.blockedBy(state, caster.id, slot, AIM_EAST),
      ]);

    expect(reasons()).toEqual([
      [null, null],
      ['unavailable', 'unavailable'],
      ['not-charged', 'not-charged'],
      ['empty-slot', 'empty-slot'],
    ]);
    caster.getComponent(Health).applyDamage(1_000_000);
    expect(reasons()).toEqual(Array.from({ length: 4 }, () => ['dead', 'dead']));
  });

  it('throws for an id that names no entity: the snapshot only asks about a Legend it holds', () => {
    const { state, validator } = setUp();

    expect(() => validator.slotBlockedBy(state, 'entity-404', 'ability-1')).toThrow(
      'no entity "entity-404"',
    );
    expect(validator.blockedBy(state, 'entity-404', 'ability-1', AIM_EAST)).toBe('unknown-entity');
  });
});
