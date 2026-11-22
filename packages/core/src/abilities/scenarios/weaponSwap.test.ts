import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { NullLogger } from '../../diagnostics/NullLogger';
import { Simulation } from '../../Simulation';
import type { EntityId } from '../../state/EntityStore.types';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import { stepPastCountdown } from '../__fixtures__/stepPastCountdown';

/**
 * The Zealot's weapon swap (DEC-303): the human plays the Zealot (spec `assassin`) on the dark
 * team, at its Stronghold (190, 30), with Weapon Swap on gadget-1 (key Z; `INBOX.md` HC-Q80, A).
 * A light training dummy stands 15 m west: out of the talons' 1.5 m reach, inside the bow's 50 m.
 * The swap's cooldown is 1 s, 30 ticks (HC-Q81, A; TUNE).
 */
const match = (seed = 5) => {
  const sim = new Simulation({
    config: createDefaultGameConfig({ match: { playerTeam: 'dark' } }),
    seed,
    logger: new NullLogger(),
    map: TWO_LANE_MAP,
    roster: [
      { pilot: 'human', team: 'dark', definitionId: 'warrior', role: 'rover', specId: 'assassin' },
    ],
  });
  const zealot = sim.snapshot().match.humanLegendId ?? '';
  const spawned: EntityId[] = [];
  sim.on('entity-spawned', ({ entityId }) => spawned.push(entityId));
  sim.enqueueCommand({
    type: 'dev-spawn',
    kind: 'light-mob',
    definitionId: 'training-dummy',
    team: 'light',
    at: { x: 175, y: 30 },
    count: 1,
  });
  stepPastCountdown(sim);
  const dummy = spawned[0] ?? '';
  const log: string[] = [];
  sim.on('ability-cast', ({ abilityId }) => log.push(`${String(sim.tick)} cast ${abilityId}`));
  sim.on('command-rejected', ({ reason }) => log.push(`${String(sim.tick)} rejected ${reason}`));
  sim.on('entity-died', ({ entityId, killer }) => {
    log.push(`${entityId} killed by ${killer.definitionId}`);
  });

  /** Presses Z: casts gadget-1, applied in the next step. */
  const swap = (): void => {
    sim.enqueueCommand({
      type: 'cast-ability',
      actorId: zealot,
      slot: 'gadget-1',
      aim: { point: { x: 175, y: 30 }, targetId: null },
    });
  };
  /** Advances `ticks` steps. */
  const run = (ticks: number): void => {
    for (let tick = 0; tick < ticks; tick += 1) sim.step();
  };
  /** Whether an arrow is in the air now. */
  const isArrowFlying = (): boolean =>
    sim.snapshot().entities.some(({ definitionId }) => definitionId === 'arrow');
  return { sim, zealot, dummy, log, swap, run, isArrowFlying };
};

describe('Weapon Swap (scenario, DEC-303)', () => {
  it('puts the bow in the Zealot’s hand: its arrows kill a dummy 15 m away, credited to the bow', () => {
    const withBow = match();
    const withTalons = match();

    withBow.swap();
    withBow.run(1);
    for (const { sim, zealot, dummy } of [withBow, withTalons]) {
      sim.enqueueCommand({ type: 'attack-target', actorId: zealot, targetId: dummy });
    }
    let hasBowShot = false;
    let hasTalonShot = false;
    for (let tick = 0; tick < 20; tick += 1) {
      withBow.run(1);
      withTalons.run(1);
      hasBowShot ||= withBow.isArrowFlying();
      hasTalonShot ||= withTalons.isArrowFlying();
    }
    withBow.run(60);

    expect(withBow.log[0]).toMatch(/cast weapon-swap$/);
    expect(hasBowShot).toBe(true);
    expect(hasTalonShot).toBe(false);
    expect(withBow.log).toContain(`${withBow.dummy} killed by obsidian-bow`);
  });

  it('refuses a second swap for 1 s (30 ticks), then swaps back to the talons', () => {
    const { sim, zealot, dummy, log, swap, run, isArrowFlying } = match();

    swap();
    run(1);
    // Events fire inside the step, before the tick count moves on.
    const castTick = sim.tick - 1;
    swap();
    run(28);
    swap();
    run(1);
    swap();
    run(1);
    sim.enqueueCommand({ type: 'attack-target', actorId: zealot, targetId: dummy });
    let hasShot = false;
    for (let tick = 0; tick < 20; tick += 1) {
      run(1);
      hasShot ||= isArrowFlying();
    }

    expect(log).toEqual([
      `${String(castTick)} cast weapon-swap`,
      `${String(castTick + 1)} rejected on-cooldown`,
      `${String(castTick + 29)} rejected on-cooldown`,
      `${String(castTick + 30)} cast weapon-swap`,
    ]);
    expect(hasShot).toBe(false);
  });

  it('gives the same hash for the same seed and swaps, and another hash without the swap', () => {
    const play = (isSwapping: boolean): number => {
      const { sim, zealot, dummy, swap, run } = match(9);
      if (isSwapping) swap();
      run(1);
      sim.enqueueCommand({ type: 'attack-target', actorId: zealot, targetId: dummy });
      run(90);
      return sim.hash();
    };

    expect(play(true)).toBe(play(true));
    expect(play(true)).not.toBe(play(false));
  });
});
