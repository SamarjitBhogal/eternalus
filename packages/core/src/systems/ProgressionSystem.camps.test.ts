import { describe, expect, it } from 'vitest';

import { Progression } from '../components/Progression';
import { DamagePipeline } from '../combat/DamagePipeline';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { timelineFrameOf } from '../config/timelineFrameOf';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { MapDefinition } from '../content/maps/maps.types';
import { MOB_DEFINITIONS } from '../content/mobs/mobCatalogue';
import { LEVEL_CURVE_CATALOGUE } from '../content/progression/levelCurveCatalogue';
import { XP_SOURCES } from '../content/progression/xpSources';
import { CHECKPOINT_DEFENDER_LIMIT } from '../content/structures/guardPlans';
import { loadGuardPlans } from '../content/structures/loadGuardPlans';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { LevelMatchesXpInvariant } from '../diagnostics/invariants/LevelMatchesXpInvariant';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { Legend } from '../entities/Legend';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import { spawnMapStructures } from '../state/__fixtures__/spawnMapStructures';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import type { OwedXp } from '../state/RespawnQueue.types';
import { GuardRoster } from './GuardRoster';
import { ProgressionSystem } from './ProgressionSystem';

const TICK_RATE = 30;

/** The two-lane map with one neutral camp (a light forest camp by default), its countdown 1 s. */
const campMatch = (
  camp: { kind: 'camp' | 'corner-camp'; definitionId: string } = {
    kind: 'camp',
    definitionId: 'forest-camp-light',
  },
) => {
  const map: MapDefinition = {
    ...TWO_LANE_MAP,
    features: [
      ...TWO_LANE_MAP.features,
      {
        id: 'camp-0',
        kind: camp.kind,
        team: 'neutral',
        definitionId: camp.definitionId,
        position: { x: 100, y: 50 },
        minimapGlyph: { shape: 'dot', size: 4, colourRole: 'neutral' },
      },
    ],
  };
  const config = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
  const state = new GameState(
    config,
    1,
    matchWorldOf(map),
    {},
    {
      countdownEndTick: timelineFrameOf(config).countdownEndTick,
    },
  );
  spawnMapStructures(state);
  const units = loadDefaultContent(TICK_RATE);
  const factory = new EntityFactory(createDefaultEntityRegistry(), units, undefined, {
    weapons: loadWeapons(TICK_RATE),
  });
  const roster = new GuardRoster(
    factory,
    units,
    loadGuardPlans(TICK_RATE),
    {},
    CHECKPOINT_DEFENDER_LIMIT,
  );
  roster.layOut(state);
  const progression = new ProgressionSystem(state, {
    units,
    curves: LEVEL_CURVE_CATALOGUE,
    xpSources: XP_SOURCES,
  });
  const invariant = new LevelMatchesXpInvariant(LEVEL_CURVE_CATALOGUE);
  const violations: string[] = [];
  /** One tick in pipeline order: progression before the roster (`SpawnSystem`), then invariants. */
  const step = (ticks = 1) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      progression.update({ state, logger: new NullLogger() });
      roster.update(state);
      violations.push(...invariant.check(state).map(({ message }) => message));
      state.advanceTick();
    }
  };
  const campMobIds = () => {
    const ids: string[] = [];
    state.guards.forEach(({ team, guardId }) => {
      if (team === 'neutral' && guardId !== null) {
        ids.push(guardId);
      }
    });
    return ids;
  };
  const legend = factory.create('warrior', 'warrior', { position: { x: 0, y: 0 }, team: 'light' });
  state.entities.add(legend);
  return { state, step, campMobIds, legend, violations };
};

describe('ProgressionSystem camp reward through the guard roster (balancing.md "Camps")', () => {
  it('pays the clearing Legend each mob XP on the kill tick and the bonus on the next tick', () => {
    const { state, step, campMobIds, legend, violations } = campMatch();
    step(TICK_RATE + 1);
    const mobs = campMobIds();
    expect(mobs.length).toBeGreaterThan(0);
    const mobXp = mobs
      .map((id) => MOB_DEFINITIONS.get(state.entities.get(id)?.definitionId ?? '').xpValue)
      .reduce((sum, xp) => sum + xp, 0);

    for (const id of mobs) {
      new DamagePipeline().apply(state, id, 1e6, {
        attackerId: legend.id,
        kind: 'weapon',
        definitionId: 'test',
      });
    }
    step();
    expect(legend.getComponent(Progression).xp).toBe(mobXp);

    step();
    // A missing content entry must fail here, not turn the bonus into 0 (ADR 0023).
    const bonus = XP_SOURCES.campCleared['forest-camp-light'] ?? 0;
    expect(bonus).toBeGreaterThan(0);
    expect(legend.getComponent(Progression).xp).toBe(mobXp + bonus);
    expect(violations).toEqual([]);
  });

  it('owes the bonus to a Legend whose hit kills the last mob while it waits to respawn (O4)', () => {
    const { state, step, campMobIds, legend, violations } = campMatch();
    step(TICK_RATE + 1);
    const mobs = campMobIds();
    expect(mobs.length).toBeGreaterThan(0);
    if (!(legend instanceof Legend)) {
      throw new Error('the clearing Legend is not a Legend');
    }
    let campId = '';
    state.guards.forEach(({ team, homeId }) => {
      campId = team === 'neutral' ? homeId : campId;
    });
    // The Legend died before its projectile or damage over time landed (DEC-295).
    state.respawns.add(legend, 'light', state.tick + 10 * TICK_RATE);
    state.entities.withdraw(legend.id, 'died');

    for (const id of mobs) {
      new DamagePipeline().apply(state, id, 1e6, {
        attackerId: legend.id,
        kind: 'weapon',
        definitionId: 'test',
      });
    }
    step(2);

    const owed: OwedXp[] = [];
    state.respawns.forEach(({ owedXp }) => owed.push(...owedXp));
    expect(owed.filter(({ cause }) => cause === 'kill')).toHaveLength(mobs.length);
    expect(owed.filter(({ cause }) => cause === 'camp-cleared')).toEqual([
      {
        cause: 'camp-cleared',
        victimId: campId,
        victimTeam: 'neutral',
        xp: XP_SOURCES.campCleared['forest-camp-light'],
      },
    ]);
    expect(violations).toEqual([]);
  });

  it('pays no clear bonus for a corner camp: its boss already pays the team (DEC-237)', () => {
    const { state, step, campMobIds, legend, violations } = campMatch({
      kind: 'corner-camp',
      definitionId: 'corner-camp',
    });
    let clears = 0;
    state.events.on('camp-cleared', () => {
      clears += 1;
    });
    step(TICK_RATE + 1);
    const mobs = campMobIds();
    expect(mobs.length).toBeGreaterThan(0);

    for (const id of mobs) {
      new DamagePipeline().apply(state, id, 1e6, {
        attackerId: legend.id,
        kind: 'weapon',
        definitionId: 'test',
      });
    }
    step();
    const afterKill = legend.getComponent(Progression).xp;
    expect(afterKill).toBeGreaterThan(0);

    step();
    expect(clears).toBe(1);
    expect(legend.getComponent(Progression).xp).toBe(afterKill);
    expect(violations).toEqual([]);
  });
});
