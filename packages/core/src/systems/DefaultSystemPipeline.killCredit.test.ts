import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { MATCH_PHASES, TERMINAL_MATCH_PHASES } from '../config/matchPhases';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadScoring } from '../content/match/loadScoring';
import { loadLevelCurves } from '../content/progression/loadLevelCurves';
import { XP_SOURCES } from '../content/progression/xpSources';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { DefaultInvariantRunner } from '../diagnostics/DefaultInvariantRunner';
import { TEST_DEBUG_CONFIG } from '../diagnostics/InvariantRunner.constants';
import { MemoryLogger } from '../diagnostics/MemoryLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { IdGenerator } from '../utils/IdGenerator';
import { DefaultSystemPipeline } from './DefaultSystemPipeline';

const config = createDefaultGameConfig();
const UNITS = loadDefaultContent(config.tickRate);

/** The match pipeline as a match builds it, a neutral gem, and a light and a dark Warrior. */
const setUp = (assistWindowTicks = loadScoring(config.tickRate).assistWindowTicks) => {
  const logger = new MemoryLogger();
  const state = new GameState(config, 1);
  const pipeline = new DefaultSystemPipeline({
    invariants: new DefaultInvariantRunner({
      debug: TEST_DEBUG_CONFIG,
      logger,
      curves: loadLevelCurves(),
      phaseOrder: MATCH_PHASES,
      terminalPhases: TERMINAL_MATCH_PHASES,
    }),
    state,
    progression: { units: UNITS, curves: loadLevelCurves(), xpSources: XP_SOURCES },
    director: { update: () => undefined },
    assistWindowTicks,
  });
  const registry = createDefaultEntityRegistry();
  const ids = new IdGenerator();
  const units = new EntityFactory(registry, UNITS, ids, { weapons: loadWeapons(config.tickRate) });
  const gem = new EntityFactory(registry, STRUCTURE_DEFINITIONS, ids).create(
    'cathedral-gem',
    'cathedral',
    {
      position: { x: 0, y: 0 },
      team: 'neutral',
    },
  );
  const victim = units.create('warrior', 'warrior', { position: { x: -6, y: 0 }, team: 'light' });
  const enemy = units.create('warrior', 'warrior', { position: { x: -8, y: 0 }, team: 'dark' });
  for (const entity of [gem, victim, enemy]) state.entities.add(entity);
  const deaths: GameEventMap['entity-died'][] = [];
  state.events.on('entity-died', (event) => deaths.push(event));
  const hits: GameEventMap['damage-applied'][] = [];
  state.events.on('damage-applied', (event) => hits.push(event));
  const runUntil = (isDone: () => boolean, ticks: number) => {
    for (let at = 0; at < ticks && !isDone(); at += 1) {
      pipeline.run({ state, logger });
      state.advanceTick();
    }
  };
  return { state, gem, victim, enemy, deaths, hits, runUntil };
};

describe('DefaultSystemPipeline kill credit (DEC-346)', () => {
  /** An enemy hit, then a swing at the gem with too little health for the burn. */
  const dieToTheGem = (assistWindowTicks?: number) => {
    const { state, gem, victim, enemy, deaths, hits, runUntil } = setUp(assistWindowTicks);
    state.entities.setAttackTarget(enemy.id, victim.id);
    runUntil(() => hits.some(({ targetId }) => targetId === victim.id), 5 * config.tickRate);
    state.entities.clearAttackTarget(enemy.id);
    expect(deaths).toEqual([]);
    // Too little health left to live through the burn; this damage has no attacker to credit.
    const left = victim.getComponent(Health).current - 30;
    new DamagePipeline().apply(state, victim.id, left, {
      attackerId: null,
      kind: 'status',
      definitionId: 'bleed',
    });

    state.entities.setAttackTarget(victim.id, gem.id);
    runUntil(() => deaths.length > 0, 5 * config.tickRate);
    return { victim, enemy, deaths };
  };

  it("credits a gem burn death to the victim's last enemy damager", () => {
    const { victim, enemy, deaths } = dieToTheGem();

    expect(deaths).toEqual([
      {
        entityId: victim.id,
        killer: { attackerId: enemy.id, kind: 'status', definitionId: 'gem-burn' },
      },
    ]);
  });

  it('uses the assist window it is given: with none, the same death is nobody’s kill', () => {
    const { victim, deaths } = dieToTheGem(0);

    expect(deaths).toEqual([
      {
        entityId: victim.id,
        killer: { attackerId: null, kind: 'status', definitionId: 'gem-burn' },
      },
    ]);
  });
});
