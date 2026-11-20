import { describe, expect, it } from 'vitest';

import { fakeKeyEvent } from './fakeKeyEvent';
import { isEditableTarget } from './isEditableTarget';

describe('isEditableTarget', () => {
  it.each([{ tagName: 'INPUT' }, { tagName: 'TEXTAREA' }])('is true for a $tagName', (target) => {
    expect(isEditableTarget(fakeKeyEvent('keydown', 'KeyE', { target }))).toBe(true);
  });

  it('is true for a contentEditable element', () => {
    const target = { tagName: 'DIV', isContentEditable: true };

    expect(isEditableTarget(fakeKeyEvent('keydown', 'KeyE', { target }))).toBe(true);
  });

  it('is false for no target, a plain element and a select (it keeps focus after a pick)', () => {
    const plain = { tagName: 'CANVAS', isContentEditable: false };
    const select = { tagName: 'SELECT', isContentEditable: false };

    expect(isEditableTarget(fakeKeyEvent('keydown', 'KeyE', { target: select }))).toBe(false);

    expect(isEditableTarget(fakeKeyEvent('keydown', 'KeyE'))).toBe(false);
    expect(isEditableTarget(fakeKeyEvent('keydown', 'KeyE', { target: plain }))).toBe(false);
  });
});
