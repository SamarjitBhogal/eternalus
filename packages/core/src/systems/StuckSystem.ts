import { ChaseWatch } from '../components/ChaseWatch';
import { Combat } from '../components/Combat';
import { ControllerBinding } from '../components/ControllerBinding';
import { Deploying } from '../components/Deploying';
import { Transform } from '../components/Transform';
import type { StuckDetectionRule } from '../content/ai/ai.types';
import type { Entity } from '../entities/Entity';
import type { GameState } from '../state/GameState';
import { distance } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { System, SystemContext } from './System.types';

/**
 * Finds the AI units stuck on their way to their attack target and plans their way round (owner
 * 2026-11-05, DEC-193): every mob and bot Legend with a target keeps a `ChaseWatch` of how close it
 * has come to what it heads for: the point of its target it aims at (`EntityStore.aimPointOf`, as
 * `PathingSystem` aims), or its detour waypoint. One that has not come
 * `minProgress` closer in `windowSeconds`, and is not in reach, is stuck: it heads for the A\*
 * waypoint toward that point over the nav grid (`state.paths`), and asks again each time it comes
 * within `waypointRadius` of it or is stuck on the way. A clear straight line, no way, or (for a
 * guard or camp mob) a waypoint outside its leash circle gives it no waypoint, so it chases
 * straight as before. The nav grid blocks a tower's whole court, so a way to a unit inside one ends
 * on the open ground nearest it, and hordes never path through a court (owner 2026-11-05, A). Runs
 * after the positions are resolved and before `PathingSystem`, which steers mobs to the waypoint;
 * bot Legends read it on their next decision. At most `maxPlansPerTick` A\* plans run a tick (11
 * §6, cost control); a unit due one past that keeps it due (`ChaseWatch.isPlanDue`) and plans on a
 * later tick.
 *
 * @remarks ponytail: the due units are served in store order each tick, so a crowd that keeps
 * coming due ahead of a unit can hold it back; a round-robin cursor like `state.ai.cursor`
 * (AiSystem) serves the skipped first once that shows.
 */
export class StuckSystem implements System {
  public readonly name = 'stuck';
  private readonly aim: MutableVec2 = { x: 0, y: 0 };
  private readonly step: MutableVec2 = { x: 0, y: 0 };

  /** @param rule - When a chase counts as stuck and how it goes round, from content. */
  public constructor(private readonly rule: StuckDetectionRule) {}

  /** Watches every AI unit with an attack target, in store order; drops the watch of the rest. */
  public update({ state }: SystemContext): void {
    const { tickRate } = state.config;
    const window = {
      tick: state.tick,
      windowTicks: Math.round(this.rule.windowSeconds * tickRate),
      minProgress: this.rule.minProgress,
    };
    let plans = this.rule.maxPlansPerTick;
    state.entities.forEach((entity) => {
      const targetId = entity.findComponent(Combat)?.targetId ?? null;
      const self = entity.findComponent(Transform);
      if (
        targetId === null ||
        self === undefined ||
        !entity.hasComponent(ControllerBinding) ||
        entity.hasComponent(Deploying) ||
        !state.entities.aimPointOf(targetId, self.position, this.aim)
      ) {
        entity.removeComponent(ChaseWatch);
        return;
      }
      let watch = entity.findComponent(ChaseWatch);
      if (watch === undefined) {
        watch = new ChaseWatch();
        entity.addComponent(watch);
      }
      const isInReach = state.entities.isInReach(entity.id, targetId);
      const gap = distance(self.position, watch.waypoint ?? this.aim);
      const isStuck = watch.observe(targetId, gap, isInReach, window);
      const isAtWaypoint = watch.waypoint !== null && gap <= this.rule.waypointRadius;
      if (isStuck || isAtWaypoint) {
        watch.requestPlan();
      }
      if (watch.isPlanDue && plans > 0) {
        plans -= 1;
        this.plan(state, entity, watch, self.position);
      }
    });
  }

  /**
   * Gives `watch` the next A\* waypoint toward `aim`, or none: when the straight line is clear (the
   * answer is `aim` itself, which a plain chase already heads for), when there is no way, or when
   * the waypoint lies outside a guard's leash circle (18 §7: a guard never leaves it).
   */
  private plan(state: GameState, entity: Entity, watch: ChaseWatch, from: Vec2): void {
    const isFound = state.paths?.waypoint(from, this.aim, this.step) === true;
    const post = state.guards.slotOf(entity.id);
    const isInLeash =
      post === undefined ||
      distance(this.step, { x: post.homeX, y: post.homeY }) - post.homeRadius <= post.leashRadius;
    const isAim = this.step.x === this.aim.x && this.step.y === this.aim.y;
    if (isFound && isInLeash && !isAim) {
      watch.headFor(this.step.x, this.step.y, distance(from, this.step), state.tick);
    } else {
      watch.dropWaypoint(distance(from, this.aim), state.tick);
    }
  }
}
