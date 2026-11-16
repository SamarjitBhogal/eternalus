import { describe, expect, it } from 'vitest';

import { GameEvents } from './GameEvents';
import { MatchRecord } from './MatchRecord';
import type { MatchResult } from './MatchResult.types';
import type { MatchState } from './MatchState.types';

const SCHEDULE = [
  { entryId: 'countdown-over', tick: 60 },
  { entryId: 'mid-game', tick: 900 },
];

/** A record on its own event channel, whose clock reads `clock.tick`. */
const recordAt = (clock: { tick: number }) => {
  const events = new GameEvents(() => clock.tick);
  return { events, match: new MatchRecord('light', SCHEDULE, events, () => clock.tick) };
};

describe('MatchRecord', () => {
  it('starts in the countdown with nothing fired, held, seated, scored or ended', () => {
    const { match } = recordAt({ tick: 0 });

    expect({
      phase: match.phase,
      phaseEnteredTick: match.phaseEnteredTick,
      timelineCursor: match.timelineCursor,
      schedule: match.schedule,
      isIdleHeld: match.isIdleHeld,
      playerTeam: match.playerTeam,
      humanLegendId: match.humanLegendId,
      scoring: match.scoring,
      result: match.result,
    }).toEqual({
      phase: 'countdown',
      phaseEnteredTick: 0,
      timelineCursor: 0,
      schedule: SCHEDULE,
      isIdleHeld: false,
      playerTeam: 'light',
      humanLegendId: null,
      scoring: {
        legends: [],
        teams: {
          light: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0, checkpointsReached: 0 },
          dark: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0, checkpointsReached: 0 },
        },
        recentHits: [],
      },
      result: null,
    });
    expect(Object.isFrozen(match.schedule[0])).toBe(true);
  });

  it('setPhase stamps the tick and emits phase-changed', () => {
    const clock = { tick: 2 };
    const { events, match } = recordAt(clock);

    match.setPhase('early-game');

    expect(match.phase).toBe('early-game');
    expect(match.phaseEnteredTick).toBe(2);
    expect(events.recentEvents()).toEqual([
      { tick: 2, type: 'phase-changed', payload: { from: 'countdown', to: 'early-game' } },
    ]);
  });

  it('holds and releases the idle flag through holdIdle', () => {
    const { match } = recordAt({ tick: 0 });

    match.holdIdle(true);
    expect(match.isIdleHeld).toBe(true);
    match.holdIdle(false);
    expect(match.isIdleHeld).toBe(false);
  });

  it('advances the timeline cursor one entry at a time', () => {
    const { match } = recordAt({ tick: 0 });

    match.advanceTimeline();
    match.advanceTimeline();

    expect(match.timelineCursor).toBe(2);
  });

  it('stores the result once and refuses a second one', () => {
    const { match } = recordAt({ tick: 0 });
    const result: MatchResult = {
      winner: 'light',
      condition: 'objective-lost',
      playerTeam: 'light',
      hadHuman: false,
      durationTicks: 1,
      seed: 1,
      configHash: 0,
      legends: [],
      teams: {
        light: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0, checkpointsReached: 0 },
        dark: { score: 0, structuresDestroyed: 0, capturesHeldTicks: 0, checkpointsReached: 0 },
      },
      finalHash: 0,
    };

    match.endMatch(result);

    expect(match.result).toEqual(result);
    expect(() => {
      match.endMatch({ ...result, winner: 'dark' });
    }).toThrow('already ended');
    expect(match.result?.winner).toBe('light');
  });

  it('seats the human once and refuses a second seat', () => {
    const { match } = recordAt({ tick: 0 });

    match.seatHuman('entity-7');

    expect(match.humanLegendId).toBe('entity-7');
    expect(() => {
      match.seatHuman('entity-8');
    }).toThrow('already seated');
    expect(match.humanLegendId).toBe('entity-7');
  });

  it("shows the ScoreBook's data as scoring, which MatchState readers cannot write (DEC-211)", () => {
    const { match } = recordAt({ tick: 0 });
    match.scoreBook.addRow({
      entityId: 'entity-1',
      team: 'light',
      classId: 'warrior',
      controller: 'bot',
    });
    const reader: MatchState = match;
    /** Never called: each line compiles only if a reader could write the scoring. */
    const writeThroughView = (): void => {
      const { legends, teams, recentHits } = reader.scoring;
      // @ts-expect-error -- the row list is read-only.
      legends.length = 0;
      for (const row of legends) {
        // @ts-expect-error -- a row's counters are read-only.
        row.kills = 9;
      }
      // @ts-expect-error -- a team's total is read-only.
      teams.light.score = 99;
      // @ts-expect-error -- a team's counter is read-only.
      teams.dark.structuresDestroyed = 1;
      for (const hit of recentHits) {
        // @ts-expect-error -- a recent hit is read-only.
        hit.tick = 0;
      }
    };

    expect(reader.scoring).toBe(match.scoreBook.view);
    expect(reader.scoring.legends).toHaveLength(1);
    expect(writeThroughView).toBeTypeOf('function');
  });

  it('seats one human per team: humanLegendIdOf reads each seat, humanLegendId the playerTeam one', () => {
    const { match } = recordAt({ tick: 0 });

    expect(match.humanLegendIdOf('dark')).toBeNull();
    match.seatHuman('entity-8', 'dark');
    match.seatHuman('entity-7', 'light');

    expect(match.humanLegendIdOf('light')).toBe('entity-7');
    expect(match.humanLegendIdOf('dark')).toBe('entity-8');
    expect(match.humanLegendId).toBe('entity-7');
    expect(() => {
      match.seatHuman('entity-9', 'dark');
    }).toThrow('dark human is already seated');
  });
});
