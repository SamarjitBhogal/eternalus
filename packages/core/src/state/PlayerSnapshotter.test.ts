import { describe, expect, it } from 'vitest';

import { casterState } from '../abilities/__fixtures__/casterState';
import { RecordingEffect } from '../abilities/__fixtures__/RecordingEffect';
import { testAbilityRegistry } from '../abilities/__fixtures__/fakeAbilities';
import { CastReadiness } from '../abilities/CastReadiness';
import { Abilities } from '../components/Abilities';
import { Aether } from '../components/Aether';
import { StatusEffects } from '../components/StatusEffects';
import { loadLevelCurves } from '../content/progression/loadLevelCurves';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { GameState } from './GameState';
import { PlayerSnapshotter } from './PlayerSnapshotter';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { Entity } from '../entities/Entity';

const READINESS = new CastReadiness(testAbilityRegistry([new RecordingEffect('fake-strike')]));

/** A Warrior with the test kit: strike, unbuilt veil, dash, ultimate, then three empty slots. */
const setUp = () => {
  const { state, caster } = casterState({
    abilities: ['fake-strike', 'veil', 'fake-dash'],
    ultimate: 'fake-ultimate',
  });
  const snapshot = () => {
    const player = new PlayerSnapshotter(READINESS).snapshotOf(state, caster);
    if (player === null) {
      throw new Error('The Warrior has an ability bar.');
    }
    return player;
  };
  const slot = (id: string) => snapshot().slots.find(({ slot: name }) => name === id);
  return { state, caster, snapshot, slot };
};

describe('PlayerSnapshotter', () => {
  it('reports every slot in bar order for the Legend', () => {
    const { caster, snapshot } = setUp();

    const player = snapshot();

    expect(player.entityId).toBe(caster.id);
    expect(player.slots.map(({ slot }) => slot)).toEqual([
      'ability-1',
      'ability-2',
      'ability-3',
      'ability-4',
      'gadget-1',
      'gadget-2',
      'default-action',
    ]);
  });

  it('reports a ready slot with its cost and full cooldown, and no charge', () => {
    expect(setUp().slot('ability-1')).toEqual({
      slot: 'ability-1',
      abilityId: 'fake-strike',
      cooldownRemainingTicks: 0,
      cooldownTicks: 90,
      aetherCost: 30,
      charge: null,
      isReady: true,
      blockedBy: null,
    });
  });

  it('reports a slot on cooldown with the ticks left', () => {
    const { caster, slot } = setUp();
    const runtime = caster.getComponent(Abilities).slot('ability-1');
    if (runtime !== undefined) {
      runtime.cooldownUntilTick = 40;
    }

    expect(slot('ability-1')).toMatchObject({
      cooldownRemainingTicks: 40,
      cooldownTicks: 90,
      isReady: false,
      blockedBy: 'on-cooldown',
    });
  });

  it('reports a slot the aether cannot pay for', () => {
    const { caster, slot } = setUp();
    const aether = caster.getComponent(Aether);
    aether.spend(aether.current);

    expect(slot('ability-1')).toMatchObject({ isReady: false, blockedBy: 'not-enough-aether' });
  });

  it('reports the price after status modifiers (concussion adds 25%)', () => {
    const { state, caster, slot } = setUp();
    const concussion = loadStatusEffects(30, 2).get('concussion');
    caster.getComponent(StatusEffects).apply(concussion, null, state.tick);

    expect(slot('ability-1')?.aetherCost).toBe(37.5);
  });

  it('reports an ability with no effects as unavailable', () => {
    expect(setUp().slot('ability-2')).toMatchObject({
      abilityId: 'veil',
      isReady: false,
      blockedBy: 'unavailable',
    });
  });

  it('reports a directional ability as ready: the snapshot aims it itself', () => {
    expect(setUp().slot('ability-3')).toMatchObject({ isReady: true, blockedBy: null });
  });

  it('reports an empty slot with no ability, no cost and `empty-slot`', () => {
    expect(setUp().slot('gadget-1')).toEqual({
      slot: 'gadget-1',
      abilityId: null,
      cooldownRemainingTicks: 0,
      cooldownTicks: 0,
      aetherCost: 0,
      charge: null,
      isReady: false,
      blockedBy: 'empty-slot',
    });
  });

  it('reports the ultimate as not charged and sends no meter yet', () => {
    expect(setUp().slot('ability-4')).toMatchObject({
      charge: null,
      isReady: false,
      blockedBy: 'not-charged',
    });
  });

  it('is null for an entity with no ability bar', () => {
    const { state } = setUp();
    class Bare extends Entity {
      public readonly kind = 'bare';
      public readonly family = 'test';
      protected installComponents(): void {
        // No components.
      }
    }

    expect(new PlayerSnapshotter(READINESS).snapshotOf(state, new Bare('b-1', 'bare'))).toBeNull();
  });
});

describe('GameState.snapshot player', () => {
  const CURVES = loadLevelCurves();

  it('is null when no human is seated (simulation-only mode)', () => {
    const state = new GameState(createDefaultGameConfig(), 1);

    expect(state.snapshot(CURVES, READINESS).player).toBeNull();
  });

  it('is the seated human Legend’s snapshot', () => {
    const { state, caster } = setUp();
    state.match.seatHuman(caster.id);

    const { player } = state.snapshot(CURVES, READINESS);

    expect(player?.entityId).toBe(caster.id);
    expect(player?.slots).toHaveLength(7);
  });

  it('is null when no readiness is given', () => {
    const { state, caster } = setUp();
    state.match.seatHuman(caster.id);

    expect(state.snapshot(CURVES).player).toBeNull();
  });
});
