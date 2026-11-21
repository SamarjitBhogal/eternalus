import { Transform } from '../components/Transform';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { GameState } from '../state/GameState';
import { wallHitFrom } from '../state/wallHitFrom';
import type { MutableVec2 } from '../utils/vec2.types';
import type { Vec2 } from '../utils/geometry.types';
import { isPointInAnyPolygon } from '../utils/geometry';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * An attacker that stands inside a building deals more damage to that building's walls (DEC-247
 * (2), DEC-288, DEC-315; BUG-2). The walls keep their health, so only the hit grows (DEC-247 (1)).
 *
 * What counts, as built (readings the owner may overrule):
 * - A building is the Stronghold, the Cathedral or a lane tower's fort. A house has no inside yet
 *   (DEC-311, DEC-313), so it never qualifies.
 * - Its walls are its `'wall'` map objects with a `buildingId` (Stronghold, Cathedral), and the
 *   wall pieces of a lane tower's fort (`MapObject.partOf`) while the tower stands. A hit on the
 *   tower's body, a gate or a turret gets no bonus; a fort wall left standing after its tower fell
 *   is scenery and gets none.
 * - "Inside a tower fort" is standing in its court. Which piece of a fort a hit lands on is the
 *   one nearest the attacker (`wallHitFrom`), as `DamageSource` carries no hit point.
 * - The attacker's own position counts (`source.attackerId`), so a ranged attacker inside gets the
 *   bonus too.
 */
export class InteriorAttackStep implements DamageStep {
  public readonly name = 'interior-attack';
  private readonly aim: MutableVec2 = { x: 0, y: 0 };

  /**
   * @param multiplier - The factor on a hit by an attacker inside, from content.
   * @throws Error when it is not a finite number above 1.
   */
  public constructor(private readonly multiplier: number) {
    if (!(Number.isFinite(multiplier) && multiplier > 1)) {
      throw new Error(`InteriorAttackStep: needs a multiplier above 1, got ${String(multiplier)}.`);
    }
  }

  /** Returns the amount times the multiplier when the attacker stands inside the wall's building. */
  public adjust({ targetId, amount, source }: DamageHit, state: GameState): number {
    const objects = state.worldObjects;
    const from = state.entities.get(source.attackerId ?? '')?.findComponent(Transform)?.position;
    if (objects === undefined || from === undefined) return amount;
    const buildingId = this.buildingOfWall(targetId, from, state);
    return buildingId !== undefined && isPointInAnyPolygon(from, objects.interiorOf(buildingId))
      ? amount * this.multiplier
      : amount;
  }

  /** The building whose wall `targetId` is hit on from `from`, or `undefined` when no wall is. */
  private buildingOfWall(targetId: string, from: Vec2, state: GameState): string | undefined {
    const objects = state.worldObjects;
    const own: MapObject | undefined = objects?.objectFor(targetId);
    if (own !== undefined) return own.kind === 'wall' ? own.buildingId : undefined;
    return wallHitFrom(objects?.bodyOf(targetId) ?? [], from, this.aim)?.partOf;
  }
}
