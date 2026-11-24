import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { BossCombat } from '../components/BossCombat';
import { Combat } from '../components/Combat';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { CATHEDRAL_BOSS } from '../content/mobs/cathedralBoss';
import {
  CATHEDRAL_BOSS_ABILITIES,
  CATHEDRAL_BOSS_CAST,
} from '../content/mobs/cathedralBossAbilities';
import { BOSS_CAST_LOCK } from '../content/status-effects/bossCastLock';
import type { Entity } from '../entities/Entity';
import { Unit } from '../entities/Unit';
import type { GameState } from '../state/GameState';
import type { GuardSlot } from '../state/GuardStore.types';
import { atan2, cos, sin, sqrt } from '../utils/deterministicMath';
import type { System, SystemContext } from './System.types';

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
      if (boss.definitionId !== CATHEDRAL_BOSS.id || boss.findComponent(Health)?.isDead !== false)
        return;
      const combat = boss.findComponent(Combat);
      const arena = state.guards.slotOf(boss.id);
      if (arena === undefined) return;
      const targetId = combat?.targetId;
      const existing = boss.findComponent(BossCombat);
      if (existing === undefined && targetId == null) return;
      const cycle = existing ?? new BossCombat();
      if (existing === undefined) {
        cycle.nextMove = state.rng.fork(boss.id).nextInt(0, CATHEDRAL_BOSS_ABILITIES.length - 1);
        cycle.readyAt = state.tick + this.ticks(state, CATHEDRAL_BOSS_CAST.delay);
        boss.addComponent(cycle);
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
    const move = CATHEDRAL_BOSS_ABILITIES[cycle.nextMove] ?? CATHEDRAL_BOSS_ABILITIES[0];
    const dx = aim.x - body.position.x;
    const dy = aim.y - body.position.y;
    const isInRange =
      move.range === 0
        ? state.entities.isInReach(bossId, targetId)
        : dx * dx + dy * dy <= move.range * move.range;
    if (!isInRange) return;
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
    const move = CATHEDRAL_BOSS_ABILITIES[cycle.nextMove] ?? CATHEDRAL_BOSS_ABILITIES[0];
    const health = boss.getComponent(Health);
    if (state.tick >= cast.end) {
      this.statuses.remove(state, boss.id, BOSS_CAST_LOCK.id);
      cycle.cast = null;
      cycle.hit.clear();
      cycle.nextMove = (cycle.nextMove + 1) % CATHEDRAL_BOSS_ABILITIES.length;
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
    if (move.id === 'obsidian-bulwark') {
      if (state.tick === cast.fire) health.addShield(boss.id, CATHEDRAL_BOSS_CAST.shield);
      if (state.tick === cast.recover) health.removeShield(boss.id);
    } else if (state.tick >= cast.fire && state.tick < cast.recover) {
      this.strike(state, boss, body, cycle, move, angle);
    }
  }

  private strike(
    state: GameState,
    boss: Entity,
    body: Transform,
    cycle: BossCombat,
    move: (typeof CATHEDRAL_BOSS_ABILITIES)[number],
    angle: number,
  ): void {
    const arena = state.guards.slotOf(boss.id);
    if (arena === undefined) return;
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
      const ahead = x * dx + y * dy;
      const isHit =
        move.id === 'gravity-collapse'
          ? length <= move.range + target.radius
          : ahead >= 0 &&
            ahead <= move.range + target.radius &&
            Math.abs(x * dy - y * dx) <= move.width + target.radius;
      if (!isHit) return;
      cycle.hit.add(victim.id);
      const hit = this.damage.apply(state, victim.id, move.damage, {
        kind: 'ability',
        attackerId: boss.id,
        definitionId: move.id,
      });
      if (!hit.applied || hit.killed) return;
      if (move.id === 'grasping-roots') this.statuses.apply(state, victim.id, 'stun', boss.id);
      if (move.id === 'gravity-collapse' && length > body.radius + target.radius) {
        const fraction =
          Math.min(CATHEDRAL_BOSS_CAST.pull, length - body.radius - target.radius) / length;
        const end = { x: target.position.x - dx * fraction, y: target.position.y - dy * fraction };
        if (
          state.world?.grid.isLineClear(target.position.x, target.position.y, end.x, end.y) !==
          false
        ) {
          target.moveTo(end);
        }
      }
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
