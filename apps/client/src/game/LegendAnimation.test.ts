import type { EntitySnapshot } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { LegendAnimation } from './LegendAnimation';
import { LEGEND_SPRITE_SHEETS } from './legendSpriteSheets';

const hero: EntitySnapshot = {
  id: 'hero',
  kind: 'magus',
  family: 'legend',
  definitionId: 'magus',
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.75, facing: { x: 0, y: 1 } },
  health: { current: 800, max: 800 },
  aether: null,
  progression: null,
  capture: null,
  area: null,
  gem: null,
};

describe('LegendAnimation on Phase 3', () => {
  it.each(Object.entries(LEGEND_SPRITE_SHEETS).map(([spec, { atlasId }]) => [spec, atlasId]))(
    'draws from the %s sheet it is given, and nothing for a dead Legend',
    (_spec, atlasId) => {
      const animation = new LegendAnimation(atlasId, 30);
      expect(animation.frame(hero, 0)).toEqual({ atlasId, frame: 0 });
      expect(animation.frame({ ...hero, health: { current: 0, max: 800 } }, 0)).toBeNull();
    },
  );
  it.each([
    [1, 0, 4],
    [-1, 0, 3],
    [0, 1, 1],
    [0, -1, 2],
  ])('walks in direction %s,%s without bleeding into another row', (x, y, row) => {
    const animation = new LegendAnimation('oracle-sprites', 30);
    const stepped = { ...hero, transform: { x, y, radius: 0.75, facing: { x: 0, y: 1 } } };
    animation.observe(hero, 1);
    animation.observe(stepped, 2);
    expect(animation.frame(hero, 0)?.frame).toBe(row * 6);
    animation.observe(stepped, 3);
    expect(animation.frame(hero, 0)?.frame).toBe(0);
  });
  it('keeps the last facing frame while idle without cycling a walk pose', () => {
    const animation = new LegendAnimation('oracle-sprites', 30);
    animation.observe(
      { ...hero, transform: { x: 0, y: 0, radius: 0.75, facing: { x: -1, y: 0 } } },
      0,
    );
    expect(animation.frame(hero, 0)?.frame).toBe(18);
    expect(animation.frame(hero, 27)?.frame).toBe(18);
  });
  it('does not walk a Legend that it did not see on the tick before (a respawn)', () => {
    const animation = new LegendAnimation('oracle-sprites', 30);
    const atHome = { ...hero, transform: { x: 40, y: 0, radius: 0.75, facing: { x: 0, y: 1 } } };
    const stepEast = { ...atHome, transform: { ...atHome.transform, x: 41 } };
    animation.observe(hero, 1);

    // Dead and out of the snapshots from tick 2; back at its Stronghold on tick 300.
    animation.observe(atHome, 300);
    const afterRespawn = animation.frame(hero, 0)?.frame;
    animation.observe(stepEast, 301);

    // Row 0 is the idle row; row 4 is the east walk.
    expect([afterRespawn, animation.frame(hero, 0)?.frame]).toEqual([0, 4 * 6]);
  });
  it('plays the staff attack row from the tick of a weapon hit', () => {
    const animation = new LegendAnimation('oracle-sprites', 30);
    animation.attackStarted(0);
    expect(animation.frame(hero, 0)?.frame).toBe(30);
    expect(animation.frame(hero, 12)?.frame).toBeGreaterThan(30);
    expect(animation.frame(hero, 30)?.frame).toBeLessThan(6);
  });
});
