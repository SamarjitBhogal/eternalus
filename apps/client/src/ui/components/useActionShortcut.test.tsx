import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import type { InputAction } from '../../bridge/Binding.types';
import { renderWithStore } from '../testStore';
import { useActionShortcut } from './useActionShortcut';

/** A component that only holds the shortcut, as `KeyPrompt` and `usePauseMenuKey` will. */
function ShortcutProbe({
  action,
  isEnabled,
}: {
  readonly action: InputAction;
  readonly isEnabled: boolean;
}): ReactElement {
  useActionShortcut(action, () => undefined, isEnabled);
  return <span>probe</span>;
}

// The listener lifecycle (bubble phase, one listener per type, removal, bindings read at press
// time) is bindActionShortcut's, tested in Node by actionShortcut.test.ts; the hook only runs it
// in an effect, which a server render never does.
describe('useActionShortcut', () => {
  it('server-renders without touching window, enabled or not', () => {
    expect(typeof globalThis.window).toBe('undefined');
    for (const isEnabled of [true, false]) {
      expect(renderWithStore(<ShortcutProbe action="pause-menu" isEnabled={isEnabled} />)).toBe(
        '<span>probe</span>',
      );
    }
  });
});
