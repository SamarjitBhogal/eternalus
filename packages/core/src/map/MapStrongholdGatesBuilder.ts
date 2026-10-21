import type { MapDecoration, MapFeature } from '../content/maps/maps.types';
import { MAP_PALETTE as P } from '../content/maps/map1Scenery';
import { MapDecorationBuilder } from './MapDecorationBuilder';
/** Connects palace corridors to generated gates, leaving the damageable ring visible. */
export class MapStrongholdGatesBuilder extends MapDecorationBuilder {
  /** Each passage ends at its generated gate; generated turrets supply the gate posts. */
  public build(feature: MapFeature, gates: readonly MapFeature[]): readonly MapDecoration[] {
    this.buildingId = feature.id;
    this.layer = 'ground';
    for (const gate of gates.filter(
      (entry) => entry.kind === 'gate' && entry.team === feature.team,
    )) {
      const dx = gate.position.x - feature.position.x;
      const dy = gate.position.y - feature.position.y;
      const length = Math.hypot(dx, dy);
      const nx = (-dy / length) * 10;
      const ny = (dx / length) * 10;
      this.polygon(
        `${feature.id}-${gate.laneId ?? gate.id}-gate-bridge`,
        [
          { x: feature.position.x + dx / 2 - nx, y: feature.position.y + dy / 2 - ny },
          { x: gate.position.x - nx, y: gate.position.y - ny },
          { x: gate.position.x + nx, y: gate.position.y + ny },
          { x: feature.position.x + dx / 2 + nx, y: feature.position.y + dy / 2 + ny },
        ],
        P.palaceInlay,
      );
    }
    return this.pieces;
  }
}
