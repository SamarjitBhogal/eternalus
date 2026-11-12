import type { DamageHit, DamageStep } from './DamageStep.types';
import type { GameState } from '../state/GameState';

/**
 * Bosses take only part of a lane minion's hit (`balancing.md` "25% from minions"): a hit whose
 * attacker is a horde member, on a target whose definition id is in `takenShare`, is multiplied by
 * that share. Legends, guards, camp mobs and attackerless damage pass unchanged.
 */
export class BossMinionDamageStep implements DamageStep {
  public readonly name = 'boss-minion-damage';

  /** @param takenShare - The share of a minion's hit each boss takes, by definition id, from content. */
  public constructor(private readonly takenShare: Readonly<Record<string, number>>) {}

  /** Returns the amount after the target's share of a minion's hit. */
  public adjust({ targetId, amount, source }: DamageHit, state: GameState): number {
    const definitionId = state.entities.get(targetId)?.definitionId;
    const share = definitionId === undefined ? undefined : this.takenShare[definitionId];
    if (share === undefined || source.attackerId === null) {
      return amount;
    }
    return state.hordes.hordeOf(source.attackerId) === undefined ? amount : amount * share;
  }
}
