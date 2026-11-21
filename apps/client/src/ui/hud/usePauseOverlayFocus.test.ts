import { describe, expect, it } from 'vitest';

import { focusDialogInSettings, isOverlayOpen, restoreFocusOnClose } from './usePauseOverlayFocus';

/** A stand-in for an element: it counts the times it took the focus, and can leave the document. */
function fakeElement() {
  let focused = 0;
  return {
    isConnected: true,
    focus: () => {
      focused += 1;
    },
    focusCount: () => focused,
  };
}

// The hook runs these in effects, which a server render never does; these cases call them as
// React would: the effect body when the overlay opens, its cleanup when it closes.
describe('restoreFocusOnClose', () => {
  it('gives the focus back to the opener when the overlay closes, not before (I-72)', () => {
    const opener = fakeElement();

    const onClose = restoreFocusOnClose(true, opener);
    expect(opener.focusCount()).toBe(0);
    onClose?.();

    expect(opener.focusCount()).toBe(1);
  });

  it('skips an opener that left the document while the overlay was open', () => {
    const opener = fakeElement();

    const onClose = restoreFocusOnClose(true, opener);
    opener.isConnected = false;
    onClose?.();

    expect(opener.focusCount()).toBe(0);
  });

  it('skips a missing opener (nothing had the focus, or it was not an HTML element)', () => {
    const onClose = restoreFocusOnClose(true, null);

    expect(onClose).toBeTypeOf('function');
    expect(() => onClose?.()).not.toThrow();
  });

  it('has nothing to restore while the overlay is closed', () => {
    const opener = fakeElement();

    expect(restoreFocusOnClose(false, opener)).toBeUndefined();
    expect(opener.focusCount()).toBe(0);
  });
});

describe('isOverlayOpen', () => {
  it('is open in the pause and the settings view alike, so a switch between them restores nothing', () => {
    expect(isOverlayOpen('pause')).toBe(true);
    expect(isOverlayOpen('settings')).toBe(true);
  });

  it('is closed with no overlay', () => {
    expect(isOverlayOpen(null)).toBe(false);
  });
});

describe('focusDialogInSettings', () => {
  it('focuses the dialog itself in the settings view', () => {
    const dialog = fakeElement();

    focusDialogInSettings('settings', dialog);

    expect(dialog.focusCount()).toBe(1);
  });

  it('leaves the focus alone in the pause view (Resume autofocuses) and while closed', () => {
    const dialog = fakeElement();

    focusDialogInSettings('pause', dialog);
    focusDialogInSettings(null, dialog);

    expect(dialog.focusCount()).toBe(0);
  });

  it('skips a dialog that is not mounted', () => {
    expect(() => {
      focusDialogInSettings('settings', null);
    }).not.toThrow();
  });
});
