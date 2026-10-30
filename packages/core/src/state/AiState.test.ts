import { describe, expect, it } from 'vitest';

import { SeededRandom } from '../utils/SeededRandom';
import { AiState } from './AiState';
import type { Brain } from './AiState.types';

const brain = (profileId: string): Brain => ({
  controllerId: 'minion',
  profileId,
  memory: {},
  rngState: new SeededRandom(1).getState(),
});

describe('AiState', () => {
  it('keeps one brain per entity and visits them in creation order', () => {
    const ai = new AiState();
    ai.set('entity-2', brain('a'));
    ai.set('entity-1', brain('b'));
    ai.set('entity-2', brain('c'));
    const visited: string[] = [];

    ai.forEach((id, { profileId }) => visited.push(`${id}:${profileId}`));

    expect(ai.size).toBe(2);
    expect(visited).toEqual(['entity-2:c', 'entity-1:b']);
    expect(ai.get('entity-1')?.profileId).toBe('b');
  });

  it('drops a deleted brain from the deferred queue too', () => {
    const ai = new AiState();
    ai.set('entity-1', brain('a'));
    ai.defer(['entity-1', 'entity-2']);

    ai.delete('entity-1');

    expect(ai.get('entity-1')).toBeUndefined();
    expect(ai.deferred).toEqual(['entity-2']);
  });
});
