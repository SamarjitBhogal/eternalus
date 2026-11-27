import { compareById } from '../utils/compareById';
import type { ThreatHit, ThreatTotal } from './ThreatLedger.types';

/**
 * The recent hits an entity took, by attacker (architecture 11 §4.6 "the highest recent damage
 * dealer", DEC-371 E7): the boss's memory of who hurts it. Old hits fall out, as the senses of
 * Alien: Isolation's alien decay. Game state, so `StateHasher` covers it. `BossDamageSystem` adds
 * it on a boss's first hit and records each later one.
 *
 * @remarks ponytail: one entry per hit, pruned on each record (a few hundred under a horde); fold
 * hits into per-second buckets if hashing it ever shows in a profile.
 */
export class ThreatLedger {
  private readonly hits: ThreatHit[] = [];

  /** The fields that change the entity's future, for `StateHasher`. */
  public get fields(): readonly (string | number)[] {
    return this.hits.flatMap(({ attackerId, tick, amount }) => [attackerId, tick, amount]);
  }

  /** Records `amount` dealt by `attackerId` on `tick`, and forgets the hits before `sinceTick`. */
  public record(attackerId: string, amount: number, tick: number, sinceTick: number): void {
    const stale = this.hits.findIndex((hit) => hit.tick >= sinceTick);
    this.hits.splice(0, stale === -1 ? this.hits.length : stale);
    this.hits.push({ attackerId, tick, amount });
  }

  /** Each attacker's damage from `sinceTick` on, in attacker id order. */
  public totalsSince(sinceTick: number): readonly ThreatTotal[] {
    const totals = new Map<string, number>();
    for (const { attackerId, tick, amount } of this.hits) {
      if (tick >= sinceTick) totals.set(attackerId, (totals.get(attackerId) ?? 0) + amount);
    }
    return [...totals]
      .sort(([a], [b]) => compareById(a, b))
      .map(([attackerId, amount]) => ({ attackerId, amount }));
  }
}
