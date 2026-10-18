import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PARTICLE_STEP_X, PARTICLE_STEP_Y } from './ParticlesLayer.constants';
import { ParticlesLayer } from './ParticlesLayer';

describe('ParticlesLayer', () => {
  const html = renderToStaticMarkup(
    <ParticlesLayer layer={{ kind: 'particles', count: 4, colourToken: '--team-dark-primary' }} />,
  );

  it('draws count particles in the colour token', () => {
    expect(html.match(/<span /g)).toHaveLength(4);
    expect(html.match(/background-color:var\(--team-dark-primary\)/g)).toHaveLength(4);
  });

  it('spreads the particles by the low-discrepancy steps', () => {
    const percent = (step: number) => `${String(Math.round((step % 1) * 1000) / 10)}%`;
    expect(html).toContain(`left:${percent(PARTICLE_STEP_X)};top:${percent(PARTICLE_STEP_Y)}`);
    expect(html).toContain('left:0%;top:0%');
  });
});
