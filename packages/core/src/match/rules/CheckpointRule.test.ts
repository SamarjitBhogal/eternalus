import { describe, expect, it } from 'vitest';

import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { SCORING } from '../../content/match/scoring';
import { Entity } from '../../entities/Entity';
import type { EntityId } from '../../state/EntityStore.types';
import { GameState } from '../../state/GameState';
import type { PlayableTeam, Team } from '../../teams/teams.types';
import { createDefaultScoringRules } from '../defaultScoringRules';
import { Scoring } from '../Scoring';

const CENTER = { x: 800, y: 450 };
const OUTSIDE = { x: 0, y: 0 };
const POINT = 'zone-1';

/** A test Legend: `family` `legend`, with the components `setUp` gives it. */
class TestLegend extends Entity {
  public readonly family = 'legend';
  public readonly kind = 'warrior';

  protected installComponents(): void {
    // `setUp` adds the components.
  }
}

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const scoring = new Scoring(state, createDefaultScoringRules(SCORING, state.config.tickRate));
  let next = 0;
  /** Adds a Legend at `at` and announces it with `entity-spawned`, as a spawn does. */
  const legend = (team: Team, at = CENTER): EntityId => {
    next += 1;
    const unit = new TestLegend(`entity-${String(next)}`, 'warrior');
    unit.addComponent(new TeamMembership(team));
    unit.addComponent(new Transform(at, 0.5));
    state.entities.add(unit);
    state.events.emit('entity-spawned', { entityId: unit.id, kind: 'warrior', team });
    return unit.id;
  };
  /** Announces a checkpoint `team`'s push reached with the Legends on the zone, as `CaptureSystem` does. */
  const reach = (team: Team, checkpoint: number, presentLegendIds: readonly EntityId[] = []) => {
    state.events.emit('checkpoint-reached', { pointId: POINT, team, checkpoint, presentLegendIds });
  };
  /** Ends `ticks` ticks as the director does: one fold each. */
  const run = (ticks = 1): void => {
    for (let tick = 0; tick < ticks; tick += 1) {
      scoring.fold({ state, enterPhase: () => undefined });
      state.advanceTick();
    }
  };
  const team = (side: PlayableTeam) => state.match.scoring.teams[side];
  const checkpointsOf = (legendId: EntityId): number | undefined =>
    state.match.scoring.legends.find((row) => row.entityId === legendId)?.checkpointsWon;
  return { state, legend, reach, run, team, checkpointsOf };
};

describe('CheckpointRule (through Scoring)', () => {
  it.each<PlayableTeam>(['light', 'dark'])(
    'gives team %s a checkpoint reached and 3 team-only points for each checkpoint its push reaches',
    (side) => {
      const { state, legend, reach, run, team } = setUp();
      const light = legend('light', OUTSIDE);
      const dark = legend('dark', OUTSIDE);

      reach(side, 1);
      reach(side, 2);
      run();

      expect(team(side)).toEqual({
        score: 6,
        structuresDestroyed: 0,
        capturesHeldTicks: 0,
        checkpointsReached: 2,
      });
      expect(state.match.scoring.legends.map((row) => [row.entityId, row.score])).toEqual([
        [light, 0],
        [dark, 0],
      ]);
    },
  );

  it("gives nothing for a neutral camp's push", () => {
    const { state, legend, reach, run } = setUp();
    const inside = legend('light');

    reach('neutral', 1, [inside]);
    run();

    expect(state.match.scoring.teams.light.score).toBe(0);
    expect(state.match.scoring.teams.dark.score).toBe(0);
    expect(state.match.scoring.teams.light.checkpointsReached).toBe(0);
    expect(state.match.scoring.teams.dark.checkpointsReached).toBe(0);
    expect(state.match.scoring.legends.find((row) => row.entityId === inside)).toMatchObject({
      checkpointsWon: 0,
      score: 0,
    });
  });

  it('wins the checkpoint for each listed Legend with a row only, with no points', () => {
    const { state, legend, reach, run, checkpointsOf } = setUp();
    const inside = legend('light');
    const outside = legend('light', OUTSIDE);
    const enemyInside = legend('dark');
    /** A listed id with no row (no Legend spawned under it) wins nothing and breaks nothing. */
    const noRow = 'entity-99';

    reach('light', 1, [inside, noRow]);
    reach('light', 2, [inside, noRow]);
    run();

    expect([inside, outside, enemyInside, noRow].map(checkpointsOf)).toEqual([2, 0, 0, undefined]);
    expect(state.match.scoring.legends.every((row) => row.score === 0)).toBe(true);
  });

  it('takes who stood on the zone from the event, not from where the Legends are at the fold', () => {
    const { state, legend, reach, run, checkpointsOf } = setUp();
    const leaver = legend('light');
    const arriver = legend('light', OUTSIDE);

    reach('light', 1, [leaver]);
    state.entities.get(leaver)?.findComponent(Transform)?.moveTo(OUTSIDE);
    state.entities.get(arriver)?.findComponent(Transform)?.moveTo(CENTER);
    run();

    expect([leaver, arriver].map(checkpointsOf)).toEqual([1, 0]);
  });

  it('gives the points but no Legend a checkpoint when no Legend of the team is on the zone', () => {
    const { legend, reach, run, team, checkpointsOf } = setUp();
    const elsewhere = legend('light', OUTSIDE);

    reach('light', 1, []);
    run();

    expect(team('light').score).toBe(3);
    expect(checkpointsOf(elsewhere)).toBe(0);
  });
});
