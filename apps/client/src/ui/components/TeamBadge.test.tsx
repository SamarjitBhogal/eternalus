import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../testStore';
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
});
