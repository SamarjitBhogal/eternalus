import { AbilityLifetime } from '../../components/AbilityLifetime';
import { BeamChannel } from '../../components/BeamChannel';
import { Channeling } from '../../components/Channeling';
import { Transform } from '../../components/Transform';
import type { BeamSpec, WithoutTimes } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { fieldRectangle } from '../fieldGeometry';
import { mustBePositive } from '../specChecks';
import type { AbilitySpawn } from '../../state/AbilitySpawn.types';

/** Begins the channel; the field system applies timed pulses and opposing-ray locks. */
export class BeamEffect implements AbilityEffect<BeamSpec> {
  public readonly kind = 'beam';
  /** Receives the match's entity spawn port. */
  public constructor(private readonly spawn: AbilitySpawn) {}
  /** Checks every length and fixed-tick interval. */
  public validate(spec: BeamSpec): readonly string[] {
    return Object.entries(spec).flatMap(([key, value]) =>
      typeof value === 'number' ? mustBePositive(value, `beam ${key}`) : [],
    );
  }
  /** Shows the beam's full authored reach. */
  public describe(spec: WithoutTimes<BeamSpec>): readonly AbilityDisplayStep[] {
    return [
      {
        kind: this.kind,
        shape: { kind: 'path', width: spec.width },
        distance: spec.range,
        collisionRadius: Number.EPSILON,
      },
    ];
  }
  /** Locks movement/attacks until the channel retires, with a bounded extension budget. */
  public apply(spec: BeamSpec, cast: CastContext): void {
    const caster = cast.state.entities.get(cast.casterId);
    const position = caster?.getComponent(Transform).position;
    if (caster === undefined || position === undefined) return;
    const team = cast.state.entities.teamOf(cast.casterId);
    const field = this.spawn('death-ray-field', {
      position,
      ...(team === undefined ? {} : { team }),
      area: [fieldRectangle(position, cast.direction, spec.range, spec.width)],
    });
    field.addComponent(
      new AbilityLifetime(cast.casterId, cast.abilityId, cast.tick + spec.durationTicks),
    );
    field.addComponent(
      new BeamChannel(
        cast.direction,
        spec.range,
        spec.width,
        cast.scaled('damage', spec.damage),
        spec.pulseTicks,
        cast.tick + spec.durationTicks + spec.extensionTicks,
        cast.tick,
      ),
    );
    caster.addComponent(new Channeling(field.id));
    // The field performs its final inclusive pulse before releasing the channel in that tick.
    cast.statuses.apply(
      cast.state,
      cast.casterId,
      'channeling',
      cast.casterId,
      spec.durationTicks + spec.extensionTicks + 1,
    );
  }
}
