import { describe, expect, it } from 'vitest';

import { Capturable } from '../components/Capturable';
import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { CapturePointsConfig } from '../config/GameConfig.types';
import { loadDefaultContent } from '../content/loadDefaultContent';
import type { ProjectileDefinition } from '../content/projectiles/projectiles.types';
import { loadWeapons } from '../content/weapons/loadWeapons';
import { CATHEDRAL_CAPTURE_POINT } from '../content/zones/cathedralCapturePoint';
import { NullLogger } from '../diagnostics/NullLogger';
import { createDefaultEntityRegistry } from '../entities/defaultEntityRegistry';
import { Entity } from '../entities/Entity';
import { EntityFactory } from '../entities/EntityFactory';
import { Projectile } from '../entities/Projectile';
import { CapturePoint } from '../entities/zones/CapturePoint';
import type { GameEventMap } from '../state/GameEvents.types';
import { GameState } from '../state/GameState';
import type { Team } from '../teams/teams.types';
import { CaptureSystem } from './CaptureSystem';

/** The shipped rate: 30 ticks per second, so tick-rate bugs show (F11b). */
const TICK_RATE = 30;
/** Tuning picked so the numbers read easily: 360 ticks to capture at margin 1, 600 to revert. */
const RULES: CapturePointsConfig = {
  checkpoints: 3,
  captureSeconds: 12,
  revertSeconds: 20,
  maxMargin: 3,
  weights: { legend: 10, unit: 1 },
};
const PER_TICK = 1 / (RULES.captureSeconds * TICK_RATE);
const REVERT_PER_TICK = 1 / (RULES.revertSeconds * TICK_RATE);
const CENTER = { x: 800, y: 450 };
const OUTSIDE = { x: 0, y: 0 };
/** Half the side of the test zone: a 70 x 70 square floor around `CENTER`. */
const HALF = 35;
const AREA = [
  [
    { x: CENTER.x - HALF, y: CENTER.y - HALF },
    { x: CENTER.x + HALF, y: CENTER.y - HALF },
    { x: CENTER.x + HALF, y: CENTER.y + HALF },
    { x: CENTER.x - HALF, y: CENTER.y + HALF },
  ],
];
const logger = new NullLogger();

/** Stands in for a structure: on a team, with a position, but not a `Unit`. */
class Tower extends Entity {
  public readonly kind = 'tower';
  public readonly family = 'structure';

  protected installComponents(): void {
    this.addComponent(new Transform(CENTER, 14));
    this.addComponent(new TeamMembership('light'));
  }
}

const BOLT: ProjectileDefinition = {
  id: 'fake-bolt',
  kind: 'projectile',
  displayName: 'Fake Bolt',
  footprintRadius: 0.15,
  movementProfile: { maxSpeed: 2, acceleration: 2, mass: 0.05 },
};

type CaptureEvent =
  | { readonly type: 'capture-progress'; readonly payload: GameEventMap['capture-progress'] }
  | {
      readonly type: 'capture-point-owner-changed';
      readonly payload: GameEventMap['capture-point-owner-changed'];
    };

const setUp = (rules: CapturePointsConfig = RULES) => {
  const state = new GameState(createDefaultGameConfig(), 1);
  const factory = new EntityFactory(
    createDefaultEntityRegistry(),
    loadDefaultContent(TICK_RATE),
    undefined,
    loadWeapons(TICK_RATE),
  );
  const point = new CapturePoint('zone-1', CATHEDRAL_CAPTURE_POINT.id);
  point.spawn({
    definition: CATHEDRAL_CAPTURE_POINT,
    position: CENTER,
    team: 'neutral',
    area: AREA,
  });
  state.entities.add(point);
  const zone = point.getComponent(Capturable);
  const system = new CaptureSystem(rules, TICK_RATE, []);
  const events: CaptureEvent[] = [];
  state.events.on('capture-progress', (payload) => {
    events.push({ type: 'capture-progress', payload });
  });
  state.events.on('capture-point-owner-changed', (payload) => {
    events.push({ type: 'capture-point-owner-changed', payload });
  });
  const reached: GameEventMap['checkpoint-reached'][] = [];
  state.events.on('checkpoint-reached', (payload) => {
    reached.push(payload);
  });

  const add = (definitionId: string, team: Team, at = CENTER): Entity => {
    const kind = definitionId === 'warrior' ? 'warrior' : 'light-mob';
    const entity = factory.create(kind, definitionId, { position: at, team });
    state.entities.add(entity);
    return entity;
  };
  const legend = (team: Team) => add('warrior', team);
  const minions = (team: Team, count: number) =>
    Array.from({ length: count }, () => add('light-minion', team));
  const leave = (...entities: Entity[]) => {
    for (const entity of entities) {
      entity.getComponent(Transform).moveTo(OUTSIDE);
    }
  };
  const run = (ticks: number) => {
    for (let tick = 0; tick < ticks; tick += 1) {
      system.update({ state, logger });
    }
  };
  return { state, zone, events, reached, legend, minions, leave, run };
};

describe('CaptureSystem', () => {
  it('captures a neutral zone, passing each checkpoint before the owner changes', () => {
    const { zone, events, legend, run } = setUp();
    legend('light');

    // A Legend weighs 10, but the margin is capped at 3: 360 / 3 = 120 ticks.
    run(119);
    expect(zone.owner).toBe('neutral');
    run(1);

    expect(zone.owner).toBe('light');
    expect(zone.progress).toBe(1);
    expect(
      events.map(({ type, payload }) => [type, 'checkpoint' in payload && payload.checkpoint]),
    ).toEqual([
      ['capture-progress', 1],
      ['capture-progress', 2],
      ['capture-progress', 3],
      ['capture-point-owner-changed', false],
    ]);
    expect(events.at(-1)?.payload).toEqual({ pointId: 'zone-1', from: 'neutral', to: 'light' });
  });

  it('takes an enemy zone by draining it to 0 first; the owner keeps it until the capture ends', () => {
    const { zone, events, legend, leave, run } = setUp();
    const light = legend('light');
    run(120);
    leave(light);
    legend('dark');
    events.length = 0;

    // From +1 to -1 is twice as far: 240 ticks at margin 3.
    run(120);
    expect(zone.progress).toBe(0);
    expect(zone.owner).toBe('light');
    run(119);
    expect(zone.owner).toBe('light');
    run(1);

    expect(zone.owner).toBe('dark');
    expect(zone.progress).toBe(-1);
    expect(
      events.map(({ type, payload }) =>
        type === 'capture-progress' ? `${payload.team} ${String(payload.checkpoint)}` : type,
      ),
    ).toEqual([
      'light 2',
      'light 1',
      'light 0',
      'dark 1',
      'dark 2',
      'dark 3',
      'capture-point-owner-changed',
    ]);
    expect(events.at(-1)?.payload).toEqual({ pointId: 'zone-1', from: 'light', to: 'dark' });
  });

  it('announces checkpoint-reached 1 to 3 in order for the capturing side, never on a drain or a revert', () => {
    const { zone, reached, legend, minions, leave, run } = setUp();
    const light = legend('light');
    run(120);
    leave(light);
    const dark = legend('dark');
    // 240 ticks at margin 3: Light's 3, 2, 1 drain away (no event), then Dark reaches 1, 2, 3.
    run(240);
    leave(dark);
    const drainer = minions('light', 1);
    // 180 ticks at margin 1 drain Dark's zone to -0.5 (checkpoint 1).
    run(180);
    leave(...drainer);
    // Nobody inside: it reverts to Dark's -1 and passes checkpoints 2 and 3 on its own.
    run(300);

    expect(zone.progress).toBe(-1);
    expect(reached).toEqual(
      [
        ['light', 1],
        ['light', 2],
        ['light', 3],
        ['dark', 1],
        ['dark', 2],
        ['dark', 3],
      ].map(([team, checkpoint]) => ({ pointId: 'zone-1', team, checkpoint })),
    );
  });

  it('reaches each checkpoint once per side until the zone changes owner (DEC-145 (g))', () => {
    const { zone, reached, legend, leave, run } = setUp();
    const seen = () => reached.map(({ team, checkpoint }) => `${team} ${String(checkpoint)}`);
    // A Legend moves the progress 1/120 a tick (margin capped at 3).
    const firstLight = legend('light');
    run(80);
    expect(seen()).toEqual(['light 1', 'light 2']);
    leave(firstLight);
    run(400);
    expect(zone.progress).toBe(0);
    // Light pushes again from neutral: 1 and 2 were reached already, so only 3 fires.
    const light = legend('light');
    run(120);
    expect(zone.owner).toBe('light');
    expect(seen()).toEqual(['light 1', 'light 2', 'light 3']);
    leave(light);
    // Dark, 200 ticks: +1 drains to -2/3, Dark's checkpoint 2.
    const dark = legend('dark');
    run(200);
    expect(seen().slice(3)).toEqual(['dark 1', 'dark 2']);
    leave(dark);
    // The owner pushes its own zone back to -1/3: an owner reaches nothing.
    const owner = legend('light');
    run(40);
    expect(zone.checkpoint).toBe(1);
    leave(owner);
    // Dark again: past 2 (reached) to 3, and the capture completes.
    legend('dark');
    run(80);

    expect(zone.owner).toBe('dark');
    expect(seen()).toEqual(['light 1', 'light 2', 'light 3', 'dark 1', 'dark 2', 'dark 3']);
  });

  it('announces every checkpoint one step passes, also a step that crosses 0 from the other side', () => {
    // A fast tuning the validator accepts: 9 ticks at margin 1, so a lone Legend steps 10/9.
    const { zone, reached, legend, minions, leave, run } = setUp({
      ...RULES,
      captureSeconds: 0.3,
      maxMargin: 10,
    });
    const seen = () => reached.map(({ team, checkpoint }) => `${team} ${String(checkpoint)}`);
    const dark = minions('dark', 1);
    run(4);
    expect(zone.progress).toBeCloseTo(-4 / 9, 9);
    leave(...dark);
    legend('light');
    run(1);
    // -4/9 + 10/9 = +2/3: one step leaves Dark's checkpoint 1 and passes Light's 1 and 2.
    expect(zone.progress).toBeCloseTo(2 / 3, 9);
    expect(seen()).toEqual(['dark 1', 'light 1', 'light 2']);
  });

  it("publishes each side's summed weight inside as the zone's presence, every tick", () => {
    const { zone, legend, minions, leave, run } = setUp();
    const inside = [legend('light'), ...minions('dark', 2), ...minions('neutral', 1)];

    run(1);
    expect(zone.presence).toEqual({ light: 10, dark: 2, neutral: 1 });
    leave(...inside);
    run(1);
    expect(zone.presence).toEqual({ light: 0, dark: 0, neutral: 0 });
  });

  it('pauses on a tie between the two heaviest sides', () => {
    const { zone, legend, minions, leave, run } = setUp();
    const starter = minions('light', 1);
    run(60);
    const before = zone.progress;
    leave(...starter);
    legend('light');
    legend('dark');
    minions('neutral', 3);

    run(90);

    expect(zone.progress).toBe(before);
    expect(zone.owner).toBe('neutral');
  });

  it('captures faster with a larger margin, up to maxMargin (a cap that changes the result)', () => {
    const progressAfter30Ticks = (light: number, dark: number): number => {
      const { zone, minions, run } = setUp();
      minions('light', light);
      minions('dark', dark);
      run(30);
      return zone.progress;
    };

    expect(progressAfter30Ticks(1, 0)).toBeCloseTo(30 * PER_TICK, 12);
    expect(progressAfter30Ticks(2, 0)).toBeCloseTo(60 * PER_TICK, 12);
    expect(progressAfter30Ticks(4, 2)).toBeCloseTo(60 * PER_TICK, 12);
    expect(progressAfter30Ticks(3, 0)).toBeCloseTo(90 * PER_TICK, 12);
    // Margin 5 is capped at 3: no faster than margin 3, so the cap is what limits it.
    expect(progressAfter30Ticks(5, 0)).toBeCloseTo(90 * PER_TICK, 12);
    expect(progressAfter30Ticks(5, 0)).toBeLessThan(150 * PER_TICK);
  });

  it('weighs a Legend as 10 units: one Legend beats 8 enemy minions at margin 2', () => {
    const { zone, legend, minions, run } = setUp();
    legend('light');
    minions('dark', 8);

    run(30);

    expect(zone.progress).toBeCloseTo(60 * PER_TICK, 12);
  });

  it('lets neutral units retake an owned zone back to neutral', () => {
    const { zone, events, legend, minions, leave, run } = setUp();
    const light = legend('light');
    run(120);
    leave(light);
    minions('neutral', 1);
    events.length = 0;

    run(359);
    expect(zone.owner).toBe('light');
    run(1);

    expect(zone.progress).toBe(0);
    expect(zone.owner).toBe('neutral');
    expect(events.at(-1)?.payload).toEqual({ pointId: 'zone-1', from: 'light', to: 'neutral' });
  });

  it('reverts an unfinished capture to the last locking state when nobody is inside', () => {
    const { zone, events, minions, leave, run } = setUp();
    const light = minions('light', 1);
    run(60);
    leave(...light);

    // 60 ticks of capture is 1/6; reverting at 1/600 per tick takes 100 ticks.
    run(99);
    expect(zone.progress).toBeCloseTo(1 / 6 - 99 * REVERT_PER_TICK, 12);
    run(1);

    expect(zone.progress).toBe(0);
    expect(zone.owner).toBe('neutral');
    expect(events.some(({ type }) => type === 'capture-point-owner-changed')).toBe(false);
  });

  it('refills a partly taken zone toward its owner, and an empty owned zone stays owned', () => {
    const { zone, legend, minions, leave, run } = setUp();
    const light = legend('light');
    run(120);
    leave(light);
    const dark = minions('dark', 3);
    // 144 ticks at margin 3 drains 1.2: past 0 to -0.2, still Light's zone.
    run(144);
    expect(zone.progress).toBeCloseTo(-0.2, 12);
    expect(zone.owner).toBe('light');
    leave(...dark);

    run(720);

    expect(zone.progress).toBe(1);
    expect(zone.owner).toBe('light');
    run(1000);
    expect(zone.progress).toBe(1);
    expect(zone.owner).toBe('light');
  });

  it('never counts a dead Legend still in the store (respawn keeps them)', () => {
    const { zone, legend, run } = setUp();
    const dead = legend('dark').getComponent(Health);
    dead.applyDamage(dead.total);

    run(120);

    expect(zone.progress).toBe(0);
  });

  it('never counts a structure standing in the zone', () => {
    const { state, zone, run } = setUp();
    const tower = new Tower('tower-1', 'tower');
    tower.spawn({});
    state.entities.add(tower);

    run(600);

    expect(zone.progress).toBe(0);
    expect(zone.owner).toBe('neutral');
  });

  it('never counts a projectile flying through the zone', () => {
    const { state, zone, run } = setUp();
    const bolt = new Projectile('bolt-1', BOLT.id);
    bolt.spawn({ definition: BOLT, position: CENTER, team: 'dark' });
    state.entities.add(bolt);

    run(600);

    expect(zone.progress).toBe(0);
    expect(zone.owner).toBe('neutral');
  });

  it("counts a unit whose centre is just inside the area's corner and not one just outside", () => {
    const { zone, run, state } = setUp();
    const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(TICK_RATE));
    // The corner is 49.5 from the centre: outside any circle of the old radius 35.
    for (const at of [
      { x: CENTER.x + HALF - 0.01, y: CENTER.y + HALF - 0.01 },
      { x: CENTER.x, y: CENTER.y - HALF - 0.01 },
    ]) {
      state.entities.add(
        factory.create('light-mob', 'light-minion', { position: at, team: 'dark' }),
      );
    }

    run(30);

    expect(zone.progress).toBeCloseTo(-30 * PER_TICK, 12);
  });

  it('turns authored seconds into ticks with the match tick rate', () => {
    const slow = setUp({ ...RULES, captureSeconds: 24 });
    slow.minions('light', 1);

    slow.run(30);

    expect(slow.zone.progress).toBeCloseTo(30 / (24 * TICK_RATE), 12);
  });
});
