import {
  type Command,
  type EntityId,
  findMapObjectAt,
  findUnitAt,
  type InputIntent,
  type MapObject,
  type Snapshot,
  type Vec2,
} from '@eternalus/core';

/** The parts of a snapshot an attack target is picked from. */
type TargetSnapshot = Pick<Snapshot, 'entities' | 'mapObjects'>;

/**
 * Turns one seat's `InputIntent`s into commands for that seat's Legend (ADR 0016 point 1), the
 * server's copy of the client's `PlayerCommands` rules, because core's `intent` handler does not
 * apply intents yet: `move` or `stop` only when the movement axes change, and one `attack-target`
 * per target the held attack aims at (a living enemy unit first, else a map object). One per seat,
 * so each keeps its own last movement and target.
 */
export class SeatCommands {
  private lastMove: Vec2 = { x: 0, y: 0 };
  private attackTargetId: EntityId | null = null;

  /**
   * @param actorId The seat's Legend, stamped on every command.
   * @param mapObjects The match's map objects, the non-unit attack targets.
   * @param enqueue Where commands go (`Simulation.enqueueCommand`).
   */
  public constructor(
    private readonly actorId: EntityId,
    private readonly mapObjects: readonly MapObject[],
    private readonly enqueue: (command: Command) => void,
  ) {}

  /** Queues the commands `intent` asks for; `snapshot` is the latest state. */
  public apply(intent: InputIntent, snapshot: TargetSnapshot): void {
    const { actorId } = this;
    const { move, isAttacking, aim } = intent;
    this.applyAttack(isAttacking === true ? aim : null, snapshot);
    if (move.x === this.lastMove.x && move.y === this.lastMove.y) return;
    const isMoving = move.x !== 0 || move.y !== 0;
    this.enqueue(isMoving ? { type: 'move', actorId, direction: move } : { type: 'stop', actorId });
    // `stop` drops the attack target, so a button still held queues it again next intent.
    if (!isMoving) this.attackTargetId = null;
    this.lastMove = move;
  }

  private applyAttack(aim: Vec2 | null, snapshot: TargetSnapshot): void {
    const targetId = aim === null ? null : this.targetAt(aim, snapshot);
    if (targetId !== null && targetId !== this.attackTargetId) {
      this.enqueue({ type: 'attack-target', actorId: this.actorId, targetId });
    }
    this.attackTargetId = targetId;
  }

  /** The unit under `point`, else the map object there: a unit is drawn on top of a building. */
  private targetAt(point: Vec2, snapshot: TargetSnapshot): EntityId | null {
    return (
      findUnitAt(snapshot.entities, this.actorId, point) ??
      findMapObjectAt(this.mapObjects, snapshot.mapObjects ?? [], point)
    );
  }
}
