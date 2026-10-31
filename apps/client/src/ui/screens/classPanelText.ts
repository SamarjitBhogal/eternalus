import type { ClassPanel } from '../../bridge/selectors/selectClassPanel';

/** The shown class's title, role line, description and rows: the class step's panel and View Details'. */
export const classPanelText = (panel: ClassPanel) =>
  ({
    title: panel.card.displayName,
    subtitle: panel.card.tagline,
    subtitleAccentToken: panel.card.accentToken,
    description: panel.description,
    rows: panel.details,
  }) as const;
