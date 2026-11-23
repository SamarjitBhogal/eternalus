import type { AbilityRegistry } from '../abilities/AbilityRegistry';
import { CastInstance } from '../abilities/CastInstance';
import { TargetQuery } from '../abilities/TargetQuery';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { Command } from '../commands/Command.types';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Abilities } from '../components/Abilities';
import type { AbilitySlotRuntime } from '../components/AbilitySlotRuntime';
import type { CastInProgress } from '../components/Abilities.types';
import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import { Transform } from '../components/Transform';
import type { Entity } from '../entities/Entity';
import type { AreaHitQuery } from '../state/AreaHitQuery';
import type { GameState } from '../state/GameState';
import type { SlotReadiness } from '../state/SlotReadiness.types';
import { compareById } from '../utils/compareById';
import type { System, SystemContext } from './System.types';

/**
 * Runs the casts the `cast-ability` handler queued this tick (architecture 05 §7 step 3), casters
 * in id order. Each cast is checked again (the state may have moved since the command); a cast
 * that now fails is announced as `command-rejected` and dropped. Otherwise it pays the price in
 * aether, stamps the cooldown (cooldowns start at cast), emits `ability-cast` and fires the
 * ability's steps that are due at the cast through their strategies. A cast with later steps
 * (`delayTicks`, 05 §4) is kept on the caster's `Abilities` as plain data; after this tick's new
 * casts, each kept cast fires the steps that are now due, in list order, on the caster where it
 * is then, and is dropped after its last step. Its aim stays the one fixed at the cast. A caster
 * that died drops its casts; one that left the match took them along. Runs after `HordeSystem`
 * and before `StatusEffectSystem` (plan arch call 13).
 */
export class AbilitySystem implements System {
  public readonly name = 'abilities';

  private readonly targets: TargetQuery;

  /**
   * @param registry - Where abilities are composed and effects found.
   * @param validator - The cast rules, the same the handler checks with (the match's
   *   `CastValidator`, through its `SlotReadiness` port).
   * @param damage - The match's one damage pipeline, for the effects.
   * @param statuses - The match's one status applier, for the effects.
   * @param areas - The match's one hit rule for areas, for the effects' targets.
   */
  public constructor(
    private readonly registry: AbilityRegistry,
    private readonly validator: Pick<SlotReadiness, 'blockedBy' | 'priceOf'>,
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
    areas: AreaHitQuery,
  ) {
    this.targets = new TargetQuery(registry, areas);
  }

  /** Runs every queued cast of this tick, then the due steps of every cast in progress. */
  public update({ state }: SystemContext): void {
    const queued: { readonly caster: Entity; readonly runtime: AbilitySlotRuntime }[] = [];
    const inProgress: Entity[] = [];
    state.entities.forEach((caster) => {
      const abilities = caster.findComponent(Abilities);
      for (const runtime of abilities?.slots ?? []) {
        if (runtime.pendingCast !== null) {
          queued.push({ caster, runtime });
        }
      }
      if ((abilities?.castsInProgress.length ?? 0) > 0) {
        inProgress.push(caster);
      }
    });
    queued.sort((a, b) => compareById(a.caster.id, b.caster.id));
    for (const { caster, runtime } of queued) {
      this.cast(state, caster, runtime);
    }
    inProgress.sort((a, b) => compareById(a.id, b.id));
    for (const caster of inProgress) {
      this.advance(state, caster);
    }
  }

  private cast(state: GameState, caster: Entity, runtime: AbilitySlotRuntime): void {
    const aim = runtime.takePending();
    const { abilityId, slot } = runtime;
    if (aim === null || abilityId === null) {
      return;
    }
    const reason = this.validator.blockedBy(state, caster.id, slot, aim);
    if (reason !== null) {
      const command: Command<'cast-ability'> = {
        type: 'cast-ability',
        actorId: caster.id,
        slot,
        aim,
      };
      state.events.emit('command-rejected', { command, reason });
      return;
    }
    const ability = this.registry.resolve(abilityId);
    caster.getComponent(Aether).spend(this.validator.priceOf(state, caster.id, abilityId));
    runtime.recordCast(state.tick, ability.definition.cooldownTicks);
    state.events.emit('ability-cast', { casterId: caster.id, abilityId, slot });
    const { position } = caster.getComponent(Transform);
    const { targeting } = ability;
    const cast: CastInProgress = {
      abilityId,
      slot,
      aim:
        targeting === null ? aim : targeting.strategy.aimFor(targeting.spec, aim, caster.id, state),
      origin: { x: position.x, y: position.y },
      casterLevel: caster.findComponent(Progression)?.level ?? 1,
      tick: state.tick,
      nextStep: 0,
    };
    this.fireDue(state, caster, cast);
  }

  /** Fires the due steps of each cast `caster` has in progress; drops them all once it died. */
  private advance(state: GameState, caster: Entity): void {
    const casts = caster.getComponent(Abilities).endCasts();
    // One check per caster: a step never hurts its own caster (effects query enemies only and
    // `FriendlyFireStep` zeroes a hit on the attacker's own team).
    if (caster.findComponent(Health)?.isDead === true) {
      return;
    }
    for (const cast of casts) {
      this.fireDue(state, caster, cast);
    }
  }

  /**
   * Fires the due steps of `cast` on `caster` where it is now (at the cast, where the cast began)
   * and keeps it on `caster` while steps are left. A cast with no step due is kept as it is, and
   * nothing is built for it.
   */
  private fireDue(state: GameState, caster: Entity, cast: CastInProgress): void {
    const ability = this.registry.resolve(cast.abilityId);
    const waiting = ability.steps[cast.nextStep];
    if (waiting !== undefined && !CastInstance.isDue(cast.tick, waiting, state.tick)) {
      caster.getComponent(Abilities).keepCast(cast);
      return;
    }
    const { position } = caster.getComponent(Transform);
    const here = { x: position.x, y: position.y };
    // ponytail: one CastInstance per cast per due tick, fine while casts are rare; pool it if bots
    // cast every tick.
    const next = new CastInstance(
      { ...cast, casterId: caster.id, ability },
      {
        state,
        effects: this.registry,
        targets: this.targets,
        damage: this.damage,
        statuses: this.statuses,
      },
    ).run({ from: here, to: here }, cast.nextStep);
    if (next < ability.steps.length) {
      caster.getComponent(Abilities).keepCast({ ...cast, nextStep: next });
    }
  }
}
