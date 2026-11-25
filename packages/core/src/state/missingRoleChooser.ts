import { ControllerBinding } from '../components/ControllerBinding';
import { TeamMembership } from '../components/TeamMembership';
import type { Entity } from '../entities/Entity';
import { Legend } from '../entities/Legend';
import { assignLanes } from './assignLanes';
import type { MissingRoleBots, MissingRoleChooser } from './missingRoleChooser.types';

/**
 * The bot a Legend becomes when the human leaves it (owner's answer of 2026-11-23 on PR #112
 * item (2); architecture 11 §7, 18 §8): the role its team lacks. With no Rover bot on the team
 * (alive or waiting to respawn), the Rover; otherwise a lane bot on the lane with the fewest of its
 * team's lane bots (`assignLanes`, `legendsPerLane`). With no lane to take (no map, or every lane
 * full) it falls back to the Rover, which takes no lane.
 *
 * @param bots - The Rover's and the lane bot's controller and difficulty (`Simulation`, content).
 */
export const createMissingRoleChooser =
  ({ rover, laner }: MissingRoleBots): MissingRoleChooser =>
  (state, legendId, team) => {
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
    if (!seen.hasRover) {
      return rover;
    }
    const laneIds = (state.world?.routes.lanes ?? []).map(({ id }) => id);
    const { legendsPerLane } = state.config.match;
    const room = laneIds.some((id) => (occupied[id] ?? 0) < legendsPerLane);
    if (!room) {
      return rover;
    }
    const [lane = ''] = assignLanes(1, laneIds, legendsPerLane, occupied);
    return { ...laner, memory: { lane } };
  };
