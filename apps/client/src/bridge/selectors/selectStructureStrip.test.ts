import type { MapFeatureKind } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { PlayableTeam } from '../domain.types';
import type { StructureStatus } from '../hud.types';
import { FIGMA_HUD_PLAYER, figmaHudState, TEST_HUD_CATALOGUE } from '../__fixtures__/hudFixtures';
import { contentSlice } from '../slices/contentSlice';
import { hudSlice } from '../slices/hudSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import { createAppStore } from '../store';
import { selectStructureStrip } from './selectStructureStrip';

/** A store with the HUD catalogue, `structures` and, unless `null`, the player's team. */
function storeWith(team: PlayableTeam | null, structures: readonly StructureStatus[]) {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({
      ...contentSlice.getInitialState(),
      hud: TEST_HUD_CATALOGUE,
    }),
  );
  if (team !== null) store.dispatch(matchSetupSlice.actions.setTeam({ seed: 1, playerTeam: team }));
  store.dispatch(matchSlice.actions.structuresChanged(structures));
  return store;
}

const structure = (
  structureId: string,
  kind: MapFeatureKind,
  team: PlayableTeam,
  laneIndex: number | null,
  health: StructureStatus['health'] = null,
): StructureStatus => ({ structureId, kind, team, laneIndex, health });

/** One team's strip structures for `lanes` lanes, `buffPerLane` buff towers each, plus a turret. */
function teamStructures(team: PlayableTeam, lanes: number, buffPerLane = 1): StructureStatus[] {
  const laneIds = Array.from({ length: lanes }, (_, lane) => lane);
  return [
    structure(`${team}-turret`, 'turret', team, 0),
    ...laneIds.flatMap((lane) => [
      structure(`${team}-spawner-${String(lane)}`, 'spawner-tower', team, lane),
      ...Array.from({ length: buffPerLane }, (_, n) =>
        structure(`${team}-buff-${String(lane)}-${String(n)}`, 'buff-tower', team, lane),
      ),
    ]),
    structure(`${team}-wall-1`, 'wall-segment', team, null),
    structure(`${team}-gate-0`, 'gate', team, null),
    structure(`${team}-wall-0`, 'wall-segment', team, null),
    structure(`${team}-stronghold`, 'stronghold', team, null),
  ];
}

const ids = (team: PlayableTeam | null, side: 'allied' | 'enemy', all: StructureStatus[]) =>
  selectStructureStrip(storeWith(team, all).getState(), side).map((tile) => tile.tileId);

describe('selectStructureStrip', () => {
  it('orders the allied strip stronghold, wall, buff towers by lane, production towers by lane', () => {
    const all = [...teamStructures('light', 3), ...teamStructures('dark', 3)];
    expect(ids('light', 'allied', all)).toEqual([
      'light-stronghold',
      'light-wall',
      'light-buff-0-0',
      'light-buff-1-0',
      'light-buff-2-0',
      'light-spawner-0',
      'light-spawner-1',
      'light-spawner-2',
    ]);
  });

  it('shows the other team in the enemy strip, for a Light and a Dark player', () => {
    const all = [...teamStructures('light', 3), ...teamStructures('dark', 3)];
    expect(ids('light', 'enemy', all)[0]).toBe('dark-stronghold');
    expect(ids('dark', 'allied', all)[0]).toBe('dark-stronghold');
    expect(ids('dark', 'enemy', all)[0]).toBe('light-stronghold');
    const tiles = selectStructureStrip(storeWith('dark', all).getState(), 'enemy');
    expect(new Set(tiles.map((tile) => tile.team))).toEqual(new Set(['light']));
  });

  it('scales with the lane count and leaves the turret out (FR-013 litmus)', () => {
    expect(ids('light', 'allied', teamStructures('light', 3))).toHaveLength(8);
    expect(ids('light', 'allied', teamStructures('light', 5))).toHaveLength(12);
    expect(ids('light', 'allied', teamStructures('light', 3, 2))).toHaveLength(11);
    expect(ids('light', 'allied', teamStructures('light', 3))).not.toContain('light-turret');
  });

  it('merges wall segments and gates into one tile whose health is the sum, unknown if any is', () => {
    const walls = (gateHealth: StructureStatus['health']) => [
      structure('light-wall-0', 'wall-segment', 'light', null, { current: 10, max: 40 }),
      structure('light-wall-1', 'wall-segment', 'light', null, { current: 30, max: 40 }),
      structure('light-gate-0', 'gate', 'light', null, gateHealth),
    ];
    const wallTile = (gateHealth: StructureStatus['health']) =>
      selectStructureStrip(storeWith('light', walls(gateHealth)).getState(), 'allied');
    expect(wallTile({ current: 20, max: 20 })).toEqual([
      {
        tileId: 'light-wall',
        team: 'light',
        displayName: 'Wall',
        iconAssetId: 'structure-wall',
        healthFraction: 0.6,
        isDestroyed: false,
      },
    ]);
    expect(wallTile(null)[0]?.healthFraction).toBeNull();
  });

  it('shows a structure destroyed at zero health, never at unknown or some health (DEC-69)', () => {
    const towers = [
      structure('light-buff-0', 'buff-tower', 'light', 0, { current: 0, max: 40 }),
      structure('light-buff-1', 'buff-tower', 'light', 1, { current: 1, max: 40 }),
      structure('light-buff-2', 'buff-tower', 'light', 2, null),
    ];
    const tiles = selectStructureStrip(storeWith('light', towers).getState(), 'allied');
    expect(tiles.map((tile) => [tile.tileId, tile.isDestroyed])).toEqual([
      ['light-buff-0', true],
      ['light-buff-1', false],
      ['light-buff-2', false],
    ]);
  });

  it('shows the one Wall tile destroyed once any one wall segment or gate is (DEC-108)', () => {
    const health = (current: number): StructureStatus['health'] => ({ current, max: 40 });
    const wallDestroyed = (wall0: number, wall1: number, gate: number): boolean | undefined =>
      selectStructureStrip(
        storeWith('light', [
          structure('light-wall-0', 'wall-segment', 'light', null, health(wall0)),
          structure('light-wall-1', 'wall-segment', 'light', null, health(wall1)),
          structure('light-gate-0', 'gate', 'light', null, health(gate)),
        ]).getState(),
        'allied',
      )[0]?.isDestroyed;
    expect(wallDestroyed(40, 40, 40)).toBe(false);
    expect(wallDestroyed(0, 40, 40)).toBe(true);
    expect(wallDestroyed(40, 0, 40)).toBe(true);
    expect(wallDestroyed(40, 40, 0)).toBe(true);
  });

  it('binds the Figma bars by identity: production towers 18, 23, 20 of 46', () => {
    const { structures } = figmaHudState().match;
    const tiles = selectStructureStrip(storeWith('light', structures).getState(), 'enemy');
    expect(tiles.map((tile) => tile.healthFraction)).toEqual([
      18 / 46,
      18 / 46,
      18 / 46,
      18 / 46,
      18 / 46,
      18 / 46,
      23 / 46,
      20 / 46,
    ]);
  });

  it('is empty before the player has a team', () => {
    expect(ids(null, 'allied', teamStructures('light', 3))).toEqual([]);
  });

  it('returns the same tiles after a clock tick and after a HUD publish', () => {
    const store = storeWith('light', figmaHudState().match.structures);
    const allied = selectStructureStrip(store.getState(), 'allied');
    const enemy = selectStructureStrip(store.getState(), 'enemy');
    store.dispatch(matchSlice.actions.clockChanged({ tick: 30, seconds: 1 }));
    store.dispatch(hudSlice.actions.hudStateChanged(FIGMA_HUD_PLAYER));
    expect(selectStructureStrip(store.getState(), 'allied')).toBe(allied);
    expect(selectStructureStrip(store.getState(), 'enemy')).toBe(enemy);
  });
});
