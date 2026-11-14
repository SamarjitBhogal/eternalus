import {
  type EntityId,
  findMapObjectAt,
  findUnitAt,
  type MapObject,
  type Simulation,
  type Snapshot,
  type Vec2,
} from '@eternalus/core';

import type { Projection } from './engine/input/Projection.types';
import type { IntentSource } from './Match.types';
import type { PlayerActions } from './PlayerActions';

/** The parts of a snapshot an attack target is picked from: its units and map objects. */
type TargetSnapshot = Pick<Snapshot, 'entities' | 'mapObjects'>;

/**
 * Turns the player's intent into commands for the player's Legend, once a tick (`Match.tick`):
 * `move` or `stop` only when the movement axes change, and `attack-target` once per target the
 * held attack button aims at (a living enemy unit under the cursor first, else a map object). A
 * press the canvas gestures own is no held attack (`setPointerClaimed`; 06 §10, attack and roof
 * input arbitration): with the developer explorer shown that is every press, and a plain click
 * attacks once on its release instead (`MatchViewControls.clickAt`, DEC-150). It only turns input
 * into commands: `apply` tells `Match` whether the player moves, and `Match` tells the camera
 * (DEC-151).
 */
export class PlayerCommands implements PlayerActions {
  private lastMove: Vec2 = { x: 0, y: 0 };

  /** The unit or map object the held attack targeted last; `null` once released or stopped. */
  private attackTargetId: EntityId | null = null;

  /** Whether the Legend was in the last snapshot: a Legend that comes back is a new entity. */
  private wasPlayerPresent = false;

  /** Whether the canvas gestures own the main button's press (`setPointerClaimed`). */
  private isPointerClaimed = false;

  /**
   * @param mapObjects The world's map objects (`PreparedWorld.mapObjects`), the attack targets.
   */
  public constructor(
    private readonly input: IntentSource,
    private readonly simulation: Pick<Simulation, 'enqueueCommand'>,
    private readonly camera: Projection,
    private readonly mapObjects: readonly MapObject[],
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
   * Reads this tick's intent and queues its commands for the Legend `actorId`. `snapshot` is the
   * latest one: only a living unit or map object in it can be the target.
   *
   * @returns Whether the player's movement input is non-zero this tick.
   */
  public apply(actorId: EntityId, snapshot: TargetSnapshot): boolean {
    const { move, isAttacking, aim } = this.input.read(this.camera);
    const isPlayerPresent = snapshot.entities.some((entity) => entity.id === actorId);
    if (isPlayerPresent && !this.wasPlayerPresent) {
      // A Legend back from a respawn has no movement and no target: send the held input again.
      this.lastMove = { x: 0, y: 0 };
      this.attackTargetId = null;
    }
    this.wasPlayerPresent = isPlayerPresent;
    const attackAim = isAttacking === true && !this.isPointerClaimed ? aim : null;
    this.applyAttack(actorId, attackAim, snapshot);
    const isMoving = move.x !== 0 || move.y !== 0;
    if (move.x === this.lastMove.x && move.y === this.lastMove.y) {
      return isMoving;
    }
    this.simulation.enqueueCommand(
      isMoving ? { type: 'move', actorId, direction: move } : { type: 'stop', actorId },
    );
    if (!isMoving) {
      // `stop` also drops the attack target, so a button still held queues it again next tick.
      this.attackTargetId = null;
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
   * Queues `attack-target` on the unit or map object under `aim` (the held attack button's world
   * point, or `null`); holding the button on one target queues one command, not one per tick.
   */
  private applyAttack(actorId: EntityId, aim: Vec2 | null, snapshot: TargetSnapshot): void {
    const targetId = aim === null ? null : this.targetAt(actorId, aim, snapshot);
    if (targetId !== null && targetId !== this.attackTargetId) {
      this.simulation.enqueueCommand({ type: 'attack-target', actorId, targetId });
    }
    this.attackTargetId = targetId;
  }

  /** The unit under `point`, else the map object there: a unit is drawn on top of a building. */
  private targetAt(actorId: EntityId, point: Vec2, snapshot: TargetSnapshot): EntityId | null {
    return (
      findUnitAt(snapshot.entities, actorId, point) ??
      findMapObjectAt(this.mapObjects, snapshot.mapObjects ?? [], point)
    );
  }
}
