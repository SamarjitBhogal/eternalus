import type { BotDifficultyDefinition } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import { sqrt } from '../utils/deterministicMath';
import { distanceSquaredToRect } from '../utils/geometry';
import type { BotTurn } from './BotLegendController.types';
import { BotMovement } from './BotMovement';
import { closeness, weakness } from './utility/considerations';
import { UtilityScorer } from './utility/UtilityScorer';

/**
 * Chooses a bot Legend's enemy for `Fight` and `Defend` (architecture 11 §4.2): the
 * `UtilityScorer` of the bot's difficulty rates each candidate by its closeness to the bot and its
 * weakness. `BotLeaves` owns one. Stateless apart from its scorers, one per difficulty.
 */
export class BotTargeting {
  private readonly scorers = new Map<string, UtilityScorer<'closeness' | 'weakness'>>();

  /**
   * Picks the enemy in `engageRadius` the utility scorer likes best: an enemy unit, or a camp mob
   * attacking the bot (DEC-166; it never farms a camp that leaves it alone).
   */
  public findEnemy(turn: BotTurn): boolean {
    const { id, team, position, difficulty, perception } = turn;
    const enemies = perception.unitsWithin(position, difficulty.engageRadius, {
      hostileTo: team,
      neutralAttackersOf: id,
      aliveOnly: true,
    });
    turn.enemy = this.best(turn, enemies, difficulty.engageRadius);
    return turn.enemy !== null;
  }

  /**
   * Picks an enemy to drive off the bot's own structures on `lane` (DEC-323 (2)): a standing tower
   * or gate is under attack while an enemy unit within `engageRadius` of its box (`box`: its whole
   * fort, so the fort area plus the engage radius) has it as its attack target. Of the enemies
   * there round the attacked structure nearest the bot (the earlier in the lane index on a tie),
   * the scorer picks one, wherever on its lane the bot stands. The Rover's tree has no `Defend`.
   */
  public findDefence(turn: BotTurn, lane: string): boolean {
    const { state, team, position, difficulty } = turn;
    let attackedGap = Number.POSITIVE_INFINITY;
    let enemies: readonly EntityId[] = [];
    let reach = 0;
    // `onLane` lists in store order, so the strict comparison keeps the earlier entry on a tie.
    for (const entry of state.laneStructures.onLane(lane, team)) {
      const gap = BotMovement.gapSquared(position, entry);
      if (gap >= attackedGap || !state.entities.isAlive(entry.id)) {
        continue;
      }
      const { box } = entry;
      const halfDiagonal = sqrt(box.width * box.width + box.height * box.height) / 2;
      const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const near = turn.perception
        .unitsWithin(centre, halfDiagonal + difficulty.engageRadius, {
          hostileTo: team,
          aliveOnly: true,
        })
        .filter((enemy) => {
          const at = BotMovement.positionOf(state, enemy);
          const engage = difficulty.engageRadius * difficulty.engageRadius;
          return at !== undefined && distanceSquaredToRect(at, box) <= engage;
        });
      if (near.some((enemy) => state.entities.attackTargetOf(enemy) === entry.id)) {
        attackedGap = gap;
        enemies = near;
        // The bot is `sqrt(gap)` from the structure, which stands in its box.
        reach = 2 * halfDiagonal + difficulty.engageRadius;
      }
    }
    if (enemies.length === 0) {
      return false;
    }
    turn.enemy = this.best(turn, enemies, sqrt(attackedGap) + reach);
    return turn.enemy !== null;
  }

  /** The enemy the scorer likes best; closeness falls from 1 at the bot to 0 at `range`. */
  private best(turn: BotTurn, enemies: readonly EntityId[], range: number): EntityId | null {
    const { state, position, difficulty } = turn;
    return this.scorerFor(difficulty).best(enemies, (enemy) => {
      const at = BotMovement.positionOf(state, enemy) ?? position;
      return {
        closeness: closeness(sqrt(BotMovement.gapSquared(position, at)), range),
        weakness: weakness(state.entities.healthFractionOf(enemy) ?? 1),
      };
    });
  }

  private scorerFor(difficulty: BotDifficultyDefinition): UtilityScorer<'closeness' | 'weakness'> {
    let scorer = this.scorers.get(difficulty.id);
    if (scorer === undefined) {
      scorer = new UtilityScorer(difficulty.utilityWeights);
      this.scorers.set(difficulty.id, scorer);
    }
    return scorer;
  }
}
