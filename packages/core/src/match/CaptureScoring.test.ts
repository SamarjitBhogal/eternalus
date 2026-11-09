import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ASSIST_WINDOW_SECONDS, SCORING_WEIGHTS } from '../content/match/scoring';
import { CATHEDRAL_CAPTURE_POINT } from '../content/zones/cathedralCapturePoint';
import { Entity } from '../entities/Entity';
import { CapturePoint } from '../entities/zones/CapturePoint';
import type { EntityId } from '../state/EntityStore.types';
import { GameState } from '../state/GameState';
import type { PlayableTeam, Team } from '../teams/teams.types';
import { Scoring } from './Scoring';

/** One minute at 30 ticks per second: the held time one hold point needs (DEC-214 (A2)). */
const MINUTE_TICKS = 1800;
/** 30 s: half of a minute. */
const HALF_MINUTE_TICKS = 900;
const CENTER = { x: 800, y: 450 };
const OUTSIDE = { x: 0, y: 0 };
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

/** A test Legend: `family` `legend`, with the components `spawn` gives it. */
class TestLegend extends Entity {
  public readonly family = 'legend';
  public readonly kind = 'warrior';

  protected installComponents(): void {
    // `setUp` adds the components.
  }
}

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const scoring = new Scoring(state, {
    weights: SCORING_WEIGHTS,
    assistWindowSeconds: ASSIST_WINDOW_SECONDS,
  });
  const point = new CapturePoint(POINT, CATHEDRAL_CAPTURE_POINT.id);
  point.spawn({
    definition: CATHEDRAL_CAPTURE_POINT,
    position: CENTER,
    team: 'neutral',
    area: AREA,
  });
  state.entities.add(point);
  let next = 0;
  /** Adds a Legend at `at` and announces it with `entity-spawned`, as a spawn does. */
  const legend = (team: Team, at = CENTER): EntityId => {
    next += 1;
    const unit = new TestLegend(`entity-${String(next)}`, 'warrior');
    unit.addComponent(new Health(100));
    unit.addComponent(new TeamMembership(team));
    unit.addComponent(new Transform(at, 0.5));
    state.entities.add(unit);
    state.events.emit('entity-spawned', { entityId: unit.id, kind: 'warrior', team });
    return unit.id;
  };
  /** Announces a checkpoint `team`'s push reached, as `CaptureSystem` does. */
  const reach = (team: Team, checkpoint = 1, pointId = POINT): void => {
    state.events.emit('checkpoint-reached', { pointId, team, checkpoint });
  };
  /** Announces a capture point that changed owner, as `CaptureSystem` does. */
  const own = (pointId: string, from: Team, to: Team): void => {
    state.events.emit('capture-point-owner-changed', { pointId, from, to });
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
  return { state, legend, reach, own, run, team, checkpointsOf };
};

describe('CaptureScoring (through Scoring)', () => {
  describe('checkpoints (DEC-214 (A1))', () => {
    it.each<PlayableTeam>(['light', 'dark'])(
      'gives team %s 3 team-only points for each checkpoint its push reaches',
      (side) => {
        const { state, legend, reach, run, team } = setUp();
        const light = legend('light', OUTSIDE);
        const dark = legend('dark', OUTSIDE);

        reach(side, 1);
        reach(side, 2);
        run();

        expect(team(side)).toEqual({ score: 6, structuresDestroyed: 0, capturesHeldTicks: 0 });
        expect(state.match.scoring.legends.map((row) => [row.entityId, row.score])).toEqual([
          [light, 0],
          [dark, 0],
        ]);
      },
    );

    it("gives nothing for a neutral camp's push", () => {
      const { state, legend, reach, run } = setUp();
      const inside = legend('light');

      reach('neutral', 1);
      run();

      expect(state.match.scoring.teams.light.score).toBe(0);
      expect(state.match.scoring.teams.dark.score).toBe(0);
      expect(state.match.scoring.legends.find((row) => row.entityId === inside)).toMatchObject({
        checkpointsWon: 0,
        score: 0,
      });
    });

    it("wins the checkpoint for the team's living Legends on the zone only, with no points", () => {
      const { state, legend, reach, run, checkpointsOf } = setUp();
      const inside = legend('light');
      const outside = legend('light', OUTSIDE);
      const enemyInside = legend('dark');
      const deadInside = legend('light');
      state.entities.get(deadInside)?.findComponent(Health)?.applyDamage(1000);

      reach('light', 1);
      reach('light', 2);
      run();

      expect([inside, outside, enemyInside, deadInside].map(checkpointsOf)).toEqual([2, 0, 0, 0]);
      expect(state.match.scoring.legends.every((row) => row.score === 0)).toBe(true);
    });

    it('reads who stands on the zone when the checkpoint is reached, not at the fold', () => {
      const { state, legend, reach, run, checkpointsOf } = setUp();
      const leaver = legend('light');
      const arriver = legend('light', OUTSIDE);

      reach('light', 1);
      state.entities.get(leaver)?.findComponent(Transform)?.moveTo(OUTSIDE);
      state.entities.get(arriver)?.findComponent(Transform)?.moveTo(CENTER);
      run();

      expect([leaver, arriver].map(checkpointsOf)).toEqual([1, 0]);
    });

    it('gives the points but no Legend a checkpoint for a zone that is not in the store', () => {
      const { legend, reach, run, team, checkpointsOf } = setUp();
      const inside = legend('light');

      reach('light', 1, 'zone-99');
      run();

      expect(team('light').score).toBe(3);
      expect(checkpointsOf(inside)).toBe(0);
    });
  });

  describe('holds (DEC-214 (A2))', () => {
    it('pools held time over points: two points held 30 s give 1 point', () => {
      const { own, run, team } = setUp();
      own(POINT, 'neutral', 'light');
      own(OTHER_POINT, 'neutral', 'light');

      run(HALF_MINUTE_TICKS - 1);
      const justShort = { ...team('light') };
      run();

      expect(justShort).toEqual({
        score: 0,
        structuresDestroyed: 0,
        capturesHeldTicks: MINUTE_TICKS - 2,
      });
      expect(team('light')).toEqual({
        score: 1,
        structuresDestroyed: 0,
        capturesHeldTicks: MINUTE_TICKS,
      });
    });

    it('gives a point per full minute: one point held 2 min gives 2 points', () => {
      const { own, run, team } = setUp();
      own(POINT, 'neutral', 'dark');

      run(2 * MINUTE_TICKS);

      expect(team('dark')).toMatchObject({ score: 2, capturesHeldTicks: 2 * MINUTE_TICKS });
      expect(team('light')).toMatchObject({ score: 0, capturesHeldTicks: 0 });
    });

    it('keeps the held time when a point is lost: 40 s, lost, then 20 s give 1 point', () => {
      const { own, run, team } = setUp();
      own(POINT, 'neutral', 'light');
      run(MINUTE_TICKS - 600);
      own(POINT, 'light', 'dark');
      run(300);
      own(POINT, 'dark', 'light');

      run(599);
      const justShort = { ...team('light') };
      run();

      expect(justShort).toMatchObject({ score: 0, capturesHeldTicks: MINUTE_TICKS - 1 });
      expect(team('light')).toMatchObject({ score: 1, capturesHeldTicks: MINUTE_TICKS });
      expect(team('dark')).toMatchObject({ score: 0, capturesHeldTicks: 300 });
    });

    it('stops adding once a point goes to a neutral camp, and the camp gets nothing', () => {
      const { state, own, run, team } = setUp();
      own(POINT, 'neutral', 'light');
      run(10);
      own(POINT, 'light', 'neutral');

      run(MINUTE_TICKS);

      expect(team('light')).toMatchObject({ score: 0, capturesHeldTicks: 10 });
      expect(state.match.scoring.ownedPoints).toEqual({ light: 0, dark: 0 });
    });

    it('adds nothing for a team that owns nothing', () => {
      const { state, run } = setUp();

      run(MINUTE_TICKS);

      expect(state.match.scoring.teams).toEqual({
        light: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0 },
        dark: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0 },
      });
    });

    it('counts the tick a capture completes as held', () => {
      const { own, run, team } = setUp();

      own(POINT, 'neutral', 'light');
      run();

      expect(team('light').capturesHeldTicks).toBe(1);
    });

    it('adds nothing once the match has a result', () => {
      const { state, own, run, team } = setUp();
      own(POINT, 'neutral', 'light');
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
  });

  it("keeps each team's total its Legends' scores plus its team-only points", () => {
    const { state, legend, reach, own, run, team } = setUp();
    legend('light');
    legend('dark');
    reach('light', 1);
    reach('light', 2);
    reach('dark', 1);
    own(POINT, 'neutral', 'light');
    own(OTHER_POINT, 'neutral', 'dark');
    state.events.emit('structure-destroyed', {
      entityId: 'entity-90',
      kind: 'spawner-tower',
      team: 'dark',
      lane: null,
    });

    run(MINUTE_TICKS + 1);

    const weights = SCORING_WEIGHTS;
    for (const side of ['light', 'dark'] as const) {
      const totals = team(side);
      const legendPoints = state.match.scoring.legends
        .filter((row) => row.team === side)
        .reduce((sum, row) => sum + row.score, 0);
      const checkpoints = side === 'light' ? 2 : 1;
      expect(totals.score).toBe(
        legendPoints +
          totals.structuresDestroyed * weights.structureDestroyed +
          checkpoints * weights.captureCheckpoint +
          Math.floor(totals.capturesHeldTicks / MINUTE_TICKS) * weights.holdPerMinute,
      );
    }
    expect([team('light').score, team('dark').score]).toEqual([5 + 6 + 1, 3 + 1]);
  });
});
