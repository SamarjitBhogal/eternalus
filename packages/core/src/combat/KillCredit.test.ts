import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadScoring } from '../content/match/loadScoring';
import { CATHEDRAL_GEM } from '../content/structures/cathedralGem';
import { NullLogger } from '../diagnostics/NullLogger';
import { Entity } from '../entities/Entity';
import { createDefaultScoringRules } from '../match/defaultScoringRules';
import { Scoring } from '../match/Scoring';
import type { EntityId } from '../state/EntityStore.types';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import { DeathSystem } from '../systems/DeathSystem';
import type { Team } from '../teams/teams.types';
import { DamagePipeline } from './DamagePipeline';
import { KillCredit } from './KillCredit';

/** A test unit of any family, with the `Health` and team `spawn` gives it. */
class TestUnit extends Entity {
  public constructor(
    id: string,
    public readonly family: string,
    public readonly kind: string,
  ) {
    super(id, family === 'legend' ? 'warrior' : `${kind}-definition`);
  }

  protected installComponents(): void {
    // `spawn` adds the components.
  }
}

const BURN = { attackerId: null, kind: 'status', definitionId: 'gem-burn' } as const;

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const scoring = loadScoring(state.config.tickRate);
  const score = new Scoring(state, createDefaultScoringRules(scoring));
  const damage = new DamagePipeline(
    undefined,
    new KillCredit(scoring.assistWindowTicks, CATHEDRAL_GEM.statusIds),
  );
  const deaths: GameEventMap['entity-died'][] = [];
  state.events.on('entity-died', (event) => deaths.push(event));
  let next = 0;
  const spawn = (family: string, kind: string, team: Team, health = 100): EntityId => {
    next += 1;
    const unit = new TestUnit(`entity-${String(next)}`, family, kind);
    unit.addComponent(new Health(health));
    unit.addComponent(new TeamMembership(team));
    state.entities.add(unit);
    state.events.emit('entity-spawned', { entityId: unit.id, kind, team });
    return unit.id;
  };
  const legend = (team: Team) => spawn('legend', 'warrior', team);
  const hit = (attackerId: EntityId, targetId: EntityId) => {
    damage.apply(state, targetId, 10, { attackerId, kind: 'weapon', definitionId: 'sword' });
  };
  /** The gem's burn takes the rest of the victim's health. */
  const burnToDeath = (victimId: EntityId) => {
    damage.apply(state, victimId, 10_000, BURN);
  };
  const endTick = () => {
    new DeathSystem().update({ state, logger: new NullLogger() });
    score.fold({ state, enterPhase: () => undefined });
    state.advanceTick();
  };
  const runFor = (ticks: number) => {
    for (let at = 0; at < ticks; at += 1) endTick();
  };
  const rowOf = (entityId: EntityId) =>
    state.match.scoring.legends.find((row) => row.entityId === entityId);
  return {
    state,
    damage,
    scoring,
    deaths,
    spawn,
    legend,
    hit,
    burnToDeath,
    endTick,
    runFor,
    rowOf,
  };
};

describe('KillCredit (DEC-346)', () => {
  it('gives a gem kill to the enemy Legend that hit the victim 10 s before: its kill and points', () => {
    const { deaths, legend, hit, burnToDeath, endTick, runFor, rowOf } = setUp();
    const victim = legend('light');
    const enemy = legend('dark');
    hit(enemy, victim);
    runFor(10 * 30);

    burnToDeath(victim);
    endTick();

    expect(deaths).toEqual([{ entityId: victim, killer: { ...BURN, attackerId: enemy } }]);
    expect(rowOf(enemy)).toMatchObject({ kills: 1, assists: 0, score: 15 });
    expect(rowOf(victim)).toMatchObject({ deaths: 1 });
  });

  it('gives nobody the kill once the window has passed since the last enemy hit: a death only', () => {
    const { scoring, deaths, legend, hit, burnToDeath, endTick, runFor, rowOf } = setUp();
    const victim = legend('light');
    const enemy = legend('dark');
    hit(enemy, victim);
    runFor(scoring.assistWindowTicks + 1);

    burnToDeath(victim);
    endTick();

    expect(deaths).toEqual([{ entityId: victim, killer: BURN }]);
    expect(rowOf(enemy)).toMatchObject({ kills: 0, score: 0 });
    expect(rowOf(victim)).toMatchObject({ deaths: 1 });
  });

  it('credits the enemy minion that hit last, so no Legend earns the kill', () => {
    const { deaths, spawn, legend, hit, burnToDeath, endTick, rowOf } = setUp();
    const victim = legend('light');
    const enemy = legend('dark');
    const minion = spawn('mob', 'light-mob', 'dark');
    hit(enemy, victim);
    endTick();
    hit(minion, victim);
    endTick();

    burnToDeath(victim);
    endTick();

    expect(deaths).toEqual([{ entityId: victim, killer: { ...BURN, attackerId: minion } }]);
    expect(rowOf(enemy)).toMatchObject({ kills: 0, assists: 1 });
  });

  it("never credits an ally's hit", () => {
    const { deaths, legend, hit, burnToDeath, endTick } = setUp();
    const victim = legend('light');
    const ally = legend('light');
    hit(ally, victim);
    endTick();

    burnToDeath(victim);

    expect(deaths).toEqual([{ entityId: victim, killer: BURN }]);
  });

  it('leaves every other killer as it is: a hit with an attacker, and other status damage', () => {
    const { state, damage, deaths, legend, hit, endTick } = setUp();
    const enemy = legend('dark');
    const other = legend('dark');
    const bled = legend('light');
    const struck = legend('light');
    hit(enemy, bled);
    hit(enemy, struck);
    endTick();
    const bleed = { attackerId: null, kind: 'status', definitionId: 'bleed' } as const;
    const sword = { attackerId: other, kind: 'weapon', definitionId: 'sword' } as const;

    damage.apply(state, bled, 10_000, bleed);
    damage.apply(state, struck, 10_000, sword);

    expect(deaths).toEqual([
      { entityId: bled, killer: bleed },
      { entityId: struck, killer: sword },
    ]);
  });
});
