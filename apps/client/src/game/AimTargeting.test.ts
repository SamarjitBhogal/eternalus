import {
  type AbilitySlotSnapshot,
  type EntitySnapshot,
  loadDisplayContent,
  type Snapshot,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { HudSlotId } from '../bridge/Binding.types';
import { AimTargeting } from './AimTargeting';
import type { DashReach } from './Match.types';

const ABILITIES = loadDisplayContent().abilities;
const CASTER: EntitySnapshot = {
  id: 'legend-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'light',
  transform: { x: 10, y: 20, radius: 0.5 },
  health: { current: 1, max: 1 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
};
/** Where the Legend is drawn this frame: between snapshots, so not its snapshot position. */
const DRAWN_AT = { x: 9, y: 20 };

const slot = (id: HudSlotId, abilityId: string | null): AbilitySlotSnapshot => ({
  slot: id,
  abilityId,
  cooldownRemainingTicks: 0,
  cooldownTicks: 0,
  aetherCost: 0,
  charge: null,
  isReady: true,
  blockedBy: null,
});

const snapshotWith = (abilityId: string | null): Snapshot =>
  ({
    tick: 0,
    entities: [CASTER],
    player: { entityId: CASTER.id, slots: [slot('ability-1', abilityId)] },
  }) as unknown as Snapshot;

describe('AimTargeting', () => {
  it('aims the selected dash from where the Legend is drawn, as far as the simulation says', () => {
    const asked: unknown[] = [];
    const reach: DashReach = (origin, direction, distance, radius) => {
      asked.push([origin, direction, distance, radius]);
      return 3;
    };

    const target = new AimTargeting(ABILITIES, CASTER.id, reach).targetOf(
      snapshotWith('blade-runner'),
      'ability-1',
      { x: 100, y: 20 },
      DRAWN_AT,
    );

    expect(asked).toEqual([[DRAWN_AT, { x: 1, y: 0 }, 8, 0.5]]);
    expect(target?.origin).toEqual(DRAWN_AT);
    expect(target?.direction).toEqual({ x: 1, y: 0 });
    // The dash's own row has no area: the view gets `null`, never a missing field.
    expect(target?.steps[0]?.shape).toBeNull();
    expect(target?.steps.map(({ reach: reached }) => reached)).toEqual(
      ABILITIES.find(({ id }) => id === 'blade-runner')?.steps.map(({ distance }) =>
        distance === undefined ? null : 3,
      ),
    );
  });

  it('gives a dash its whole distance without a reach port (a Duel)', () => {
    const target = new AimTargeting(ABILITIES, CASTER.id).targetOf(
      snapshotWith('blade-runner'),
      'ability-1',
      { x: 10, y: 90 },
      DRAWN_AT,
    );

    expect(target?.steps.find(({ reach }) => reach !== null)?.reach).toBe(8);
    expect(target?.direction.x).toBeCloseTo(0.0142, 3);
  });

  it('does not ask the simulation for a caster-centred ability, and keeps no direction on the caster', () => {
    const reach: DashReach = () => {
      throw new Error('asked');
    };
    const targeting = new AimTargeting(ABILITIES, CASTER.id, reach);

    const slam = targeting.targetOf(snapshotWith('slam'), 'ability-1', { x: 30, y: 20 }, DRAWN_AT);
    const onCaster = new AimTargeting(ABILITIES, CASTER.id).targetOf(
      snapshotWith('blade-runner'),
      'ability-1',
      DRAWN_AT,
      DRAWN_AT,
    );

    expect(slam?.steps.every(({ reach: reached }) => reached === null)).toBe(true);
    expect(onCaster?.direction).toEqual({ x: 0, y: 0 });
  });

  it('is null with no slot selected (quick cast), no pointer point, no place, an empty slot, an unknown ability or no Legend', () => {
    const targeting = new AimTargeting(ABILITIES, CASTER.id);
    const aim = { x: 1, y: 1 };

    expect(targeting.targetOf(snapshotWith('slam'), null, aim, DRAWN_AT)).toBeNull();
    expect(targeting.targetOf(snapshotWith('slam'), 'ability-1', null, DRAWN_AT)).toBeNull();
    expect(targeting.targetOf(snapshotWith('slam'), 'ability-1', aim, null)).toBeNull();
    expect(targeting.targetOf(snapshotWith(null), 'ability-1', aim, DRAWN_AT)).toBeNull();
    expect(targeting.targetOf(snapshotWith('no-such'), 'ability-1', aim, DRAWN_AT)).toBeNull();
    expect(targeting.targetOf(snapshotWith('slam'), 'ability-2', aim, DRAWN_AT)).toBeNull();
    expect(
      new AimTargeting(ABILITIES, null).targetOf(snapshotWith('slam'), 'ability-1', aim, DRAWN_AT),
    ).toBeNull();
  });
});
