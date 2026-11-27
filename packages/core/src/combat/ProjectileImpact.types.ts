import type {
  ProjectileImpactData,
  ProjectileImpactKind,
  ProjectileSource,
} from '../components/ProjectilePayload.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';

/** One shot landing on a body, as the impact of its kind sees it. */
export type ProjectileHit<K extends ProjectileImpactKind> = {
  /** What the shot does where it lands: its impact kind and that kind's data. */
  readonly impact: ProjectileImpactData<K>;
  /** The entity that fired it. */
  readonly ownerId: EntityId;
  /** The owner's team at the moment of firing. */
  readonly team: Team;
  /** The owner's level at the moment of firing. */
  readonly ownerLevel: number;
  /** Who the hit is credited to. */
  readonly source: ProjectileSource;
  /** Where it was fired from. */
  readonly origin: Vec2;
  /**
   * The body it touched first (not always the one it was fired at); `null` for an arc shot that
   * landed on bare ground (`ProjectileSystem`, DEC-342).
   */
  readonly bodyId: EntityId | null;
  /** Where the shot's centre was when it touched the body, or where an arc shot landed. */
  readonly point: Vec2;
};

/**
 * What a shot of one impact kind does where it lands (architecture 05 §3, §10): a weapon's
 * damage, or an ability step's `onHit`. `ProjectileSystem` flies every shot the same way and hands
 * the hit to the impact its payload names. A new kind is one entry in `ProjectileImpactDataByKind`,
 * one class and one line in the pipeline's `impacts`; the flight does not change.
 */
export interface ProjectileImpact<K extends ProjectileImpactKind> {
  /**
   * Lands `hit`. The shot is removed (a straight shot) or lodges (an arc shot) after this returns.
   *
   * @returns The ids of the bodies it landed on, for the owner's hit record
   *   (`EntityStore.recordHits`); none for a hit on bare ground with no blast.
   */
  land(state: GameState, hit: ProjectileHit<K>): readonly EntityId[];
}

/** One impact per kind; a missing kind does not compile. */
export type ProjectileImpacts = { readonly [K in ProjectileImpactKind]: ProjectileImpact<K> };
