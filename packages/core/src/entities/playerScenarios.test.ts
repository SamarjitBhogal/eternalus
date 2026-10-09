/**
 * Player scenarios: what a player sees and does, played through the real entity layer.
 *
 * The systems (`MovementSystem`, `DeathSystem`, ability effects) arrive with session B's kernel,
 * so the small helpers below do exactly what those systems will do, through the same component
 * methods. When the systems land, these scenarios move onto them unchanged in intent.
 */
import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { LEGEND_CLASSES } from '../content/legends/legendCatalogue';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import { createDefaultEntityRegistry } from './defaultEntityRegistry';
import type { Entity } from './Entity';
import { EntityFactory } from './EntityFactory';

const EAST: Vec2 = { x: 1, y: 0 };

/** The shipped unit definitions as the simulation loads them (speeds per tick at 30 ticks/s). */
const UNIT_DEFINITIONS = loadDefaultContent(createDefaultGameConfig().tickRate);

/** Spawns `definitionId` the way a spawn command will: by the definition's kind. */
const spawnUnit = (
  factory: EntityFactory,
  definitionId: string,
  team: Team,
  position: Vec2 = { x: 0, y: 0 },
): Entity => {
  const definition = UNIT_DEFINITIONS.get(definitionId);
  return factory.create(definition.kind, definitionId, { position, team });
};

/** One tick of movement toward `direction`, as `MovementSystem` will do it. */
const stepToward = (unit: Entity, direction: Vec2): void => {
  const movement = unit.getComponent(Movement);
  movement.accelerateToward(direction);
  unit.getComponent(Transform).moveBy(movement.velocity);
};

/** Ticks a unit needs to run `metres` east from a standstill. */
const ticksToRun = (unit: Entity, metres: number): number => {
  const start = unit.getComponent(Transform).position.x;
  let ticks = 0;

  while (unit.getComponent(Transform).position.x - start < metres) {
    stepToward(unit, EAST);
    ticks += 1;
  }

  return ticks;
};

describe('Player scenarios', () => {
  describe('choosing a Legend on character select', () => {
    it('shows Warrior, Sentinel and Magus, in that order, each with a one-line role', () => {
      const cards = LEGEND_CLASSES.all().map((legend) => ({
        name: legend.displayName,
        hasRole: legend.roleBlurb.length > 0,
      }));

      expect(cards).toEqual([
        { name: 'Warrior', hasRole: true },
        { name: 'Sentinel', hasRole: true },
        { name: 'Magus', hasRole: true },
      ]);
    });

    it('lets the player spawn whichever class they pick', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);

      for (const legend of LEGEND_CLASSES.all()) {
        const spawned = spawnUnit(factory, legend.id, 'light');

        expect(spawned.kind).toBe(legend.kind);
        expect(spawned.family).toBe('legend');
      }
    });
  });

  describe('entering the match', () => {
    it('spawns the player at their capital with full health, on their team', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
      const capital = { x: 85, y: 450 };

      const player = spawnUnit(factory, 'warrior', 'dark', capital);

      expect(player.getComponent(Transform).position).toEqual(capital);
      expect(player.getComponent(Health).current).toBe(LEGEND_CLASSES.get('warrior').baseHealth);
      expect(player.getComponent(Movement).speed).toBe(0);
      expect(player.getComponent(TeamMembership).team).toBe('dark');
    });

    it('treats teammates as allies, the other team and neutral camps as enemies', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
      const player = spawnUnit(factory, 'magus', 'light').getComponent(TeamMembership);

      const teammate = spawnUnit(factory, 'sentinel', 'light').getComponent(TeamMembership);
      const enemy = spawnUnit(factory, 'warrior', 'dark').getComponent(TeamMembership);
      const campMob = spawnUnit(factory, 'training-dummy', 'neutral').getComponent(TeamMembership);

      expect(player.isAlly(teammate)).toBe(true);
      expect(player.isEnemy(enemy)).toBe(true);
      expect(player.isEnemy(campMob)).toBe(true);
    });
  });

  describe('moving around the map', () => {
    it('lets a Warrior win a short sprint and a Sentinel win a long run', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
      const sprint = (id: string, metres: number): number =>
        ticksToRun(spawnUnit(factory, id, 'light'), metres);

      expect(sprint('warrior', 20)).toBeLessThan(sprint('sentinel', 20));
      expect(sprint('sentinel', 1000)).toBeLessThan(sprint('warrior', 1000));
    });

    it('never lets a Legend go faster than its top speed, however long it runs', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
      const sentinel = spawnUnit(factory, 'sentinel', 'dark');

      for (let tick = 0; tick < 3000; tick += 1) {
        stepToward(sentinel, EAST);
      }

      expect(sentinel.getComponent(Movement).speed).toBe(
        UNIT_DEFINITIONS.get('sentinel').movement.maxSpeed,
      );
    });

    it('stops the player at once when they let go of the keys', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
      const player = spawnUnit(factory, 'warrior', 'light');
      stepToward(player, EAST);
      stepToward(player, EAST);
      const stoppedAt = player.getComponent(Transform).position;

      stepToward(player, { x: 0, y: 0 });

      expect(player.getComponent(Movement).speed).toBe(0);
      expect(player.getComponent(Transform).position).toEqual(stoppedAt);
    });

    it('moves the same way on every run (deterministic)', () => {
      const run = (): Vec2 => {
        const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
        const player = spawnUnit(factory, 'magus', 'light');

        for (let tick = 0; tick < 90; tick += 1) {
          stepToward(player, tick < 45 ? EAST : { x: 1, y: 1 });
        }

        return player.getComponent(Transform).position;
      };

      expect(run()).toEqual(run());
    });
  });

  describe('fighting', () => {
    it('kills a Legend when damage reaches its base health and reports the overkill', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
      const warrior = spawnUnit(factory, 'warrior', 'light');
      const health = warrior.getComponent(Health);

      health.applyDamage(LEGEND_CLASSES.get('warrior').baseHealth - 1);
      expect(health.isDead).toBe(false);

      expect(health.applyDamage(10)).toEqual({ toShields: 0, toBase: 1, overflow: 9 });
      expect(health.isDead).toBe(true);
    });

    it('removes a dead unit only with a cause, and it keeps nothing afterwards', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
      const mob = spawnUnit(factory, 'training-dummy', 'dark');
      mob.getComponent(Health).applyDamage(1000);

      expect(() => {
        mob.retire('');
      }).toThrow('requires a removal cause');
      mob.retire('killed');

      expect(mob.hasComponent(Health)).toBe(false);
      expect(mob.hasComponent(Transform)).toBe(false);
    });

    it('lets a Magus revive a fallen enemy mob to fight for the Magus team', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
      const magus = spawnUnit(factory, 'magus', 'light');
      const fallen = spawnUnit(factory, 'training-dummy', 'dark');
      fallen.getComponent(Health).applyDamage(1000);

      const reviveHealth = fallen.getComponent(Health).max;
      fallen.getComponent(Health).heal(reviveHealth);
      const previousTeam = fallen
        .getComponent(TeamMembership)
        .setTeam(magus.getComponent(TeamMembership).team);

      expect(previousTeam).toBe('dark');
      expect(fallen.getComponent(Health).isDead).toBe(false);
      expect(fallen.getComponent(TeamMembership).isAlly(magus.getComponent(TeamMembership))).toBe(
        true,
      );
    });
  });

  describe('a horde leaving the spawner', () => {
    it('spawns 16 light mobs (training dummies) with unique ids, all on the spawner team', () => {
      const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);

      const horde = Array.from({ length: 16 }, () => spawnUnit(factory, 'training-dummy', 'dark'));

      expect(new Set(horde.map((mob) => mob.id)).size).toBe(16);
      expect(horde.every((mob) => mob.getComponent(TeamMembership).team === 'dark')).toBe(true);
    });

    it('gives the same ids on every replay of the same spawns', () => {
      const ids = (): string[] => {
        const factory = new EntityFactory(createDefaultEntityRegistry(), UNIT_DEFINITIONS);
        return Array.from({ length: 4 }, () => spawnUnit(factory, 'training-dummy', 'light').id);
      };

      expect(ids()).toEqual(ids());
      expect(ids()).toEqual(['entity-1', 'entity-2', 'entity-3', 'entity-4']);
    });
  });
});
