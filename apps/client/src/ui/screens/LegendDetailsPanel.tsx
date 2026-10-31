import type { ReactElement } from 'react';

import type { DetailSlot } from '../../bridge/catalogue.types';
import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import { InfoPanel } from '../components/InfoPanel';
import type { InfoPanelLayout } from '../components/InfoPanel.types';
import { STRINGS } from '../strings';
import styles from './LegendDetailsPanel.module.css';
import { LegendSelectRatingBar } from './LegendSelectRatingBar';

const { characterSelect: text } = STRINGS;

/**
 * The panel's role line (57:35): "<title>  ·  <role>"; with no role, the title alone under a
 * Legend name, and nothing when the panel title already is the sub-class title (CD-13).
 */
function roleLine(legend: LegendCardView): string | null {
  if (legend.roleLabel !== null) return text.detailLine(legend.subClassName, legend.roleLabel);
  return legend.legendName === null ? null : legend.subClassName;
}

/** Where the panel is drawn: the step's left panel, or View Details' left and right columns. */
type LegendDetailsView = 'panel' | 'view-details';

/**
 * How each view configures the shared `InfoPanel`: the step's panel has the "Ultimate / Abilities"
 * header and the rating bars; View Details labels each row instead and shows no ratings.
 * Recommendation: no ratings, as frame 145:2's class case has none and DEC-103 asks for "a similar
 * thing" (its "no legends in the corner" is the Legends strip only; register CD-42, HC-C1).
 */
const VIEWS = {
  panel: { layout: 'legend', detailsHeader: text.legendDetailsHeader, hasRatings: true },
  'view-details': {
    layout: 'legend-details',
    detailsHeader: null,
    rowLabels: text.detailLabels,
    hasRatings: false,
  },
} as const satisfies Record<
  LegendDetailsView,
  {
    readonly layout: InfoPanelLayout;
    readonly detailsHeader: string | null;
    readonly rowLabels?: Readonly<Record<DetailSlot, string>>;
    readonly hasRatings: boolean;
  }
>;

/**
 * A Legend's details on the left of the Legend step and the locked view (58:271): its panel
 * (title, role line, description, detail rows) and its rating bars, placed in the step's
 * artboard; with `view="view-details"` the same panel laid out for View Details (DEC-103).
 * `shouldFocusTitle` focuses the title on mount (the locked view, DEC-60).
 */
export function LegendDetailsPanel({
  legend,
  view = 'panel',
  shouldFocusTitle = false,
}: {
  readonly legend: LegendCardView;
  readonly view?: LegendDetailsView;
  readonly shouldFocusTitle?: boolean;
}): ReactElement {
  const { hasRatings, ...configured } = VIEWS[view];
  return (
    <>
      <InfoPanel
        {...configured}
        title={legend.legendName ?? legend.subClassName}
        subtitle={roleLine(legend)}
        subtitleAccentToken={legend.accentToken}
        description={legend.description}
        rows={legend.details}
        shouldFocusTitle={shouldFocusTitle}
      />
      {hasRatings && (
        <div className={styles.ratings}>
          {legend.ratings.map(({ axis, value }) => (
            <LegendSelectRatingBar key={axis} label={text.ratingAxes[axis]} value={value} />
          ))}
        </div>
      )}
    </>
  );
}
