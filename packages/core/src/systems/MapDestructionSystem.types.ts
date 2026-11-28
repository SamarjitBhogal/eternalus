import type { DamagePipeline } from '../combat/DamagePipeline';
import type { ObstacleDefinition } from '../content/obstacles/obstacles.types';
import type { LaneFlowFields } from '../map/LaneFlowFields';
import type { GameState } from '../state/GameState';
import type { DamageSource } from '../state/GameEvents.types';

/** A lethal building hit whose owned walls and furnishings must share its collapse. */
export type BuildingCollapse = { readonly buildingId: string; readonly source: DamageSource };

/** What a `MapDestructionSystem` is built from. */
export type MapDestructionOptions = {
  readonly state: GameState;
  /** The match's damage step; a collapse hits the contents through it. */
  readonly damage: DamagePipeline;
  /** The lane fields to mark dirty over reopened cells; `null` without hordes. */
  readonly flowFields: LaneFlowFields | null;
  /** What each standing fort wall becomes when its tower falls (DEC-219 (a)). */
  readonly ruinWall: ObstacleDefinition;
};
