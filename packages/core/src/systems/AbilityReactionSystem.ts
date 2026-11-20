import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { Abilities } from '../components/Abilities';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { UltimateLedger } from '../components/UltimateLedger';
import { KNOCKBACK } from '../content/abilities/knockback';
import { FURY_HIT, ULTIMATE_CHARGE } from '../content/abilities/starterTuning';
import { ZONE_LOCKING_MOBS } from '../content/zones/zoneLocks';
import type { GameState } from '../state/GameState';
import type { GameEventMap } from '../state/GameEvents.types';
import { normalize } from '../utils/vec2';
import { TickRate } from '../utils/TickRate';
import type { System, SystemContext } from './System.types';

/** Reacts to actual combat events: cloak breaks, Fury hits and non-passive ultimate charge. */
export class AbilityReactionSystem implements System {
  public readonly name = 'ability-reactions';
  private readonly assistTicks: number;
  /** Subscriptions live inside this Simulation's own event bus. */
  public constructor(
    private readonly state: GameState,
    private readonly statuses: StatusEffectApplier,
  ) {
    this.assistTicks = new TickRate(state.config.tickRate).toTicks(
      ULTIMATE_CHARGE.assistWindowSeconds,
    );
    state.events.on('damage-applied', (event) => {
      this.damage(event);
    });
    state.events.on('entity-died', (event) => {
      this.death(event);
    });
  }
  /** Keeps damage history bounded by the documented assist window. */
  public update({ state }: SystemContext): void {
    state.entities.forEach((entity) =>
      entity.findComponent(UltimateLedger)?.prune(state.tick, this.assistTicks),
    );
  }

  private damage({ targetId, amount, absorbed, source }: GameEventMap['damage-applied']): void {
    this.breakStatus(targetId, 'break-on-damage');
    const id = source.attackerId;
    if (id === null) return;
    if (source.kind === 'weapon' || source.kind === 'ability')
      this.breakStatus(id, 'break-on-attack');
    const attacker = this.state.entities.get(id);
    const target = this.state.entities.get(targetId);
    if (attacker?.family === 'legend') {
      const ledger = attacker.findComponent(UltimateLedger) ?? new UltimateLedger();
      attacker.addComponent(ledger);
      ledger.hits.set(targetId, this.state.tick);
      const health = target?.findComponent(Health);
      const isBoss =
        target?.family === 'boss' ||
        (target !== undefined && ZONE_LOCKING_MOBS.includes(target.definitionId));
      const fraction =
        target?.family === 'structure'
          ? ULTIMATE_CHARGE.structureHealthFractionPerPoint
          : isBoss
            ? ULTIMATE_CHARGE.bossHealthFractionPerPoint
            : null;
      if (fraction !== null && health !== undefined)
        this.gain(id, (amount + absorbed) / health.max / fraction);
    }
    if (
      source.kind === 'weapon' &&
      attacker
        ?.findComponent(StatusEffects)
        ?.active.some((status) => status.definition.id === FURY_HIT.statusId) === true
    )
      this.furyHit(id, targetId);
  }

  private death({ entityId, killer }: GameEventMap['entity-died']): void {
    const victim = this.state.entities.get(entityId);
    const killerId = killer.attackerId;
    if (killerId !== null)
      this.gain(
        killerId,
        victim?.family === 'legend'
          ? ULTIMATE_CHARGE.legendKill
          : victim?.family === 'mob' && !ZONE_LOCKING_MOBS.includes(victim.definitionId)
            ? ULTIMATE_CHARGE.minionKill
            : 0,
      );
    this.state.entities.forEach((entity) => {
      const ledger = entity.findComponent(UltimateLedger);
      const last = ledger?.hits.get(entityId);
      if (
        victim?.family === 'legend' &&
        entity.id !== killerId &&
        last !== undefined &&
        this.state.tick - last <= this.assistTicks &&
        this.state.entities.teamOf(entity.id) !== this.state.entities.teamOf(entityId)
      )
        this.gain(entity.id, ULTIMATE_CHARGE.assist);
      ledger?.hits.delete(entityId);
    });
    const slot = victim?.findComponent(Abilities)?.slot('ability-4');
    if (slot !== undefined)
      slot.charge = Math.max(0, slot.charge - ULTIMATE_CHARGE.deathLoss / ULTIMATE_CHARGE.maximum);
  }

  private gain(id: string, points: number): void {
    const entity = this.state.entities.get(id);
    const slot = entity?.findComponent(Abilities)?.slot('ability-4');
    if (
      entity?.family === 'legend' &&
      entity.findComponent(Health)?.isDead === false &&
      slot !== undefined &&
      this.state.tick >= slot.meterLockedUntilTick
    ) {
      const next = Math.min(1, slot.charge + points / ULTIMATE_CHARGE.maximum);
      slot.charge = 1 - next <= Number.EPSILON * ULTIMATE_CHARGE.maximum ? 1 : next;
    }
  }

  private breakStatus(id: string, flag: 'break-on-attack' | 'break-on-damage'): void {
    const active = this.state.entities.get(id)?.findComponent(StatusEffects)?.active ?? [];
    for (const status of [...active])
      if (status.definition.flags.includes(flag))
        this.statuses.remove(this.state, id, status.definition.id);
  }

  private furyHit(attackerId: string, targetId: string): void {
    const attacker = this.state.entities.get(attackerId)?.findComponent(Transform);
    const target = this.state.entities.get(targetId);
    const body = target?.findComponent(Transform);
    const movement = target?.findComponent(Movement);
    if (
      attacker === undefined ||
      body === undefined ||
      movement === undefined ||
      target?.findComponent(Health)?.isDead !== false
    )
      return;
    const delta = {
      x: body.position.x - attacker.position.x,
      y: body.position.y - attacker.position.y,
    };
    const direction = delta.x === 0 && delta.y === 0 ? attacker.facing : normalize(delta);
    const distance =
      (FURY_HIT.knockback * KNOCKBACK.baseMass) / Math.max(KNOCKBACK.baseMass, movement.mass);
    movement.push(
      { x: direction.x * distance, y: direction.y * distance },
      new TickRate(this.state.config.tickRate).toTicks(KNOCKBACK.travelSeconds),
    );
    this.statuses.apply(this.state, targetId, KNOCKBACK.staggerStatusId, attackerId);
  }
}
