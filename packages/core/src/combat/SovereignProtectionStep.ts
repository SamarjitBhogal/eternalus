import { Sovereign } from '../entities/Sovereign';
import type { GameState } from '../state/GameState';
import { isPlayableTeam } from '../teams/playableTeams';
import type { DamageHit, DamageStep } from './DamageStep.types';

/** A Sovereign takes no damage while a living friendly BuffTower protects it (DEC-73). */
export class SovereignProtectionStep implements DamageStep {
  public readonly name = 'sovereign-protection';

  /** Blocks a hit only while this Sovereign's own team still has a living BuffTower. */
  public adjust({ targetId, amount }: DamageHit, state: GameState): number {
    if (!(state.entities.get(targetId) instanceof Sovereign)) return amount;
    const team = state.entities.teamOf(targetId);
    return isPlayableTeam(team) && state.livingBuffTowerCount(team) > 0 ? 0 : amount;
  }
}
