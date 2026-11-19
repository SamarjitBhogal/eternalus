import type { AbilityRegistry } from '../abilities/AbilityRegistry';
import { fieldRectangle } from '../abilities/fieldGeometry';
import { TargetQuery } from '../abilities/TargetQuery';
import type { DamagePipeline } from '../combat/DamagePipeline';
import type { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { AbilityLifetime } from '../components/AbilityLifetime';
import { BeamChannel } from '../components/BeamChannel';
import { Channeling } from '../components/Channeling';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Transform } from '../components/Transform';
import { ZoneArea } from '../components/ZoneArea';
import type { GameState } from '../state/GameState';
import type { ActiveBeam } from './BeamSystem.types';
import type { System, SystemContext } from './System.types';

/** Death Ray pulses, interruption and bounded symmetric opposing-beam locks. */
export class BeamSystem implements System {
  public readonly name = 'beam-channels';
  private readonly targets: TargetQuery;
  /** Uses the match's shared damage and status pipelines. */
  public constructor(
    registry: AbilityRegistry,
    private readonly damage: DamagePipeline,
    private readonly statuses: StatusEffectApplier,
  ) {
    this.targets = new TargetQuery(registry);
  }
  /** Determines both sides of each lock before advancing either channel. */
  public update({ state }: SystemContext): void {
    if (state.match.isIdleHeld) return;
    const active: ActiveBeam[] = [];
    state.entities.forEach((entity) => {
      const life = entity.findComponent(AbilityLifetime);
      const beam = entity.findComponent(BeamChannel);
      if (life !== undefined && beam !== undefined) active.push({ entity, life, beam });
    });
    const locked = new Set<string>();
    for (const a of active)
      for (const b of active) {
        if (a === b || state.entities.teamOf(a.entity.id) === state.entities.teamOf(b.entity.id))
          continue;
        if (
          this.hits(state, a).includes(b.life.casterId) &&
          this.hits(state, b).includes(a.life.casterId)
        ) {
          locked.add(a.entity.id);
          locked.add(b.entity.id);
        }
      }
    for (const field of active) this.advance(state, field, locked.has(field.entity.id));
  }

  private advance(state: GameState, field: ActiveBeam, isLocked: boolean): void {
    const { entity, life, beam } = field;
    const caster = state.entities.get(life.casterId);
    if (
      caster?.findComponent(Health)?.isDead !== false ||
      caster.findComponent(StatusEffects)?.has('cannot-cast') === true ||
      caster.findComponent(StatusEffects)?.hasStatus('channeling') !== true ||
      caster.findComponent(Channeling)?.entityId !== entity.id
    ) {
      this.finish(state, field);
      return;
    }
    if (isLocked) life.expiresTick = Math.min(beam.maximumExpiryTick, life.expiresTick + 1);
    const position = caster.getComponent(Transform).position;
    entity.getComponent(Transform).moveTo(position);
    const length =
      state.collisions?.reach(position, beam.direction, beam.range, Number.EPSILON) ?? beam.range;
    entity.addComponent(
      new ZoneArea([fieldRectangle(position, beam.direction, length, beam.width)]),
    );
    if (state.tick <= life.expiresTick && state.tick >= beam.nextPulseTick) {
      for (const targetId of this.hits(state, field))
        this.damage.apply(state, targetId, beam.damage, {
          attackerId: life.casterId,
          kind: 'ability',
          definitionId: life.abilityId,
        });
      beam.nextPulseTick += beam.pulseTicks;
    }
    if (state.tick >= life.expiresTick) this.finish(state, field);
  }

  private hits(state: GameState, { life, beam }: ActiveBeam): readonly string[] {
    const body = state.entities.get(life.casterId)?.findComponent(Transform);
    if (body === undefined) return [];
    const from = body.position;
    const length =
      state.collisions?.reach(from, beam.direction, beam.range, Number.EPSILON) ?? beam.range;
    const shape = { kind: 'path', width: beam.width };
    return this.targets.find(
      state,
      life.casterId,
      shape,
      {
        from,
        to: { x: from.x + beam.direction.x * length, y: from.y + beam.direction.y * length },
      },
      { team: 'enemies' },
    );
  }

  private finish(state: GameState, { entity, life }: ActiveBeam): void {
    const caster = state.entities.get(life.casterId);
    if (caster?.findComponent(Channeling)?.entityId === entity.id) {
      caster.removeComponent(Channeling);
      this.statuses.remove(state, caster.id, 'channeling');
    }
    if (state.entities.has(entity.id)) {
      state.entities.remove(entity.id, 'consumed');
      state.events.emit('entity-removed', { entityId: entity.id, cause: 'consumed' });
    }
  }
}
