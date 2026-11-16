import { describe, expect, it } from 'vitest';
import { Capturable } from '../components/Capturable';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { Veterancy } from '../components/Veterancy';
import { StatusEffectApplier } from '../combat/StatusEffectApplier';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { MINION_VETERANCY } from '../content/mobs/minionVeterancy';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import { ZONE_LEVEL_UP } from '../content/zones/zoneLevelUp';
import { CATHEDRAL_CAPTURE_POINT } from '../content/zones/cathedralCapturePoint';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { Entity } from '../entities/Entity';
import { CapturePoint } from '../entities/zones/CapturePoint';
import { GameState } from '../state/GameState';
import { StateHasher } from '../state/StateHasher';
import { TWO_LANE_MAP } from '../state/__fixtures__/twoLaneMap';
import { matchWorldOf } from '../state/__fixtures__/matchWorld';
import type { PlayableTeam, Team } from '../teams/teams.types';
import { VeterancySystem } from './VeterancySystem';
import { ZoneLevelUpSystem } from './ZoneLevelUpSystem';

const TICK_RATE = 30;
const HOLD_TICKS = ZONE_LEVEL_UP.holdSeconds * TICK_RATE;
const AREA = [
  [
    { x: 90, y: 20 },
    { x: 110, y: 20 },
    { x: 110, y: 40 },
    { x: 90, y: 40 },
  ],
];
const logger = new NullLogger();

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP));
  const units = loadDefaultContent(TICK_RATE);
  const factory = new EntityFactory(createDefaultEntityRegistry(), units);
  const statuses = new StatusEffectApplier(loadStatusEffects(TICK_RATE, 2));
  const veterancy = new VeterancySystem(state, statuses, units, MINION_VETERANCY);
  const levelUp = new ZoneLevelUpSystem(state, ZONE_LEVEL_UP);
  const point = new CapturePoint('zone-1', CATHEDRAL_CAPTURE_POINT.id);
  point.spawn({
    definition: CATHEDRAL_CAPTURE_POINT,
    position: { x: 100, y: 30 },
    team: 'neutral',
    area: AREA,
    laneId: 'lane-0',
  });
  state.entities.add(point);
  let hordes = 0;
  /** Steps both systems `ticks` times, as the pipeline does at the end of a tick. */
  const run = (ticks = 1) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      veterancy.update({ state, logger });
      levelUp.update({ state, logger });
      state.advanceTick();
    }
  };
  const own = (to: Team) => {
    const from = point.getComponent(Capturable).setOwner(to, state.tick);
    state.events.emit('capture-point-owner-changed', { pointId: point.id, from, to });
  };
  /** Spawns a one-minion horde of `team` on `lane` and announces it, as `SpawnSystem` does. */
  const spawn = (team: PlayableTeam, lane = 'lane-0'): Entity => {
    const minion = factory.create('light-mob', 'light-minion', {
      team,
      position: { x: 100, y: 30 },
    });
    state.entities.add(minion);
    hordes += 1;
    const hordeId = `horde-${String(hordes)}`;
    state.hordes.add({
      id: hordeId,
      team,
      weightClass: 'light',
      lane,
      formationId: 'ranks',
      memberIds: [minion.id],
      progress: 0,
    });
    state.events.emit('horde-spawned', { hordeId, lane, team, memberIds: [minion.id] });
    return minion;
  };
  const levelOf = (entity: Entity) => entity.findComponent(Veterancy)?.level ?? 0;
  const veteranStacks = (entity: Entity) =>
    entity
      .getComponent(StatusEffects)
      .active.filter(({ definition }) => definition.id === MINION_VETERANCY.statusId)
      .reduce((sum, { stacks }) => sum + stacks, 0);
  return { state, own, spawn, run, levelOf, veteranStacks, point };
};

describe('ZoneLevelUpSystem (07 §7, DEC-258)', () => {
  it("levels the owner's minions spawned on the lane once the zone is held for the hold time", () => {
    const { own, spawn, run, levelOf } = setUp();
    own('light');
    run(HOLD_TICKS - 1);
    const early = spawn('light');
    run();
    const onTime = spawn('light');
    const otherLane = spawn('light', 'lane-1');
    const enemy = spawn('dark');
    run();

    expect(levelOf(early)).toBe(0);
    expect(levelOf(onTime)).toBe(ZONE_LEVEL_UP.levels);
    expect(levelOf(otherLane)).toBe(0);
    expect(levelOf(enemy)).toBe(0);
  });

  it('gives the level its effects: max health and a veteran stack', () => {
    const { own, spawn, run, veteranStacks } = setUp();
    own('light');
    run(HOLD_TICKS);
    const base = spawn('light');
    const baseMax = base.getComponent(Health).max;
    run();

    expect(base.getComponent(Health).max).toBeCloseTo(
      baseMax * (1 + MINION_VETERANCY.healthPerLevel),
    );
    expect(veteranStacks(base)).toBe(1);
  });

  it('takes the level and its effects back on the tick the zone is lost, and restarts the clock', () => {
    const { own, spawn, run, levelOf, veteranStacks } = setUp();
    own('light');
    run(HOLD_TICKS);
    const minion = spawn('light');
    const baseMax = minion.getComponent(Health).max;
    run();
    own('dark');
    run();

    expect(levelOf(minion)).toBe(0);
    expect(minion.getComponent(Health).max).toBeCloseTo(baseMax);
    expect(veteranStacks(minion)).toBe(0);
    const darkEarly = spawn('dark');
    run();
    expect(levelOf(darkEarly)).toBe(0);
  });

  it('never takes back a level the minion earned from kills', () => {
    const { own, spawn, run, levelOf, veteranStacks } = setUp();
    own('light');
    run(HOLD_TICKS);
    const minion = spawn('light');
    run();
    // A kill level on top of the zone's.
    minion.getComponent(Veterancy).gainLevels(1, MINION_VETERANCY.maxLevel);
    own('neutral');
    run();

    expect(levelOf(minion)).toBe(1);
    expect(veteranStacks(minion)).toBe(1);
  });

  it('gives a neutral owner nothing', () => {
    const { own, spawn, run, levelOf } = setUp();
    own('light');
    own('neutral');
    run(HOLD_TICKS);
    const minion = spawn('light');
    run();
    expect(levelOf(minion)).toBe(0);
  });

  it('gives the same hash for the same events', () => {
    const play = () => {
      const { state, own, spawn, run } = setUp();
      own('light');
      run(HOLD_TICKS);
      spawn('light');
      run();
      own('dark');
      run();
      return new StateHasher().hash(state);
    };
    expect(play()).toBe(play());
  });
});
