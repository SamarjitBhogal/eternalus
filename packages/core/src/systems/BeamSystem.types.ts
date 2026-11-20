import type { AbilityLifetime } from '../components/AbilityLifetime';
import type { BeamChannel } from '../components/BeamChannel';
import type { Entity } from '../entities/Entity';

/** One active channel collected before the pulse/lock pass. */
export type ActiveBeam = {
  readonly entity: Entity;
  readonly life: AbilityLifetime;
  readonly beam: BeamChannel;
};
