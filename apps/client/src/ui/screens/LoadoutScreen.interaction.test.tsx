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
import { STRINGS } from '../strings';
import { TEST_CONTENT } from '../testStore';
import { LoadoutScreen } from './LoadoutScreen';

/** React's `act` expects this flag in a test page (react.dev, "act"). */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const MAGUS_OPTIONS = {
  classId: 'magus',
  defaultWeaponId: 'magus-staff',
  weapons: [
    { id: 'magus-staff', displayName: 'Staff' },
    { id: 'wuuthrad', displayName: 'Wuuthrad' },
  ],
};

/** Keyed by Legend (DEC-354 (1)): TEST_CONTENT's warrior Templar, sentinel Colossus, Magus three. */
const LOADOUTS: LoadoutsSliceState = {
  options: {
    knight: {
      classId: 'warrior',
      defaultWeaponId: 'raptor-talons',
      weapons: [
        { id: 'raptor-talons', displayName: 'Raptor Talons' },
        { id: 'wuuthrad', displayName: 'Wuuthrad' },
      ],
    },
    colossus: {
      classId: 'sentinel',
      defaultWeaponId: 'sentinel-shield',
      weapons: [{ id: 'sentinel-shield', displayName: 'Sentinel Shield' }],
    },
    catalyst: MAGUS_OPTIONS,
    oracle: MAGUS_OPTIONS,
    necromancer: MAGUS_OPTIONS,
  },
  saved: { catalyst: 'wuuthrad' },
  repaired: [],
};

let root: Root | undefined;
const intents: UiIntent[] = [];
const stopListening = eventBus.on('ui-intent', (intent) => intents.push(intent));

function mount(): HTMLElement {
  const store = createAppStore({ content: TEST_CONTENT, loadouts: LOADOUTS });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <Provider store={store}>
        <LoadoutScreen />
      </Provider>,
    );
  });
  return container;
}

const names = (radios: readonly HTMLElement[]): (string | null)[] =>
  radios.map((radio) => radio.textContent);

const group = (container: HTMLElement, label: string): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>(
    `[role="radiogroup"][aria-label="${label}"] [role="radio"]`,
  ),
];

const click = (element: Element | undefined): void => {
  act(() => {
    element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
};

const button = (container: HTMLElement, name: string): HTMLButtonElement | undefined =>
  [...container.querySelectorAll('button')].find((b) => b.textContent === name);
const saveButton = (container: HTMLElement): HTMLButtonElement | undefined =>
  button(container, STRINGS.loadouts.save);

afterAll(stopListening);

afterEach(() => {
  act(() => root?.unmount());
  document.body.replaceChildren();
  intents.length = 0;
});

describe('LoadoutScreen (page)', () => {
  it('changes the weapons offered when another class is picked', () => {
    const container = mount();
    expect(group(container, STRINGS.loadouts.weaponGroup).map((b) => b.textContent)).toEqual([
      'Raptor Talons',
      'Wuuthrad',
    ]);
    click(group(container, STRINGS.loadouts.classGroup)[1]);
    expect(group(container, STRINGS.loadouts.weaponGroup).map((b) => b.textContent)).toEqual([
      'Sentinel Shield',
    ]);
  });

  it('changes the Legends offered when another class is picked, and opens the first', () => {
    const container = mount();
    expect(names(group(container, STRINGS.loadouts.legendGroup))).toEqual(['Templar']);
    click(group(container, STRINGS.loadouts.classGroup)[2]);
    const legends = group(container, STRINGS.loadouts.legendGroup);
    expect(names(legends)).toEqual(['Catalyst', 'Oracle', 'Heretic']);
    expect(legends.map((radio) => radio.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
  });

  it('keeps Save disabled until a different weapon is picked, then sends the intent', () => {
    const container = mount();
    expect(saveButton(container)?.disabled).toBe(true);
    click(group(container, STRINGS.loadouts.weaponGroup)[1]);
    expect(saveButton(container)?.disabled).toBe(false);
    click(saveButton(container));
    expect(intents).toEqual([
      { kind: 'save-loadout', specId: 'knight', primaryWeaponId: 'wuuthrad' },
    ]);
  });

  it('saves a weapon for the picked Legend: a Legend, a weapon, then Save (DEC-354 (1))', () => {
    const container = mount();
    click(group(container, STRINGS.loadouts.classGroup)[2]);
    // The Catalyst has Wuuthrad saved; the Oracle, of the same class, has nothing saved.
    expect(group(container, STRINGS.loadouts.weaponGroup)[1]?.getAttribute('aria-checked')).toBe(
      'true',
    );
    click(group(container, STRINGS.loadouts.legendGroup)[1]);
    const weapons = group(container, STRINGS.loadouts.weaponGroup);
    expect(weapons.map((radio) => radio.getAttribute('aria-checked'))).toEqual(['true', 'false']);

    click(weapons[1]);
    click(saveButton(container));

    expect(intents).toEqual([
      { kind: 'save-loadout', specId: 'oracle', primaryWeaponId: 'wuuthrad' },
    ]);
  });

  it('Auto-build picks the class auto-build weapon, which Save then sends', () => {
    const container = mount();
    const autoBuild = () => button(container, STRINGS.loadouts.autoBuild);
    expect(autoBuild()?.disabled).toBe(true);
    click(group(container, STRINGS.loadouts.weaponGroup)[1]);
    expect(autoBuild()?.disabled).toBe(false);

    click(autoBuild());

    const weapons = group(container, STRINGS.loadouts.weaponGroup);
    expect(weapons.map((radio) => radio.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    expect(autoBuild()?.disabled).toBe(true);
    expect(saveButton(container)?.disabled).toBe(true);
  });

  it('moves the pick with the arrow keys and wraps at the ends', () => {
    const container = mount();
    const weapons = group(container, STRINGS.loadouts.weaponGroup);
    act(() => {
      weapons[0]?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
    });
    expect(group(container, STRINGS.loadouts.weaponGroup)[1]?.getAttribute('aria-checked')).toBe(
      'true',
    );
    act(() => {
      group(container, STRINGS.loadouts.weaponGroup)[1]?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
    });
    expect(group(container, STRINGS.loadouts.weaponGroup)[0]?.getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('sends Back to the home screen', () => {
    const container = mount();
    click([...container.querySelectorAll('button')].find((b) => b.textContent === STRINGS.back));
    expect(intents).toEqual([{ kind: 'navigate', route: 'home' }]);
  });
});
