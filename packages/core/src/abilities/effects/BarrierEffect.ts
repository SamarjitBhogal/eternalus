import { AbilityLifetime } from '../../components/AbilityLifetime';
import { MapObjectBody } from '../../components/MapObjectBody';
import { Transform } from '../../components/Transform';
import { TeamMembership } from '../../components/TeamMembership';
import { ZoneArea } from '../../components/ZoneArea';
import type { BarrierSpec } from '../../content/abilities/AbilityDefinition.types';
import type { MapObject } from '../../content/maps/mapObjects.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import { isPlayableTeam } from '../../teams/playableTeams';
import { CONTACT_EPSILON } from '../../utils/circlePolygon.constants';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { fieldRectangle } from '../fieldGeometry';
import { mustBePositive } from '../specChecks';
import type { AbilitySpawn } from '../../state/AbilitySpawn.types';

/** Creates a breakable temporary Shield Wall and installs exact world collision. */
export class BarrierEffect implements AbilityEffect<BarrierSpec> {
  public readonly kind = 'barrier';
  /** Receives the match's shared factory. */
  public constructor(private readonly spawn: AbilitySpawn) {}
  /** Checks geometry and lifetime. */
  public validate(spec: BarrierSpec): readonly string[] {
    return [
      ...mustBePositive(spec.width, 'wall width'),
      ...mustBePositive(spec.thickness, 'wall thickness'),
      ...mustBePositive(spec.durationTicks, 'wall lifetime'),
    ];
  }
  /** The wall places directly in front of its caster rather than at a ranged target. */
  public describe(): readonly AbilityDisplayStep[] {
    return [];
  }
  /** Keeps the near face tangent to the caster, rather than spawning around their body. */
  public apply(spec: BarrierSpec, cast: CastContext): void {
    const body = cast.state.entities.get(cast.casterId)?.getComponent(Transform);
    if (body === undefined) return;
    const direction =
      cast.direction.x === 0 && cast.direction.y === 0 ? body.facing : cast.direction;
    const from = {
      x: body.position.x + direction.x * (body.radius + CONTACT_EPSILON),
      y: body.position.y + direction.y * (body.radius + CONTACT_EPSILON),
    };
    const polygon = fieldRectangle(from, direction, spec.thickness, spec.width);
    const team = cast.state.entities.teamOf(cast.casterId);
    const wall = this.spawn('ability-shield-wall', {
      position: from,
      ...(team === undefined ? {} : { team }),
    });
    if (team !== undefined) wall.addComponent(new TeamMembership(team));
    const object: MapObject = {
      id: wall.id,
      kind: 'wall',
      footprints: [polygon],
      isBlocking: true,
      ...(team !== undefined && isPlayableTeam(team) ? { team } : {}),
    };
    wall.addComponent(new MapObjectBody(object));
    wall.addComponent(new ZoneArea([polygon]));
    wall.addComponent(
      new AbilityLifetime(cast.casterId, cast.abilityId, cast.tick + spec.durationTicks),
    );
    cast.state.worldObjects?.add(object, wall);
    cast.state.collisions?.addObstacle?.(wall.id, polygon);
    const cells = cast.state.world?.grid.stampFootprint(polygon) ?? [];
    if (cells.length > 0) cast.state.events.emit('terrain-changed', { cells });
    // Headless maps may omit scenery ownership. Their temporary geometry must still retire;
    // normal maps use the existing WorldObjectStore removal path instead, exactly once.
    if (cast.state.worldObjects === undefined) {
      const unsubscribe = cast.state.events.on('entity-removed', ({ entityId }) => {
        if (entityId !== wall.id) return;
        cast.state.collisions?.removeObstacle?.(entityId);
        const cleared = cast.state.world?.grid.clearFootprint(polygon) ?? [];
        if (cleared.length > 0) cast.state.events.emit('terrain-changed', { cells: cleared });
        unsubscribe();
      });
    }
  }
}
