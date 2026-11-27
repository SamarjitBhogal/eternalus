import {
  type AbilitySlotSnapshot,
  createDefaultGameConfig,
  type EntitySnapshot,
  loadDisplayContent,
  type PlacedSummon,
  type Snapshot,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { HudSlotId } from '../bridge/Binding.types';
import { AimTargeting } from './AimTargeting';
import type { DashReach, SummonPreview } from './Match.types';

const ABILITIES = loadDisplayContent(createDefaultGameConfig().tickRate).abilities;
const CASTER: EntitySnapshot = {
  id: 'legend-1',
  kind: 'warrior',
  family: 'legend',
  definitionId: 'warrior',
  team: 'light',
  transform: { x: 10, y: 20, radius: 0.5, facing: { x: 1, y: 0 } },
  health: { current: 1, max: 1 },
  progression: null,
  aether: null,
  area: null,
  capture: null,
  statuses: null,
  projectile: null,
  swing: null,
  gem: null,
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
    expect(target?.casterRadius).toBe(0.5);
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

  it('copies the outline the simulation placed into the Shield Wall step (DEC-382, HC-B43 (7), HC-S15)', () => {
    const asked: unknown[] = [];
    const placed: PlacedSummon = {
      outline: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ],
      isBlocked: true,
    };
    const preview: SummonPreview = (corners, origin, direction, distance) => {
      asked.push([corners, origin, direction, distance]);
      return placed;
    };
    const wall = ABILITIES.find(({ id }) => id === 'shield-wall')?.steps[0]?.shape;

    const target = new AimTargeting(ABILITIES, CASTER.id, undefined, preview).targetOf(
      snapshotWith('shield-wall'),
      'ability-1',
      { x: 100, y: 20 },
      DRAWN_AT,
    );

    expect(wall?.kind).toBe('outline');
    expect(asked).toEqual([
      [wall?.kind === 'outline' ? wall.corners : null, DRAWN_AT, { x: 1, y: 0 }, 3],
    ]);
    expect(target?.steps.map((step) => step.placed)).toEqual([placed]);
  });

  it('gives a Shield Wall step no outline without the query', () => {
    const target = new AimTargeting(ABILITIES, CASTER.id).targetOf(
      snapshotWith('shield-wall'),
      'ability-1',
      { x: 100, y: 20 },
      DRAWN_AT,
    );

    expect(target?.steps.map((step) => step.placed)).toEqual([null]);
  });

  it('never asks about, and gives no outline to, a step that places none', () => {
    const preview: SummonPreview = () => {
      throw new Error('asked');
    };

    const dash = new AimTargeting(ABILITIES, CASTER.id, undefined, preview).targetOf(
      snapshotWith('blade-runner'),
      'ability-1',
      { x: 100, y: 20 },
      DRAWN_AT,
    );

    expect(dash?.steps.every(({ placed }) => placed === null)).toBe(true);
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

  it('says whether the ability in a slot uses the aim, from the display data', () => {
    const aiming = new AimTargeting(ABILITIES, CASTER.id);
    const granted = {
      ...snapshotWith(null),
      player: {
        entityId: CASTER.id,
        slots: [
          slot('ability-1', 'blade-runner'),
          { ...slot('ability-1', 'fury-dash'), slot: 'granted' },
        ],
      },
    } as unknown as Snapshot;

    expect(aiming.usesAim(granted, 'ability-1')).toBe(true);
    expect(aiming.usesAim(granted, 'granted')).toBe(false);
    // No ability in the slot, or none the display data knows: the usual aimed paths.
    expect(aiming.usesAim(granted, 'ability-3')).toBe(true);
    expect(aiming.usesAim(snapshotWith(null), 'ability-1')).toBe(true);
  });
});
