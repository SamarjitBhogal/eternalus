import { describe, expect, it } from 'vitest';

import { cssRule } from './hudTestSupport';

/** A module's CSS text: a commented-out copy of a rule, a comment inside it, a selector list. */
const CSS = `/* .panel { left: 9px; } an old box */
.panel {
  left: 0;
  /* top: 9px; */
  top: 2px;
}

.panelInner,
.panel .inner {
  width: 3px;
}
`;

describe('cssRule', () => {
  it('returns the declarations of the rule, with every comment stripped', () => {
    expect(cssRule(CSS, '.panel')).toBe('\n  left: 0;\n  \n  top: 2px;\n');
  });

  it('matches the whole selector exactly, never a prefix or one part of a list', () => {
    expect(cssRule(CSS, '.panelInner,\n.panel .inner')).toBe('\n  width: 3px;\n');
    expect(() => cssRule(CSS, '.pan')).toThrow('no rule with the selector ".pan"');
    expect(() => cssRule(CSS, '.panelInner')).toThrow('no rule with the selector ".panelInner"');
  });

  // A renamed rule must fail its assertions, not pass a negative one on an empty string.
  it('fails loudly for a selector the CSS does not have', () => {
    expect(() => cssRule(CSS, '.missing')).toThrow('no rule with the selector ".missing"');
    expect(() => cssRule('', '.panel')).toThrow('no rule with the selector ".panel"');
  });
});
