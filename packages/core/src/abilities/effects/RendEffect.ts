import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { Transform } from '../../components/Transform';
import { KNOCKBACK } from '../../content/abilities/knockback';
import type { RendSpec, WithoutTimes } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import { normalize } from '../../utils/vec2';
import { TickRate } from '../../utils/TickRate';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { mustBePositive } from '../specChecks';

/** Rip & Tear's directional hit, bleed and low-health execution/pull. */
export class RendEffect implements AbilityEffect<RendSpec> {
  public readonly kind = 'rend';
  /** Receives the status definitions used by the applier. */
  public constructor(private readonly statuses: { has(id: string): boolean }) {}
  /** Validates execution parameters and the bleed reference. */
  public validate(spec: RendSpec): readonly string[] {
    return [
      ...mustBePositive(spec.damage, 'rend damage'),
      ...mustBePositive(spec.pull, 'rend pull'),
      ...mustBePositive(spec.multiplier, 'rend execution multiplier'),
      ...(spec.threshold > 0 && spec.threshold < 1 ? [] : ['Rend threshold must be a fraction']),
      ...(this.statuses.has(spec.statusId) ? [] : ['Unknown rend status']),
    ];
  }
  /** Shows the cone in the shared aim overlay. */
  public describe(spec: WithoutTimes<RendSpec>): readonly AbilityDisplayStep[] {
    return [{ kind: this.kind, shape: spec.shape }];
  }
  /** Uses health before the hit to decide execution, with no friendly fire. */
  public apply(spec: RendSpec, cast: CastContext): void {
    for (const id of cast.targets(spec.shape, { team: 'enemies' })) {
      const target = cast.state.entities.get(id);
      const health = target?.findComponent(Health);
      const isLow = health !== undefined && health.current < health.max * spec.threshold;
      cast.damage.apply(
        cast.state,
        id,
        cast.scaled('damage', spec.damage) * (isLow ? spec.multiplier : 1),
        { attackerId: cast.casterId, kind: 'ability', definitionId: cast.abilityId },
      );
      cast.statuses.apply(cast.state, id, spec.statusId, cast.casterId);
      const movement = target?.findComponent(Movement);
      const position = target?.findComponent(Transform)?.position;
      if (isLow && !health.isDead && movement !== undefined && position !== undefined) {
        const offset = {
          x: cast.placement.from.x - position.x,
          y: cast.placement.from.y - position.y,
        };
        const direction = offset.x === 0 && offset.y === 0 ? { x: 0, y: 0 } : normalize(offset);
        const distance =
          (spec.pull * KNOCKBACK.baseMass) / Math.max(KNOCKBACK.baseMass, movement.mass);
        movement.push(
          { x: direction.x * distance, y: direction.y * distance },
          new TickRate(cast.state.config.tickRate).toTicks(KNOCKBACK.travelSeconds),
        );
      }
    }
  }
}
