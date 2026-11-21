import { describe, expect, it } from 'vitest';

import globalCss from './global.css?raw';

/** The first `:root` value of a custom property. */
const tokenValue = (name: string): string => {
  const match = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(globalCss);
  if (match?.[1] === undefined) throw new Error(`global.css declares no ${name}`);
  return match[1].trim();
};

describe('font tokens (DEC-67: Cinzel on every screen)', () => {
  it('sets --font-game to Cinzel first', () => {
    expect(tokenValue('--font-game')).toMatch(/^'Cinzel'/);
  });

  it.each(['--font-display', '--font-body'])('aliases %s to --font-game', (name) => {
    expect(tokenValue(name)).toBe('var(--font-game)');
  });
});
