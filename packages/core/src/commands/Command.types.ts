import type { PlayableTeam, Team } from '../teams/teams.types';
import type { EntityId } from '../state/EntityStore.types';
import type { Vec2 } from '../utils/geometry.types';

/** An ability bar slot (architecture 05 §6); `ability-4` is the ultimate. */
export type AbilitySlot =
  | 'ability-1'
  | 'ability-2'
  | 'ability-3'
  | 'ability-4'
  | 'gadget-1'
  | 'gadget-2'
  | 'default-action';

/** Where a developer-menu horde appears (architecture 13 §4). */
export type SpawnOrigin =
  | { readonly kind: 'structure'; readonly structureId: string }
  | { readonly kind: 'lane'; readonly lane: string; readonly t: number }
  | { readonly kind: 'point'; readonly at: Vec2 };

/** Where an ability is aimed: a world point and, for targeted abilities, the target. */
export type Aim = { readonly point: Vec2; readonly targetId: EntityId | null };

/**
 * The human's per-tick input with no key names in it (architecture 13 §6.2): movement axes as one
 * normalised vector (zero when idle), the world point under the pointer and the slots pressed
 * this tick.
 */
export type InputIntent = {
  readonly move: Vec2;
  readonly aim: Vec2 | null;
  readonly triggered: readonly AbilitySlot[];
};

/**
 * The fields of every command, by type. The single place of change for commands: a new line here
 * does not compile until `defaultCommandHandlers.ts` has a handler for it.
 */
type CommandPayloads = {
  readonly move: { readonly actorId: EntityId; readonly direction: Vec2 };
  readonly stop: { readonly actorId: EntityId };
  readonly 'attack-target': { readonly actorId: EntityId; readonly targetId: EntityId };
  readonly 'cast-ability': {
    readonly actorId: EntityId;
    readonly slot: AbilitySlot;
    readonly aim: Aim;
  };
  readonly intent: { readonly actorId: EntityId; readonly intent: InputIntent };
  /** Developer menu: spawn `count` entities of `kind` at `at`. */
  readonly 'dev-spawn': {
    readonly kind: string;
    readonly definitionId: string;
    readonly team: Team;
    readonly at: Vec2;
    readonly count: number;
  };
  /**
   * Developer menu: spawn `count` mobs of `definitionId` as one horde (architecture 13 §4,
   * 18 §3.5), clipped to the unit cap. The origin picks the lane: a structure's own lane, a lane
   * and a fraction `t` of it from the Light gate, or the lane nearest a point.
   */
  readonly 'dev-spawn-mobs': {
    readonly team: PlayableTeam;
    readonly definitionId: string;
    readonly count: number;
    readonly origin: SpawnOrigin;
  };
  /** Developer menu: remove an entity (cause `dev-removed`). */
  readonly 'dev-remove-entity': { readonly entityId: EntityId };
  /** Developer menu: hand an entity to another controller (sim mode). */
  readonly 'dev-set-controller': { readonly entityId: EntityId; readonly controllerId: string };
};

/** The name of a command. */
export type CommandType = keyof CommandPayloads;

/**
 * Every change of intent, from the player, a bot or the developer menu: a plain, serialisable
 * object discriminated by `type` (architecture 03 §3). `Command<'move'>` is one member.
 */
export type Command<K extends CommandType = CommandType> = {
  readonly [P in K]: { readonly type: P } & CommandPayloads[P];
}[K];

/** Why a command was not applied; sent with `command-rejected`. */
export type CommandRejectReason =
  | 'unknown-entity'
  | 'unknown-kind'
  | 'unknown-definition'
  | 'invalid-count'
  | 'invalid-position'
  | 'invalid-origin'
  | 'cap-exceeded'
  | 'horde-only'
  | 'invalid-direction'
  | 'not-movable'
  | 'cannot-attack'
  | 'invalid-target'
  | 'not-supported';
