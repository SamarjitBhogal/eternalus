import { ControllerBinding } from '../components/ControllerBinding';
import { TeamMembership } from '../components/TeamMembership';
import type { ControllerSpawn } from '../entities/EntityFactory.types';
import type { Entity } from '../entities/Entity';
import { Legend } from '../entities/Legend';
import type { PlayableTeam } from '../teams/teams.types';
import { assignLanes } from './assignLanes';
import type { EntityId } from './EntityStore.types';
import type { GameState } from './GameState';
import type {
  MissingRoleBots,
  MissingRoleChooser,
  PickedBotChooser,
  TeamBots,
} from './missingRoleChooser.types';

/**
 * The lane cap of a lane bot a developer picks: none, so it goes past `legendsPerLane` when every
 * lane is full (DEC-356 (1); a reading the owner confirms, `INBOX.md` BUG-4 slice 3 (i)).
 */
const NO_LANE_CAP = Number.POSITIVE_INFINITY;

/** Counts `team`'s bots, alive or waiting to respawn, except the Legend `legendId`. */
const countTeamBots = (
  state: GameState,
  legendId: EntityId,
  team: PlayableTeam,
  { rover, laner }: MissingRoleBots,
): TeamBots => {
  const seen = { hasRover: false };
  const occupied: Record<string, number> = {};
  const count = (legend: Entity): void => {
    const binding = legend.findComponent(ControllerBinding);
    if (legend.id === legendId || binding === undefined) {
      return;
    }
    const { lane } = binding.initialMemory;
    if (binding.controllerId === rover.controllerId) {
      seen.hasRover = true;
    } else if (binding.controllerId === laner.controllerId && typeof lane === 'string') {
      occupied[lane] = (occupied[lane] ?? 0) + 1;
    }
  };
  state.entities.forEach((entity) => {
    if (entity instanceof Legend && entity.findComponent(TeamMembership)?.team === team) {
      count(entity);
    }
  });
  state.respawns.forEach((entry) => {
    if (entry.team === team) {
      count(entry.legend);
    }
  });
  return { hasRover: seen.hasRover, occupied };
};

/**
 * A lane bot on the lane with the fewest of its team's lane bots (`assignLanes`), the lowest lane
 * index first, at most `perLane` on a lane; `undefined` when no lane has room (or the match has no
 * map).
 */
const lanerOnFreeLane = (
  state: GameState,
  { laner }: MissingRoleBots,
  occupied: Readonly<Record<string, number>>,
  perLane: number,
): ControllerSpawn | undefined => {
  const laneIds = (state.world?.routes.lanes ?? []).map(({ id }) => id);
  if (!laneIds.some((id) => (occupied[id] ?? 0) < perLane)) {
    return undefined;
  }
  const [lane = ''] = assignLanes(1, laneIds, perLane, occupied);
  return { ...laner, memory: { lane } };
};

/**
 * The bot a Legend becomes when the human leaves it with no bot picked (owner's answer of
 * 2026-11-23 on PR #112 item (2); architecture 11 §7, 18 §8): the role its team lacks. With no
 * Rover bot on the team (alive or waiting to respawn), the Rover; otherwise a lane bot on the lane
 * with the fewest of its team's lane bots (`legendsPerLane`). With no lane to take (no map, or
 * every lane full) it falls back to the Rover, which takes no lane.
 *
 * @param bots - The Rover's and the lane bot's controller and difficulty (`Simulation`, content).
 */
export const createMissingRoleChooser =
  (bots: MissingRoleBots): MissingRoleChooser =>
  (state, legendId, team) => {
    const { hasRover, occupied } = countTeamBots(state, legendId, team, bots);
    const laner = hasRover
      ? lanerOnFreeLane(state, bots, occupied, state.config.match.legendsPerLane)
      : undefined;
    return laner ?? bots.rover;
  };

/**
 * The bot a developer picks for a Legend in sim mode (owner's answer of 2026-11-26 on PR #112
 * item (1), DEC-356; architecture 11 §7). The Rover's controller id gives the Rover, also when the
 * team has one. The lane bot's gives a lane bot on the lane with the fewest of its team's lane
 * bots, past `legendsPerLane` when every lane is full; with no map it falls back to the Rover. Any
 * other id names no bot.
 *
 * @param bots - The Rover's and the lane bot's controller and difficulty (`Simulation`, content).
 */
export const createPickedBotChooser = (bots: MissingRoleBots): PickedBotChooser => {
  // One entry per bot a developer can pick, by controller id (a registry, not a switch on the id).
  const byController = new Map<
    string,
    (state: GameState, legendId: EntityId, team: PlayableTeam) => ControllerSpawn
  >([
    [bots.rover.controllerId, () => bots.rover],
    [
      bots.laner.controllerId,
      (state, legendId, team) => {
        const { occupied } = countTeamBots(state, legendId, team, bots);
        return lanerOnFreeLane(state, bots, occupied, NO_LANE_CAP) ?? bots.rover;
      },
    ],
  ]);
  return (state, legendId, team, controllerId) =>
    byController.get(controllerId)?.(state, legendId, team);
};
