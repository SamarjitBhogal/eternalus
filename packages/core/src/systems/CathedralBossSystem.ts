import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { BossCombat } from '../components/BossCombat';
import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { CATHEDRAL_BOSS_CAST } from '../content/mobs/cathedralBossAbilities';
import type { BossMoveDefinition } from '../content/mobs/bossMoves.types';
import { BOSS_CAST_LOCK } from '../content/status-effects/bossCastLock';
import type { Entity } from '../entities/Entity';
import { Unit } from '../entities/Unit';
import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import { atan2, cos, sin, sqrt } from '../utils/deterministicMath';
import type { System, SystemContext } from './System.types';
import { bossMoveEffects } from './bossMoveEffects';

/** Runs the Cathedral boss's telegraphed, deterministic special attack cycle. */
export class CathedralBossSystem implements System {
  public readonly name = 'cathedral-boss';

  /** Shares the match's damage and status rules. */
  public constructor(
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
  ) {}

  /** Advances active casts or starts the next move when the boss has a live target in range. */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) return;
    state.entities.forEach((boss) => {
      const cycle = boss.findComponent(BossCombat);
      if (cycle === undefined || boss.findComponent(Health)?.isDead !== false) return;
      const combat = boss.findComponent(Combat);
      const arena = state.guards.slotOf(boss.id);
      if (arena === undefined) return;
      const targetId = combat?.targetId;
      if (cycle.readyAt === 0 && targetId != null) {
        cycle.readyAt = state.tick + this.ticks(state, CATHEDRAL_BOSS_CAST.delay);
      }
      const body = boss.getComponent(Transform);
      if (
        cycle.cast === null &&
        state.tick >= cycle.readyAt &&
        targetId != null &&
        boss.findComponent(StatusEffects)?.has('cannot-cast') !== true
      ) {
        this.begin(state, cycle, body, boss.id, targetId, arena);
      }
      if (cycle.cast !== null) this.advance(state, boss, cycle, body);
    });
  }

  private begin(
    state: GameState,
    cycle: BossCombat,
    body: Transform,
    bossId: string,
    targetId: string,
    arena: GuardSlot,
  ): void {
    const target = state.entities.get(targetId);
    const aim = target?.findComponent(Transform)?.position;
    if (aim === undefined || target?.findComponent(Health)?.isDead !== false) return;
    if (!CathedralBossSystem.isInArena(arena, aim)) return;
    const dx = aim.x - body.position.x;
    const dy = aim.y - body.position.y;
    const distance = sqrt(dx * dx + dy * dy);
    const inMelee = state.entities.isInReach(bossId, targetId);
    const inRange = cycle.moves.flatMap((move, index) => {
      if (move.range === 0 ? !inMelee : distance > move.range) return [];
      // At a given distance, prefer the move with the smallest unused reach. The visual ranges
      // remain authored in the existing move table.
      return [{ index, move, weight: 1 / (1 + Math.max(0, move.range - distance)) }];
    });
    const unused = inRange.filter(({ index }) => !cycle.usedMoves.has(index));
    if (unused.length === 0 && inRange.length > 0) cycle.usedMoves.clear();
    const choices = unused.length > 0 ? unused : inRange;
    const total = choices.reduce((sum, choice) => sum + choice.weight, 0);
    let roll = state.rng.fork(bossId).fork(String(state.tick)).nextFloat() * total;
    const selected = choices.find(({ weight }) => {
      roll -= weight;
      return roll < 0;
    });
    if (selected === undefined) return;
    const { index, move } = selected;
    cycle.nextMove = index;
    cycle.usedMoves.add(index);
    const fire = state.tick + this.ticks(state, move.charge);
    const recover = fire + this.ticks(state, move.active);
    const heading = atan2(dy, dx);
    cycle.cast = {
      id: move.id,
      start: state.tick,
      fire,
      recover,
      end: recover + this.ticks(state, move.recovery),
      heading,
      angle: heading - move.sweep / 2,
      range: move.range,
      width: move.width,
    };
    this.statuses.apply(state, bossId, BOSS_CAST_LOCK.id, bossId);
  }

  private advance(state: GameState, boss: Entity, cycle: BossCombat, body: Transform): void {
    const cast = cycle.cast;
    if (cast === null) return;
    const move = cycle.moves[cycle.nextMove];
    if (move === undefined) return;
    if (state.tick >= cast.end) {
      this.statuses.remove(state, boss.id, BOSS_CAST_LOCK.id);
      cycle.cast = null;
      cycle.hit.clear();
      if (cycle.usedMoves.size === cycle.moves.length) cycle.usedMoves.clear();
      cycle.readyAt = state.tick + this.ticks(state, CATHEDRAL_BOSS_CAST.delay);
      return;
    }
    boss.findComponent(Movement)?.stop();
    const progress = Math.max(
      0,
      Math.min(1, (state.tick - cast.fire) / Math.max(1, cast.recover - cast.fire - 1)),
    );
    const angle = cast.heading + move.sweep * (progress - 0.5);
    body.face({ x: cos(angle), y: sin(angle) });
    cycle.cast = { ...cast, angle };
    bossMoveEffects[move.effect].onTick?.(state, boss, cast);
    if (state.tick >= cast.fire && state.tick < cast.recover) {
      this.strike(state, boss, body, cycle, move, angle);
    }
  }

  private strike(
    state: GameState,
    boss: Entity,
    body: Transform,
    cycle: BossCombat,
    move: BossMoveDefinition,
    angle: number,
  ): void {
    const { contains, onHit } = bossMoveEffects[move.effect];
    const arena = state.guards.slotOf(boss.id);
    if (arena === undefined || contains === undefined) return;
    const team = state.entities.teamOf(boss.id);
    const x = cos(angle);
    const y = sin(angle);
    state.entities.forEach((victim) => {
      if (
        !(victim instanceof Unit) ||
        state.entities.teamOf(victim.id) === team ||
        cycle.hit.has(victim.id)
      )
        return;
      const target = victim.getComponent(Transform);
      if (!CathedralBossSystem.isInArena(arena, target.position)) return;
      const dx = target.position.x - body.position.x;
      const dy = target.position.y - body.position.y;
      const length = sqrt(dx * dx + dy * dy);
      if (
        !contains({
          ahead: x * dx + y * dy,
          sideways: x * dy - y * dx,
          distance: length,
          radius: target.radius,
          range: move.range,
          width: move.width,
        })
      )
        return;
      cycle.hit.add(victim.id);
      const hit = this.damage.apply(state, victim.id, move.damage, {
        kind: 'ability',
        attackerId: boss.id,
        definitionId: move.id,
      });
      if (!hit.applied || hit.killed) return;
      onHit?.({
        state,
        bossId: boss.id,
        victimId: victim.id,
        body,
        target,
        distance: length,
        dx,
        dy,
        statuses: this.statuses,
      });
    });
  }

  private static isInArena(arena: GuardSlot, position: Transform['position']): boolean {
    const dx = position.x - arena.homeX;
    const dy = position.y - arena.homeY;
    return dx * dx + dy * dy <= arena.leashRadius * arena.leashRadius;
  }

  private ticks(state: GameState, seconds: number): number {
    return Math.max(1, Math.round(seconds * state.config.tickRate));
  }
}
