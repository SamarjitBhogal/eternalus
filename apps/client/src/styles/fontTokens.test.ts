import { describe, expect, it } from 'vitest';

import globalCss from './global.css?raw';

/** The first `:root` value of a custom property, with one level of `var(--x)` resolved. */
const resolved = (name: string): string => {
  const read = (token: string): string => {
    const match = new RegExp(`${token}\\s*:\\s*([^;]+);`).exec(globalCss);
    if (match?.[1] === undefined) throw new Error(`global.css declares no ${token}`);
    return match[1].trim();
  };
  const value = read(name);
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return alias?.[1] === undefined ? value : read(alias[1]);
};

describe('font tokens (owner ruling N1: Cinzel on every screen)', () => {
  it.each(['--font-display', '--font-body', '--font-game'])(
    '%s resolves to Cinzel first',
    (name) => {
      expect(resolved(name)).toMatch(/^'Cinzel'/);
    },
  );
});
