import type { EntitySnapshot, InputIntent, Snapshot } from '@eternalus/core';
import type { ServerMessage } from '@eternalus/protocol';
import type { BotLink, BotLinkFactory } from './BotLink.types';
import type { BotLogger } from './BotLogger';
import type { BotNavigator } from './BotNavigator';
import type { BotNavigatorSource } from './BotNavigatorSource';
import type { BotReport } from './BotReport.types';
import { PROGRESS_EVERY_STATES } from './DuelBot.constants';

/** One scripted Duel player: joins the queue, then chases and attacks the enemy Legend. */
export class DuelBot {
  public readonly report: BotReport;
  private link: BotLink | null = null;
  private navigator: BotNavigator | null = null;
  private seq = 0;
  private firstSeen: { x: number; y: number } | null = null;
  /** The enemy Legend once seen; core removes a dead Legend from the snapshot, so its absence is a kill. */
  private enemyId: string | null = null;

  public constructor(
    name: string,
    private readonly url: string,
    private readonly links: BotLinkFactory,
    private readonly navigators: Pick<BotNavigatorSource, 'forSeed'>,
    private readonly logger: BotLogger,
  ) {
    this.report = {
      name,
      isWaiting: false,
      matchId: null,
      seed: null,
      team: null,
      legendId: null,
      states: 0,
      lastTick: -1,
      ticksOutOfOrder: 0,
      firstMoveTick: null,
      attackTicks: 0,
      enemyHealthFirst: null,
      enemyHealthLow: null,
      ownHealthFirst: null,
      ownHealthLow: null,
      hasKilled: false,
      hasDied: false,
      ended: null,
      rejected: [],
      error: null,
    };
  }

  /** Opens the connection and joins the queue once it is open. */
  public connect(): void {
    this.link = this.links.open(this.url, {
      onOpen: () => {
        this.link?.send({ type: 'queue-join' });
      },
      onMessage: (message) => {
        this.receive(message);
      },
      onError: () => {
        this.report.error ??= 'socket error';
      },
    });
  }

  /** Closes the connection. */
  public close(): void {
    this.link?.close();
  }

  /** Handles one server message. */
  public receive(message: ServerMessage): void {
    const { report, logger } = this;
    switch (message.type) {
      case 'queue-waiting':
        report.isWaiting = true;
        logger.log(report.name, 'waiting in the queue');
        break;
      case 'match-found':
        report.matchId = message.matchId;
        report.seed = message.seed;
        report.team = message.team;
        report.legendId = message.legendId;
        this.navigator = this.navigators.forSeed(message.seed);
        logger.log(
          report.name,
          `match-found ${message.matchId} team=${message.team} seed=${String(message.seed)} legend=${message.legendId}`,
        );
        break;
      case 'state':
        this.onState(message.snapshot);
        break;
      case 'match-ended':
        report.ended = { reason: message.reason, winner: message.winner };
        report.hasKilled ||= message.winner !== null && message.winner === report.team;
        logger.log(
          report.name,
          `match-ended reason=${message.reason} winner=${String(message.winner)}`,
        );
        break;
      case 'rejected':
        report.rejected.push(message.reason);
        break;
    }
  }

  private onState(snapshot: Snapshot): void {
    const { report } = this;
    report.states += 1;
    if (snapshot.tick <= report.lastTick) {
      report.ticksOutOfOrder += 1;
    }
    report.lastTick = snapshot.tick;
    if (report.legendId === null) {
      return;
    }
    const own = snapshot.entities.find(({ id }) => id === report.legendId);
    const enemy = snapshot.entities.find(({ id, family }) =>
      this.enemyId === null ? family === 'legend' && id !== report.legendId : id === this.enemyId,
    );
    this.enemyId = enemy?.id ?? this.enemyId;
    this.trackDeaths(own === undefined, enemy === undefined);
    if (own?.transform == null || this.navigator === null) {
      return;
    }
    const body = own.transform;
    this.trackMovement(snapshot.tick, body);
    this.trackHealth(own, 'own');
    if (enemy?.transform == null) {
      this.send({ move: { x: 0, y: 0 }, aim: null, triggered: [], isAttacking: false });
      return;
    }
    this.trackHealth(enemy, 'enemy');
    const intent = this.navigator.step(body, enemy.transform);
    if (intent.isAttacking === true) {
      report.attackTicks += 1;
    }
    if (report.states % PROGRESS_EVERY_STATES === 0) {
      this.logProgress(snapshot.tick, body, enemy);
    }
    this.send(intent);
  }

  private trackMovement(tick: number, here: { x: number; y: number }): void {
    this.firstSeen ??= { x: here.x, y: here.y };
    if (
      this.report.firstMoveTick === null &&
      (here.x !== this.firstSeen.x || here.y !== this.firstSeen.y)
    ) {
      this.report.firstMoveTick = tick;
      this.logger.log(this.report.name, `first moved on tick ${String(tick)}`);
    }
  }

  /** A Legend seen before and gone now died (core removes dead Legends from the snapshot). */
  private trackDeaths(isOwnGone: boolean, isEnemyGone: boolean): void {
    const { report } = this;
    if (isOwnGone && this.firstSeen !== null && !report.hasDied) {
      report.hasDied = true;
      report.ownHealthLow = 0;
      this.logger.log(report.name, 'own Legend died');
    }
    if (isEnemyGone && this.enemyId !== null && !report.hasKilled) {
      report.hasKilled = true;
      report.enemyHealthLow = 0;
      this.logger.log(report.name, `killed the enemy Legend ${this.enemyId}`);
    }
  }

  private trackHealth(entity: EntitySnapshot, whose: 'own' | 'enemy'): void {
    if (entity.health === null) {
      return;
    }
    const { report } = this;
    const { current } = entity.health;
    if (whose === 'own') {
      report.ownHealthFirst ??= current;
      report.ownHealthLow = Math.min(report.ownHealthLow ?? current, current);
      report.hasDied ||= current <= 0;
    } else {
      report.enemyHealthFirst ??= current;
      report.enemyHealthLow = Math.min(report.enemyHealthLow ?? current, current);
      report.hasKilled ||= current <= 0;
    }
  }

  private logProgress(tick: number, here: { x: number; y: number }, enemy: EntitySnapshot): void {
    const { transform } = enemy;
    if (transform === null) {
      return;
    }
    const away = Math.hypot(transform.x - here.x, transform.y - here.y);
    this.logger.log(
      this.report.name,
      `tick ${String(tick)} at (${here.x.toFixed(1)}, ${here.y.toFixed(1)}), enemy ${away.toFixed(1)} away, ` +
        `hp low ${String(this.report.ownHealthLow)} vs ${String(this.report.enemyHealthLow)}`,
    );
  }

  private send(intent: InputIntent): void {
    this.link?.send({ type: 'intent', seq: this.seq, intent });
    this.seq += 1;
  }
}
