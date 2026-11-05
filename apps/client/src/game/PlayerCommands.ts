import {
  type EntityId,
  type EntitySnapshot,
  findMapObjectAt,
  type MapObject,
  type MapObjectSnapshot,
  type Simulation,
  type Vec2,
} from '@eternalus/core';

import { findUnitAt } from './findUnitAt';
import type { Projection } from './engine/input/Projection.types';
import type { IntentSource } from './Match.types';

/**
 * Turns the player's intent into commands for the player's Legend, once a tick (`Match.tick`):
 * `move` or `stop` only when the movement axes change, and `attack-target` once per target the
 * held attack button aims at (a living enemy unit under the cursor first, else a map object). A
 * press the canvas gestures own is no held attack (`setPointerClaimed`; 06 §10, attack and roof
 * input arbitration): with the developer explorer shown that is every press, and a plain click
 * attacks once on its release instead (`attackAt`, DEC-150). It only turns input into commands:
 * `apply` tells `Match` whether the player moves, and `Match` tells the camera (DEC-151).
 */
export class PlayerCommands {
  private lastMove: Vec2 = { x: 0, y: 0 };

  /** The map object the held attack button last targeted; `null` once released or stopped. */
  private attackTargetId: EntityId | null = null;

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
   * one action. With the explorer, a plain click that is no roof click attacks on its release
   * through `attackAt` (DEC-150).
   */
  public setPointerClaimed(isClaimed: boolean): void {
    this.isPointerClaimed = isClaimed;
  }

  /**
   * Reads this tick's intent and queues its commands for the Legend `actorId`. `states` are the
   * latest snapshot's map objects and `entities` its units: only a living one can be the target.
   *
   * @returns Whether the player's movement input is non-zero this tick.
   */
  public apply(
    actorId: EntityId,
    states: readonly MapObjectSnapshot[],
    entities: readonly EntitySnapshot[],
  ): boolean {
    const { move, isAttacking, aim } = this.input.read(this.camera);
    const attackAim = isAttacking === true && !this.isPointerClaimed ? aim : null;
    this.applyAttack(actorId, attackAim, states, entities);
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
   * The developer explorer's plain click (DEC-150): queues one `attack-target` for the Legend
   * `actorId` on the living enemy unit under `point` (world units), else on the map object there.
   * `states` and `entities` are the latest snapshot's map objects and units: open ground, a
   * destroyed object or a dead unit queues nothing.
   */
  public attackAt(
    actorId: EntityId,
    point: Vec2,
    states: readonly MapObjectSnapshot[],
    entities: readonly EntitySnapshot[],
  ): void {
    const targetId = this.targetAt(actorId, point, states, entities);
    if (targetId !== null) {
      this.simulation.enqueueCommand({ type: 'attack-target', actorId, targetId });
    }
  }

  /**
   * Queues `attack-target` on the map object under `aim` (the held attack button's world point,
   * or `null`); holding the button on one target queues one command, not one per tick.
   */
  private applyAttack(
    actorId: EntityId,
    aim: Vec2 | null,
    states: readonly MapObjectSnapshot[],
    entities: readonly EntitySnapshot[],
  ): void {
    const targetId = aim === null ? null : this.targetAt(actorId, aim, states, entities);
    if (targetId !== null && targetId !== this.attackTargetId) {
      this.simulation.enqueueCommand({ type: 'attack-target', actorId, targetId });
    }
    this.attackTargetId = targetId;
  }

  /** The unit under `point`, else the map object there: a unit is drawn on top of a building. */
  private targetAt(
    actorId: EntityId,
    point: Vec2,
    states: readonly MapObjectSnapshot[],
    entities: readonly EntitySnapshot[],
  ): EntityId | null {
    return findUnitAt(entities, actorId, point) ?? findMapObjectAt(this.mapObjects, states, point);
  }
}
