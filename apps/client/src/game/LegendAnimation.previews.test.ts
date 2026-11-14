import { createDefaultGameConfig, NullLogger, Simulation } from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { LegendAnimation } from './LegendAnimation';

function setup(spec = 'knight', kind = 'warrior') {
  const sim = new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds: 0 } }),
    seed: 1,
    logger: new NullLogger(),
  });
  sim.enqueueCommand({
    type: 'dev-spawn',
    kind,
    definitionId: kind,
    team: 'light',
    at: { x: 10, y: 10 },
    count: 1,
  });
  sim.step();
  const hero = sim.snapshot().entities[0];
  if (hero === undefined) throw new Error('Test Legend did not spawn');
  const animation = new LegendAnimation(hero.id, spec, 30, sim);
  animation.observe(null, sim.snapshot());
  const cast = (slot: 'ability-1' | 'ability-2' | 'ability-3' | 'ability-4') => {
    sim.enqueueCommand({
      type: 'cast-ability',
      actorId: hero.id,
      slot,
      aim: { point: { x: 20, y: 10 }, targetId: null },
    });
    sim.step();
  };
  return { sim, hero, animation, cast };
}

describe('repaired combat sprite playback', () => {
  it.each([
    ['assassin', 'warrior'],
    ['knight', 'warrior'],
    ['paladin', 'warrior'],
    ['colossus', 'sentinel'],
    ['juggernaut', 'sentinel'],
  ])('keeps every %s ability inside its dedicated six-frame row', (spec, kind) => {
    const { sim, hero, animation, cast } = setup(spec, kind);
    const slots = ['ability-1', 'ability-2', 'ability-3', 'ability-4'] as const;
    slots.forEach((slot, i) => {
      cast(slot);
      const start = sim.tick;
      const row = i + 6;
      const duration = [2.4, 1.8, 1.8, 3.6];
      if (kind === 'sentinel') duration.splice(0, 4, 2.8, 2.4, 2.8, 3.6);
      const seconds = duration[i];
      if (seconds === undefined) throw new Error('Missing test duration');
      for (let step = 0; step < 6; step++)
        expect(animation.frame(hero, start + ((step + 0.1) / 6) * seconds * 30)).toEqual({
          atlasId: `${spec}-sprites`,
          frame: row * 6 + step,
        });
      expect(animation.frame(hero, start + seconds * 30 + 1)?.frame).toBeLessThan(6);
    });
    animation.destroy();
  });
  it('does not interrupt Fury with a successful weapon hit', () => {
    const { sim, hero, animation, cast } = setup();
    cast('ability-4');
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind: 'light-mob',
      definitionId: 'training-dummy',
      team: 'dark',
      at: { x: 11, y: 10 },
      count: 1,
    });
    sim.step();
    sim.enqueueCommand({ type: 'attack-target', actorId: hero.id, targetId: 'entity-2' });
    sim.step();
    expect(sim.snapshot().entities.find((e) => e.id === 'entity-2')?.health?.current).toBeLessThan(
      100,
    );
    expect(animation.frame(hero, sim.tick)?.frame).toBeGreaterThanOrEqual(54);
    expect(animation.frame(hero, sim.tick + 60)?.frame).toBeGreaterThanOrEqual(54);
    animation.destroy();
  });
  it('anchors scars to the cast ground, caps history, expires it and releases it on teardown', () => {
    const { sim, hero, animation, cast } = setup('colossus', 'sentinel');
    cast('ability-4');
    const first = animation.effects(sim.tick)[0];
    if (first === undefined) throw new Error('Cast effect was not recorded');
    expect(first.origin).toEqual({ x: 10, y: 10 });
    const snapshot = sim.snapshot();
    animation.observe(snapshot, {
      ...snapshot,
      entities: [{ ...hero, transform: { x: 9, y: 10, radius: 0.75 } }],
    });
    expect(animation.effects(sim.tick)[0]?.origin).toEqual(first.origin);
    expect(animation.effects(sim.tick + 120)[0]?.progress).toBe(1);
    expect(animation.effects(sim.tick + 120)[0]?.fade).toBeGreaterThan(0);
    expect(animation.effects(sim.tick - 2)).toEqual([]);
    for (let i = 0; i < 6; i++) cast('ability-2');
    expect(animation.effects(sim.tick)).toHaveLength(4);
    expect(animation.effects(sim.tick)[3]?.direction).toEqual({ x: -1, y: 0 });
    expect(animation.effects(sim.tick + 180)).toEqual([]);
    animation.destroy();
    expect(animation.effects(sim.tick)).toEqual([]);
  });
  it('keeps Magus timing and ornaments outside combat effect history', () => {
    const { sim, hero, animation, cast } = setup('catalyst', 'magus');
    cast('ability-1');
    expect(animation.frame(hero, sim.tick + 18)?.frame).toBe(39);
    expect(animation.effects(sim.tick)).toEqual([]);
    animation.destroy();
    const unsupported = setup('unknown');
    expect(unsupported.animation.effects(0)).toEqual([]);
    unsupported.animation.destroy();
  });
});
