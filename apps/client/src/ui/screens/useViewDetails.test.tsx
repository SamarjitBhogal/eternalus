import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../testStore';
import { useViewDetails } from './useViewDetails';

/** Shows whether a step's View Details is open. */
function Probe(): string {
  return useViewDetails().isOpen ? 'open' : 'closed';
}

// Opening and the focus restore run in event handlers and effects, which a server render never
// does; the restore itself is `restoreFocusOnClose`, tested with the pause overlay.
describe('useViewDetails', () => {
  it('starts closed', () => {
    expect(renderWithStore(<Probe />)).toBe('closed');
  });
});
