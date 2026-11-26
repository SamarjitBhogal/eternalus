import { describe, expect, it } from 'vitest';

import { casterState } from '../abilities/__fixtures__/casterState';
import { Aether } from '../components/Aether';
import { Health } from '../components/Health';
import { AETHER_REGEN } from '../content/abilities/aetherRegen';
import type { Team } from '../teams/teams.types';
import { NullLogger } from '../diagnostics/NullLogger';
import { AetherRegenSystem } from './AetherRegenSystem';
import { AETHER_REGEN_QUANTUM } from './AetherRegenSystem.constants';

/** A Warrior (base aether 100) at the origin with `spent` aether gone, and a regen system at 30 ticks/s. */
const setUp = (spent = 50) => {
  const { state, factory, caster } = casterState();
  const aether = caster.getComponent(Aether);
  aether.spend(spent);
  const system = new AetherRegenSystem(AETHER_REGEN, 30);
  const runFor = (ticks: number): void => {
    for (let tick = 0; tick < ticks; tick += 1) {
      system.update({ state, logger: new NullLogger() });
    }
  };
  const addStructure = (kind: string, definitionId: string, team: Team, x: number) => {
    const structure = factory.create(kind, definitionId, { position: { x, y: 0 }, team });
    state.entities.add(structure);
    return structure;
  };
  return { state, aether, runFor, addStructure };
};

/** Far from the Warrior at the origin: outside every aura it could stand in. */
const FAR = [200, 300, 400] as const;

describe('AetherRegenSystem', () => {
  it('refills 4 aether per second at the base capacity (DEC-201)', () => {
    const { aether, runFor } = setUp();

    runFor(30);

    expect(aether.current - 50).toBeCloseTo(4, 3);
  });

  it('adds only whole multiples of 2^-16 each tick, so many ticks add up exactly', () => {
    const { aether, runFor } = setUp();

    runFor(7);

    const gained = aether.current - 50;
    expect(Number.isInteger(gained / AETHER_REGEN_QUANTUM)).toBe(true);
    expect(gained).toBe(7 * (Math.floor(4 / 30 / AETHER_REGEN_QUANTUM) * AETHER_REGEN_QUANTUM));
  });

  it('scales the rate with max aether / base aether, so a full refill takes as long at every level', () => {
    const { aether, runFor } = setUp();
    aether.raiseMax(100); // max 200 on a base of 100

    runFor(30);

    expect(aether.current - 50).toBeCloseTo(8, 3);
  });

  it('refills 50% faster within the aura of an allied BuffTower, however many other BuffTowers fell', () => {
    const { state, aether, runFor, addStructure } = setUp();
    addStructure('buff-tower', 'buff-tower', 'light', AETHER_REGEN.auraRadius);
    const others = FAR.map((x) => addStructure('buff-tower', 'buff-tower', 'light', x));
    state.indexStructures();
    for (const { id } of others) state.entities.remove(id, 'died');

    runFor(30);

    expect(aether.current - 50).toBeCloseTo(6, 3);
  });

  describe("the Stronghold's aura, scaled by its team's standing BuffTowers (DEC-201 (4))", () => {
    /** The Warrior next to its Stronghold, with three BuffTowers out of reach, indexed as spawned. */
    const nearStronghold = () => {
      const match = setUp();
      match.addStructure('stronghold', 'stronghold', 'light', -5);
      const towers = FAR.map((x) => match.addStructure('buff-tower', 'buff-tower', 'light', x));
      match.state.indexStructures();
      return { ...match, towers };
    };

    it('gives the full +50% while every BuffTower stands', () => {
      const { aether, runFor } = nearStronghold();

      runFor(30);

      expect(aether.current - 50).toBeCloseTo(6, 3);
    });

    it('gives +50% x standing / spawned: two of three standing give +33%', () => {
      const { state, towers, aether, runFor } = nearStronghold();
      state.entities.remove(towers[0]?.id ?? '', 'died');

      runFor(30);

      expect(aether.current - 50).toBeCloseTo(4 * (1 + 0.5 * (2 / 3)), 3);
    });

    it('gives nothing once every BuffTower has fallen (removed, or dead and not yet removed)', () => {
      const { state, towers, aether, runFor } = nearStronghold();
      state.entities.remove(towers[0]?.id ?? '', 'died');
      state.entities.remove(towers[1]?.id ?? '', 'died');
      towers[2]?.getComponent(Health).applyDamage(1_000_000);

      runFor(30);

      expect(aether.current - 50).toBeCloseTo(4, 3);
    });

    it('counts only its own team’s BuffTowers', () => {
      const { towers, aether, runFor, addStructure, state } = nearStronghold();
      state.entities.remove(towers[0]?.id ?? '', 'died');
      addStructure('buff-tower', 'buff-tower', 'dark', 500); // the enemy's, standing

      runFor(30);

      expect(aether.current - 50).toBeCloseTo(4 * (1 + 0.5 * (2 / 3)), 3);
    });

    it('gives nothing, and no division by zero, for a team that never had a BuffTower', () => {
      const { aether, runFor, addStructure } = setUp();
      addStructure('stronghold', 'stronghold', 'light', -5);

      runFor(30);

      expect(aether.current - 50).toBeCloseTo(4, 3);
      expect(Number.isFinite(aether.current)).toBe(true);
    });
  });

  it('takes the largest bonus inside several allied auras, never their sum', () => {
    const { state, aether, runFor, addStructure } = setUp();
    addStructure('stronghold', 'stronghold', 'light', -5); // +33%: two of three BuffTowers stand
    addStructure('buff-tower', 'buff-tower', 'light', 5); // +50%
    addStructure('buff-tower', 'buff-tower', 'light', -6); // a second +50% in reach
    const fallen = addStructure('buff-tower', 'buff-tower', 'light', FAR[0]);
    state.indexStructures();
    state.entities.remove(fallen.id, 'died');

    runFor(30);

    expect(aether.current - 50).toBeCloseTo(6, 3); // +50%, not +133%
  });

  it('gives no aura from an enemy structure, a destroyed one, one out of reach or another kind', () => {
    const { aether, runFor, addStructure } = setUp();
    addStructure('buff-tower', 'buff-tower', 'dark', 1);
    addStructure('buff-tower', 'buff-tower', 'light', AETHER_REGEN.auraRadius + 0.01);
    addStructure('spawner-tower', 'spawner-tower', 'light', 2);
    const ruin = addStructure('stronghold', 'stronghold', 'light', 3);
    ruin.getComponent(Health).applyDamage(1_000_000);

    runFor(30);

    expect(aether.current - 50).toBeCloseTo(4, 3);
  });

  it('never refills above max', () => {
    const { aether, runFor } = setUp(1);

    runFor(30);

    expect(aether.current).toBe(aether.max);
  });
});
