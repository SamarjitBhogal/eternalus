import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import viteConfig from './vite.config.ts';

const hasName = (plugin: unknown): plugin is { readonly name: string } =>
  typeof plugin === 'object' && plugin !== null && 'name' in plugin;

describe('vite.config', () => {
  it('emits every asset as its own file, never inlined into the JavaScript (14 §11)', () => {
    expect(viteConfig.build?.assetsInlineLimit).toBe(0);
  });

  it('serves the error-reports endpoint from the dev and preview servers (ADR 0025 §1)', () => {
    const names = (viteConfig.plugins ?? []).flat(2).filter(hasName);

    expect(names.map(({ name }) => name)).toContain('eternalus:error-reports');
  });

  it('defines the root package version and the short commit for error reports (ADR 0025 §3)', () => {
    const root: unknown = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    );
    const version =
      typeof root === 'object' && root !== null && 'version' in root ? root.version : null;

    expect(viteConfig.define).toEqual({
      __GAME_VERSION__: JSON.stringify(version),
      __GAME_COMMIT__: expect.stringMatching(/^"(?:[0-9a-f]{4,40}|unknown)"$/) as unknown,
    });
  });
});
