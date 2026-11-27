import { describe, expect, it } from 'vitest';

import { ControllerBinding } from '../components/ControllerBinding';
import { TeamMembership } from '../components/TeamMembership';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { AiMemory } from '../content/ai/ai.types';
import { Legend } from '../entities/Legend';
import { WorldMap } from '../map/WorldMap';
import type { PlayableTeam } from '../teams/teams.types';
import { TWO_LANE_MAP } from './__fixtures__/twoLaneMap';
import { GameState } from './GameState';
import { MatchWorld } from './MatchWorld';
import { createMissingRoleChooser, createPickedBotChooser } from './missingRoleChooser';

class Hero extends Legend {
  public readonly kind = 'hero';

  protected override installComponents(context: unknown): void {
    const { team } = context as { team: PlayableTeam };
    this.addComponent(new TeamMembership(team));
  }
}

const ROVER = { controllerId: 'rover', profileId: 'rover', memory: {} } as const;
const BOTS = { rover: ROVER, laner: { controllerId: 'bot-legend', profileId: 'normal' } } as const;
const choose = createMissingRoleChooser(BOTS);
const pick = createPickedBotChooser(BOTS);

/** A match on the two-lane map (`lane-0`, `lane-1`) with one Legend per lane per team. */
const stateWith = (hasMap = true): GameState =>
  new GameState(
    createDefaultGameConfig({ match: { legendsPerLane: 1 } }),
    1,
    hasMap
      ? new MatchWorld(
          TWO_LANE_MAP,
          WorldMap.fromDefinition(TWO_LANE_MAP, 2, () => false),
        )
      : null,
  );

const addLegend = (
  state: GameState,
  id: string,
  team: PlayableTeam,
  bot?: { readonly controllerId: 'rover' | 'bot-legend'; readonly memory: AiMemory },
): Legend => {
  const legend = new Hero(id, 'hero');
  legend.spawn({ team });
  if (bot !== undefined) {
    legend.addComponent(new ControllerBinding(bot.controllerId, 'normal', bot.memory));
  }
  state.entities.add(legend);
  return legend;
};

describe('createMissingRoleChooser', () => {
  it('picks the Rover when the team has no Rover bot (another team Rover does not count)', () => {
    const state = stateWith();
    addLegend(state, 'entity-1', 'light');
    addLegend(state, 'entity-2', 'light', {
      controllerId: 'bot-legend',
      memory: { lane: 'lane-0' },
    });
    addLegend(state, 'entity-3', 'dark', { controllerId: 'rover', memory: {} });

    expect(choose(state, 'entity-1', 'light')).toEqual(ROVER);
  });

  it('picks a lane bot on the free lane when the team has its Rover', () => {
    const state = stateWith();
    addLegend(state, 'entity-1', 'light');
    addLegend(state, 'entity-2', 'light', { controllerId: 'rover', memory: {} });
    addLegend(state, 'entity-3', 'light', {
      controllerId: 'bot-legend',
      memory: { lane: 'lane-0' },
    });
    addLegend(state, 'entity-4', 'dark', {
      controllerId: 'bot-legend',
      memory: { lane: 'lane-1' },
    });

    expect(choose(state, 'entity-1', 'light')).toEqual({
      controllerId: 'bot-legend',
      profileId: 'normal',
      memory: { lane: 'lane-1' },
    });
  });

  it('takes the lowest lane index first when the lanes are even', () => {
    const state = stateWith();
    addLegend(state, 'entity-1', 'light');
    addLegend(state, 'entity-2', 'light', { controllerId: 'rover', memory: {} });

    expect(choose(state, 'entity-1', 'light').memory).toEqual({ lane: 'lane-0' });
  });

  it('counts a Rover bot waiting to respawn as the team Rover', () => {
    const state = stateWith();
    addLegend(state, 'entity-1', 'light');
    const rover = addLegend(state, 'entity-2', 'light', { controllerId: 'rover', memory: {} });
    state.entities.withdraw(rover.id, 'died');
    state.respawns.add(rover, 'light', 100);

    expect(choose(state, 'entity-1', 'light').controllerId).toBe('bot-legend');
  });

  it('falls back to the Rover when no lane has room, or the match has no map', () => {
    const full = stateWith();
    addLegend(full, 'entity-1', 'light');
    addLegend(full, 'entity-2', 'light', { controllerId: 'rover', memory: {} });
    addLegend(full, 'entity-3', 'light', {
      controllerId: 'bot-legend',
      memory: { lane: 'lane-0' },
    });
    addLegend(full, 'entity-4', 'light', {
      controllerId: 'bot-legend',
      memory: { lane: 'lane-1' },
    });
    expect(choose(full, 'entity-1', 'light')).toEqual(ROVER);

    const mapless = stateWith(false);
    addLegend(mapless, 'entity-1', 'light');
    addLegend(mapless, 'entity-2', 'light', { controllerId: 'rover', memory: {} });
    expect(choose(mapless, 'entity-1', 'light')).toEqual(ROVER);
  });

  it('does not count the Legend the human leaves', () => {
    const state = stateWith();
    addLegend(state, 'entity-1', 'light', { controllerId: 'rover', memory: {} });

    expect(choose(state, 'entity-1', 'light')).toEqual(ROVER);
  });
});

describe('createPickedBotChooser (DEC-356)', () => {
  it('gives the Rover for its id, also when the team has a Rover bot', () => {
    const state = stateWith();
    addLegend(state, 'entity-1', 'light');
    addLegend(state, 'entity-2', 'light', { controllerId: 'rover', memory: {} });

    expect(pick(state, 'entity-1', 'light', 'rover')).toEqual(ROVER);
  });

  it('gives a lane bot on the lane with the fewest of its team lane bots, also when the team lacks a Rover', () => {
    const state = stateWith();
    addLegend(state, 'entity-1', 'light');
    addLegend(state, 'entity-2', 'light', {
      controllerId: 'bot-legend',
      memory: { lane: 'lane-0' },
    });
    addLegend(state, 'entity-3', 'dark', {
      controllerId: 'bot-legend',
      memory: { lane: 'lane-1' },
    });

    expect(pick(state, 'entity-1', 'light', 'bot-legend')).toEqual({
      controllerId: 'bot-legend',
      profileId: 'normal',
      memory: { lane: 'lane-1' },
    });
  });

  it('goes past legendsPerLane when every lane is full, and falls back to the Rover with no map', () => {
    const full = stateWith();
    addLegend(full, 'entity-1', 'light');
    for (const [id, lane] of [
      ['entity-2', 'lane-0'],
      ['entity-3', 'lane-1'],
      ['entity-4', 'lane-0'],
    ] as const) {
      addLegend(full, id, 'light', { controllerId: 'bot-legend', memory: { lane } });
    }
    expect(pick(full, 'entity-1', 'light', 'bot-legend')?.memory).toEqual({ lane: 'lane-1' });

    const mapless = stateWith(false);
    addLegend(mapless, 'entity-1', 'light');
    expect(pick(mapless, 'entity-1', 'light', 'bot-legend')).toEqual(ROVER);
  });

  it('does not count the Legend itself', () => {
    const state = stateWith();
    addLegend(state, 'entity-1', 'light', {
      controllerId: 'bot-legend',
      memory: { lane: 'lane-0' },
    });

    expect(pick(state, 'entity-1', 'light', 'bot-legend')?.memory).toEqual({ lane: 'lane-0' });
  });

  it('names no bot for any other controller id', () => {
    const state = stateWith();
    addLegend(state, 'entity-1', 'light');

    expect(pick(state, 'entity-1', 'light', 'player')).toBeUndefined();
    expect(pick(state, 'entity-1', 'light', 'no-such')).toBeUndefined();
  });
});
