import type { EntitySnapshot, GameEventMap } from '@eternalus/core';
import { createDefaultGameConfig, NullLogger, Simulation } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { TypedEventBus } from '../bridge/TypedEventBus';
import { LegendAnimation } from './LegendAnimation';
import { LEGEND_SKINS } from './LegendAnimation.constants';

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
  it('uses the successful Fury repeat event for its dash pose', () => {
    const { bus, simulation } = events();
    const animation = new LegendAnimation(hero.id, 'knight', 30, simulation);
    bus.emit('ability-recast', { casterId: hero.id, abilityId: 'fury', slot: 'ability-4' });
    expect(animation.frame(hero, 0)?.frame).toBe(42);
    expect(animation.effects(0)[0]?.abilityId).toBe('fury-dash');
    animation.destroy();
    expect(bus.listenerCount()).toBe(0);
  });
  it.each(Object.entries(LEGEND_SKINS))(
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
  it('plays successful casts and lets weapon hits interrupt a buff pose while keeping its effects', () => {
    const { bus, simulation } = events();
    const animation = new LegendAnimation(hero.id, 'knight', 30, simulation);
    for (let i = 0; i < 8; i++)
      bus.emit('ability-cast', { casterId: hero.id, abilityId: 'fury', slot: 'ability-4' });
    expect(animation.frame(hero, 0)?.frame).toBe(54);
    expect(animation.effects(30)).toHaveLength(4);
    bus.emit('damage-applied', {
      targetId: 'tree',
      amount: 1,
      absorbed: 0,
      source: { attackerId: hero.id, kind: 'weapon', definitionId: 'sword' },
    });
    expect(animation.frame(hero, 0)?.frame).toBe(30);
    bus.emit('ability-cast', { casterId: hero.id, abilityId: 'unknown', slot: 'ability-1' });
    bus.emit('ability-cast', { casterId: 'bot', abilityId: 'veil', slot: 'ability-1' });
    expect(animation.effects(181)).toEqual([]);
    expect(animation.effects(-1)).toEqual([]);
    animation.destroy();
  });
  it('falls back for unknown selections without subscriptions or effects', () => {
    const { bus, simulation } = events();
    const animation = new LegendAnimation(null, null, 30, simulation);
    expect(animation.frame(hero, 0)).toBeNull();
    expect(animation.effects(0)).toEqual([]);
    expect(bus.listenerCount()).toBe(0);
    animation.destroy();
  });
});
