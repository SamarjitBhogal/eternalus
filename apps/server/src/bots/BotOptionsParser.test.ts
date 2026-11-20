import { describe, expect, it } from 'vitest';
import { BOT_OPTION_DEFAULTS } from './BotOptions.constants';
import { BotOptionsParser } from './BotOptionsParser';

describe('BotOptionsParser', () => {
  it('turns the default strings into numbers', () => {
    expect(new BotOptionsParser().parse(BOT_OPTION_DEFAULTS)).toEqual({
      url: 'ws://127.0.0.1:8787',
      players: 2,
      seconds: 20,
      staggerMs: 200,
    });
  });

  it.each([
    ['players', '0'],
    ['players', '1.5'],
    ['players', 'x'],
    ['seconds', '0'],
    ['stagger', '-1'],
  ])('rejects %s=%s', (key, value) => {
    expect(() => new BotOptionsParser().parse({ ...BOT_OPTION_DEFAULTS, [key]: value })).toThrow(
      RangeError,
    );
  });
});
