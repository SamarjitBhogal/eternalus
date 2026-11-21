import {
  type AttackMode,
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
 * per target and attack mode the held attack aims at (a living enemy unit first, else a map object;
 * the melee key wins over the basic attack, DEC-308). One per seat, so each keeps its own last
 * movement, target and mode.
 */
export class SeatCommands {
  private lastMove: Vec2 = { x: 0, y: 0 };
  private attackTargetId: EntityId | null = null;
  private attackMode: AttackMode = 'basic';

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
    const { move, isAttacking, isMeleeAttacking, aim } = intent;
    const isMeleeHeld = isMeleeAttacking === true;
    this.applyAttack(
      isMeleeHeld || isAttacking === true ? aim : null,
      isMeleeHeld ? 'melee' : 'basic',
      snapshot,
    );
    if (move.x === this.lastMove.x && move.y === this.lastMove.y) return;
    const isMoving = move.x !== 0 || move.y !== 0;
    this.enqueue(isMoving ? { type: 'move', actorId, direction: move } : { type: 'stop', actorId });
    // `stop` drops the attack target, so a button still held queues it again next intent.
    if (!isMoving) this.attackTargetId = null;
    this.lastMove = move;
  }

  /**
   * Forgets the last movement and target, for when the simulation cleared the Legend's own (a
   * Duel round reset), so a key still held queues its command again next intent.
   */
  public reset(): void {
    this.lastMove = { x: 0, y: 0 };
    this.attackTargetId = null;
    this.attackMode = 'basic';
  }

  /** A change of target or mode queues a new command; a `'basic'` command carries no mode. */
  private applyAttack(aim: Vec2 | null, mode: AttackMode, snapshot: TargetSnapshot): void {
    const targetId = aim === null ? null : this.targetAt(aim, snapshot);
    if (targetId !== null && (targetId !== this.attackTargetId || mode !== this.attackMode)) {
      const { actorId } = this;
      this.enqueue(
        mode === 'melee'
          ? { type: 'attack-target', actorId, targetId, mode }
          : { type: 'attack-target', actorId, targetId },
      );
    }
    this.attackTargetId = targetId;
    this.attackMode = mode;
  }

  /** The unit under `point`, else the map object there: a unit is drawn on top of a building. */
  private targetAt(point: Vec2, snapshot: TargetSnapshot): EntityId | null {
    return (
      findUnitAt(snapshot.entities, this.actorId, point) ??
      findMapObjectAt(this.mapObjects, snapshot.mapObjects ?? [], point)
    );
  }
}
