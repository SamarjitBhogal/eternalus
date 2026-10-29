import { afterAll, afterEach, describe, expect, it } from 'vitest';

import type { Binding } from '../../bridge/Binding.types';
import { eventBus } from '../../bridge/eventBus';
import type { UiIntent } from '../../bridge/events';
import { bindActionShortcut } from '../components/actionShortcut';
import { classStepActions } from './classStepActions';
import type { ClassStepCard, ClassStepLocal } from './classStepState';

const CARDS: readonly ClassStepCard[] = [
  { classId: 'warrior', isAvailable: true },
  { classId: 'sentinel', isAvailable: true },
  { classId: 'magus', isAvailable: true },
  { classId: 'harbinger', isAvailable: false },
];

const NOTHING: ClassStepLocal = { pickedClassId: null, previewClassId: null };

/** The actions over a state the test owns: `update` applies to it, as React's setter would. */
function harness(initial: ClassStepLocal = NOTHING) {
  let state = initial;
  const actions = () =>
    classStepActions(CARDS, state, (next) => {
      state = next(state);
    });
  return { actions, state: () => state };
}

/** A cancelable keydown carrying the fields `bindActionShortcut` reads (Node has no KeyboardEvent). */
const keydown = (code: string): Event =>
  Object.assign(new Event('keydown', { cancelable: true }), {
    code,
    repeat: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
  });

const VIEW_DETAILS_ON_C: readonly Binding[] = [
  { action: 'gadget-2', chords: [{ device: 'keyboard', code: 'KeyC', label: 'C' }] },
];

describe('classStepActions', () => {
  const seen: UiIntent[] = [];
  const stop = eventBus.on('ui-intent', (intent) => seen.push(intent));
  afterEach(() => {
    seen.length = 0;
  });
  afterAll(stop);

  it('picks on click locally and emits nothing; a locked card stays unpicked', () => {
    const step = harness();
    step.actions().pick('magus');
    step.actions().pick('harbinger');

    expect(step.state().pickedClassId).toBe('magus');
    expect(seen).toEqual([]);
  });

  it('moves with the arrows, wrapping, picks where it lands and emits nothing (APG, I-14)', () => {
    const step = harness();

    expect(step.actions().move(1, 'ArrowRight')).toBe(2);
    expect(step.state().pickedClassId).toBe('magus');
    expect(step.actions().move(0, 'ArrowLeft')).toBe(3);
    expect(step.state().pickedClassId).toBe('magus');
    expect(step.actions().move(3, 'ArrowDown')).toBe(0);
    expect(step.state().pickedClassId).toBe('warrior');
    expect(step.actions().move(0, 'End')).toBe(3);
    expect(step.actions().move(2, 'Tab')).toBeNull();
    expect(seen).toEqual([]);
  });

  it('previews without picking or emitting', () => {
    const step = harness();
    step.actions().preview('harbinger');

    expect(step.state()).toEqual({ pickedClassId: null, previewClassId: 'harbinger' });
    expect(seen).toEqual([]);
  });

  it('Select Class emits exactly one select-class for the pick, nothing without one', () => {
    harness().actions().selectPicked();
    expect(seen).toEqual([]);

    harness({ pickedClassId: 'magus', previewClassId: 'warrior' }).actions().selectPicked();
    expect(seen).toEqual([{ kind: 'select-class', classId: 'magus' }]);
  });

  it('cycles the alternate layout over the available classes and emits nothing (CD-10)', () => {
    const step = harness();
    step.actions().cycle(1);
    step.actions().cycle(1);

    expect(step.state().pickedClassId).toBe('magus');
    step.actions().cycle(1);
    expect(step.state().pickedClassId).toBe('warrior');
    expect(seen).toEqual([]);
  });

  it('View Details emits one select-class for the shown class, on click and on its bound key', () => {
    const step = harness();
    step.actions().cycle(1);
    step.actions().selectShown();
    expect(seen).toEqual([{ kind: 'select-class', classId: 'sentinel' }]);

    seen.length = 0;
    const target = new EventTarget();
    const unbind = bindActionShortcut(
      target,
      () => VIEW_DETAILS_ON_C,
      'gadget-2',
      () => {
        step.actions().selectShown();
      },
    );
    target.dispatchEvent(keydown('KeyC'));
    target.dispatchEvent(keydown('KeyX'));
    unbind();

    expect(seen).toEqual([{ kind: 'select-class', classId: 'sentinel' }]);
  });
});
