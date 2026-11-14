import { describe, expect, it } from 'vitest';

import { Aether } from '../components/Aether';
import { ControllerBinding } from '../components/ControllerBinding';
import { Health } from '../components/Health';
import { Progression } from '../components/Progression';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { LEGEND_RESPAWN_SECONDS } from '../content/progression/legendRespawn';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import { Unit } from '../entities/Unit';
import { WorldMap } from '../map/WorldMap';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { GameState } from '../state/GameState';
import { MatchWorld } from '../state/MatchWorld';
import { StateHasher } from '../state/StateHasher';
import { DeathSystem } from './DeathSystem';
import { RespawnSystem } from './RespawnSystem';

const CONFIG = createDefaultGameConfig();
const DELAY = Math.round(LEGEND_RESPAWN_SECONDS * CONFIG.tickRate);
const DARK_STRONGHOLD = { x: 190, y: 30 };
const LIGHT_STRONGHOLD = { x: 10, y: 30 };
const BOT = {
  controllerId: 'bot-legend',
  profileId: 'normal',
  memory: { lane: 'lane-1' },
} as const;

const setUp = (isWithMap = true) => {
  const world = isWithMap
    ? new MatchWorld(
        TWO_LANE_MAP,
        WorldMap.fromDefinition(TWO_LANE_MAP, 2, () => false),
      )
    : null;
  const state = new GameState(CONFIG, 1, world);
  const weapons = loadWeapons(CONFIG.tickRate);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate, undefined, weapons),
    undefined,
    weapons,
  );
  const respawn = new RespawnSystem(factory, DELAY);
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
  legend.getComponent(Progression).restore(250, 3);
  legend.getComponent(Health).raiseMax(40);
  legend.getComponent(Aether).raiseMax(15);
  return legend;
};

const kill = ({ state }: ReturnType<typeof setUp>, id: string): void => {
  const health = state.entities.get(id)?.getComponent(Health);
  health?.applyDamage(health.current);
};

describe('RespawnSystem', () => {
  it('removes a dead Legend, keeps it away for the whole delay and brings it back at its Stronghold', () => {
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
    expect(back?.kind).toBe('warrior');
    expect(back?.getComponent(Transform).position).toEqual(DARK_STRONGHOLD);
    expect(back?.getComponent(Progression).xp).toBe(250);
    expect(back?.getComponent(Progression).level).toBe(3);
    expect(back?.getComponent(Health).current).toBe(healthMax);
    expect(back?.getComponent(Health).max).toBe(healthMax);
    expect(back?.getComponent(Aether).current).toBe(aetherMax);
    expect(back?.getComponent(Aether).max).toBe(aetherMax);
    expect(back?.getComponent(ControllerBinding)).toMatchObject({
      controllerId: BOT.controllerId,
      profileId: BOT.profileId,
      initialMemory: BOT.memory,
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
      [diedAtTick + DELAY, { entityId: legend.id, team: 'dark', position: DARK_STRONGHOLD }],
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
    waiting.state.respawns.add({
      entityId: 'entity-1',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'dark',
      xp: 0,
      level: 1,
      healthMax: 100,
      aetherMax: 50,
      returnsAtTick: DELAY,
    });

    expect(new StateHasher().hash(waiting.state)).not.toBe(new StateHasher().hash(empty.state));
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
