import type { AttackMode, Command, EntityId, InputIntent, Vec2 } from '@eternalus/core';

/**
 * Turns one seat's `InputIntent`s into commands for that seat's Legend (ADR 0016 point 1), the
 * server's copy of the client's `PlayerCommands` rules, because core's `intent` handler does not
 * apply intents yet: `move` or `stop` only when the movement axes change, and `attack-aim` with the
 * aim point whenever the held attack's point or mode changes, plus one with a null point on release
 * (DEC-184: a click attacks wherever it aims; the melee key wins over the basic attack, DEC-308).
 * One per seat, so each keeps its own last movement, aim and mode.
 */
export class SeatCommands {
  private lastMove: Vec2 = { x: 0, y: 0 };
  private lastAim: Vec2 | null = null;
  private attackMode: AttackMode = 'basic';

  /**
   * @param actorId The seat's Legend, stamped on every command.
   * @param enqueue Where commands go (`Simulation.enqueueCommand`).
   */
  public constructor(
    private readonly actorId: EntityId,
    private readonly enqueue: (command: Command) => void,
  ) {}

  /** Queues the commands `intent` asks for. */
  public apply(intent: InputIntent): void {
    const { actorId } = this;
    const { move, isAttacking, isMeleeAttacking, aim } = intent;
    const isMeleeHeld = isMeleeAttacking === true;
    this.applyAttack(
      isMeleeHeld || isAttacking === true ? aim : null,
      isMeleeHeld ? 'melee' : 'basic',
    );
    if (move.x === this.lastMove.x && move.y === this.lastMove.y) return;
    const isMoving = move.x !== 0 || move.y !== 0;
    this.enqueue(isMoving ? { type: 'move', actorId, direction: move } : { type: 'stop', actorId });
    // `stop` drops the aim, so a button still held queues it again next intent.
    if (!isMoving) this.lastAim = null;
    this.lastMove = move;
  }

  /**
   * Forgets the last movement and aim, for when the simulation cleared the Legend's own (a
   * Duel round reset), so a key still held queues its command again next intent.
   */
  public reset(): void {
    this.lastMove = { x: 0, y: 0 };
    this.lastAim = null;
    this.attackMode = 'basic';
  }

  /** A change of point or mode queues a new command, a release one null aim; `'basic'` carries no mode. */
  private applyAttack(aim: Vec2 | null, mode: AttackMode): void {
    const last = this.lastAim;
    const isSame =
      aim === null
        ? last === null
        : last !== null && last.x === aim.x && last.y === aim.y && mode === this.attackMode;
    if (!isSame) {
      const { actorId } = this;
      this.enqueue(
        aim !== null && mode === 'melee'
          ? { type: 'attack-aim', actorId, aim, mode }
          : { type: 'attack-aim', actorId, aim },
      );
    }
    this.lastAim = aim;
    this.attackMode = mode;
  }
}
