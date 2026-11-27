// @vitest-environment happy-dom
// A page for this file only (DEC-111): the rest of the suite stays in Node.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import { createAppStore } from '../../bridge/store';
import { TEST_CONTENT } from '../testStore';
import { useLoadoutDraft } from './useLoadoutDraft';

/** React's `act` expects this flag in a test page (react.dev, "act"). */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LOADOUTS: LoadoutsSliceState = {
  options: {
    warrior: {
      defaultWeaponId: 'raptor-talons',
      weapons: [
        { id: 'raptor-talons', displayName: 'Raptor Talons' },
        { id: 'wuuthrad', displayName: 'Wuuthrad' },
      ],
    },
    sentinel: {
      defaultWeaponId: 'sentinel-shield',
      weapons: [{ id: 'sentinel-shield', displayName: 'Sentinel Shield' }],
    },
  },
  saved: { warrior: 'wuuthrad' },
  repaired: ['sentinel'],
};

type Draft = ReturnType<typeof useLoadoutDraft>;

let root: Root | undefined;
const intents: UiIntent[] = [];
const stopListening = eventBus.on('ui-intent', (intent) => intents.push(intent));

/** Mounts the hook over `LOADOUTS`; `draft()` is its latest return value. */
function mountHook(): () => Draft {
  let latest: Draft | undefined;
  const Probe = (): null => {
    latest = useLoadoutDraft(TEST_CONTENT.legendClasses);
    return null;
  };
  const store = createAppStore({ content: TEST_CONTENT, loadouts: LOADOUTS });
  root = createRoot(document.createElement('div'));
  act(() => {
    root?.render(
      <Provider store={store}>
        <Probe />
      </Provider>,
    );
  });
  return () => {
    if (latest === undefined) throw new Error('the hook did not render');
    return latest;
  };
}

afterAll(stopListening);

afterEach(() => {
  act(() => root?.unmount());
  intents.length = 0;
});

describe('useLoadoutDraft', () => {
  it('opens the first class on its saved weapon, with nothing to save', () => {
    const draft = mountHook();

    expect(draft().classId).toBe(TEST_CONTENT.legendClasses[0]?.classId);
    expect(draft().weaponId).toBe('wuuthrad');
    expect(draft().isDirty).toBe(false);
    expect(draft().isAutoBuilt).toBe(false);
  });

  it('marks a picked weapon dirty, and not dirty again when the saved one is picked back', () => {
    const draft = mountHook();

    act(() => {
      draft().pickWeapon('raptor-talons');
    });
    expect(draft().weaponId).toBe('raptor-talons');
    expect(draft().isDirty).toBe(true);
    expect(draft().isAutoBuilt).toBe(true);

    act(() => {
      draft().pickWeapon('wuuthrad');
    });
    expect(draft().isDirty).toBe(false);
  });

  it('picks the class default on autoBuild', () => {
    const draft = mountHook();

    act(() => {
      draft().autoBuild();
    });

    expect(draft().weaponId).toBe('raptor-talons');
  });

  it('keeps an unsaved pick per class and reads the other class from the store', () => {
    const draft = mountHook();
    act(() => {
      draft().pickWeapon('raptor-talons');
    });

    act(() => {
      draft().pickClass('sentinel');
    });
    expect(draft().weaponId).toBe('sentinel-shield');
    expect(draft().wasRepaired).toBe(true);
    expect(draft().isDirty).toBe(false);

    act(() => {
      draft().pickClass('warrior');
    });
    expect(draft().weaponId).toBe('raptor-talons');
    expect(draft().wasRepaired).toBe(false);
  });

  it('sends a save-loadout intent for a dirty pick and drops the draft', () => {
    const draft = mountHook();
    act(() => {
      draft().pickWeapon('raptor-talons');
    });

    act(() => {
      draft().save();
    });

    expect(intents).toEqual([
      { kind: 'save-loadout', classId: 'warrior', primaryWeaponId: 'raptor-talons' },
    ]);
    expect(draft().weaponId).toBe('wuuthrad');
    expect(draft().isDirty).toBe(false);
  });

  it('sends nothing when saving with no change', () => {
    const draft = mountHook();

    act(() => {
      draft().save();
    });

    expect(intents).toEqual([]);
  });
});
