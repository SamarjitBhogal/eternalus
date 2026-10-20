import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../testStore';
import { ScreenFrame } from './ScreenFrame';

describe('ScreenFrame', () => {
  it('renders the team background behind its children in a <main>', () => {
    const html = renderWithStore(
      <ScreenFrame>
        <p>inside</p>
      </ScreenFrame>,
    );
    expect(html).toMatch(/^<main/);
    expect(html).toContain('data-background="test-neutral"');
    expect(html).toContain('<p>inside</p>');
  });

  it('renders no set for a team without one', () => {
    const html = renderWithStore(
      <ScreenFrame team="dark">
        <p>inside</p>
      </ScreenFrame>,
    );
    expect(html).not.toContain('data-background=');
  });
});
