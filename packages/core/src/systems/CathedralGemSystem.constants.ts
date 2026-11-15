import type { DamageSource } from '../state/GameEvents.types';

/**
 * The hits that count as hitting the gem directly: a weapon or an ability aimed at it. Damage
 * over time (`status`) and hits from structures or the environment do not; splash on a unit next
 * to the gem never names the gem as its target. Interim, pending the lightning item's question (4)
 * in `INBOX.md`.
 */
export const DIRECT_HIT_KINDS: ReadonlySet<DamageSource['kind']> = new Set(['weapon', 'ability']);
