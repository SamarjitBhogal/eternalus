import { Aether } from '../components/Aether';
import { Capturable } from '../components/Capturable';
import { Health } from '../components/Health';
import { MapObjectBody } from '../components/MapObjectBody';
import { Movement } from '../components/Movement';
import { Progression } from '../components/Progression';
import { ProjectileFlight } from '../components/ProjectileFlight';
import { StatusEffects } from '../components/StatusEffects';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { LevelCurveDefinition } from '../content/progression/progression.types';
import type { Entity } from '../entities/Entity';
import { Structure } from '../entities/structures/Structure';
import type { EntitySnapshot, ProjectileSnapshot, StatusSnapshot } from './Snapshot.types';

/**
 * Projects one entity into its `EntitySnapshot` (architecture 03 §5): one group per component,
 * `null` when the entity has no such component (DEC-17); `mapObjectId` and `mapFeatureId` are
 * left out instead. A new component group is added here, never in `GameState` (DEC-232).
 */
export class EntitySnapshotter {
  /**
   * @param checkpoints - How many checkpoints a full capture passes (`GameConfig.match.capturePoints`).
   * @param curves - The level curves a `Progression` levels along (the catalogue
   *   `ProgressionSystem` uses), to report the XP inside each level.
   * @param tick - The tick the snapshot shows (`GameState.tick`), to time the statuses.
   */
  public constructor(
    private readonly checkpoints: number,
    private readonly curves: Pick<ContentCatalogue<LevelCurveDefinition>, 'get'>,
    private readonly tick: number,
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
      ...(entity instanceof Structure &&
        entity.mapFeatureId !== null && { mapFeatureId: entity.mapFeatureId }),
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
      statuses: this.statusesOf(entity.findComponent(StatusEffects)),
      projectile: this.projectileOf(entity),
    };
  }

  /** A shot's speed and ending as plain data; `null` for an entity with no `ProjectileFlight`. */
  private projectileOf(entity: Entity): ProjectileSnapshot | null {
    const flight = entity.findComponent(ProjectileFlight);
    const movement = entity.findComponent(Movement);
    if (flight === undefined || movement === undefined) {
      return null;
    }
    return {
      speedShare: movement.speed / movement.maxSpeed,
      ending: flight.isEnded ? flight.endingShare : null,
    };
  }

  /** The active statuses as plain data; one shared empty list for none, so most allocate none. */
  private statusesOf(statuses: StatusEffects | undefined): readonly StatusSnapshot[] | null {
    const { tick } = this;
    if (statuses === undefined) {
      return null;
    }
    const { active } = statuses;
    return active.length === 0
      ? NO_STATUSES
      : active.map(({ definition, periodAnchorTick, expiresTick }) => ({
          id: definition.id,
          ticksActive: tick - periodAnchorTick,
          ticksLeft: expiresTick === null ? null : expiresTick - tick,
        }));
  }
}

const NO_STATUSES: readonly StatusSnapshot[] = [];
