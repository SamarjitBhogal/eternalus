import type { TurretTargetPriority } from '../content/structures/turrets.types';
import type { EntityId } from '../state/EntityStore.types';
import type { Vec2 } from '../utils/geometry.types';

/** One living enemy in a turret's range, as `chooseTurretTarget` ranks it. */
export type TurretCandidate = {
  readonly id: EntityId;
  readonly kind: string;
  /** Where it stands: the turret aims ahead of this point. */
  readonly position: Vec2;
  /** Squared distance from the turret's centre: the nearest wins inside a priority entry. */
  readonly distanceSquared: number;
  /** Whether it is an enemy Legend that damaged an allied Legend inside the defend-ally window. */
  readonly hasHurtAllyLegend: boolean;
};

/** What a turret chooses its target from (architecture 11 §4.5). */
export type TurretTargetInput = {
  /** The target it holds, or `null`. */
  readonly currentId: EntityId | null;
  /** Every living enemy in range, in any order. */
  readonly candidates: readonly TurretCandidate[];
  /** Tried before the current target is kept (the defend-ally override). */
  readonly overrides: readonly TurretTargetPriority[];
  /** Tried once the current target is gone. */
  readonly priority: readonly TurretTargetPriority[];
  /** The kinds `heavy-unit` names. */
  readonly heavyKinds: readonly string[];
};
