import { describe, expect, it } from 'vitest';

import { Capturable } from '../../components/Capturable';
import { TeamMembership } from '../../components/TeamMembership';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { SCORING } from '../../content/match/scoring';
import { CATHEDRAL_CAPTURE_POINT } from '../../content/zones/cathedralCapturePoint';
import { Entity } from '../../entities/Entity';
import { CapturePoint } from '../../entities/zones/CapturePoint';
import type { EntityId } from '../../state/EntityStore.types';
import { GameState } from '../../state/GameState';
import type { PlayableTeam, Team } from '../../teams/teams.types';
import { createDefaultScoringRules } from '../defaultScoringRules';
import { Scoring } from '../Scoring';

/** One minute at 30 ticks per second: the held time one hold point needs (DEC-214 (A2)). */
const MINUTE_TICKS = 1800;
/** 30 s: half of a minute. */
const HALF_MINUTE_TICKS = 900;
const CENTER = { x: 800, y: 450 };
/** A 70 x 70 square floor around `CENTER`. */
const AREA = [
  [
    { x: CENTER.x - 35, y: CENTER.y - 35 },
    { x: CENTER.x + 35, y: CENTER.y - 35 },
    { x: CENTER.x + 35, y: CENTER.y + 35 },
    { x: CENTER.x - 35, y: CENTER.y + 35 },
  ],
];
const POINT = 'zone-1';
const OTHER_POINT = 'zone-2';

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
  for (const id of [POINT, OTHER_POINT]) {
    const point = new CapturePoint(id, CATHEDRAL_CAPTURE_POINT.id);
    point.spawn({
      definition: CATHEDRAL_CAPTURE_POINT,
      position: CENTER,
      team: 'neutral',
      area: AREA,
    });
    state.entities.add(point);
  }
  let next = 0;
  /** Adds a Legend and announces it with `entity-spawned`, as a spawn does. */
  const legend = (team: Team): EntityId => {
    next += 1;
    const unit = new TestLegend(`entity-${String(next)}`, 'warrior');
    unit.addComponent(new TeamMembership(team));
    state.entities.add(unit);
    state.events.emit('entity-spawned', { entityId: unit.id, kind: 'warrior', team });
    return unit.id;
  };
  /** Announces a checkpoint `team`'s push reached, as `CaptureSystem` does. */
  const reach = (team: Team, checkpoint: number): void => {
    state.events.emit('checkpoint-reached', {
      pointId: POINT,
      team,
      checkpoint,
      presentLegendIds: [],
    });
  };
  /** Hands a capture point to `to`, as `CaptureSystem` does when a capture completes. */
  const own = (pointId: string, to: Team): void => {
    state.entities.get(pointId)?.getComponent(Capturable).setOwner(to);
  };
  /** Ends `ticks` ticks as the director does: one fold each. */
  const run = (ticks = 1): void => {
    for (let tick = 0; tick < ticks; tick += 1) {
      scoring.fold({ state, enterPhase: () => undefined });
      state.advanceTick();
    }
  };
  const team = (side: PlayableTeam) => state.match.scoring.teams[side];
  return { state, legend, reach, own, run, team };
};

describe('CaptureHoldRule (through Scoring)', () => {
  it('pools held time over points: two points held 30 s give 1 point', () => {
    const { own, run, team } = setUp();
    own(POINT, 'light');
    own(OTHER_POINT, 'light');

    run(HALF_MINUTE_TICKS - 1);
    const justShort = { ...team('light') };
    run();

    expect(justShort).toEqual({
      score: 0,
      structuresDestroyed: 0,
      capturesHeldTicks: MINUTE_TICKS - 2,
      checkpointsReached: 0,
    });
    expect(team('light')).toEqual({
      score: 1,
      structuresDestroyed: 0,
      capturesHeldTicks: MINUTE_TICKS,
      checkpointsReached: 0,
    });
  });

  it('gives a point per full minute: one point held 2 min gives 2 points', () => {
    const { own, run, team } = setUp();
    own(POINT, 'dark');

    run(2 * MINUTE_TICKS);

    expect(team('dark')).toMatchObject({ score: 2, capturesHeldTicks: 2 * MINUTE_TICKS });
    expect(team('light')).toMatchObject({ score: 0, capturesHeldTicks: 0 });
  });

  it('keeps the held time when a point is lost: 40 s, lost, then 20 s give 1 point', () => {
    const { own, run, team } = setUp();
    own(POINT, 'light');
    run(MINUTE_TICKS - 600);
    own(POINT, 'dark');
    run(300);
    own(POINT, 'light');

    run(599);
    const justShort = { ...team('light') };
    run();

    expect(justShort).toMatchObject({ score: 0, capturesHeldTicks: MINUTE_TICKS - 1 });
    expect(team('light')).toMatchObject({ score: 1, capturesHeldTicks: MINUTE_TICKS });
    expect(team('dark')).toMatchObject({ score: 0, capturesHeldTicks: 300 });
  });

  it('stops adding once a point goes to a neutral camp, and the camp gets nothing', () => {
    const { own, run, team } = setUp();
    own(POINT, 'light');
    run(10);
    own(POINT, 'neutral');

    run(MINUTE_TICKS);

    expect(team('light')).toMatchObject({ score: 0, capturesHeldTicks: 10 });
    expect(team('dark')).toMatchObject({ score: 0, capturesHeldTicks: 0 });
  });

  it('adds nothing for a team that owns nothing', () => {
    const { state, run } = setUp();

    run(MINUTE_TICKS);

    expect(state.match.scoring.teams).toEqual({
      light: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0, checkpointsReached: 0 },
      dark: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0, checkpointsReached: 0 },
    });
  });

  it('counts the tick a capture completes as held', () => {
    const { own, run, team } = setUp();

    own(POINT, 'light');
    run();

    expect(team('light').capturesHeldTicks).toBe(1);
  });

  it("reads each point's owner from its Capturable, not from capture-point-owner-changed (DEC-223 (4b))", () => {
    const { state, own, run, team } = setUp();
    state.events.emit('capture-point-owner-changed', {
      pointId: POINT,
      from: 'neutral',
      to: 'light',
    });
    own(OTHER_POINT, 'dark');

    run(10);

    expect(team('light').capturesHeldTicks).toBe(0);
    expect(team('dark').capturesHeldTicks).toBe(10);
  });

  it('adds nothing once the match has a result', () => {
    const { state, own, run, team } = setUp();
    own(POINT, 'light');
    run(5);
    state.match.endMatch({
      winner: 'light',
      condition: 'objective-lost',
      playerTeam: 'light',
      hadHuman: false,
      durationTicks: 5,
      seed: 1,
      configHash: 0,
      legends: [],
      teams: state.match.scoring.teams,
      finalHash: 0,
    });

    run(MINUTE_TICKS);

    expect(team('light')).toMatchObject({ score: 0, capturesHeldTicks: 5 });
  });

  it("keeps each team's total its Legends' scores plus its team-only points", () => {
    const { state, legend, reach, own, run, team } = setUp();
    legend('light');
    legend('dark');
    reach('light', 1);
    reach('light', 2);
    reach('dark', 1);
    own(POINT, 'light');
    own(OTHER_POINT, 'dark');
    state.events.emit('structure-destroyed', {
      entityId: 'entity-90',
      kind: 'spawner-tower',
      team: 'dark',
      lane: null,
    });

    run(MINUTE_TICKS + 1);

    const weights = SCORING.weights;
    for (const side of ['light', 'dark'] as const) {
      const totals = team(side);
      const legendPoints = state.match.scoring.legends
        .filter((row) => row.team === side)
        .reduce((sum, row) => sum + row.score, 0);
      expect(totals.score).toBe(
        legendPoints +
          totals.structuresDestroyed * weights.structureDestroyed +
          totals.checkpointsReached * weights.captureCheckpoint +
          Math.floor(totals.capturesHeldTicks / MINUTE_TICKS) * weights.holdPerMinute,
      );
    }
    expect([team('light').checkpointsReached, team('dark').checkpointsReached]).toEqual([2, 1]);
    expect([team('light').score, team('dark').score]).toEqual([5 + 6 + 1, 3 + 1]);
  });
});
