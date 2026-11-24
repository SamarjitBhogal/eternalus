import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameEventMap } from '../../state/GameEvents.types';
import type { GameState } from '../../state/GameState';
import { abilityMatch, type ScenarioSpawn } from '../__fixtures__/abilityMatch';

/**
 * Rip & Tear (DEC-204, DEC-206, balancing.md:186; readings R1-R3): a 90-degree fan 3 m past the
 * Sentinel's body (1.25 m, so 4.25 m from its centre) along the aim; 90 damage, 180 under 30%
 * health; at or below 10% the enemy dies; under 30% it is knocked back 1.5 m (less for a heavier
 * one, DEC-208); one bleed stack; then Fear (2 s) on every survivor in the fan or the circle of the
 * fan's range, never on a Sentinel (DEC-207). The light Sentinel stands at (50, 50) and aims east.
 * Each health threshold is read when its step runs (R2). Every invariant runs each tick and throws.
 */
const SELF = { x: 50, y: 50 };
const EAST = { x: 60, y: 50 };
const SENTINEL: ScenarioSpawn = { kind: 'sentinel', team: 'light', at: SELF };

/** The match with `others` after the Sentinel, and a way to leave a unit with `left` health. */
const match = (others: readonly ScenarioSpawn[]) => {
  const scenario = abilityMatch([SENTINEL, ...others], { debug: TEST_DEBUG_CONFIG });
  const { state } = scenario.sim as unknown as { readonly state: GameState };
  const leave = (id: EntityId | undefined, left: number): void => {
    const health = state.entities.get(id ?? '')?.getComponent(Health);
    if (health === undefined) throw new Error(`no unit "${String(id)}"`);
    health.applyDamage(health.current - left);
  };
  const deaths: GameEventMap['entity-died'][] = [];
  const charged: string[] = [];
  scenario.sim.on('entity-died', (death) => deaths.push(death));
  scenario.sim.on('ultimate-charged', ({ entityId, cause }) =>
    charged.push(`${entityId} ${cause}`),
  );
  return { ...scenario, leave, deaths, charged };
};

/** The log lines about `id`, without the id. */
const linesOf = (log: readonly string[], id: EntityId | undefined): string[] =>
  log
    .filter((line) => line.endsWith(` ${id ?? ''}`))
    .map((line) => line.slice(0, -(id ?? '').length - 1));

describe('Rip & Tear (scenario)', () => {
  it('hits every enemy in the fan by its health, each threshold read as its step runs (DEC-204, R2)', () => {
    const { ids, cast, run, lost, leave, log, entity, deaths, charged } = match([
      { kind: 'light-mob', definitionId: 'training-dummy', team: 'dark', at: { x: 53, y: 50 } },
      { kind: 'warrior', team: 'dark', at: { x: 53, y: 52 } },
      { kind: 'sentinel', team: 'dark', at: { x: 53, y: 47.5 } },
      { kind: 'warrior', team: 'dark', at: { x: 54.2, y: 49.2 } },
      { kind: 'warrior', team: 'dark', at: { x: 57, y: 50 } },
      { kind: 'warrior', team: 'light', at: { x: 52, y: 50.2 } },
    ]);
    const [sentinel, dummy, dropping, heavy, full, far, ally] = ids;
    leave(dropping, 260); // 43% of 600: the 90 hit leaves 170, under 30%
    leave(heavy, 330); // 27.5% of 1,200: takes 180, keeps 150 (12.5%)

    cast(sentinel ?? '', 'ability-2', EAST);
    run(2);

    // 100 -> 10 by the 90 hit, then 10% or less: executed, a kill of the Sentinel's cast that
    // fills its ultimate meter as any mob kill does.
    expect(entity(dummy)).toBeUndefined();
    expect(deaths).toEqual([
      {
        entityId: dummy,
        killer: { attackerId: sentinel, kind: 'ability', definitionId: 'rip-and-tear' },
      },
    ]);
    expect(charged).toEqual([`${sentinel ?? ''} mob-kill`]);
    expect([dropping, heavy, full].map(lost)).toEqual([600 - 170, 1200 - 150, 90]);
    expect([far, ally].map(lost)).toEqual([0, 0]);
    // Under 30% when its step runs: knocked back (and so staggered); then a bleed, then Fear.
    expect(linesOf(log, dropping)).toEqual(['1 staggered on', '1 bleed on', '1 feared on']);
    expect(linesOf(log, heavy)).toEqual(['1 staggered on', '1 bleed on']); // a Sentinel: no Fear
    expect(linesOf(log, full)).toEqual(['1 bleed on', '1 feared on']);
    expect([far, ally].flatMap((id) => linesOf(log, id))).toEqual([]);
  });

  it('knocks a low enemy back 1.5 m for the base weight, less for a heavier one (DEC-208, R2)', () => {
    const { ids, cast, run, at, leave } = match([
      { kind: 'sentinel', team: 'dark', at: { x: 53, y: 50 } },
    ]);
    const [sentinel, heavy] = ids;
    leave(heavy, 330);

    cast(sentinel ?? '', 'ability-2', EAST);
    run(30);

    expect(at(heavy).x).toBeCloseTo(53 + 1.5 / 6, 5);
    expect(at(heavy).y).toBeCloseTo(50, 5);
  });

  it('fears every survivor in the circle of the fan’s range, behind the Sentinel too, for 2 s (DEC-206 (2))', () => {
    const { ids, cast, run, lost, log } = match([
      { kind: 'warrior', team: 'dark', at: { x: 47, y: 50 } },
      { kind: 'warrior', team: 'dark', at: { x: 44, y: 50 } },
    ]);
    const [sentinel, behind, beyond] = ids;

    cast(sentinel ?? '', 'ability-2', EAST);
    run(70);

    expect([behind, beyond].map(lost)).toEqual([0, 0]);
    expect(linesOf(log, behind)).toEqual(['1 feared on', '61 feared off']);
    expect(linesOf(log, beyond)).toEqual([]);
  });

  it('runs a feared enemy straight away at half speed; its move, attack and cast commands do nothing (R3)', () => {
    const { ids, sim, cast, run, at, lost, log } = match([
      { kind: 'warrior', team: 'dark', at: { x: 47.5, y: 50 } },
    ]);
    const [sentinel, warrior] = ids;
    const actorId = warrior ?? '';

    cast(sentinel ?? '', 'ability-2', EAST);
    run(1);
    sim.enqueueCommand({ type: 'move', actorId, direction: { x: 1, y: 0 } });
    sim.enqueueCommand({ type: 'attack-target', actorId, targetId: sentinel ?? '' });
    sim.enqueueCommand({
      type: 'cast-ability',
      actorId,
      slot: 'ability-1',
      aim: { point: SELF, targetId: null },
    });
    run(9);
    const before = at(warrior);
    run(30);
    const after = at(warrior);

    expect(after.x).toBeLessThan(before.x);
    expect(after.y).toBeCloseTo(50, 5);
    // 6 m/s halved: 3 m/s, so 3 m over the 30 ticks of 1 s.
    expect(before.x - after.x).toBeCloseTo(3, 1);
    expect(lost(sentinel)).toBe(0);
    expect(log).toContain(`2 rejected ${actorId} cannot-cast`);
  });

  it('gives the walk back to the unit’s own commands when the fear ends', () => {
    const { ids, sim, cast, run, at } = match([
      { kind: 'warrior', team: 'dark', at: { x: 47.5, y: 50 } },
    ]);
    const [sentinel, warrior] = ids;

    cast(sentinel ?? '', 'ability-2', EAST);
    run(1);
    sim.enqueueCommand({ type: 'move', actorId: warrior ?? '', direction: { x: 0, y: 1 } });
    run(59); // to tick 60, the last feared tick: the fear ends at tick 61
    const freed = at(warrior);
    run(16);

    expect(freed.y).toBeCloseTo(50, 5); // fleeing west, not walking north, while feared
    expect(at(warrior).y).toBeGreaterThan(freed.y + 1);
  });

  it('keeps a feared unit running its last way once the source is gone', () => {
    const { ids, sim, cast, run, at } = match([
      { kind: 'warrior', team: 'dark', at: { x: 47.5, y: 47.5 } },
    ]);
    const [sentinel, warrior] = ids;

    cast(sentinel ?? '', 'ability-2', EAST);
    run(5);
    sim.enqueueCommand({ type: 'dev-remove-entity', entityId: sentinel ?? '' });
    run(1);
    const gone = at(warrior);
    run(20);
    const later = at(warrior);

    // Still south-west, along the line from where the Sentinel stood.
    expect(later.x - gone.x).toBeLessThan(-1);
    expect(later.y - gone.y).toBeCloseTo(later.x - gone.x, 5);
  });

  it('never fears a Sentinel, from any source (DEC-207)', () => {
    const { ids, cast, run, log } = match([
      { kind: 'sentinel', team: 'dark', at: { x: 47, y: 50 } },
    ]);
    const [sentinel, enemy] = ids;

    cast(sentinel ?? '', 'ability-2', EAST);
    run(2);

    expect(linesOf(log, enemy)).toEqual([]);
  });

  it('gives the same hash for the same seed', () => {
    const play = () => {
      const scenario = match([
        { kind: 'warrior', team: 'dark', at: { x: 53, y: 50 } },
        { kind: 'warrior', team: 'dark', at: { x: 47, y: 50 } },
      ]);
      scenario.leave(scenario.ids[1], 150);
      scenario.cast(scenario.ids[0] ?? '', 'ability-2', EAST);
      scenario.run(60);
      return scenario;
    };
    const [first, second] = [play(), play()];

    expect(first.log).toContain(`1 feared on ${first.ids[2] ?? ''}`);
    expect(second.sim.hash()).toBe(first.sim.hash());
  });
});
