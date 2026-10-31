import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { WinObjective } from '../../components/WinObjective';
import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../../config/matchPhases';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { ASSIST_WINDOW_SECONDS, SCORING_WEIGHTS } from '../../content/match/scoring';
import { loadLevelCurves } from '../../content/progression/loadLevelCurves';
import { XP_SOURCES } from '../../content/progression/xpSources';
import { DefaultInvariantRunner } from '../../diagnostics/DefaultInvariantRunner';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../../diagnostics/MemoryLogger';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { GameState } from '../../state/GameState';
import { StateHasher } from '../../state/StateHasher';
import { DefaultSystemPipeline } from '../../systems/DefaultSystemPipeline';
import { createDefaultMatchDirector } from '../defaultMatchDirector';
import { MatchTimeline } from '../MatchTimeline';

/** A 0 s countdown: step 0 is held, so the first attack lands on step 1. */
const CONFIG = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
const UNITS = loadDefaultContent(CONFIG.tickRate);
const CURVES = loadLevelCurves();
/** Far past the one hit the objective has left. */
const MAX_TICKS = 30;

/**
 * Builds the real per-tick systems and director (as `Simulation` does), with a light warrior
 * beside a dark training dummy that carries `WinObjective` and one hit point, the warrior told to
 * attack it. The warrior is announced with `entity-spawned`, as a spawn does, so it has a scoring
 * row. Steps until the match ends or `MAX_TICKS`.
 */
const playOut = () => {
  const logger = new MemoryLogger();
  const timeline = MatchTimeline.resolve(CONFIG);
  const state = new GameState(CONFIG, 7, timeline.schedule());
  const director = createDefaultMatchDirector({
    state,
    timeline,
    debug: TEST_DEBUG_CONFIG,
    logger,
    scoring: { weights: SCORING_WEIGHTS, assistWindowSeconds: ASSIST_WINDOW_SECONDS },
  });
  const pipeline = new DefaultSystemPipeline({
    invariants: new DefaultInvariantRunner(
      TEST_DEBUG_CONFIG,
      logger,
      CURVES,
      MATCH_PHASES,
      TERMINAL_MATCH_PHASES,
    ),
    state,
    progression: { units: UNITS, curves: CURVES, xpSources: XP_SOURCES },
    director,
  });
  director.start(state);
  const factory = new EntityFactory(createDefaultEntityRegistry(), UNITS);
  const warrior = factory.create('warrior', 'warrior', { position: { x: 0, y: 0 }, team: 'light' });
  const objective = factory.create('light-mob', 'training-dummy', {
    position: { x: 1, y: 0 },
    team: 'dark',
  });
  objective.addComponent(new WinObjective());
  const health = objective.getComponent(Health);
  health.applyDamage(health.max - 1);
  state.entities.add(warrior);
  state.events.emit('entity-spawned', { entityId: warrior.id, kind: 'warrior', team: 'light' });
  state.entities.add(objective);
  state.entities.setAttackTarget(warrior.id, objective.id);

  const events: string[] = [];
  state.events.on('entity-died', ({ entityId }) => {
    events.push(`${String(state.tick)}: ${entityId} died`);
  });
  state.events.on('match-ended', () => {
    events.push(`${String(state.tick)}: match-ended`);
  });
  while (state.match.result === null && state.tick < MAX_TICKS) {
    pipeline.run({ state, logger });
    state.advanceTick();
  }
  return { state, events, logger, hash: new StateHasher().hash(state) };
};

describe('losing the last win objective (scenario)', () => {
  it('ends the match on the tick the objective dies by damage, with a MatchResult', () => {
    const { state, events, logger } = playOut();

    expect(events).toEqual(['1: entity-2 died', '1: match-ended']);
    expect(state.match.phase).toBe('victory');
    expect(state.match.phaseEnteredTick).toBe(1);
    expect(state.match.result).toMatchObject({
      winner: 'light',
      condition: 'objective-lost',
      playerTeam: 'light',
      hadHuman: false,
      durationTicks: 2,
      seed: 7,
    });
    expect(logger.records).toEqual([]);
  });

  it('counts the winning kill in the result: a light mob is a minion kill worth 1 (DEC-79)', () => {
    const { state } = playOut();

    expect(state.match.result?.legends).toEqual([
      {
        entityId: 'entity-1',
        team: 'light',
        classId: 'warrior',
        controller: 'bot',
        kills: 0,
        deaths: 0,
        assists: 0,
        minionKills: 1,
        neutralKills: 0,
        structureDamage: 0,
        score: 1,
      },
    ]);
    expect(state.match.result?.teams).toEqual({ light: { score: 1 }, dark: { score: 0 } });
  });

  it('is deterministic: two runs give deep-equal results and equal hashes', () => {
    const first = playOut();
    const second = playOut();

    expect(second.state.match.result).toEqual(first.state.match.result);
    expect(second.hash).toBe(first.hash);
    expect(first.state.match.result?.finalHash).toEqual(expect.any(Number));
    expect(first.state.match.result?.configHash).toEqual(expect.any(Number));
  });
});
