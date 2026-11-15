import type { Team } from '../teams/teams.types';
import type { HealingZone } from './HealingZones.types';

/** A quiet friendly structure's bonus per tick and the ground it covers. */
export type BonusZone = {
  readonly team: Team | undefined;
  readonly bonusPerTick: number;
  readonly zone: HealingZone;
};
