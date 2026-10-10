import { describe, expect, it } from 'vitest';

import {
  captureButton,
  captureKey,
  type CapturedKey,
  type CaptureState,
  IDLE,
  keyLabel,
  saveIntent,
} from './bindingCapture';

const LISTENING: CaptureState = { step: 'listening', action: 'move-up' };

function key(code: string, key: string, extra: Partial<CapturedKey> = {}): CapturedKey {
  return {
    code,
    key,
    repeat: false,
    ctrlKey: false,
    metaKey: false,
    isExemptTarget: false,
    ...extra,
  };
}

describe('press-to-bind capture', () => {
  it('runs the requirements doc scenario: select move-up, press ArrowUp, Enter saves', () => {
    const captured = captureKey(LISTENING, key('ArrowUp', 'ArrowUp'));
    const saved = captureKey(captured.state, key('Enter', 'Enter'));

    expect(captured.state).toEqual({
      step: 'confirming',
      action: 'move-up',
      chord: { device: 'keyboard', code: 'ArrowUp', label: '↑' },
    });
    expect(saved.state).toEqual(IDLE);
    expect(saved.intent).toEqual({
      kind: 'update-binding',
      action: 'move-up',
      chord: { device: 'keyboard', code: 'ArrowUp', label: '↑' },
      onConflict: 'swap',
    });
  });

  it('binds a mouse side button (the requirements doc Z → side button scenario)', () => {
    const captured = captureButton({ step: 'listening', action: 'gadget-1' }, 3, false);

    expect(captured.state).toEqual({
      step: 'confirming',
      action: 'gadget-1',
      chord: { device: 'mouse', code: '3', label: 'Mouse 4' },
    });
  });

  it('cancels with Escape while listening or confirming', () => {
    const confirming = captureKey(LISTENING, key('KeyQ', 'q')).state;

    expect(captureKey(LISTENING, key('Escape', 'Escape')).state).toEqual(IDLE);
    expect(captureKey(confirming, key('Escape', 'Escape'))).toEqual({
      state: IDLE,
      intent: null,
      isConsumed: true,
    });
  });

  it('can bind Enter itself: the first Enter is captured, the second saves', () => {
    const captured = captureKey(LISTENING, key('Enter', 'Enter'));
    const saved = captureKey(captured.state, key('Enter', 'Enter'));

    expect(captured.intent).toBeNull();
    expect(saved.intent).toMatchObject({ chord: { code: 'Enter', label: 'Enter' } });
  });

  it('replaces the pending chord when another key is pressed before saving', () => {
    const first = captureKey(LISTENING, key('KeyQ', 'q')).state;

    expect(captureKey(first, key('KeyE', 'e')).state).toMatchObject({
      chord: { code: 'KeyE', label: 'E' },
    });
  });

  it('leaves Tab, F5, F12 and Ctrl/Meta shortcuts to the browser', () => {
    const inputs = [
      key('Tab', 'Tab'),
      key('F5', 'F5'),
      key('F12', 'F12'),
      key('KeyR', 'r', { ctrlKey: true }),
      key('KeyR', 'r', { metaKey: true }),
    ];

    for (const input of inputs) {
      expect(captureKey(LISTENING, input)).toEqual({
        state: LISTENING,
        intent: null,
        isConsumed: false,
      });
    }
  });

  it('ignores auto-repeat but still consumes it', () => {
    expect(captureKey(LISTENING, key('KeyW', 'w', { repeat: true }))).toEqual({
      state: LISTENING,
      intent: null,
      isConsumed: true,
    });
  });

  it('lets Enter and Space press a focused dialog or reset button instead of capturing them', () => {
    const confirming = captureKey(LISTENING, key('KeyS', 's')).state;

    const enter = captureKey(confirming, key('Enter', 'Enter', { isExemptTarget: true }));
    const space = captureKey(confirming, key('Space', ' ', { isExemptTarget: true }));

    expect(enter).toEqual({ state: confirming, intent: null, isConsumed: false });
    expect(space).toEqual({ state: confirming, intent: null, isConsumed: false });
  });

  it('still cancels with Escape from a dialog button', () => {
    const confirming = captureKey(LISTENING, key('KeyS', 's')).state;

    expect(captureKey(confirming, key('Escape', 'Escape', { isExemptTarget: true })).state).toEqual(
      IDLE,
    );
  });

  it('treats a click on a dialog or reset button as a click, not a mouse binding', () => {
    expect(captureButton(LISTENING, 0, true)).toEqual({
      state: LISTENING,
      intent: null,
      isConsumed: false,
    });
  });

  it('does nothing while idle', () => {
    expect(captureKey(IDLE, key('KeyW', 'w')).isConsumed).toBe(false);
    expect(captureButton(IDLE, 0, false).isConsumed).toBe(false);
  });

  it('ignores buttons beyond the five a mouse reports', () => {
    expect(captureButton(LISTENING, 5, false).isConsumed).toBe(false);
  });

  it('falls back to key when a virtual keyboard reports no code', () => {
    expect(captureKey(LISTENING, key('', 'w')).state).toMatchObject({
      chord: { code: 'w', label: 'W' },
    });
  });

  it('saves with the conflict policy the player picked', () => {
    const confirming = captureKey(LISTENING, key('KeyS', 's')).state;

    expect(saveIntent(confirming, 'replace')).toMatchObject({ onConflict: 'replace' });
    expect(saveIntent(LISTENING, 'replace')).toBeNull();
  });

  it.each([
    ['w', 'W'],
    [' ', 'Space'],
    ['ArrowLeft', '←'],
    ['Escape', 'Esc'],
    ['Shift', 'Shift'],
  ])('labels the key %j as %j', (pressed, label) => {
    expect(keyLabel(pressed)).toBe(label);
  });
});
