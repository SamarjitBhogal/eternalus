import type { GameState } from '../state/GameState';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * Blocks damage between entities on the same team, so Legends never hurt allies and neutral
 * bosses never hurt each other. Damage with no attacker (environment) or against something with
 * no team (a tree) always passes.
 */
export class FriendlyFireStep implements DamageStep {
  public readonly name = 'friendly-fire';

  /** Returns 0 for a same-team hit, the amount otherwise. */
  public adjust({ targetId, amount, source }: DamageHit, state: GameState): number {
    if (source.attackerId === null) {
      return amount;
    }
    const attackerTeam = state.entities.teamOf(source.attackerId);
    const targetTeam = state.entities.teamOf(targetId);
    return attackerTeam !== undefined && attackerTeam === targetTeam ? 0 : amount;
  }
}
