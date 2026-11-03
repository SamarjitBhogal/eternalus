import { describe, expect, it } from 'vitest';
import { Simulation } from '../Simulation';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { NullLogger } from '../diagnostics/NullLogger';
import { MapGenerator } from './MapGenerator';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { MapObjectBuilder } from './MapObjectBuilder';

describe('map-object destruction scenario', () => {
  it('destroys a house using normal attacks and replays seed, objects and rubble state deterministically', () => {
    const run = (): number => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate(config, 1);
      const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const house = objects.find((o) => o.kind === 'house');
      if (house === undefined) throw new Error('No house');
      const points = house.footprints.flat();
      const left = Math.min(...points.map((p) => p.x));
      const y = (Math.min(...points.map((p) => p.y)) + Math.max(...points.map((p) => p.y))) / 2;
      const sim = new Simulation({
        config,
        seed: 1,
        logger: new NullLogger(),
        map,
        mapObjects: objects,
      });
      sim.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team: 'light',
        at: { x: left - 1, y },
        count: 1,
      });
      sim.step();
      const attacker = sim.snapshot().entities.find((e) => e.kind === 'warrior');
      const target = sim.snapshot().mapObjects?.find((o) => o.id === house.id);
      if (attacker === undefined || target?.entityId == null) throw new Error('Missing combatants');
      sim.enqueueCommand({ type: 'move', actorId: attacker.id, direction: { x: 1, y: 0 } });
      for (let i = 0; i < 30; i++) sim.step();
      const blocked = sim.snapshot().entities.find((e) => e.id === attacker.id);
      expect(blocked?.transform?.x).toBeLessThan(left);
      sim.enqueueCommand({ type: 'stop', actorId: attacker.id });
      sim.enqueueCommand({
        type: 'attack-target',
        actorId: attacker.id,
        targetId: target.entityId,
      });
      for (let i = 0; i < 65; i++) sim.step();
      expect(sim.snapshot().mapObjects?.find((o) => o.id === house.id)).toMatchObject({
        isDestroyed: true,
        health: { current: 0, max: 100 },
      });
      expect(sim.snapshot().entities.some((e) => e.id === target.entityId)).toBe(false);
      sim.enqueueCommand({ type: 'move', actorId: attacker.id, direction: { x: 1, y: 0 } });
      for (let i = 0; i < 30; i++) sim.step();
      const crossed = sim.snapshot().entities.find((e) => e.id === attacker.id);
      expect(crossed?.transform?.x).toBeGreaterThan(left);
      return sim.hash();
    };
    expect(run()).toBe(run());
  });
});
