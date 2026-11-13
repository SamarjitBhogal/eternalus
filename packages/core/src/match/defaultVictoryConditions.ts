import type { GameState } from '../state/GameState';
import { ObjectiveLostCondition } from './conditions/ObjectiveLostCondition';
import type { VictoryCondition } from './VictoryCondition.types';

/**
 * The victory conditions in check order, the first verdict wins (architecture 12 §6): the only
 * file that names them. Each condition that listens to events subscribes to `state` here.
 */
export const createDefaultVictoryConditions = (state: GameState): readonly VictoryCondition[] => [
  new ObjectiveLostCondition(state),
];
