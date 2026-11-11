import { describe, expect, it } from 'vitest';

import { renderWithStore, TEST_CONTENT } from '../testStore';
import { TeamBadge } from './TeamBadge';
import styles from './TeamBadge.module.css';

describe('TeamBadge', () => {
  it.each([
    ['light', 'Light'],
    ['dark', 'Dark'],
  ] as const)('shows the %s team by name and reads it as a sentence', (team, name) => {
    const html = renderWithStore(<TeamBadge team={team} />);

    expect(html).toBe(
      `<p class="${String(styles.badge)}">` +
        `<span class="${String(styles.name)}" aria-hidden="true">${name}</span>` +
        `<span class="${String(styles.srOnly)}">You are on the ${name} team</span></p>`,
    );
  });

  it('shows nothing before a team is assigned', () => {
    expect(renderWithStore(<TeamBadge team={null} />)).toBe('');
  });

  it('names the team from the content catalogue', () => {
    const html = renderWithStore(<TeamBadge team="dark" />, {
      content: { ...TEST_CONTENT, teamNames: { light: 'Lux', dark: 'Umbra' } },
    });

    expect(html).toContain('aria-hidden="true">Umbra</span>');
    expect(html).toContain('You are on the Umbra team');
  });
});
