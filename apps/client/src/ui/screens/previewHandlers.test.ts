import { describe, expect, it } from 'vitest';

import { previewHandlers } from './previewHandlers';

describe('previewHandlers', () => {
  it('starts the preview on focus and pointer enter, and ends it on blur and pointer leave', () => {
    const calls: boolean[] = [];
    const handlers = previewHandlers((isPreviewing) => {
      calls.push(isPreviewing);
    });

    handlers.onFocus();
    handlers.onBlur();
    handlers.onPointerEnter();
    handlers.onPointerLeave();

    expect(calls).toEqual([true, false, true, false]);
  });

  it('hands out exactly those four handlers, so spreading them adds no attribute', () => {
    expect(Object.keys(previewHandlers(() => undefined)).sort()).toEqual([
      'onBlur',
      'onFocus',
      'onPointerEnter',
      'onPointerLeave',
    ]);
  });
});
