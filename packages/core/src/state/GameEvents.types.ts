import type { ShieldBar } from '../components/Health.types';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { EntityId, RemovalCause } from './EntityStore.types';
import type { MatchPhase } from './GameState.types';

/**
 * Who or what dealt damage (architecture 05 §9). Every hit names one, so every death has a killer.
 * Lives in `state/` because events carry it and `state/` may not import `combat/` (02).
 */
export type DamageSource = {
  readonly attackerId: EntityId | null;
  readonly kind: 'weapon' | 'ability' | 'status' | 'structure' | 'environment';
  /** The weapon, ability, status or structure definition id. */
  readonly definitionId: string;
};

/** A horde's announcement payload. */
type HordePayload = {
  readonly hordeId: string;
  readonly lane: string;
  readonly team: Team;
  readonly memberIds: readonly EntityId[];
};

/** A status effect's announcement payload. */
type StatusPayload = {
  readonly entityId: EntityId;
  readonly statusId: string;
  readonly sourceId: EntityId | null;
};

/**
 * Every event the simulation can emit, by name (architecture 03 §4). The single place of change
 * for events: an emitter adds its line here. Emitting a name that is not listed does not compile.
 * Ids of things that have no type yet (lanes, hordes, statuses, abilities) are plain strings.
 */
export type GameEventMap = {
  readonly 'entity-spawned': {
    readonly entityId: EntityId;
    readonly kind: string;
    readonly team: Team;
  };
  /** `killer` is set for a `died` removal whose lethal hit went through the damage pipeline. */
  readonly 'entity-removed': {
    readonly entityId: EntityId;
    readonly cause: RemovalCause;
    readonly killer?: DamageSource;
  };
  readonly 'damage-applied': {
    readonly targetId: EntityId;
    readonly amount: number;
    readonly absorbed: number;
    readonly source: DamageSource;
  };
  readonly 'entity-died': { readonly entityId: EntityId; readonly killer: DamageSource };
  /** A basic attack that was spent without landing (the attacker is blinded). */
  readonly 'attack-missed': { readonly attackerId: EntityId; readonly targetId: EntityId };
  readonly 'structure-destroyed': {
    readonly entityId: EntityId;
    readonly kind: string;
    readonly team: Team;
    readonly lane: string | null;
  };
  readonly 'shield-bars-changed': {
    readonly entityId: EntityId;
    readonly bars: readonly ShieldBar[];
  };
  readonly 'capture-progress': {
    readonly pointId: string;
    readonly team: Team;
    readonly progress: number;
    readonly checkpoint: number;
  };
  readonly 'capture-point-owner-changed': {
    readonly pointId: string;
    readonly from: Team;
    readonly to: Team;
  };
  readonly 'phase-changed': { readonly from: MatchPhase; readonly to: MatchPhase };
  /** `slot` is an `AbilitySlot` (typed loosely: `state/` sits below `commands/`). */
  readonly 'ability-cast': {
    readonly casterId: EntityId;
    readonly abilityId: string;
    readonly slot: string;
  };
  readonly 'status-applied': StatusPayload;
  readonly 'status-expired': StatusPayload;
  readonly 'horde-spawned': HordePayload;
  readonly 'horde-dissolved': HordePayload;
  readonly 'level-up': { readonly entityId: EntityId; readonly level: number };
  readonly 'team-changed': {
    readonly entityId: EntityId;
    readonly from: Team;
    readonly to: Team;
    readonly cause: string;
  };
  readonly 'boss-summoned': { readonly entityId: EntityId; readonly kind: string };
  /** `command` is the rejected `Command` (typed loosely: `state/` sits below `commands/`). */
  readonly 'command-rejected': {
    readonly command: { readonly type: string };
    readonly reason: string;
  };
  readonly 'collision-anomaly': {
    readonly entityId: EntityId;
    readonly from: Vec2;
    readonly to: Vec2;
    readonly colliderId: string;
  };
  readonly 'invariant-violated': {
    readonly invariantId: string;
    readonly tick: number;
    readonly details: Readonly<Record<string, number | string | boolean>>;
  };
  readonly 'tick-completed': { readonly tick: number };
};

/** The name of a game event. */
export type GameEventType = keyof GameEventMap;

/** A listener for one event type. */
export type GameEventHandler<K extends GameEventType> = (payload: GameEventMap[K]) => void;

/** Stops the subscription it was returned from. */
export type Unsubscribe = () => void;

/** An event as recorded for diagnostics: what happened, with what payload, in which tick. */
export type TimedEvent = {
  readonly [K in GameEventType]: {
    readonly tick: number;
    readonly type: K;
    readonly payload: GameEventMap[K];
  };
}[GameEventType];
