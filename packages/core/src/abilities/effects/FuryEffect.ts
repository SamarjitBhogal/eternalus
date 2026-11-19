import { Abilities } from '../../components/Abilities';
import { StatusEffects } from '../../components/StatusEffects';
import type { FurySpec } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { mustBePositive } from '../specChecks';

/** Starts Fury once, then treats repeat presses during it as its documented short dash. */
export class FuryEffect implements AbilityEffect<FurySpec> {
  public readonly kind = 'fury';
  /** Receives status references for the same boot-time checks as other effects. */
  public constructor(private readonly statuses: { has(id: string): boolean }) {}
  /** Checks the status and fixed-tick dash parameters. */
  public validate(spec: FurySpec): readonly string[] {
    return [
      ...mustBePositive(spec.durationTicks, 'Fury duration'),
      ...mustBePositive(spec.dashDistance, 'Fury dash'),
      ...mustBePositive(spec.dashTicks, 'Fury dash duration'),
      ...mustBePositive(spec.internalCooldownTicks, 'Fury dash cooldown'),
      ...(this.statuses.has(spec.statusId) ? [] : ['Unknown Fury status']),
    ];
  }
  /** Initial activation is a self buff; repeat casts use the current aim. */
  public describe(): readonly AbilityDisplayStep[] {
    return [];
  }
  /** Does not spend or reset the ultimate meter for each repeat dash. */
  public apply(spec: FurySpec, cast: CastContext): void {
    const slot = cast.state.entities.get(cast.casterId)?.findComponent(Abilities)?.slot(cast.slot);
    if (slot === undefined) return;
    if (
      slot.isRecastActive(
        cast.tick,
        cast.state.entities.get(cast.casterId)?.findComponent(StatusEffects),
      )
    ) {
      const dash = {
        kind: 'dash',
        distance: spec.dashDistance,
        durationTicks: spec.dashTicks,
        onPath: [],
        onEnd: [],
      };
      cast.run(dash, cast.placement);
      slot.recordRecast(cast.tick);
      return;
    }
    cast.statuses.apply(cast.state, cast.casterId, spec.statusId, cast.casterId);
    slot.recastUntilTick = cast.tick + spec.durationTicks;
    slot.nextRecastTick = cast.tick;
    slot.recastCooldownTicks = spec.internalCooldownTicks;
    slot.recastStatusId = spec.statusId;
  }
}
