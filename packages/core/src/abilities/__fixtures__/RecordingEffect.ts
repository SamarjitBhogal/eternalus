import type { AbilityEffect, CastContext, EffectStep } from '../AbilityEffect.types';

/** One step a `RecordingEffect` ran. */
export type RecordedStep = { readonly spec: EffectStep; readonly cast: CastContext };

/**
 * A test double for any effect kind: it only records each step it is asked to apply, into a log
 * that several doubles may share (to see the order across kinds).
 */
export class RecordingEffect implements AbilityEffect {
  /**
   * @param kind - The effect kind it stands in for.
   * @param log - Where it records; a fresh list when omitted.
   */
  public constructor(
    public readonly kind: string,
    public readonly log: RecordedStep[] = [],
  ) {}

  /** Records the step. */
  public apply(spec: EffectStep, cast: CastContext): void {
    this.log.push({ spec, cast });
  }
}
