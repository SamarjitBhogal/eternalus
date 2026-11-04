import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { GradientLayer } from './GradientLayer';

describe('GradientLayer', () => {
  it('draws a linear gradient at the layer angle from colour tokens only', () => {
    const html = renderToStaticMarkup(
      <GradientLayer
        layer={{ kind: 'gradient', angleDeg: 160, stops: ['--surface-0', '--team-light-accent'] }}
      />,
    );
    expect(html).toContain('linear-gradient(160deg, var(--surface-0), var(--team-light-accent))');
    expect(html).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});
