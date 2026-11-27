import type { GuardPlanDefinition, GuardTableEntry } from '../content/structures/structures.types';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import type { GuardSlot } from '../state/GuardStore.types';
import type { Vec2 } from '../utils/geometry.types';

/**
 * How a guard plan's posts come back after their guards are lost (architecture 18 §7, 07 §6),
 * chosen by the plan's `respawn` id (DEC-168). It owns any announcement that its home was cleared.
 */
export interface GuardRespawnRule {
  /**
   * Empties post `index`, whose guard (`slot.guardId`) was lost this tick, and sets when the post
   * may be filled again.
   */
  release(state: GameState, index: number, slot: GuardSlot): void;
}

/** The posts `GuardRoster` lays out for one home: who holds them, where, and how far they chase. */
export type PostLayout = {
  readonly home: Entity;
  readonly team: Team;
  readonly table: readonly Pick<GuardTableEntry, 'mobId' | 'count'>[];
  /** Posts stand on a ring this far from the home's centre. */
  readonly ring: number;
  /** The leash is measured from a circle of this radius around the home's centre. */
  readonly homeRadius: number;
  readonly leashRadius: number;
  readonly leashTolerance: number;
  readonly respawnTicks: number;
  /** The tick the posts are first filled, or `null`: not until `GuardRoster.activate`. */
  readonly firstTick: number | null;
  readonly canLevel: boolean;
  /** The checkpoint whose defenders hold these posts; absent for the home's own guard plan. */
  readonly checkpoint?: number;
  /** The posts' id prefix; the home's id by default. */
  readonly idPrefix?: string;
  /** Circles no post's guard may touch (the structures inside a defended zone); none by default. */
  readonly keepOut?: readonly { readonly center: Vec2; readonly radius: number }[];
};

/** A guard plan's activation kinds (`activation.at`, architecture 18 §7.1). */
export type ActivationKind = GuardPlanDefinition['activation']['at'];

/** The loaded activation of kind `K`. */
export type ActivationOf<K extends ActivationKind> = Extract<
  GuardPlanDefinition['activation'],
  { readonly at: K }
>;

/**
 * Each activation kind's first tick for its plan's posts, or `null` for posts that wait for
 * `GuardRoster.activate`: the registry a new kind adds its line to (rule 12).
 */
export type FirstTickRules = {
  readonly [K in ActivationKind]: (state: GameState, activation: ActivationOf<K>) => number | null;
};
