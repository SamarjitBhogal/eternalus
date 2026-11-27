import { describe, expect, it } from 'vitest';

import { findGemAt } from './findGemAt';
import type { EntitySnapshot } from './Snapshot.types';

const entity = (id: string, x: number, isGem: boolean): EntitySnapshot => ({
  id,
  kind: isGem ? 'cathedral-gem' : 'stronghold',
  family: 'structure',
  definitionId: id,
  team: 'neutral',
  transform: { x, y: 0, radius: 5, facing: { x: 1, y: 0 } },
  health: { current: 1, max: 1 },
  elevation: null,
  progression: null,
  aether: null,
  area: null,
  capture: null,
  aura: null,
  gem: isGem ? { holder: 'neutral', glowTicksLeft: 0, glowHits: 0, ticksSinceHit: null } : null,
});

describe('findGemAt', () => {
  it('finds the gem whose hit circle holds the point, edge included', () => {
    expect(findGemAt([entity('gem', 0, true)], { x: 0, y: 5 })).toBe('gem');
  });

  it('finds nothing outside the circle or on a structure that is no gem', () => {
    const entities = [entity('gem', 0, true), entity('stronghold', 100, false)];
    expect(findGemAt(entities, { x: 0, y: 5.01 })).toBeNull();
    expect(findGemAt(entities, { x: 100, y: 0 })).toBeNull();
  });
});
