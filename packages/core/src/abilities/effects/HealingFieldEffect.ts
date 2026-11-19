import { AbilityLifetime } from '../../components/AbilityLifetime';
import { HealingField } from '../../components/HealingField';
import { Transform } from '../../components/Transform';
import type {
  HealingFieldSpec,
  WithoutTimes,
} from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { fieldCircle } from '../fieldGeometry';
import { mustBePositive } from '../specChecks';
import type { AbilitySpawn } from '../../state/AbilitySpawn.types';

/** Spawns Sanctuary through the match factory; ticks are owned by the field system. */
export class HealingFieldEffect implements AbilityEffect<HealingFieldSpec> {
  public readonly kind = 'healing-field';
  /** Receives the match's spawn port. */
  public constructor(private readonly spawn: AbilitySpawn) {}
  /** Validates the authored area, lifetime and healing fraction. */
  public validate(spec: HealingFieldSpec): readonly string[] {
    return [
      ...mustBePositive(spec.radius, 'healing radius'),
      ...mustBePositive(spec.durationTicks, 'healing duration'),
      ...mustBePositive(spec.fractionPerSecond, 'healing fraction'),
    ];
  }
  /** Shows the caster-centred healing radius. */
  public describe(spec: WithoutTimes<HealingFieldSpec>): readonly AbilityDisplayStep[] {
    return [{ kind: this.kind, shape: { kind: 'circle', radius: spec.radius } }];
  }
  /** A field remains where cast even when the caster moves or dies. */
  public apply(spec: HealingFieldSpec, cast: CastContext): void {
    const position = cast.state.entities.get(cast.casterId)?.getComponent(Transform).position;
    if (position === undefined) return;
    const team = cast.state.entities.teamOf(cast.casterId);
    const field = this.spawn('sanctuary-field', {
      position,
      ...(team === undefined ? {} : { team }),
      area: [fieldCircle(position, spec.radius)],
    });
    field.addComponent(
      new AbilityLifetime(cast.casterId, cast.abilityId, cast.tick + spec.durationTicks),
    );
    field.addComponent(
      new HealingField(
        cast.scaled('fractionPerSecond', spec.fractionPerSecond) / cast.state.config.tickRate,
      ),
    );
  }
}
