import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../testStore';
import { ScreenFrame } from './ScreenFrame';
import styles from './ScreenFrame.module.css';

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

  it('pads its content as a panel by default', () => {
    const html = renderWithStore(
      <ScreenFrame>
        <p>inside</p>
      </ScreenFrame>,
    );

    expect(html).toContain(`<div class="${String(styles.content)}"><p>inside</p></div>`);
    expect(html).not.toContain(String(styles.stage));
  });

  it('hosts a selection stage full-bleed, without the panel padding', () => {
    const html = renderWithStore(
      <ScreenFrame layout="stage">
        <p>inside</p>
      </ScreenFrame>,
    );

    expect(html).toContain(`<div class="${String(styles.stage)}"><p>inside</p></div>`);
    expect(html).not.toContain(String(styles.content));
    expect(html).toContain('data-background="test-neutral"');
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
