import { Combat } from '../components/Combat';
import { Transform } from '../components/Transform';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import { distance } from '../utils/geometry';
import { normalizeInto, subInto } from '../utils/vec2';
import type { MutableVec2 } from '../utils/vec2.types';
import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';
import { isTouchedBeforeWall } from './isTouchedBeforeWall';
import type { LineOfFireQuery } from './LineOfFire.types';

/**
 * The match's line-of-fire query (architecture 05 §10, DEC-317), built once by `Simulation` with
 * the projectile definitions. A shot flies from the attacker's centre to the point it is aimed at
 * (`EntityStore.aimPointOf`): an outline's nearest point, which the shot touches there, or a unit's
 * centre, whose circle it touches its radius sooner. The line is clear when that contact is within
 * the shot's `range` and touched before the first wall (`isTouchedBeforeWall` on
 * `CollisionQuery.reach`): the rule `ProjectileSystem` lands a shot by, so a fort that is also a
 * wall reads clear. An attack needs a line only when it fires a projectile. An attacker inside the
 * target's outline hits it at once.
 */
export class LineOfFire implements LineOfFireQuery {
  /** Scratch for the aim point, then the aim direction. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /**
   * @param projectiles - The projectile definitions: a shot sweeps its `footprintRadius` and flies
   *   its `range`.
   */
  public constructor(
    private readonly projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'get'>,
  ) {}

  /** {@inheritDoc LineOfFireQuery.isClear} */
  public isClear(state: GameState, attackerId: EntityId, targetId: EntityId): boolean {
    const attacker = state.entities.get(attackerId);
    const attack = attacker?.findComponent(Combat)?.attack;
    const from = attacker?.findComponent(Transform)?.position;
    const target = state.entities.get(targetId);
    if (
      state.collisions === null ||
      attack === undefined ||
      !('projectile' in attack) ||
      from === undefined ||
      target === undefined
    ) {
      return true;
    }
    const aimed = state.entities.aimPointOf(targetId, from, this.aim);
    if (aimed === null || aimed === 'inside') {
      return true;
    }
    const shot = this.projectiles.get(attack.projectile.projectileId);
    const targetRadius = aimed === 'centre' ? target.getComponent(Transform).radius : 0;
    const contact = distance(from, this.aim) - shot.footprintRadius - targetRadius;
    if (contact <= 0) {
      return true;
    }
    if (contact > shot.range) {
      return false;
    }
    normalizeInto(this.aim, subInto(this.aim, this.aim, from));
    return isTouchedBeforeWall(
      contact,
      state.collisions.reach(from, this.aim, contact, shot.footprintRadius),
    );
  }
}
