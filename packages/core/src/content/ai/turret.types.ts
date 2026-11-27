/**
 * One entry of a turret's target lists (architecture 11 §4.5): `legend-hurting-ally-legend` is an
 * enemy Legend that damaged an allied Legend inside the defend-ally window; `heavy-unit` an enemy
 * of a heavy kind; `nearest-enemy` any enemy. Inside an entry the nearest enemy wins, ties to the
 * lower id.
 */
export type TurretTargetPriority = 'legend-hurting-ally-legend' | 'heavy-unit' | 'nearest-enemy';

/** The fields of a turret profile that are the same as authored and as loaded. */
type TurretProfileBase = {
  /** The AI profile id a structure definition names (`aiProfile`). */
  readonly id: string;
  /**
   * Metres from the turret's edge to a target's centre within which it takes and keeps a target.
   */
  readonly range: number;
  /**
   * Tried first, in order, even while the turret holds a target (the defend-ally override): it
   * switches to the nearest enemy an entry names, unless its target is one.
   */
  readonly overrides: readonly TurretTargetPriority[];
  /** Best first; tried once the current target is dead or out of range and no override names one. */
  readonly priority: readonly TurretTargetPriority[];
  /** The entity kinds `heavy-unit` names. */
  readonly heavyKinds: readonly string[];
};

/** How a turret picks its targets and its ammo (architecture 11 §4.5), as authored, in seconds. */
export type AuthoredTurretProfile = TurretProfileBase & {
  /** How long a hit on an allied Legend marks its enemy Legend for `legend-hurting-ally-legend`. */
  readonly defendAllySeconds: number;
};

/** A turret profile as loaded (`loadTurrets`): the defend-ally window in ticks. */
export type TurretProfileDefinition = TurretProfileBase & {
  readonly defendAllyTicks: number;
};
