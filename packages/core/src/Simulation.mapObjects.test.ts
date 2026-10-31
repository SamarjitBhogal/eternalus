import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from './config/defaultGameConfig';
import { DEFAULT_MAP_LAYOUT } from './content/maps/defaultMapLayout';
import { NullLogger } from './diagnostics/NullLogger';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';

/** Both teams' bots as the client composes them: laners plus a Rover that starts in its palace. */
const roster = (legendsPerTeam: number): RosterSlot[] =>
  (['light', 'dark'] as const).flatMap((team) => [
    ...Array.from({ length: legendsPerTeam - 1 }, () => ({
      team,
      definitionId: 'warrior',
      role: 'laner' as const,
      difficulty: 'normal',
    })),
    { team, definitionId: 'warrior', role: 'rover' as const, difficulty: 'rover' },
  ]);

describe('Simulation with a roster and map objects (as the client builds a match)', () => {
  it.each([1, 2])(
    'every bot Legend leaves its Stronghold wall ring within 30 seconds (seed %i)',
    (seed) => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate(config, seed);
      const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const simulation = new Simulation({
        config,
        seed,
        logger: new NullLogger(),
        map,
        mapObjects,
        roster: roster(config.match.legendsPerTeam),
      });
      const strongholds = new Map(
        map.features
          .filter(({ kind }) => kind === 'stronghold')
          .map(({ team, position }) => [team, position]),
      );
      for (let tick = 0; tick < 30 * config.tickRate; tick += 1) {
        simulation.step();
      }

      const legends = simulation.snapshot().entities.filter(({ kind }) => kind === 'warrior');
      expect(legends).toHaveLength(2 * config.match.legendsPerTeam);
      const stillHome = legends.filter(({ team, transform }) => {
        const home = strongholds.get(team ?? 'neutral');
        const at = transform ?? { x: 0, y: 0 };
        return (
          home === undefined ||
          Math.hypot(at.x - home.x, at.y - home.y) <= DEFAULT_MAP_LAYOUT.wallRing.radius
        );
      });
      expect(stillHome).toEqual([]);
    },
  );

  it('lets only the other side attack what a side built; scenery takes attacks from both (DEC-121 (a))', () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed: 1,
      logger: new NullLogger(),
      map,
      mapObjects,
    });
    for (const team of ['light', 'dark'] as const) {
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team,
        at: { x: 400, y: 450 },
        count: 1,
      });
    }
    simulation.step();
    const { entities, mapObjects: objects = [] } = simulation.snapshot();
    const warrior = (team: string) => entities.find((e) => e.kind === 'warrior' && e.team === team);
    const entityOf = (id: string) => objects.find((o) => o.id === id)?.entityId ?? '';
    const lightPalaceWall = mapObjects.find(
      (o) => o.buildingId === 'light-stronghold' && o.kind === 'wall',
    );
    const tree = mapObjects.find((o) => o.kind === 'tree');
    const rejected: string[] = [];
    simulation.on('command-rejected', ({ command, reason }) => {
      rejected.push(`${'targetId' in command ? String(command.targetId) : ''}:${reason}`);
    });
    const targets = [
      entityOf('light-stronghold'),
      entityOf(lightPalaceWall?.id ?? ''),
      entityOf(tree?.id ?? ''),
    ];
    for (const actor of [warrior('light'), warrior('dark')]) {
      for (const targetId of targets) {
        simulation.enqueueCommand({ type: 'attack-target', actorId: actor?.id ?? '', targetId });
      }
    }
    simulation.step();

    expect(targets.every((id) => id.startsWith('entity-'))).toBe(true);
    expect(rejected).toEqual([
      `${targets[0] ?? ''}:invalid-target`,
      `${targets[1] ?? ''}:invalid-target`,
    ]);
  });
});
