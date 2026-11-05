import type { EntitySnapshot, Team } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { findUnitAt } from './findUnitAt';

const entity = (id: string, family: string, team: Team, x: number, radius = 2): EntitySnapshot => ({
  id,
  kind: family,
  family,
  definitionId: family,
  team,
  transform: { x, y: 0, radius },
  health: { current: 5, max: 5 },
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

  it('skips structures, allies, the attacker and dead units; nearest centre wins', () => {
    const dead = { ...entity('dead', 'mob', 'dark', 0), health: { current: 0, max: 5 } };
    const units = [
      PLAYER,
      entity('tower', 'structure', 'dark', 0),
      entity('ally', 'mob', 'light', 0),
      dead,
      entity('far', 'mob', 'dark', 1.5),
      entity('near', 'mob', 'dark', 0.5),
    ];
    expect(findUnitAt(units, 'player', { x: 0, y: 0 })).toBe('near');
    expect(findUnitAt(units, 'player', { x: 100, y: 0 })).toBeNull();
  });
});
