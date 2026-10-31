import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import { createDefaultEntityRegistry } from '../../entities/defaultEntityRegistry';
import { EntityFactory } from '../../entities/EntityFactory';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import { GameState } from '../../state/GameState';
import { matchWorldOf } from '../../state/__fixtures__/matchWorld';
import type { Command, SpawnOrigin } from '../Command.types';
import { DevSpawnMobsHandler } from './DevSpawnMobsHandler';

const factory = new EntityFactory(createDefaultEntityRegistry(), loadDefaultContent(30));
const handler = new DevSpawnMobsHandler();

const spawn = (
  origin: SpawnOrigin,
  overrides: Partial<Command<'dev-spawn-mobs'>> = {},
  state = new GameState(createDefaultGameConfig(), 1, matchWorldOf(TWO_LANE_MAP)),
) => {
  const reason = handler.handle(
    {
      type: 'dev-spawn-mobs',
      team: 'dark',
      definitionId: 'medium-minion',
      count: 5,
      origin,
      ...overrides,
    },
    { state, factory },
  );
  return { reason, requests: state.hordeRequests };
};

describe('DevSpawnMobsHandler', () => {
  it('queues one horde on the lane each kind of origin names', () => {
    expect(spawn({ kind: 'structure', structureId: 'spawner-light-0' }).requests).toEqual([
      {
        team: 'dark',
        mobId: 'medium-minion',
        weightClass: 'medium',
        count: 5,
        lane: 'lane-0',
        origin: { x: 60, y: 20 },
      },
    ]);
    expect(spawn({ kind: 'lane', lane: 'lane-1', t: 0.25 }).requests[0]).toMatchObject({
      lane: 'lane-1',
      origin: { x: 60, y: 40 },
    });
    expect(spawn({ kind: 'point', at: { x: 90, y: 37 } }).requests[0]).toMatchObject({
      lane: 'lane-1',
      origin: { x: 90, y: 37 },
    });
  });

  it('rejects a non-mob definition, a bad count and an origin that names no lane', () => {
    const lane = { kind: 'lane', lane: 'lane-0', t: 0.5 } as const;

    expect(spawn(lane, { definitionId: 'warrior' }).reason).toBe('unknown-definition');
    expect(spawn(lane, { count: 0 }).reason).toBe('invalid-count');
    expect(spawn(lane, { count: 1.5 }).reason).toBe('invalid-count');
    expect(spawn({ kind: 'structure', structureId: 'cathedral' }).reason).toBe('invalid-origin');
    expect(spawn({ kind: 'structure', structureId: 'nowhere' }).reason).toBe('invalid-origin');
    expect(spawn({ kind: 'lane', lane: 'lane-9', t: 0.5 }).reason).toBe('invalid-origin');
    expect(spawn({ kind: 'lane', lane: 'lane-0', t: 2 }).reason).toBe('invalid-origin');
    expect(spawn({ kind: 'point', at: { x: Number.NaN, y: 0 } }).reason).toBe('invalid-origin');
    expect(spawn(lane, {}, new GameState(createDefaultGameConfig(), 1)).reason).toBe(
      'invalid-origin',
    );
  });
});
