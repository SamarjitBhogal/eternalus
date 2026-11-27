import {
  type AttackMode,
  type EntityId,
  findMapObjectAt,
  findUnitAt,
  type MapObject,
  type Simulation,
  type Snapshot,
  type Vec2,
} from '@eternalus/core';

import type { AbilityCasts } from './AbilityCasts';
import type { Projection } from './engine/input/Projection.types';
import type { IntentSource } from './Match.types';
import type { PlayerActions } from './PlayerActions';

/** The parts of a snapshot an attack target is picked from: its units and map objects. */
type TargetSnapshot = Pick<Snapshot, 'entities' | 'mapObjects'>;

/**
 * Turns the player's intent into commands for the player's Legend, once a tick (`Match.tick`):
 * `move` or `stop` only when the movement axes change, and `attack-aim` with the cursor's world
 * point whenever the held attack button's point or mode changes, and one `attack-aim` with a null
 * point on release (DEC-184: a click attacks wherever it aims, whether or not a target is under
 * the cursor; core's `CombatSystem` picks what is hit). A press the canvas gestures own is no
 * held attack (`setPointerClaimed`; 06 §10, attack and roof input arbitration): with the
 * developer explorer shown that is every press, and a plain click attacks once on its release
 * instead (`MatchViewControls.clickAt`, DEC-150). It only turns input into commands (ability keys
 * go through `AbilityCasts`, which also says when aiming has taken the main button from the
 * attack): `apply` tells `Match` whether the player moves, and `Match` tells the camera
 * (DEC-151).
 */
export class PlayerCommands implements PlayerActions {
  private lastMove: Vec2 = { x: 0, y: 0 };

  /** The last `attack-aim` point sent, `null` after a release or a stop (nothing aimed). */
  private lastAim: Vec2 | null = null;

  /** The attack mode of `lastAim`'s command: a change of mode queues a new command. */
  private attackMode: AttackMode = 'basic';

  /** Whether the canvas gestures own the main button's press (`setPointerClaimed`). */
  private isPointerClaimed = false;

  /**
   * @param mapObjects The world's map objects (`PreparedWorld.mapObjects`), the explorer's click
   *   targets.
   */
  public constructor(
    private readonly input: IntentSource,
    private readonly simulation: Pick<Simulation, 'enqueueCommand'>,
    private readonly camera: Projection,
    private readonly mapObjects: readonly MapObject[],
    private readonly casts: AbilityCasts,
  ) {}

  /**
   * Whether the canvas gestures own the main button's press (a minimap click, or any press while
   * the developer explorer is shown). While they do, the held button is no attack: one press is
   * one action. With the explorer, a plain click attacks on its release through
   * `MatchViewControls.clickAt` (DEC-150).
   */
  public setPointerClaimed(isClaimed: boolean): void {
    this.isPointerClaimed = isClaimed;
  }

  /**
   * Reads this tick's intent and queues its commands for the Legend `actorId`.
   *
   * @returns Whether the player's movement input is non-zero this tick.
   */
  public apply(actorId: EntityId): boolean {
    const { move, isAttacking, isMeleeAttacking, aim, triggered } = this.input.read(this.camera);
    const isHeld = isAttacking === true && !this.isPointerClaimed;
    const isConsumed = this.casts.apply(actorId, { triggered, aim, isAttacking: isHeld });
    const isMeleeHeld = isMeleeAttacking === true && !this.isPointerClaimed;
    // The melee key wins over the click; only the click can be consumed by an aiming cast.
    const isAttackHeld = isMeleeHeld || (isHeld && !isConsumed);
    this.applyAttack(actorId, isAttackHeld ? aim : null, isMeleeHeld ? 'melee' : 'basic');
    const isMoving = move.x !== 0 || move.y !== 0;
    if (move.x === this.lastMove.x && move.y === this.lastMove.y) {
      return isMoving;
    }
    this.simulation.enqueueCommand(
      isMoving ? { type: 'move', actorId, direction: move } : { type: 'stop', actorId },
    );
    if (!isMoving) {
      // `stop` also drops the aim, so a button still held queues it again next tick.
      this.lastAim = null;
    }
    this.lastMove = move;
    return isMoving;
  }

  /**
   * The developer explorer's click on a unit (DEC-150, DEC-183): queues one `attack-target` for
   * the Legend `actorId` on the living enemy unit under `point` (world units). `snapshot` is the
   * latest one.
   *
   * @returns Whether a unit was under the point; it wins over a roof (`MatchViewControls.clickAt`).
   */
  public attackUnitAt(actorId: EntityId, point: Vec2, snapshot: TargetSnapshot): boolean {
    const targetId = findUnitAt(snapshot.entities, actorId, point);
    if (targetId === null) {
      return false;
    }
    this.simulation.enqueueCommand({ type: 'attack-target', actorId, targetId });
    return true;
  }

  /**
   * The developer explorer's click on a map object (DEC-150): queues one `attack-target` for the
   * Legend `actorId` on the living map object under `point`; open ground or a destroyed object
   * queues nothing.
   */
  public attackObjectAt(actorId: EntityId, point: Vec2, snapshot: TargetSnapshot): void {
    const targetId = findMapObjectAt(this.mapObjects, snapshot.mapObjects ?? [], point);
    if (targetId !== null) {
      this.simulation.enqueueCommand({ type: 'attack-target', actorId, targetId });
    }
  }

  /**
   * Queues `attack-aim` at `aim` (the held attack button's world point, or `null`) with `mode`
   * when the point or mode differs from the last one sent, and one `attack-aim` with `null` on
   * release. A `'basic'` command carries no mode. Nothing is queued while the button is up and no
   * aim is held.
   */
  private applyAttack(actorId: EntityId, aim: Vec2 | null, mode: AttackMode): void {
    const last = this.lastAim;
    const isSame =
      aim === null
        ? last === null
        : last !== null && last.x === aim.x && last.y === aim.y && mode === this.attackMode;
    if (!isSame) {
      this.simulation.enqueueCommand(
        aim !== null && mode === 'melee'
          ? { type: 'attack-aim', actorId, aim, mode }
          : { type: 'attack-aim', actorId, aim },
      );
    }
    this.lastAim = aim;
    this.attackMode = mode;
  }
}
