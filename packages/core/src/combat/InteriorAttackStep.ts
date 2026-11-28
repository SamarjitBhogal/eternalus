import { Transform } from '../components/Transform';
import type { MapObject } from '../content/maps/mapObjects.types';
import type { GameState } from '../state/GameState';
import type { WorldObjectStore } from '../state/WorldObjectStore';
import { isPointInAnyPolygon } from '../utils/geometry';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * An attacker that stands inside a building deals more damage to that building (DEC-247 (2),
 * DEC-288, DEC-315, DEC-324; BUG-2). The building keeps its health, so only the hit grows (DEC-247
 * (1)).
 *
 * What counts:
 * - A building is the Stronghold, the Cathedral or a lane tower's fort. A house has no inside yet
 *   (DEC-311, DEC-313), so it never qualifies.
 * - On the Stronghold and the Cathedral, the bonus is for a hit on one of the building's `'wall'`
 *   map objects (`buildingId`) from inside its floor; the Stronghold's ring walls do not count
 *   (DEC-324 (3)).
 * - On a lane tower, every hit on the tower from inside its fort counts, keep or wall, because the
 *   fort and the keep are one health pool (DEC-185 B, DEC-324 (1)). A fort wall left standing
 *   after its tower fell is scenery and gets no bonus.
 * - "Inside a tower's fort" is standing in its court, the ground inside the wall band, so a
 *   doorway is outside (`WorldObjectStore.interiorOf`, DEC-324 (2)).
 * - The attacker's own position counts (`source.attackerId`), so a ranged attacker inside gets the
 *   bonus too.
 */
export class InteriorAttackStep implements DamageStep {
  public readonly name = 'interior-attack';

  /**
   * @param multiplier - The factor on a hit by an attacker inside, from content.
   * @throws Error when it is not a finite number above 1.
   */
  public constructor(private readonly multiplier: number) {
    if (!(Number.isFinite(multiplier) && multiplier > 1)) {
      throw new Error(`InteriorAttackStep: needs a multiplier above 1, got ${String(multiplier)}.`);
    }
  }

  /** Returns the amount times the multiplier when the attacker stands inside the target's building. */
  public adjust({ targetId, amount, source }: DamageHit, state: GameState): number {
    const objects = state.worldObjects;
    const from = state.entities.get(source.attackerId ?? '')?.findComponent(Transform)?.position;
    if (objects === undefined || from === undefined) return amount;
    const buildingId = InteriorAttackStep.buildingOf(targetId, objects);
    return buildingId !== undefined && isPointInAnyPolygon(from, objects.interiorOf(buildingId))
      ? amount * this.multiplier
      : amount;
  }

  /**
   * The building a hit on `targetId` gets the bonus for: a wall's building, or a lane tower's fort
   * (the `partOf` of its body's wall pieces); `undefined` for any other target.
   */
  private static buildingOf(targetId: string, objects: WorldObjectStore): string | undefined {
    const own: MapObject | undefined = objects.objectFor(targetId);
    if (own !== undefined) return own.kind === 'wall' ? own.buildingId : undefined;
    return objects.bodyOf(targetId).find(({ partOf }) => partOf !== undefined)?.partOf;
  }
}
