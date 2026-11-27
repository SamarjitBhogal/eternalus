import { describe, expect, it } from 'vitest';

import { ThreatLedger } from '../components/ThreatLedger';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { GREATER_BOSS_PROFILE } from '../content/ai/bosses/greaterBoss';
import { loadDefaultContent } from '../content/loadDefaultContent';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { EntityFactory } from '../entities/EntityFactory';
import type { AiMemory } from '../state/AiState.types';
import { GameState } from '../state/GameState';
import { SeededRandom } from '../utils/SeededRandom';
import { TickRate } from '../utils/TickRate';
import { BossMoveChooser } from './BossMoveChooser';
import type { BossTarget } from './BossMoveChooser.types';
import { Perception } from './perception/Perception';

const PROFILE = GREATER_BOSS_PROFILE;
const { brain } = PROFILE;
const CONFIG = createDefaultGameConfig();
const rate = new TickRate(CONFIG.tickRate);
const SLAM = 'greater-boss-slam';
const SWEEP = 'greater-boss-sweep';
const WIDE_SWEEP = 'greater-boss-wide-sweep';
const BEAM = 'greater-boss-beam';
const CHARGE = 'greater-boss-charge';
const SEEDS = Array.from({ length: 40 }, (_, at) => at + 1);

const chooser = new BossMoveChooser(PROFILE);

/** Memory with each of `moveIds` on cooldown long past this decision. */
const cooling = (...moveIds: string[]): AiMemory =>
  Object.fromEntries(moveIds.map((id) => [`ready:${id}`, 10_000]));

/**
 * The Greater Boss (entity-1), three Warriors (entity-2..4) and a tower guard (entity-5).
 * `targets` lists units at a distance from the boss (gap) by entity id, nearest first as the
 * controller gives them; `hit` records recent damage to the boss.
 */
const setUp = () => {
  const state = new GameState(CONFIG, 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(CONFIG.tickRate),
    undefined,
    loadWeapons(CONFIG.tickRate),
  );
  const boss = factory.create('heavy-mob', 'greater-boss', {
    position: { x: 0, y: 0 },
    team: 'neutral',
  });
  state.entities.add(boss);
  for (let at = 0; at < 3; at += 1) {
    state.entities.add(
      factory.create('warrior', 'warrior', { team: 'light', position: { x: at, y: 3 } }),
    );
  }
  state.entities.add(
    factory.create('light-mob', 'light-guard', { team: 'light', position: { x: 0, y: 5 } }),
  );
  const ledger = new ThreatLedger();
  boss.addComponent(ledger);
  const hit = (attackerId: string, amount: number): void => {
    ledger.record(attackerId, amount, state.tick, 0);
  };
  const targets = (gaps: Readonly<Record<string, number>>): BossTarget[] =>
    Object.entries(gaps)
      .map(([id, gap]) => ({ id, at: { x: gap, y: 0 }, gap }))
      .sort((a, b) => a.gap - b.gap);
  const choose = (gaps: Readonly<Record<string, number>>, memory: AiMemory = {}, seed = 1) =>
    chooser.choose(
      {
        state,
        id: boss.id,
        memory,
        profile: PROFILE,
        zone: { x: 0, y: 0, radius: 25 },
        at: { x: 0, y: 0 },
        perception: new Perception(state),
        rng: new SeededRandom(seed),
        ticks: (seconds) => rate.toTicks(seconds),
      },
      targets(gaps),
    );
  /** The move picked across many seeds, and the target, as `move@target` (`none` for none). */
  const picks = (gaps: Readonly<Record<string, number>>, memory: AiMemory = {}): Set<string> =>
    new Set(
      SEEDS.map((seed) => {
        const choice = choose(gaps, memory, seed);
        return choice === null ? 'none' : `${choice.move.id}@${choice.target.id}`;
      }),
    );
  const hurt = (): void => {
    state.entities.setBossPhase(boss.id, 'hurt', state.tick);
  };
  return { state, boss, hit, choose, picks, hurt };
};

describe('BossMoveChooser', () => {
  it('punishes the top recent damage dealer, a Legend in melee range, before a nearer unit', () => {
    const { hit, picks } = setUp();
    hit('entity-2', 60);
    hit('entity-3', 40);

    // The beam, charge and slam punish; the charge stays locked while the boss is healthy.
    expect(picks({ 'entity-3': 1, 'entity-2': brain.meleeRange })).toEqual(
      new Set([`${BEAM}@entity-2`, `${SLAM}@entity-2`]),
    );
    // Punish outranks a crowd: with the slam cooling, the crowd would sweep the nearest.
    expect(picks({ 'entity-3': 1, 'entity-4': 2, 'entity-2': 3 }, cooling(SLAM))).toEqual(
      new Set([`${BEAM}@entity-2`]),
    );
  });

  it('punishes only a Legend, in melee range, with at least the punish share', () => {
    const guard = setUp();
    guard.hit('entity-5', 100);
    // The guard dealt it all, but only a Legend is punished: the fallback hits the nearest.
    expect(guard.picks({ 'entity-2': 1, 'entity-5': 2 }, cooling(SLAM))).toEqual(
      new Set([`${SWEEP}@entity-2`]),
    );

    const far = setUp();
    far.hit('entity-2', 100);
    // Out of melee range: the far branch reaches the nearest with the beam (charge locked).
    expect(far.picks({ 'entity-2': brain.meleeRange + 1 })).toEqual(new Set([`${BEAM}@entity-2`]));

    const shared = setUp();
    shared.hit('entity-2', 39);
    shared.hit('entity-3', 31);
    shared.hit('entity-4', 30);
    // Below the share, three in the crowd radius: the crowd branch (slam cooling) sweeps.
    expect(shared.picks({ 'entity-2': 1, 'entity-3': 2, 'entity-4': 3 }, cooling(SLAM))).toEqual(
      new Set([`${SWEEP}@entity-2`]),
    );
  });

  it('gives a tie for the top damage dealer to the lower id', () => {
    const { hit, picks } = setUp();
    hit('entity-3', 50);
    hit('entity-2', 50);

    expect(picks({ 'entity-2': 2, 'entity-3': 1 }, cooling(SLAM))).toEqual(
      new Set([`${BEAM}@entity-2`]),
    );
  });

  it('hits a crowd with an area move aimed at the nearest unit', () => {
    const { picks } = setUp();
    const crowd = { 'entity-2': 1, 'entity-3': 2, 'entity-4': brain.crowdRadius };

    expect(picks(crowd)).toEqual(new Set([`${SWEEP}@entity-2`, `${SLAM}@entity-2`]));
    // No ready close move: no pick, so the boss chases (the roar never fills in).
    expect(picks({ 'entity-2': 1, 'entity-3': 2 }, cooling(SLAM, SWEEP))).toEqual(
      new Set(['none']),
    );
  });

  it('reaches a far target, and falls through to the fallback when no far move is ready', () => {
    const { picks } = setUp();
    const far = { 'entity-2': 8 };

    expect(picks(far)).toEqual(new Set([`${BEAM}@entity-2`]));
    // Beam cooling, charge locked: the far branch fails and no close move reaches, so no pick and
    // the boss chases. A roar here would hold a kiter's boss in place.
    expect(picks(far, cooling(BEAM))).toEqual(new Set(['none']));
  });

  it('keeps the wide sweep and the charge locked until the boss is hurt', () => {
    const { picks, hurt } = setUp();
    const crowd = { 'entity-2': 1, 'entity-3': 2, 'entity-4': 3 };
    const far = { 'entity-2': 8 };
    const healthy = new Set([...picks(crowd), ...picks(far), ...picks({ 'entity-2': 2 })]);

    expect(
      [...healthy].filter((pick) => pick.startsWith(WIDE_SWEEP) || pick.startsWith(CHARGE)),
    ).toEqual([]);
    hurt();
    expect(picks(crowd, cooling(SLAM, SWEEP))).toEqual(new Set([`${WIDE_SWEEP}@entity-2`]));
    expect(picks(far, cooling(BEAM))).toEqual(new Set([`${CHARGE}@entity-2`]));
  });

  it('picks nothing with no target, or with no ready move in range', () => {
    const { choose } = setUp();

    expect(choose({})).toBeNull();
    expect(choose({ 'entity-2': 31 })).toBeNull();
    expect(choose({ 'entity-2': 2 }, cooling(SLAM, SWEEP, BEAM))).toBeNull();
  });

  it('lands the move its telegraph from the next tick, and picks the same for the same seed', () => {
    const { state, choose } = setUp();
    const choice = choose({ 'entity-2': 2 }, {}, 7);
    const telegraph = choice?.move.telegraphSeconds ?? NaN;

    expect(choice?.landTick).toBe(state.tick + 1 + rate.toTicks(telegraph));
    expect(SEEDS.map((seed) => choose({ 'entity-2': 2 }, {}, seed)?.move.id)).toEqual(
      SEEDS.map((seed) => choose({ 'entity-2': 2 }, {}, seed)?.move.id),
    );
  });

  it('stops on a profile whose brain names a move it does not have (a content error)', () => {
    expect(
      () =>
        new BossMoveChooser({
          ...PROFILE,
          brain: { ...brain, far: { ...brain.far, moveIds: ['greater-boss-hug'] } },
        }),
    ).toThrow('greater-boss-hug');
    expect(
      () => new BossMoveChooser({ ...PROFILE, hurtPhase: { healthShare: 0.5, moveIds: ['nope'] } }),
    ).toThrow('nope');
  });
});
