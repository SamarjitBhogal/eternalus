import { Combat } from '../components/Combat';
import { Transform } from '../components/Transform';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import { distance } from '../utils/geometry';
import { normalizeInto } from '../utils/vec2';
import type { MutableVec2 } from '../utils/vec2.types';
import { BODY_BEFORE_WALL_MARGIN } from './CollisionQuery.constants';
import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';
import type { LineOfFireQuery } from './LineOfFire.types';

/**
 * The match's line-of-fire query (architecture 05 §10, DEC-317), built once by `Simulation` with
 * the projectile definitions. A shot flies from the attacker's centre to the point it is aimed at
 * (`EntityStore.aimPointOf`): an outline's nearest point, which the shot touches there, or a unit's
 * centre, whose circle it touches its radius sooner. The line is clear when `CollisionQuery.reach`
 * covers the way to that contact, less `BODY_BEFORE_WALL_MARGIN`: the rule `ProjectileSystem`
 * lands a shot by, so a fort that is also a wall reads clear. An attacker inside the target's
 * outline hits it at once.
 */
export class LineOfFire implements LineOfFireQuery {
  /** Scratch for the aim point, then the aim direction. */
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /** @param projectiles - The projectile definitions; a shot's radius is its `footprintRadius`. */
  public constructor(
    private readonly projectiles: Pick<ContentCatalogue<ProjectileDefinition>, 'get'>,
  ) {}

  /** {@inheritDoc LineOfFireQuery.isClear} */
  public isClear(state: GameState, attackerId: EntityId, targetId: EntityId): boolean {
    const attacker = state.entities.get(attackerId);
    const attack = attacker?.findComponent(Combat)?.attack;
    const from = attacker?.findComponent(Transform)?.position;
    if (
      state.collisions === null ||
      attack?.strategy !== 'ranged-projectile' ||
      from === undefined
    ) {
      return true;
    }
    const aimed = state.entities.aimPointOf(targetId, from, this.aim);
    if (aimed === null || aimed === 'inside') {
      return true;
    }
    const shotRadius = this.projectiles.get(attack.projectile.projectileId).footprintRadius;
    const targetRadius =
      aimed === 'centre'
        ? (state.entities.get(targetId)?.findComponent(Transform)?.radius ?? 0)
        : 0;
    const contact = distance(from, this.aim) - shotRadius - targetRadius;
    if (contact <= 0) {
      return true;
    }
    normalizeInto(this.aim, { x: this.aim.x - from.x, y: this.aim.y - from.y });
    return (
      state.collisions.reach(from, this.aim, contact, shotRadius) + BODY_BEFORE_WALL_MARGIN >=
      contact
    );
  }
}
