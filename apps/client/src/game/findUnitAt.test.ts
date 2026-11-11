import type { EntitySnapshot, Team } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { findUnitAt } from './findUnitAt';

const entity = (
  id: string,
  family: string,
  team: Team,
  x: number,
  radius = 2,
  y = 0,
): EntitySnapshot => ({
  id,
  kind: family,
  family,
  definitionId: family,
  team,
  transform: { x, y, radius, facing: { x: 1, y: 0 } },
  health: { current: 5, max: 5 },
  progression: null,
  area: null,
  capture: null,
});

const PLAYER = entity('player', 'legend', 'light', 100);

describe('findUnitAt', () => {
  it('picks a minion, a camp mob and an enemy Legend by position and radius', () => {
    const units = [
      PLAYER,
      entity('minion', 'mob', 'dark', 0),
      entity('camp', 'mob', 'neutral', 10),
      entity('legend', 'legend', 'dark', 20),
    ];
    expect(findUnitAt(units, 'player', { x: 1, y: 1 })).toBe('minion');
    expect(findUnitAt(units, 'player', { x: 10, y: 0 })).toBe('camp');
    expect(findUnitAt(units, 'player', { x: 21, y: 0 })).toBe('legend');
    expect(findUnitAt(units, 'player', { x: 50, y: 0 })).toBeNull();
  });

  it('hits exactly at the radius and misses just beyond it (DEC-183: no slack)', () => {
    const units = [PLAYER, entity('minion', 'mob', 'dark', 0, 2)];
    expect(findUnitAt(units, 'player', { x: 2, y: 0 })).toBe('minion');
    expect(findUnitAt(units, 'player', { x: 2.01, y: 0 })).toBeNull();
  });

  it('counts a boss and a plain unit-family entity as units (DEC-183)', () => {
    const units = [
      PLAYER,
      entity('boss', 'boss', 'neutral', 0),
      entity('unit', 'unit', 'dark', 10),
    ];
    expect(findUnitAt(units, 'player', { x: 0, y: 0 })).toBe('boss');
    expect(findUnitAt(units, 'player', { x: 10, y: 0 })).toBe('unit');
  });

  it('skips structures, allies, the attacker, dead units, and units without health', () => {
    const dead = { ...entity('dead', 'mob', 'dark', 0), health: { current: 0, max: 5 } };
    const noHealth = { ...entity('no-health', 'mob', 'dark', 0), health: null };
    const noPosition = { ...entity('no-position', 'mob', 'dark', 0), transform: null };
    const units = [
      { ...PLAYER, transform: { x: 0, y: 0, radius: 2, facing: { x: 1, y: 0 } } },
      entity('tower', 'structure', 'dark', 0),
      entity('ally', 'mob', 'light', 0),
      dead,
      noHealth,
      noPosition,
    ];
    expect(findUnitAt(units, 'player', { x: 0, y: 0 })).toBeNull();
  });

  it('where discs overlap, the unit drawn on top (largest y; the later one on a tie) wins', () => {
    const units = [
      PLAYER,
      entity('behind', 'mob', 'dark', 0, 2, 0),
      entity('front', 'mob', 'dark', 0, 2, 1),
      entity('level-a', 'mob', 'dark', 50, 2, 0),
      entity('level-b', 'mob', 'dark', 50, 2, 0),
    ];
    expect(findUnitAt(units, 'player', { x: 0, y: 0.5 })).toBe('front');
    expect(findUnitAt(units, 'player', { x: 50, y: 0 })).toBe('level-b');
  });

  it('treats every unit as an enemy when the attacker is not in the snapshot', () => {
    const units = [entity('minion', 'mob', 'dark', 0), entity('mate', 'mob', 'light', 10)];
    expect(findUnitAt(units, 'gone', { x: 0, y: 0 })).toBe('minion');
    expect(findUnitAt(units, 'gone', { x: 10, y: 0 })).toBe('mate');
  });
});
