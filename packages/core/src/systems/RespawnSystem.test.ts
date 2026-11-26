import { describe, expect, it } from 'vitest';

import { Aether } from '../components/Aether';
import { Combat } from '../components/Combat';
import { LastEnemyHit } from '../components/LastEnemyHit';
import { Movement } from '../components/Movement';
import { StatusEffects } from '../components/StatusEffects';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { ControllerBinding } from '../components/ControllerBinding';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { LANE_ASSESSMENT_WEIGHTS } from '../content/ai/laneAssessmentWeights';
import { LEGEND_RESPAWN_SECONDS } from '../content/progression/legendRespawn';
import { LEGEND_LEVEL_CURVE } from '../content/progression/levelCurves';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { Legend } from '../entities/Legend';
import { Unit } from '../entities/Unit';
import { MatchGrid } from '../map/MatchGrid';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { MatchWorld } from '../state/MatchWorld';
import { StateHasher } from '../state/StateHasher';
import { TickRate } from '../utils/TickRate';
import { DeathSystem } from './DeathSystem';
import { RespawnSystem } from './RespawnSystem';

const CONFIG = createDefaultGameConfig();
const DELAY = new TickRate(CONFIG.tickRate).toTicks(LEGEND_RESPAWN_SECONDS);
const DARK_STRONGHOLD = { x: 190, y: 30 };
const LIGHT_STRONGHOLD = { x: 10, y: 30 };
const BOT = {
  controllerId: 'bot-legend',
  profileId: 'normal',
  memory: { lane: 'lane-0' },
} as const;

const setUp = (isWithMap = true) => {
  const world = isWithMap
    ? new MatchWorld(TWO_LANE_MAP, MatchGrid.build(TWO_LANE_MAP, [], { cellSize: 2, features: {} }))
    : null;
  const state = new GameState(CONFIG, 1, world);
  const weapons = loadWeapons(CONFIG.tickRate);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate, undefined, weapons),
    undefined,
    weapons,
  );
  const respawn = new RespawnSystem(DELAY, LANE_ASSESSMENT_WEIGHTS);
  const death = new DeathSystem();
  const context = { state, logger: new NullLogger() };
  /** One tick as the pipeline runs it: respawn, then death, then the tick counts. */
  const step = (): void => {
    respawn.update(context);
    death.update(context);
    state.advanceTick();
  };
  return { state, factory, step };
};

/** A mid-game Legend: level 3 with 250 XP, grown caps, a bot controller, away from home. */
const addLegend = ({ state, factory }: ReturnType<typeof setUp>, hasController = true) => {
  const legend = factory.create('warrior', 'warrior', {
    position: { x: 100, y: 10 },
    team: 'dark',
    ...(hasController && { controller: BOT }),
  });
  state.entities.add(legend);
  legend.getComponent(Progression).addXp(250, LEGEND_LEVEL_CURVE);
  legend.getComponent(Health).raiseMax(40);
  legend.getComponent(Aether).raiseMax(15);
  return legend;
};

const kill = ({ state }: ReturnType<typeof setUp>, id: string): void => {
  const health = state.entities.get(id)?.getComponent(Health);
  health?.applyDamage(health.current);
};

describe('RespawnSystem', () => {
  it('withdraws a dead Legend, keeps it away for the whole delay and brings the same object back at its Stronghold', () => {
    const match = setUp();
    const legend = addLegend(match);
    const { state, step } = match;
    const healthMax = legend.getComponent(Health).max;
    const aetherMax = legend.getComponent(Aether).max;
    kill(match, legend.id);
    const diedAtTick = state.tick;

    step();
    expect(state.entities.has(legend.id)).toBe(false);
    while (state.tick < diedAtTick + DELAY) {
      expect(state.entities.has(legend.id)).toBe(false);
      step();
    }
    expect(state.entities.has(legend.id)).toBe(false);
    step();

    const back = state.entities.get(legend.id);
    expect(back).toBe(legend);
    expect(back?.getComponent(Transform).position).toEqual(DARK_STRONGHOLD);
    expect(back?.getComponent(Progression).xp).toBe(250);
    expect(back?.getComponent(Progression).level).toBe(3);
    expect(back?.getComponent(Health).current).toBe(healthMax);
    expect(back?.getComponent(Health).max).toBe(healthMax);
    expect(back?.getComponent(Aether).current).toBe(aetherMax);
    expect(back?.getComponent(Aether).max).toBe(aetherMax);
    // A bot laner picks its lane again by the current threat (DEC-295 (2)): with no damage and
    // no hordes anywhere, the middle lane (`assessLanes`), not the lane it spawned with.
    expect(back?.getComponent(ControllerBinding)).toMatchObject({
      controllerId: BOT.controllerId,
      profileId: BOT.profileId,
      initialMemory: { lane: 'lane-1' },
    });
    expect(state.respawns.size).toBe(0);
  });

  it('returns exactly respawnTicks after the death tick and announces it', () => {
    const match = setUp();
    const legend = addLegend(match);
    const { state, step } = match;
    kill(match, legend.id);
    const diedAtTick = state.tick;
    const returned: unknown[] = [];
    state.events.on('legend-respawned', (payload) => returned.push([state.tick, payload]));

    while (!state.entities.has(legend.id) || state.tick === diedAtTick) {
      step();
    }

    expect(returned).toEqual([
      [
        diedAtTick + DELAY,
        { entityId: legend.id, team: 'dark', position: DARK_STRONGHOLD, owedXp: [] },
      ],
    ]);
  });

  it('brings back two Legends that die in the same tick, in store order, on the same tick', () => {
    const match = setUp();
    const first = addLegend(match);
    const second = match.factory.create('warrior', 'warrior', {
      position: { x: 50, y: 50 },
      team: 'light',
    });
    match.state.entities.add(second);
    kill(match, first.id);
    kill(match, second.id);
    const diedAtTick = match.state.tick;
    const returned: unknown[] = [];
    match.state.events.on('legend-respawned', ({ entityId, position }) =>
      returned.push([match.state.tick, entityId, position]),
    );

    for (let tick = 0; tick <= DELAY; tick += 1) match.step();

    expect(returned).toEqual([
      [diedAtTick + DELAY, first.id, DARK_STRONGHOLD],
      [diedAtTick + DELAY, second.id, LIGHT_STRONGHOLD],
    ]);
    expect(match.state.respawns.size).toBe(0);
  });

  it('brings a light Legend back at the light Stronghold, without a controller for the human', () => {
    const match = setUp();
    const legend = match.factory.create('warrior', 'warrior', {
      position: { x: 50, y: 50 },
      team: 'light',
    });
    match.state.entities.add(legend);
    kill(match, legend.id);

    for (let tick = 0; tick <= DELAY; tick += 1) match.step();

    const back = match.state.entities.get(legend.id);
    expect(back?.getComponent(Transform).position).toEqual(LIGHT_STRONGHOLD);
    expect(back?.findComponent(ControllerBinding)).toBeUndefined();
  });

  it('never brings back anything that is not a Legend (the sovereign is not one)', () => {
    const match = setUp();
    const mob = match.factory.create('light-mob', 'training-dummy', {
      position: { x: 5, y: 5 },
      team: 'dark',
    });
    match.state.entities.add(mob);
    kill(match, mob.id);

    for (let tick = 0; tick <= DELAY + 1; tick += 1) match.step();

    expect(match.state.respawns.size).toBe(0);
    expect(match.state.entities.has(mob.id)).toBe(false);
  });

  it('leaves a Legend gone when the match has no map to return it to', () => {
    const match = setUp(false);
    const legend = addLegend(match);
    kill(match, legend.id);

    for (let tick = 0; tick <= DELAY + 1; tick += 1) match.step();

    expect(match.state.respawns.size).toBe(0);
    expect(match.state.entities.has(legend.id)).toBe(false);
  });

  it('does not move the id counter: the next created entity gets the next id', () => {
    const match = setUp();
    const legend = addLegend(match);
    kill(match, legend.id);
    for (let tick = 0; tick <= DELAY; tick += 1) match.step();

    const next = match.factory.create('light-mob', 'training-dummy', {
      position: { x: 0, y: 0 },
      team: 'dark',
    });

    expect(next.id).toBe('entity-2');
  });

  it('hashes the waiting queue: the same tick and entities, only the queue differs', () => {
    const [empty, waiting] = [setUp(), setUp()];
    const legend = waiting.factory.create('warrior', 'warrior', {
      position: { x: 100, y: 10 },
      team: 'dark',
    });
    if (!(legend instanceof Legend)) throw new Error('A warrior is a Legend.');
    waiting.state.respawns.add(legend, 'dark', DELAY);
    const hasher = new StateHasher();
    const queued = hasher.hash(waiting.state);

    expect(queued).not.toBe(hasher.hash(empty.state));
    // The waiting Legend's own fields are hashed too, though it is out of the store (DEC-295).
    legend.getComponent(Progression).addXp(10, LEGEND_LEVEL_CURVE);
    expect(hasher.hash(waiting.state)).not.toBe(queued);
  });

  it('gives the same hash in two runs through a death and a return (determinism)', () => {
    const run = (): number[] => {
      const match = setUp();
      const legend = addLegend(match);
      kill(match, legend.id);
      const hashes: number[] = [];
      for (let tick = 0; tick <= DELAY + 2; tick += 1) {
        match.step();
        if (tick % 50 === 0 || tick >= DELAY) hashes.push(new StateHasher().hash(match.state));
      }
      return hashes;
    };

    expect(run()).toEqual(run());
  });

  it('faces a returning dark Legend toward the enemy Stronghold (DEC-216 (6))', () => {
    const match = setUp();
    const legend = addLegend(match);
    legend.getComponent(Transform).face({ x: 0, y: 1 });
    kill(match, legend.id);

    for (let tick = 0; tick <= DELAY; tick += 1) match.step();

    // From (190, 30) to the light Stronghold at (10, 30).
    expect(legend.getComponent(Transform).facing).toEqual({ x: -1, y: 0 });
  });

  it('resets health, aether, statuses, movement and target on return, and keeps what it earned', () => {
    const match = setUp();
    const legend = addLegend(match);
    const aether = legend.getComponent(Aether);
    aether.spend(aether.current);
    legend
      .getComponent(StatusEffects)
      .apply(loadStatusEffects(CONFIG.tickRate, 2).get('bleed'), null, 0);
    legend.getComponent(Movement).steer({ x: 1, y: 0 });
    legend.getComponent(Combat).setTarget('entity-99');
    kill(match, legend.id);

    for (let tick = 0; tick <= DELAY; tick += 1) match.step();

    expect(aether.current).toBe(aether.max);
    expect(legend.getComponent(StatusEffects).active).toEqual([]);
    expect(legend.getComponent(Movement).velocity).toEqual({ x: 0, y: 0 });
    expect(legend.getComponent(Combat).targetId).toBeNull();
    expect(legend.getComponent(Progression)).toMatchObject({ xp: 250, level: 3 });
  });

  it("forgets the last enemy hit of the Legend's earlier life, so that hit earns no gem kill (DEC-346)", () => {
    const match = setUp();
    const legend = addLegend(match);
    legend.addComponent(new LastEnemyHit('entity-99', match.state.tick));
    kill(match, legend.id);

    for (let tick = 0; tick <= DELAY; tick += 1) match.step();

    expect(match.state.entities.has(legend.id)).toBe(true);
    expect(legend.findComponent(LastEnemyHit)).toBeUndefined();
  });

  it('brings a Legend back even when its team filled the unit cap meanwhile', () => {
    const match = setUp();
    const legend = addLegend(match);
    kill(match, legend.id);
    match.step();
    const { maxUnitsPerTeam } = CONFIG.limits;
    for (let count = 0; count < maxUnitsPerTeam; count += 1) {
      match.state.entities.add(
        match.factory.create('light-mob', 'training-dummy', {
          position: { x: 5, y: 5 },
          team: 'dark',
        }),
      );
    }

    for (let tick = 0; tick < DELAY; tick += 1) match.step();

    expect(match.state.entities.has(legend.id)).toBe(true);
    expect(match.state.entities.countOnTeam('dark', Unit)).toBe(maxUnitsPerTeam + 1);
  });
});
