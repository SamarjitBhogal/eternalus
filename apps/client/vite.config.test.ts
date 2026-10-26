import { describe, expect, it } from 'vitest';

import viteConfig from './vite.config.ts';

describe('vite.config', () => {
  it('emits every asset as its own file, never inlined into the JavaScript (14 §11)', () => {
    expect(viteConfig.build?.assetsInlineLimit).toBe(0);
  });
});
