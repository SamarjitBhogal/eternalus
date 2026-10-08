import type { Replay } from '../Replay.types';

/**
 * Golden replay: seed 7, the default config of 2026-10-06, `WanderSystem` (see `replay.test.ts`)
 * and one random command every 10 ticks for 300 ticks. If it stops reproducing, either a
 * determinism bug crept in or the rules changed on purpose; only the second may regenerate it.
 */
export const WANDER_SEED_7: Replay = {
  seed: 7,
  config: {
    tickRate: 30,
    map: {
      numLanes: 3,
      spawnTowersPerLane: 1,
      buffTowersPerLane: 1,
      campsPerSide: 6,
      cornerCamps: 4,
      worldWidth: 1600,
      worldHeight: 900,
      navCellSize: 5,
      presetId: 'map-1',
    },
    match: {
      legendsPerTeam: 10,
      legendsPerLane: 3,
      countdownSeconds: 60,
      hordeSizes: {
        light: 16,
        medium: 8,
        heavy: 4,
      },
      initialHordesPerTeam: 3,
      plannedMatchSeconds: 1200,
    },
    limits: {
      maxLegendsPerTeam: 10,
      maxUnitsPerTeam: 144,
    },
  },
  commands: [
    {
      tick: 0,
      command: {
        type: 'dev-spawn',
        kind: 'walker',
        definitionId: 'training-dummy',
        team: 'dark',
        at: {
          x: -99.6116902679205,
          y: 7.535427715629339,
        },
        count: 3,
      },
    },
    {
      tick: 10,
      command: {
        type: 'dev-remove-entity',
        entityId: 'walker-3',
      },
    },
    {
      tick: 20,
      command: {
        type: 'move',
        actorId: 'walker-1',
        direction: {
          x: -85.1827887352556,
          y: 13.366135628893971,
        },
      },
    },
    {
      tick: 30,
      command: {
        type: 'dev-remove-entity',
        entityId: 'walker-4',
      },
    },
    {
      tick: 40,
      command: {
        type: 'move',
        actorId: 'walker-6',
        direction: {
          x: -45.9128619171679,
          y: -90.31420620158315,
        },
      },
    },
    {
      tick: 50,
      command: {
        type: 'dev-spawn',
        kind: 'walker',
        definitionId: 'training-dummy',
        team: 'light',
        at: {
          x: -19.018280087038875,
          y: -59.33304661884904,
        },
        count: 3,
      },
    },
    {
      tick: 60,
      command: {
        type: 'stop',
        actorId: 'walker-2',
      },
    },
    {
      tick: 70,
      command: {
        type: 'dev-remove-entity',
        entityId: 'walker-12',
      },
    },
    {
      tick: 80,
      command: {
        type: 'move',
        actorId: 'walker-11',
        direction: {
          x: 97.50000536441803,
          y: 22.170136077329516,
        },
      },
    },
    {
      tick: 90,
      command: {
        type: 'stop',
        actorId: 'walker-10',
      },
    },
    {
      tick: 100,
      command: {
        type: 'dev-spawn',
        kind: 'walker',
        definitionId: 'training-dummy',
        team: 'dark',
        at: {
          x: -92.05698324367404,
          y: -46.67278011329472,
        },
        count: 3,
      },
    },
    {
      tick: 110,
      command: {
        type: 'stop',
        actorId: 'walker-8',
      },
    },
    {
      tick: 120,
      command: {
        type: 'move',
        actorId: 'walker-14',
        direction: {
          x: -15.947651397436857,
          y: 94.03802808374166,
        },
      },
    },
    {
      tick: 130,
      command: {
        type: 'move',
        actorId: 'walker-18',
        direction: {
          x: -9.130527079105377,
          y: -21.909060887992382,
        },
      },
    },
    {
      tick: 140,
      command: {
        type: 'stop',
        actorId: 'walker-10',
      },
    },
    {
      tick: 150,
      command: {
        type: 'stop',
        actorId: 'walker-1',
      },
    },
    {
      tick: 160,
      command: {
        type: 'dev-remove-entity',
        entityId: 'walker-1',
      },
    },
    {
      tick: 170,
      command: {
        type: 'dev-remove-entity',
        entityId: 'walker-24',
      },
    },
    {
      tick: 180,
      command: {
        type: 'move',
        actorId: 'walker-11',
        direction: {
          x: -10.066089360043406,
          y: 34.47192697785795,
        },
      },
    },
    {
      tick: 190,
      command: {
        type: 'stop',
        actorId: 'walker-23',
      },
    },
    {
      tick: 200,
      command: {
        type: 'dev-remove-entity',
        entityId: 'walker-36',
      },
    },
    {
      tick: 210,
      command: {
        type: 'dev-spawn',
        kind: 'walker',
        definitionId: 'training-dummy',
        team: 'dark',
        at: {
          x: -44.79051078669727,
          y: -4.5687188394367695,
        },
        count: 2,
      },
    },
    {
      tick: 220,
      command: {
        type: 'dev-remove-entity',
        entityId: 'walker-42',
      },
    },
    {
      tick: 230,
      command: {
        type: 'dev-spawn',
        kind: 'walker',
        definitionId: 'training-dummy',
        team: 'light',
        at: {
          x: -49.71403391100466,
          y: -26.460288604721427,
        },
        count: 1,
      },
    },
    {
      tick: 240,
      command: {
        type: 'move',
        actorId: 'walker-46',
        direction: {
          x: -54.16964306496084,
          y: 96.71683120541275,
        },
      },
    },
    {
      tick: 250,
      command: {
        type: 'stop',
        actorId: 'walker-13',
      },
    },
    {
      tick: 260,
      command: {
        type: 'dev-spawn',
        kind: 'walker',
        definitionId: 'training-dummy',
        team: 'dark',
        at: {
          x: -57.90664213709533,
          y: -95.88596588000655,
        },
        count: 2,
      },
    },
    {
      tick: 270,
      command: {
        type: 'dev-remove-entity',
        entityId: 'walker-40',
      },
    },
    {
      tick: 280,
      command: {
        type: 'move',
        actorId: 'walker-35',
        direction: {
          x: 56.98976842686534,
          y: -3.9034304674714804,
        },
      },
    },
    {
      tick: 290,
      command: {
        type: 'move',
        actorId: 'entity-missing-344',
        direction: {
          x: 9.403887717053294,
          y: -82.6519463211298,
        },
      },
    },
  ],
  checkpoints: [
    {
      tick: 0,
      hash: 2109758146,
    },
    {
      tick: 100,
      hash: 1027027320,
    },
    {
      tick: 200,
      hash: 1270352718,
    },
    {
      tick: 300,
      hash: 1902630959,
    },
  ],
};
