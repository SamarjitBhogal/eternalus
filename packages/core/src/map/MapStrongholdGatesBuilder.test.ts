import { describe, expect, it } from 'vitest';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MapGenerator } from './MapGenerator';
import { MapStrongholdGatesBuilder } from './MapStrongholdGatesBuilder';
import { MapPresentationBuilder } from './MapPresentationBuilder';
describe('MapStrongholdGatesBuilder', () => {
  it.each([3, 5])(
    'connects every generated gate at %s lanes and aligns the throne carpet with the middle entrance',
    (numLanes) => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate({ ...config, map: { ...config.map, numLanes } }, 1);
      const presentation = new MapPresentationBuilder().build(map);
      for (const feature of map.features.filter((f) => f.kind === 'stronghold')) {
        const passages = new MapStrongholdGatesBuilder().build(feature, map.features);
        const gates = map.features.filter((f) => f.kind === 'gate' && f.team === feature.team);
        expect(passages).toHaveLength(numLanes);
        for (const gate of gates) {
          const passage = passages.find(
            (p) => p.id === `${feature.id}-${gate.laneId ?? gate.id}-gate-bridge`,
          );
          expect(passage?.visibility).toBeUndefined();
          expect(passage?.layer).toBe('ground');
          const a = passage?.shape[1];
          const b = passage?.shape[2];
          expect(((a?.x ?? 0) + (b?.x ?? 0)) / 2).toBeCloseTo(gate.position.x);
          expect(((a?.y ?? 0) + (b?.y ?? 0)) / 2).toBeCloseTo(gate.position.y);
        }
        const carpet = presentation.scenery.find(
          (p) => p.id === `${feature.team}-palace-interior-carpet`,
        );
        expect(carpet).toBeDefined();
        const xs = carpet?.shape.map((p) => p.x) ?? [];
        const ys = carpet?.shape.map((p) => p.y) ?? [];
        expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(
          Math.max(...ys) - Math.min(...ys),
        );
        expect((Math.max(...ys) + Math.min(...ys)) / 2).toBeCloseTo(feature.position.y);
        const gate = gates.find((g) => g.laneId === `lane-${String(Math.floor(numLanes / 2))}`);
        expect(gate?.position.y).toBeCloseTo(feature.position.y);
        expect(feature.team === 'light' ? Math.max(...xs) : Math.min(...xs)).toBeCloseTo(
          feature.position.x + (feature.team === 'light' ? 1 : -1) * 99 * (90 / 101) * (78 / 133),
        );
      }
    },
  );
});
