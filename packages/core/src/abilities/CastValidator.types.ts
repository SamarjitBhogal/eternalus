import type { AbilityRejectReason } from '../content/abilities/AbilityDefinition.types';

/** Why a cast is refused: an ability reason (05 §6), or no such caster at all. */
export type CastRejectReason = AbilityRejectReason | 'unknown-entity';
