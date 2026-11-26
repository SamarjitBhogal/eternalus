import type { EntitySnapshot, GameEventMap } from '@eternalus/core';
import { createDefaultGameConfig, NullLogger, Simulation } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { LegendAnimation } from './LegendAnimation';
import { LEGEND_SPRITE_SHEETS } from './LegendAnimation.constants';

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
const base = () =>
  new Simulation({
    config: createDefaultGameConfig(),
    seed: 1,
    logger: new NullLogger(),
  }).snapshot();
const events = () => {
  const bus = new TypedEventBus<GameEventMap>();
  return { bus, simulation: { tick: 0, on: bus.on.bind(bus) } };
};

describe('LegendAnimation on Phase 3', () => {
  it.each(Object.entries(LEGEND_SPRITE_SHEETS).map(([spec, { atlasId }]) => [spec, atlasId]))(
    'selects the %s sheet and leaves other entities unchanged',
    (spec, atlasId) => {
      const { simulation } = events();
      const animation = new LegendAnimation(hero.id, spec, 30, simulation);
      expect(animation.frame(hero, 0)).toEqual({ atlasId, frame: 0 });
      expect(animation.frame({ ...hero, id: 'bot' }, 0)).toBeNull();
      expect(animation.frame({ ...hero, health: { current: 0, max: 800 } }, 0)).toBeNull();
      animation.destroy();
    },
  );
  it.each([
    [1, 0, 4],
    [-1, 0, 3],
    [0, 1, 1],
    [0, -1, 2],
  ])('walks in direction %s,%s without bleeding into another row', (x, y, row) => {
    const { simulation } = events();
    const animation = new LegendAnimation(hero.id, 'oracle', 30, simulation);
    const snapshot = base();
    animation.observe(
      { ...snapshot, entities: [hero] },
      {
        ...snapshot,
        entities: [{ ...hero, transform: { x, y, radius: 0.75, facing: { x: 0, y: 1 } } }],
      },
    );
    expect(animation.frame(hero, 0)?.frame).toBe(row * 6);
    animation.observe(null, snapshot);
    expect(animation.frame(hero, 0)?.frame).toBe(0);
    animation.destroy();
  });
  it('keeps the last facing frame while idle without cycling a walk pose', () => {
    const { simulation } = events();
    const animation = new LegendAnimation(hero.id, 'oracle', 30, simulation);
    const snapshot = base();
    animation.observe(null, {
      ...snapshot,
      entities: [{ ...hero, transform: { x: 0, y: 0, radius: 0.75, facing: { x: -1, y: 0 } } }],
    });
    expect(animation.frame(hero, 0)?.frame).toBe(18);
    expect(animation.frame(hero, 27)?.frame).toBe(18);
    animation.destroy();
  });
  it('uses actual weapon damage for staff attack animation and releases its listeners', () => {
    const { bus, simulation } = events();
    const animation = new LegendAnimation(hero.id, 'oracle', 30, simulation);
    bus.emit('damage-applied', {
      targetId: 'tree',
      amount: 1,
      absorbed: 0,
      source: { attackerId: hero.id, kind: 'weapon', definitionId: 'staff' },
    });
    expect(animation.frame(hero, 0)?.frame).toBe(30);
    expect(animation.frame(hero, 12)?.frame).toBeGreaterThan(30);
    expect(animation.frame(hero, 30)?.frame).toBeLessThan(6);
    animation.destroy();
    expect(bus.listenerCount()).toBe(0);
  });
  it('falls back for unknown selections without subscriptions', () => {
    const { bus, simulation } = events();
    const animation = new LegendAnimation(null, null, 30, simulation);
    expect(animation.frame(hero, 0)).toBeNull();
    expect(bus.listenerCount()).toBe(0);
    animation.destroy();
  });
});
