import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { MapGenerator } from './MapGenerator';
import { MapPalaceWallsBuilder } from './MapPalaceWallsBuilder';
import { CollisionResolver } from '../physics/CollisionResolver';
import { StaticCollisionIndex } from '../physics/StaticCollisionIndex';
import { MapBuildingInteriorBuilder } from './MapBuildingInteriorBuilder';

describe('MapPalaceWallsBuilder', () => {
  it('keeps both Cathedral entrances open while its side walls remain solid', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const cathedral = map.features.find((feature) => feature.kind === 'cathedral');
    if (cathedral === undefined) throw new Error('Missing Cathedral');
    const walls = new MapBuildingInteriorBuilder()
      .build(cathedral)
      .filter((piece) => piece.object?.kind === 'wall' && piece.object.isFootprint);
    const resolver = new CollisionResolver(
      new StaticCollisionIndex(walls.map((piece) => ({ id: piece.id, polygon: piece.shape }))),
    );
    expect(resolver.move({ x: 800, y: 310 }, { x: 0, y: 25 }, 0.5).y).toBe(335);
    expect(resolver.move({ x: 800, y: 560 }, { x: 0, y: -20 }, 0.5).y).toBe(540);
    expect(resolver.move({ x: 695, y: 450 }, { x: 20, y: 0 }, 0.5).x).toBeLessThan(703);
  });
  it('blocks the oval perimeter while preserving every generated lane entrance for both teams', () => {
    const map = new MapGenerator().generate(createDefaultGameConfig(), 1);
    const scale =
      (DEFAULT_MAP_LAYOUT.wallRing.radius -
        DEFAULT_MAP_LAYOUT.wallRing.thickness -
        G.stronghold.clearance) /
      G.stronghold.extent;
    for (const feature of map.features.filter((f) => f.kind === 'stronghold')) {
      const walls = new MapPalaceWallsBuilder().build(feature, map, DEFAULT_MAP_LAYOUT.wallRing);
      const resolver = new CollisionResolver(
        new StaticCollisionIndex(walls.map((p) => ({ id: p.id, polygon: p.shape }))),
      );
      for (const gate of map.features.filter((f) => f.kind === 'gate' && f.team === feature.team)) {
        const dx = gate.position.x - feature.position.x;
        const dy = gate.position.y - feature.position.y;
        const length = Math.hypot(dx, dy);
        const ux = dx / length;
        const uy = dy / length;
        const r =
          1 /
          Math.sqrt(
            (ux / (G.palace.floorRadiusX * scale)) ** 2 +
              (uy / (G.palace.floorRadiusY * scale)) ** 2,
          );
        const start = {
          x: feature.position.x + ux * (r - 4),
          y: feature.position.y + uy * (r - 4),
        };
        const end = resolver.move(start, { x: ux * 8, y: uy * 8 }, 0.5);
        expect(end.x).toBeCloseTo(start.x + ux * 8);
        expect(end.y).toBeCloseTo(start.y + uy * 8);
      }
      const start = {
        x: feature.position.x,
        y: feature.position.y - G.palace.floorRadiusY * scale - 3,
      };
      const end = resolver.move(start, { x: 0, y: 10 }, 0.5);
      expect(end.y).toBeLessThan(start.y + 10);
    }
  });
});
