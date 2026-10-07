import { describe, expect, it } from 'vitest';

import { Health } from '../components/Health';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { FeatureOwner } from '../content/maps/maps.types';
import { Entity } from '../entities/Entity';
import { Simulation } from '../Simulation';
import type { System, SystemContext } from '../systems/System.types';
import type { Vec2 } from '../utils/geometry.types';
import { IdGenerator } from '../utils/IdGenerator';
import { SeededRandom } from '../utils/SeededRandom';
import { WANDER_SEED_7 } from './__fixtures__/wanderSeed7.replay';
import { NullLogger } from './NullLogger';
import { randomCommand } from './randomCommands';
import { recordReplay, runReplay } from './replay';
import type { Replay, ReplayTarget, ReplayTargetFactory } from './Replay.types';

const MAX_WALKERS = 64;
const SPAWN_CHANCE = 0.2;

class Walker extends Entity {
  public readonly kind = 'walker';
  public readonly family = 'test';

  protected installComponents(context: unknown): void {
    const { position, team } = context as { position: Vec2; team: FeatureOwner };
    this.addComponent(new Transform(position, 0.5));
    this.addComponent(new Health(100));
    this.addComponent(new TeamMembership(team));
  }
}

/** Spawns walkers now and then and jitters every entity, drawing only from the state's RNG. */
class WanderSystem implements System {
  public readonly name = 'wander';
  private readonly ids = new IdGenerator();

  public update({ state }: SystemContext): void {
    const { rng } = state;
    if (state.entities.size < MAX_WALKERS && rng.nextFloat() < SPAWN_CHANCE) {
      const walker = new Walker(`walker-${String(this.ids.next())}`, 'walker');
      walker.spawn({
        position: { x: rng.nextFloat() * 100, y: rng.nextFloat() * 100 },
        team: rng.nextFloat() < 0.5 ? 'light' : 'dark',
      });
      state.entities.add(walker);
    }
    state.entities.forEach((entity) => {
      entity
        .findComponent(Transform)
        ?.moveBy({ x: rng.nextFloat() - 0.5, y: rng.nextFloat() - 0.5 });
    });
  }
}

const createTarget: ReplayTargetFactory = (config, seed) =>
  new Simulation(config, seed, new NullLogger(), [new WanderSystem()]);

const recordRandomMatch = (seed: number, ticks: number, commandEvery: number): Replay => {
  const commandRng = new SeededRandom(seed).fork('commands');
  return recordReplay(
    {
      config: createDefaultGameConfig(),
      seed,
      ticks,
      checkpointEvery: 100,
      commandsFor: (tick, snapshot) =>
        tick % commandEvery === 0 ? [randomCommand(commandRng, snapshot, ['walker'])] : [],
    },
    createTarget,
  );
};

describe('replay', () => {
  it('reproduces 10 seeds x 3,000 ticks of random commands, identical at every checkpoint', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      const first = recordRandomMatch(seed, 3000, 3);
      const second = recordRandomMatch(seed, 3000, 3);
      expect(second).toEqual(first);
      expect(first.checkpoints).toHaveLength(31);
      let replayed: ReplayTarget | undefined;
      const outcome = runReplay(first, (config, matchSeed) => {
        replayed = createTarget(config, matchSeed);
        return replayed;
      });
      expect(outcome.firstDivergence).toBeNull();
      expect(outcome.finalHash).toBe(first.checkpoints.at(-1)?.hash);
      expect(replayed?.snapshot().entities.length).toBeGreaterThan(MAX_WALKERS / 2);
    }
  });

  it('gives different seeds different matches', () => {
    expect(recordRandomMatch(1, 300, 3).checkpoints.at(-1)).not.toEqual(
      recordRandomMatch(2, 300, 3).checkpoints.at(-1),
    );
  });

  it('reports the first checkpoint that diverges', () => {
    const replay = recordRandomMatch(3, 300, 3);
    const tampered: Replay = {
      ...replay,
      checkpoints: replay.checkpoints.map((checkpoint) =>
        checkpoint.tick === 200 ? { ...checkpoint, hash: checkpoint.hash ^ 1 } : checkpoint,
      ),
    };
    const outcome = runReplay(tampered, createTarget);
    expect(outcome.firstDivergence?.tick).toBe(200);
    expect(outcome.firstDivergence?.actual).toBe(replay.checkpoints[2]?.hash);
  });

  it('notices a missing command', () => {
    const replay = recordReplay(
      {
        config: createDefaultGameConfig(),
        seed: 4,
        ticks: 300,
        checkpointEvery: 100,
        commandsFor: (tick, snapshot) => {
          const [first] = snapshot.entities;
          return tick === 150 && first !== undefined
            ? [{ type: 'dev-remove-entity', entityId: first.id }]
            : [];
        },
      },
      createTarget,
    );
    expect(replay.commands).toHaveLength(1);
    const outcome = runReplay({ ...replay, commands: [] }, createTarget);
    expect(outcome.firstDivergence?.tick).toBe(200);
  });

  it('still reproduces the committed wander-seed-7 fixture', () => {
    const outcome = runReplay(WANDER_SEED_7, createTarget);
    expect(outcome.firstDivergence).toBeNull();
    expect(outcome.finalHash).toBe(WANDER_SEED_7.checkpoints.at(-1)?.hash);
  });
});
