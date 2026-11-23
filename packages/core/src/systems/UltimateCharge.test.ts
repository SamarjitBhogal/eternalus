import { describe, expect, it } from 'vitest';

import { casterState } from '../abilities/__fixtures__/casterState';
import { Abilities } from '../components/Abilities';
import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import { loadStatusEffects } from '../content/status-effects/loadStatusEffects';
import type { UltimateChargeDefinition } from '../content/progression/progression.types';
import type { Entity } from '../entities/Entity';
import type { GameEventMap } from '../state/GameEvents.types';
import type { Team } from '../teams/teams.types';
import { UltimateCharge } from './UltimateCharge';

/** A stand-in table with a distinct value per weight class, so these tests do not move with tuning. */
const TABLE: UltimateChargeDefinition = {
  fullMeter: 100,
  legendKill: 25,
  assist: 12,
  mobKill: { 'light-mob': 1, 'medium-mob': 2, 'heavy-mob': 3 },
  structureDamagePerPercent: 0.5,
  bossDamagePerPercent: { 'capture-point-boss': 2 },
  bossKill: { 'capture-point-boss': 100 },
  checkpointReached: 5,
  deathLoss: 15,
};

const setUp = () => {
  const { state, factory, caster: legend } = casterState();
  const charges = new UltimateCharge(state, TABLE);
  const spawn = (kind: string, definitionId: string, team: Team): Entity => {
    const entity = factory.create(kind, definitionId, { position: { x: 0, y: 0 }, team });
    state.entities.add(entity);
    return entity;
  };
  const meterOf = (entity: Entity) => entity.getComponent(Abilities).slot('ability-4');
  const chargeOf = (entity: Entity): number => meterOf(entity)?.charge ?? Number.NaN;
  const kill = (killer: Entity | null, victim: Entity) => {
    state.events.emit('entity-died', {
      entityId: victim.id,
      killer: {
        attackerId: killer?.id ?? null,
        kind: killer === null ? 'environment' : 'weapon',
        definitionId: killer?.definitionId ?? 'lava',
      },
    });
  };
  const announced = (): GameEventMap['ultimate-charged'][] =>
    state.events
      .recentEvents()
      .filter((event) => event.type === 'ultimate-charged')
      .map((event) => event.payload);
  const pay = () => {
    charges.pay(state);
  };
  return { state, legend, spawn, meterOf, chargeOf, kill, announced, pay };
};

describe('UltimateCharge', () => {
  it('fills the killer for an enemy Legend kill in its pass, and announces the change', () => {
    const { legend, spawn, chargeOf, kill, announced, pay } = setUp();
    const enemy = spawn('warrior', 'warrior', 'dark');

    kill(legend, enemy);
    expect(chargeOf(legend)).toBe(0);
    pay();

    expect(chargeOf(legend)).toBe(0.25);
    expect(announced()).toEqual([
      { entityId: legend.id, amount: 0.25, charge: 0.25, cause: 'legend-kill' },
    ]);
  });

  it("pays a mob kill by the mob's weight class, neutral camp mobs too (DEC-273)", () => {
    const { legend, spawn, chargeOf, kill, pay } = setUp();

    kill(legend, spawn('light-mob', 'light-minion', 'dark'));
    kill(legend, spawn('medium-mob', 'medium-guard', 'dark'));
    kill(legend, spawn('heavy-mob', 'heavy-camp-mob', 'neutral'));
    pay();

    expect(chargeOf(legend)).toBeCloseTo((1 + 2 + 3) / 100);
  });

  it('pays no kill charge for an ally kill or a self-kill (O5)', () => {
    const { legend, spawn, chargeOf, kill, announced, pay } = setUp();

    kill(legend, spawn('light-mob', 'light-minion', 'light'));
    pay();

    expect(chargeOf(legend)).toBe(0);
    expect(announced()).toEqual([]);
  });

  it('takes the death loss from the victim whoever killed it, never below 0', () => {
    const { legend, spawn, meterOf, chargeOf, kill, announced, pay } = setUp();
    const enemy = spawn('warrior', 'warrior', 'dark');
    const victimMeter = meterOf(enemy);
    kill(legend, enemy);
    pay();
    if (victimMeter !== undefined) victimMeter.charge = 0.4; // a meter some earlier kills filled

    kill(null, enemy);
    kill(enemy, enemy);
    kill(enemy, enemy);
    pay();

    const losses = announced().filter(({ entityId }) => entityId === enemy.id);
    expect(chargeOf(enemy)).toBe(0);
    expect(losses.map(({ cause }) => cause)).toEqual(['death', 'death', 'death']);
    [-0.15, -0.15, -0.1].forEach((amount, index) => {
      expect(losses[index]?.amount).toBeCloseTo(amount);
    });
    [0.25, 0.1, 0].forEach((charge, index) => {
      expect(losses[index]?.charge).toBeCloseTo(charge);
    });
  });

  it('takes the death loss from a victim already at 0 health, as it is when it dies in play', () => {
    const { legend, spawn, meterOf, chargeOf, kill, pay } = setUp();
    const enemy = spawn('warrior', 'warrior', 'dark');
    const victimMeter = meterOf(enemy);
    if (victimMeter !== undefined) victimMeter.charge = 0.4;
    enemy.getComponent(Health).applyDamage(enemy.getComponent(Health).max);

    kill(legend, enemy);
    pay();

    expect(chargeOf(enemy)).toBe(0.25);
  });

  it('gives a dead Legend no gain until it respawns', () => {
    const { legend, spawn, chargeOf, kill, pay } = setUp();
    legend.getComponent(Health).applyDamage(legend.getComponent(Health).max);

    kill(legend, spawn('warrior', 'warrior', 'dark'));
    pay();

    expect(chargeOf(legend)).toBe(0);
  });

  it('stops at a full meter and announces only what it applied', () => {
    const { legend, spawn, chargeOf, kill, announced, pay } = setUp();
    for (let index = 0; index < 5; index += 1) {
      kill(legend, spawn('warrior', 'warrior', 'dark'));
    }
    pay();

    expect(chargeOf(legend)).toBe(1);
    expect(announced().map(({ amount }) => amount)).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it("pays structure damage per 1% of the structure's max health, absorbed damage included", () => {
    const { state, legend, spawn, chargeOf, pay } = setUp();
    const tower = spawn('spawner-tower', 'spawner-tower', 'dark');
    const max = tower.getComponent(Health).max;
    const hit = (attacker: Entity, target: Entity, amount: number, absorbed: number) => {
      state.events.emit('damage-applied', {
        targetId: target.id,
        amount,
        absorbed,
        source: { attackerId: attacker.id, kind: 'weapon', definitionId: attacker.definitionId },
      });
    };

    hit(legend, tower, max * 0.03, max * 0.01); // 4% -> 2 points
    hit(legend, spawn('spawner-tower', 'spawner-tower', 'light'), max, 0); // own team: nothing
    hit(legend, spawn('warrior', 'warrior', 'dark'), 50, 0); // not a structure: nothing
    pay();

    expect(chargeOf(legend)).toBeCloseTo(0.02);
  });

  it("pays boss damage per 1% of the boss's max health at the boss's own rate (DEC-272)", () => {
    const { state, legend, spawn, chargeOf, announced, pay } = setUp();
    const boss = spawn('heavy-mob', 'capture-point-boss', 'neutral');
    const max = boss.getComponent(Health).max;
    const hit = (target: Entity, amount: number, absorbed: number) => {
      state.events.emit('damage-applied', {
        targetId: target.id,
        amount,
        absorbed,
        source: { attackerId: legend.id, kind: 'weapon', definitionId: legend.definitionId },
      });
    };

    hit(boss, max * 0.02, max * 0.01); // 3% at 2 per 1% -> 6 points
    hit(spawn('heavy-mob', 'heavy-camp-mob', 'neutral'), 50, 0); // not a listed boss: nothing
    pay();

    expect(chargeOf(legend)).toBeCloseTo(0.06);
    expect(announced().map(({ cause }) => cause)).toEqual(['boss-damage']);
  });

  it("fills the boss killer's meter, whoever dealt the damage (DEC-283)", () => {
    const { legend, spawn, chargeOf, kill, announced, pay } = setUp();

    kill(legend, spawn('heavy-mob', 'capture-point-boss', 'neutral'));
    pay();

    expect(chargeOf(legend)).toBe(1);
    expect(announced().map(({ cause }) => cause)).toEqual(['boss-kill']);
  });

  it("pays a heavy lane minion's kill its weight class only, never a full meter", () => {
    const { legend, spawn, chargeOf, kill, announced, pay } = setUp();

    kill(legend, spawn('heavy-mob', 'heavy-minion', 'dark'));
    pay();

    expect(chargeOf(legend)).toBeCloseTo(0.03);
    expect(announced().map(({ cause }) => cause)).toEqual(['mob-kill']);
  });

  it('pays each Legend present at a reached checkpoint, and each assist', () => {
    const { state, legend, spawn, chargeOf, announced, pay } = setUp();
    const ally = spawn('warrior', 'warrior', 'light');

    state.events.emit('checkpoint-reached', {
      pointId: 'point-1',
      team: 'light',
      checkpoint: 1,
      presentLegendIds: [legend.id, ally.id],
    });
    state.events.emit('assist-earned', { legendId: ally.id, victimId: 'entity-gone' });
    pay();

    expect(chargeOf(legend)).toBe(0.05);
    expect(chargeOf(ally)).toBeCloseTo(0.17);
    expect(announced().map(({ cause }) => cause)).toEqual(['checkpoint', 'checkpoint', 'assist']);
  });

  it('makes exactly a full meter from whole points worth 100, in any order', () => {
    const { state, legend, chargeOf, pay } = setUp();
    const assist = () => {
      state.events.emit('assist-earned', { legendId: legend.id, victimId: 'entity-gone' });
    };
    // 12 + 8 × 5 + 4 × 12 = 100; summed as fractions of 100 this order ends at 0.9999999999999999.
    assist();
    for (let checkpoint = 0; checkpoint < 8; checkpoint += 1) {
      state.events.emit('checkpoint-reached', {
        pointId: 'point-1',
        team: 'light',
        checkpoint: 1,
        presentLegendIds: [legend.id],
      });
    }
    for (let count = 0; count < 4; count += 1) {
      assist();
    }
    pay();

    expect(chargeOf(legend)).toBe(1);
  });

  it('never fills on its own: a thousand passes with no event change nothing', () => {
    const { legend, chargeOf, announced, pay } = setUp();

    for (let pass = 0; pass < 1000; pass += 1) {
      pay();
    }

    expect(chargeOf(legend)).toBe(0);
    expect(announced()).toEqual([]);
  });

  describe('with Erudition (ultimateGain x1.25, DEC-330)', () => {
    const erudite = (legend: Entity) => {
      legend.getComponent(StatusEffects).apply(loadStatusEffects(30, 2).get('erudition'), null, 0);
    };

    it('pays 1.25 times the points for a Legend kill', () => {
      const { legend, spawn, chargeOf, kill, announced, pay } = setUp();
      erudite(legend);

      kill(legend, spawn('warrior', 'warrior', 'dark'));
      pay();

      expect(chargeOf(legend)).toBeCloseTo(0.25 * 1.25);
      expect(announced()[0]?.amount).toBeCloseTo(0.25 * 1.25);
    });

    it('pays 1.25 times the points for an assist', () => {
      const { state, legend, chargeOf, pay } = setUp();
      erudite(legend);

      state.events.emit('assist-earned', { legendId: legend.id, victimId: 'entity-gone' });
      pay();

      expect(chargeOf(legend)).toBeCloseTo(0.12 * 1.25);
    });

    it('takes the death loss unchanged', () => {
      const { legend, meterOf, chargeOf, kill, pay } = setUp();
      erudite(legend);
      const meter = meterOf(legend);
      if (meter !== undefined) meter.charge = 0.5;

      kill(null, legend);
      pay();

      expect(chargeOf(legend)).toBeCloseTo(0.5 - 0.15);
    });

    it('pays an ordinary Legend the plain points', () => {
      const { state, legend, chargeOf, pay } = setUp();

      state.events.emit('assist-earned', { legendId: legend.id, victimId: 'entity-gone' });
      pay();

      expect(chargeOf(legend)).toBeCloseTo(0.12);
    });
  });
});
