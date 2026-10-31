import { describe, expect, it } from 'vitest';

import { DamagePipeline } from '../combat/DamagePipeline';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { ASSIST_WINDOW_SECONDS, SCORING_WEIGHTS } from '../content/match/scoring';
import { NullLogger } from '../diagnostics/NullLogger';
import { Entity } from '../entities/Entity';
import type { EntityId } from '../state/EntityStore.types';
import { GameState } from '../state/GameState';
import type { LegendStats } from '../state/ScoringState.types';
import { DeathSystem } from '../systems/DeathSystem';
import type { Team } from '../teams/teams.types';
import { Scoring } from './Scoring';

/** 30 s at 30 ticks per second (DEC-79). */
const WINDOW_TICKS = 900;

/** A test entity of any family and kind, with the `Health` and team `spawn` gives it. */
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

const EMPTY_ROW = {
  classId: 'warrior',
  controller: 'bot',
  kills: 0,
  deaths: 0,
  assists: 0,
  minionKills: 0,
  neutralKills: 0,
  structureDamage: 0,
  score: 0,
} as const;

const setUp = () => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const scoring = new Scoring(state, {
    weights: SCORING_WEIGHTS,
    assistWindowSeconds: ASSIST_WINDOW_SECONDS,
  });
  const damage = new DamagePipeline();
  let next = 0;
  /** Adds a unit and announces it with `entity-spawned`, as a spawn does. */
  const spawn = (family: string, kind: string, team: Team, health = 100): EntityId => {
    next += 1;
    const unit = new TestUnit(`entity-${String(next)}`, family, kind);
    unit.addComponent(new Health(health));
    unit.addComponent(new TeamMembership(team));
    state.entities.add(unit);
    state.events.emit('entity-spawned', { entityId: unit.id, kind, team });
    return unit.id;
  };
  const legend = (team: Team): EntityId => spawn('legend', 'warrior', team);
  const hit = (attackerId: EntityId | null, targetId: EntityId, amount = 10): void => {
    damage.apply(state, targetId, amount, { attackerId, kind: 'weapon', definitionId: 'test' });
  };
  /** A last hit: more than any test unit's health. */
  const kill = (attackerId: EntityId | null, targetId: EntityId): void => {
    hit(attackerId, targetId, 10_000);
  };
  /** Ends the tick as the pipeline does: `DeathSystem` removes the dead, then the fold. */
  const endTick = (): void => {
    new DeathSystem().update({ state, logger: new NullLogger() });
    scoring.fold({ state, enterPhase: () => undefined });
    state.advanceTick();
  };
  const runTo = (tick: number): void => {
    while (state.tick < tick) {
      endTick();
    }
  };
  const rowOf = (entityId: EntityId): LegendStats | undefined =>
    state.match.scoring.legends.find((row) => row.entityId === entityId);
  return { state, spawn, legend, hit, kill, endTick, runTo, rowOf };
};

describe('Scoring', () => {
  describe('rows', () => {
    it('gives each Legend on a playable team a row in spawn order, and no other unit one', () => {
      const { state, spawn, legend, endTick } = setUp();
      const light = legend('light');
      spawn('mob', 'light-mob', 'light');
      spawn('legend', 'warrior', 'neutral');
      const dark = legend('dark');

      endTick();

      expect(state.match.scoring.legends).toEqual([
        { entityId: light, team: 'light', ...EMPTY_ROW },
        { entityId: dark, team: 'dark', ...EMPTY_ROW },
      ]);
    });

    it("marks the human's Legend human and every other Legend bot", () => {
      const { state, legend, endTick, rowOf } = setUp();
      const human = legend('light');
      const bot = legend('light');
      state.match.humanLegendId = human;

      endTick();

      expect(rowOf(human)?.controller).toBe('human');
      expect(rowOf(bot)?.controller).toBe('bot');
    });

    it('keeps a row and its data after the Legend dies and leaves the store', () => {
      const { state, spawn, legend, kill, endTick, rowOf } = setUp();
      const killer = legend('light');
      const victim = legend('dark');
      kill(victim, spawn('mob', 'light-mob', 'light'));
      endTick();

      kill(killer, victim);
      endTick();

      expect(state.entities.has(victim)).toBe(false);
      expect(rowOf(victim)).toEqual({
        ...EMPTY_ROW,
        entityId: victim,
        team: 'dark',
        deaths: 1,
        minionKills: 1,
        score: 1,
      });
    });
  });

  describe('Legend kills, deaths and assists (DEC-79)', () => {
    it('gives the killer a kill worth 15', () => {
      const { state, legend, kill, endTick, rowOf } = setUp();
      const killer = legend('light');
      const victim = legend('dark');

      kill(killer, victim);
      endTick();

      expect(rowOf(killer)).toMatchObject({ kills: 1, score: 15 });
      expect(state.match.scoring.teams).toEqual({ light: { score: 15 }, dark: { score: 0 } });
    });

    it('counts a death and takes no points for it: the victim keeps what it earned', () => {
      const { state, spawn, legend, kill, endTick, rowOf } = setUp();
      const killer = legend('light');
      const victim = legend('dark');
      kill(victim, spawn('mob', 'medium-mob', 'light'));
      endTick();

      kill(killer, victim);
      endTick();

      expect(rowOf(victim)).toMatchObject({ deaths: 1, score: 4 });
      expect(state.match.scoring.teams.dark.score).toBe(4);
    });

    it("credits the Legend a hit names even after it left the store (its projectile's hit)", () => {
      const { state, legend, kill, endTick, rowOf } = setUp();
      const shooter = legend('light');
      const victim = legend('dark');
      state.entities.remove(shooter, 'despawned');

      kill(shooter, victim);
      endTick();

      expect(rowOf(shooter)).toMatchObject({ kills: 1, score: 15 });
    });

    it("gives each other Legend that hit the victim an assist worth 7, on the window's last tick too", () => {
      const { legend, hit, kill, endTick, runTo, rowOf } = setUp();
      const killer = legend('light');
      const early = legend('light');
      const late = legend('light');
      const victim = legend('dark');
      hit(early, victim);
      endTick();
      runTo(WINDOW_TICKS - 1);
      hit(late, victim);
      endTick();

      kill(killer, victim);
      endTick();

      expect(rowOf(early)).toMatchObject({ assists: 1, kills: 0, score: 7 });
      expect(rowOf(late)).toMatchObject({ assists: 1, kills: 0, score: 7 });
      expect(rowOf(killer)).toMatchObject({ assists: 0, kills: 1, score: 15 });
    });

    it('gives no assist for a hit older than the window', () => {
      const { legend, hit, kill, endTick, runTo, rowOf } = setUp();
      const killer = legend('light');
      const helper = legend('light');
      const victim = legend('dark');
      hit(helper, victim);
      endTick();
      runTo(WINDOW_TICKS + 1);

      kill(killer, victim);
      endTick();

      expect(rowOf(helper)).toMatchObject({ assists: 0, score: 0 });
    });

    it('gives the killer the kill and no assist for its own earlier hits', () => {
      const { legend, hit, kill, endTick, rowOf } = setUp();
      const killer = legend('light');
      const victim = legend('dark');
      hit(killer, victim);
      endTick();

      kill(killer, victim);
      endTick();

      expect(rowOf(killer)).toMatchObject({ kills: 1, assists: 0, score: 15 });
    });

    it.each<[string, (mob: EntityId) => EntityId | null]>([
      ['a minion', (mob) => mob],
      ['the environment', () => null],
    ])('gives no kill for a last hit by %s, but the assists still count', (_, lastHitter) => {
      const { state, spawn, legend, hit, kill, endTick, rowOf } = setUp();
      const helper = legend('light');
      const victim = legend('dark');
      const minion = spawn('mob', 'light-mob', 'light');
      hit(helper, victim);

      kill(lastHitter(minion), victim);
      endTick();

      expect(rowOf(helper)).toMatchObject({ kills: 0, assists: 1, score: 7 });
      expect(rowOf(victim)).toMatchObject({ deaths: 1 });
      expect(state.match.scoring.teams.light.score).toBe(7);
    });

    it('gives assists only for Legend victims, not for mobs', () => {
      const { spawn, legend, hit, kill, endTick, rowOf } = setUp();
      const killer = legend('light');
      const helper = legend('light');
      const mob = spawn('mob', 'heavy-mob', 'dark');
      hit(helper, mob);

      kill(killer, mob);
      endTick();

      expect(rowOf(helper)).toMatchObject({ assists: 0, score: 0 });
      expect(rowOf(killer)).toMatchObject({ minionKills: 1, score: 12 });
    });

    it('keeps one recent hit per Legend and victim, at its latest tick, and forgets them at the death', () => {
      const { state, legend, hit, kill, endTick } = setUp();
      const killer = legend('light');
      const helper = legend('light');
      const victim = legend('dark');
      hit(helper, victim);
      endTick();
      hit(helper, victim);
      endTick();

      expect(state.match.scoring.recentHits).toEqual([
        { victimId: victim, legendId: helper, tick: 1 },
      ]);

      kill(killer, victim);
      endTick();

      expect(state.match.scoring.recentHits).toEqual([]);
    });

    it('gives no kill for a self-kill and no assist for hits on itself (O5)', () => {
      // `FriendlyFireStep` still blocks self-damage, which the owner ruled must get through (a wall
      // breach, FR-026), so the hits are announced as the pipeline will announce them.
      const { state, legend, kill, endTick, rowOf } = setUp();
      const enemy = legend('dark');
      const reckless = legend('light');
      const clumsy = legend('light');
      const own = (entityId: EntityId) =>
        ({ attackerId: entityId, kind: 'weapon', definitionId: 'test' }) as const;
      state.events.emit('damage-applied', {
        targetId: clumsy,
        amount: 10,
        absorbed: 0,
        source: own(clumsy),
      });
      state.events.emit('entity-died', { entityId: reckless, killer: own(reckless) });
      kill(enemy, clumsy);
      endTick();

      expect(rowOf(reckless)).toMatchObject({ kills: 0, deaths: 1, score: 0 });
      expect(rowOf(clumsy)).toMatchObject({ assists: 0, deaths: 1, score: 0 });
      expect(rowOf(enemy)).toMatchObject({ kills: 1, score: 15 });
    });

    it('gives nothing for a hit on its own side that friendly fire missed (O5)', () => {
      const { state, spawn, legend, hit, kill, endTick, rowOf } = setUp();
      const shooter = legend('light');
      const enemy = legend('dark');
      const ally = legend('light');
      const hurtAlly = legend('light');
      const minion = spawn('mob', 'light-mob', 'light');
      const tower = spawn('structure', 'tower', 'light', 500);
      state.entities.remove(shooter, 'despawned');

      kill(shooter, ally);
      hit(shooter, hurtAlly);
      kill(enemy, hurtAlly);
      kill(shooter, minion);
      hit(shooter, tower, 30);
      endTick();

      expect(rowOf(shooter)).toMatchObject({
        kills: 0,
        assists: 0,
        minionKills: 0,
        structureDamage: 0,
        score: 0,
      });
      expect(state.match.scoring.teams.light.score).toBe(0);
    });
  });

  describe('mobs, bosses and structures', () => {
    it.each<[string, number]>([
      ['light-mob', 1],
      ['medium-mob', 4],
      ['heavy-mob', 12],
    ])('scores a Host %s kill as a minion kill worth %d (DEC-79)', (kind, points) => {
      const { state, spawn, legend, kill, endTick, rowOf } = setUp();
      const killer = legend('light');

      kill(killer, spawn('mob', kind, 'dark'));
      endTick();

      expect(rowOf(killer)).toMatchObject({ minionKills: 1, neutralKills: 0, score: points });
      expect(state.match.scoring.teams.light.score).toBe(points);
    });

    it.each<[string, (minion: EntityId) => EntityId | null]>([
      ['a minion', (minion) => minion],
      ['the environment', () => null],
    ])('gives no points for a mob that %s kills', (_, lastHitter) => {
      const { state, spawn, legend, hit, kill, endTick, rowOf } = setUp();
      const legendId = legend('light');
      const target = spawn('mob', 'heavy-mob', 'dark');
      const minion = spawn('mob', 'light-mob', 'light');
      hit(legendId, target);

      kill(lastHitter(minion), target);
      endTick();

      expect(rowOf(legendId)).toEqual({ ...EMPTY_ROW, entityId: legendId, team: 'light' });
      expect(state.match.scoring.teams.light.score).toBe(0);
    });

    it('counts a neutral mob as a neutral kill, scored by its kind', () => {
      const { spawn, legend, kill, endTick, rowOf } = setUp();
      const killer = legend('dark');

      kill(killer, spawn('mob', 'medium-mob', 'neutral'));
      endTick();

      expect(rowOf(killer)).toMatchObject({ neutralKills: 1, minionKills: 0, score: 4 });
    });

    it.each<[string, string, Team]>([
      ['boss', 'heavy-mob', 'neutral'],
      ['sovereign', 'monarch', 'dark'],
    ])('gives no points or counters for killing a %s', (family, kind, team) => {
      const { state, spawn, legend, kill, endTick, rowOf } = setUp();
      const killer = legend('light');

      kill(killer, spawn(family, kind, team));
      endTick();

      expect(rowOf(killer)).toEqual({ ...EMPTY_ROW, entityId: killer, team: 'light' });
      expect(state.match.scoring.teams.light.score).toBe(0);
    });

    it("counts a Legend's damage to a structure as structureDamage, with no points", () => {
      const { state, spawn, legend, hit, endTick, rowOf } = setUp();
      const legendId = legend('light');
      const minion = spawn('mob', 'light-mob', 'light');
      const tower = spawn('structure', 'tower', 'dark', 500);

      hit(legendId, tower, 30);
      hit(legendId, tower, 20);
      hit(minion, tower, 40);
      endTick();

      expect(rowOf(legendId)).toMatchObject({ structureDamage: 50, score: 0 });
      expect(state.match.scoring.recentHits).toEqual([]);
    });

    it("counts the damage a structure's shield bars absorb as structureDamage too (DEC-123)", () => {
      const { state, spawn, legend, hit, endTick, rowOf } = setUp();
      const legendId = legend('light');
      const tower = spawn('structure', 'tower', 'dark', 500);
      state.entities.get(tower)?.findComponent(Health)?.addShield('buff-tower', 25);

      hit(legendId, tower, 30);
      endTick();

      expect(rowOf(legendId)).toMatchObject({ structureDamage: 30, score: 0 });
    });
  });

  it("makes each team's total the sum of its Legends' scores", () => {
    const { state, spawn, legend, hit, kill, endTick } = setUp();
    const lightKiller = legend('light');
    const lightHelper = legend('light');
    const darkVictim = legend('dark');
    const darkFarmer = legend('dark');
    hit(lightHelper, darkVictim);
    kill(lightKiller, darkVictim);
    kill(lightHelper, spawn('mob', 'heavy-mob', 'dark'));
    kill(darkFarmer, spawn('mob', 'medium-mob', 'light'));
    endTick();

    const sumOf = (team: Team) =>
      state.match.scoring.legends
        .filter((row) => row.team === team)
        .reduce((sum, row) => sum + row.score, 0);
    expect(state.match.scoring.teams).toEqual({ light: { score: 34 }, dark: { score: 4 } });
    expect(state.match.scoring.teams.light.score).toBe(sumOf('light'));
    expect(state.match.scoring.teams.dark.score).toBe(sumOf('dark'));
  });

  it('ignores a death announced for an entity that is not in the store', () => {
    const { state, legend, endTick } = setUp();
    const killer = legend('light');
    endTick();

    state.events.emit('entity-died', {
      entityId: 'entity-99',
      killer: { attackerId: killer, kind: 'weapon', definitionId: 'test' },
    });
    endTick();

    expect(state.match.scoring.legends).toEqual([
      { ...EMPTY_ROW, entityId: killer, team: 'light' },
    ]);
  });

  it('counts nothing once the match has a result', () => {
    const { state, legend, kill, endTick, rowOf } = setUp();
    const killer = legend('light');
    const victim = legend('dark');
    endTick();
    state.match.result = {
      winner: 'light',
      condition: 'objective-lost',
      playerTeam: 'light',
      hadHuman: false,
      durationTicks: 1,
      seed: 1,
      configHash: 0,
      legends: [],
      teams: { light: { score: 0 }, dark: { score: 0 } },
      finalHash: 0,
    };
    const late = legend('light');

    kill(killer, victim);
    endTick();

    expect(rowOf(killer)).toMatchObject({ kills: 0, score: 0 });
    expect(rowOf(late)).toBeUndefined();
  });
});
