import {
  createDefaultGameConfig,
  NullLogger,
  Simulation,
  type EntitySnapshot,
} from '@eternalus/core';
import { describe, expect, it } from 'vitest';
import { LegendAnimation } from './LegendAnimation';

const hero: EntitySnapshot = {
  id: 'entity-1',
  kind: 'magus',
  family: 'legend',
  definitionId: 'magus',
  team: 'light',
  transform: { x: 0, y: 0, radius: 0.75 },
  health: { current: 800, max: 800 },
  aether: { current: 140, max: 140 },
  progression: null,
  area: null,
  capture: null,
};
const simulation = () =>
  new Simulation({
    config: createDefaultGameConfig({ match: { countdownSeconds: 0 } }),
    seed: 1,
    logger: new NullLogger(),
  });

describe('LegendAnimation', () => {
  it.each([
    ['assassin', 'warrior'],
    ['knight', 'warrior'],
    ['paladin', 'warrior'],
    ['colossus', 'sentinel'],
    ['juggernaut', 'sentinel'],
  ])('shows the selected %s skin and animates real melee damage', (spec, kind) => {
    const sim = simulation();
    const animation = new LegendAnimation(hero.id, spec, 30, sim);
    const selected = { ...hero, kind, definitionId: kind };
    expect(animation.frame(selected, 0)).toEqual({ atlasId: `${spec}-sprites`, frame: 0 });
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind,
      definitionId: kind,
      team: 'light',
      at: { x: 0, y: 0 },
      count: 1,
    });
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind: 'light-mob',
      definitionId: 'training-dummy',
      team: 'dark',
      at: { x: 1, y: 0 },
      count: 1,
    });
    sim.step();
    sim.enqueueCommand({ type: 'attack-target', actorId: hero.id, targetId: 'entity-2' });
    sim.step();
    expect(animation.frame(selected, sim.tick)?.frame).toBeGreaterThanOrEqual(30);
    expect(animation.frame(selected, sim.tick)?.frame).toBeLessThan(36);
    expect(animation.frame({ ...selected, id: 'bot' }, sim.tick)).toBeNull();
    animation.destroy();
  });
  it('plays the explicitly approved Nova preview row', () => {
    const sim = simulation(),
      animation = new LegendAnimation(hero.id, 'necromancer', 30, sim);
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind: 'magus',
      definitionId: 'magus',
      team: 'light',
      at: { x: 0, y: 0 },
      count: 1,
    });
    sim.step();
    sim.enqueueCommand({
      type: 'cast-ability',
      actorId: hero.id,
      slot: 'ability-4',
      aim: { point: { x: 0, y: 0 }, targetId: null },
    });
    sim.step();
    expect(animation.frame(hero, 1)).toEqual({ atlasId: 'necromancer-sprites', frame: 54 });
    expect(animation.frame(hero, 8)?.frame).toBe(55);
    animation.destroy();
  });
  it('unsubscribes all successful-action listeners and adds none for unsupported skins', () => {
    let released = 0;
    const simulation = {
      tick: 0,
      on: () => () => {
        released += 1;
      },
    };
    const supported = new LegendAnimation(hero.id, 'oracle', 30, simulation);
    const fallback = new LegendAnimation(hero.id, null, 30, simulation);
    fallback.destroy();
    expect(released).toBe(0);
    supported.destroy();
    expect(released).toBe(4);
  });
  it.each(['catalyst', 'oracle', 'necromancer'])(
    'selects the %s atlas and cycles six idle frames',
    (spec) => {
      const animation = new LegendAnimation(hero.id, spec, 30, simulation());
      expect(animation.frame(hero, 0)).toEqual({ atlasId: `${spec}-sprites`, frame: 0 });
      expect(animation.frame(hero, 6)?.frame).toBe(1);
      expect(animation.frame(hero, 36)?.frame).toBe(0);
      expect(animation.frame({ ...hero, id: 'bot' }, 0)).toBeNull();
      animation.destroy();
    },
  );
  it('retains the fallback for unsupported selections and dead heroes', () => {
    const animation = new LegendAnimation(hero.id, 'unknown', 30, simulation());
    expect(animation.frame(hero, 0)).toBeNull();
    const supported = new LegendAnimation(hero.id, 'oracle', 30, simulation());
    expect(supported.frame({ ...hero, health: { current: 0, max: 800 } }, 0)).toBeNull();
    animation.destroy();
    supported.destroy();
  });
  it('starts the cast row only after a successful cast, then returns to idle', () => {
    const sim = simulation();
    const animation = new LegendAnimation(hero.id, 'oracle', 30, sim);
    sim.enqueueCommand({
      type: 'dev-spawn',
      kind: 'magus',
      definitionId: 'magus',
      team: 'light',
      at: { x: 0, y: 0 },
      count: 1,
    });
    sim.step();
    sim.enqueueCommand({
      type: 'cast-ability',
      actorId: hero.id,
      slot: 'ability-1',
      aim: { point: { x: 0, y: 0 }, targetId: null },
    });
    sim.step();
    expect(animation.frame(hero, 1)?.frame).toBe(36);
    expect(animation.frame(hero, 8)?.frame).toBe(37);
    sim.enqueueCommand({
      type: 'cast-ability',
      actorId: hero.id,
      slot: 'ability-1',
      aim: { point: { x: 0, y: 0 }, targetId: null },
    });
    sim.step();
    expect(animation.frame(hero, 8)?.frame).toBe(37);
    expect(animation.frame(hero, 40)?.frame).toBeLessThan(6);
    animation.destroy();
  });
  it.each([
    [1, 0, 4],
    [-1, 0, 3],
    [0, -1, 2],
    [0, 1, 1],
  ])('uses the movement direction %s,%s', (x, y, row) => {
    const sim = simulation(),
      animation = new LegendAnimation(hero.id, 'catalyst', 30, sim);
    const before = { ...sim.snapshot(), entities: [hero] };
    const after = { ...before, entities: [{ ...hero, transform: { x, y, radius: 0.75 } }] };
    animation.observe(before, after);
    expect(animation.frame(hero, 0)?.frame).toBe(row * 6);
    animation.observe(after, after);
    expect(animation.frame(hero, 0)?.frame).toBe(0);
    animation.destroy();
  });
});
