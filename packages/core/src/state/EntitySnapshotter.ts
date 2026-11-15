import { Aether } from '../components/Aether';
import { Capturable } from '../components/Capturable';
import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { Progression } from '../components/Progression';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import type { Entity } from '../entities/Entity';
import type { EntitySnapshot } from './Snapshot.types';

/**
 * Projects one entity into its `EntitySnapshot` (architecture 03 §5): one group per component,
 * `null` when the entity has no such component (DEC-17); `mapObjectId` is left out instead. A new component group is added here,
 * never in `GameState` (DEC-232).
 */
export class EntitySnapshotter {
  /**
   * @param checkpoints - How many checkpoints a full capture passes (`GameConfig.match.capturePoints`).
   * @param curves - The level curves a `Progression` levels along (the catalogue
   *   `ProgressionSystem` uses), to report the XP inside each level.
   */
  public constructor(
    private readonly checkpoints: number,
    private readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>,
  ) {}

  /** The entity as plain, structured-clone-safe data. */
  public snapshotOf(entity: Entity): EntitySnapshot {
    const transform = entity.findComponent(Transform);
    const health = entity.findComponent(Health);
    const progression = entity.findComponent(Progression);
    const aether = entity.findComponent(Aether);
    const capture = entity.findComponent(Capturable);
    return {
      id: entity.id,
      kind: entity.kind,
      family: entity.family,
      definitionId: entity.definitionId,
      ...(entity.findComponent(MapObjectBody) === undefined
        ? {}
        : { mapObjectId: entity.getComponent(MapObjectBody).object.id }),
      team: entity.findComponent(TeamMembership)?.team ?? null,
      transform:
        transform === undefined
          ? null
          : {
              x: transform.position.x,
              y: transform.position.y,
              radius: transform.radius,
              facing: { x: transform.facing.x, y: transform.facing.y },
            },
      health: health === undefined ? null : { current: health.current, max: health.max },
      progression:
        progression === undefined
          ? null
          : {
              level: progression.level,
              ...progression.levelProgress(this.curves.get(progression.curveId)),
            },
      aether: aether === undefined ? null : { current: aether.current, max: aether.max },
      area: entity.findComponent(ZoneArea)?.polygons ?? null,
      capture:
        capture === undefined
          ? null
          : {
              owner: capture.owner,
              progress: capture.progress,
              checkpoint: capture.checkpoint,
              checkpoints: this.checkpoints,
              lockedBy: capture.lockedBy,
              presence: capture.presence,
            },
    };
  }
}
