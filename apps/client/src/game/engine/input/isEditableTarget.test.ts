import { describe, expect, it } from 'vitest';

import { fakeKeyEvent } from './fakeKeyEvent';
import { isEditableTarget } from './isEditableTarget';

describe('isEditableTarget', () => {
  it.each([{ tagName: 'INPUT' }, { tagName: 'TEXTAREA' }, { tagName: 'SELECT' }])(
    'is true for a $tagName',
    (target) => {
      expect(isEditableTarget(fakeKeyEvent('keydown', 'KeyE', { target }))).toBe(true);
    },
  );

  it('is true for a contentEditable element', () => {
    const target = { tagName: 'DIV', isContentEditable: true };

    expect(isEditableTarget(fakeKeyEvent('keydown', 'KeyE', { target }))).toBe(true);
  });

  it('is false for no target and for a plain element', () => {
    const plain = { tagName: 'CANVAS', isContentEditable: false };

    expect(isEditableTarget(fakeKeyEvent('keydown', 'KeyE'))).toBe(false);
    expect(isEditableTarget(fakeKeyEvent('keydown', 'KeyE', { target: plain }))).toBe(false);
  });
});
