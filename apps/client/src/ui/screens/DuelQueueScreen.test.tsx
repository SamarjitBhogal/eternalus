import { describe, expect, it } from 'vitest';

import { STRINGS } from '../strings';
import { buttonNames, renderWithStore } from '../testStore';
import { DuelQueueScreen } from './DuelQueueScreen';

describe('DuelQueueScreen', () => {
  it('says it is searching and offers only Cancel', () => {
    const html = renderWithStore(<DuelQueueScreen />);
    expect(html).toContain(STRINGS.duelQueue.searching);
    expect(html).toContain(STRINGS.duelQueue.explanation);
    expect(html).toContain('00:00');
    expect(buttonNames(html)).toEqual([STRINGS.duelQueue.cancel]);
  });
});
