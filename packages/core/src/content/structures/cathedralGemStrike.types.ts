/** What kind of damage the gem's lightning deals. The damage pipeline reads no type yet. */
type GemStrikeDamageType = 'physical' | 'magical';

/**
 * The Cathedral gem's lightning on attackers (DISC-11): what one strike deals, how often the gem
 * can strike, and how far away an attacker can be and still be struck.
 */
export type CathedralGemStrike = {
  /** Damage per strike, before the damage steps. */
  readonly damage: number;
  readonly damageType: GemStrikeDamageType;
  /** Seconds between strikes; one cooldown for the gem, whoever hit it. */
  readonly cooldownSeconds: number;
  /** World units from the gem's centre to the attacker; a farther attacker is not struck. */
  readonly range: number;
};
