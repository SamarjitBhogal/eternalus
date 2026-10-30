import type { ReactElement } from 'react';

import type { LegendCardView } from '../../bridge/selectors/selectLegendStepView';
import { InfoPanel } from '../components/InfoPanel';
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

/**
 * A Legend's details on the left of the Legend step and the locked view (58:271): its panel
 * (title, role line, description, detail rows) and its rating bars, placed in the step's
 * artboard. `shouldFocusTitle` focuses the title on mount (the locked view, DEC-60).
 */
export function LegendDetailsPanel({
  legend,
  shouldFocusTitle = false,
}: {
  readonly legend: LegendCardView;
  readonly shouldFocusTitle?: boolean;
}): ReactElement {
  return (
    <>
      <InfoPanel
        layout="legend"
        title={legend.legendName ?? legend.subClassName}
        subtitle={roleLine(legend)}
        subtitleAccentToken={legend.accentToken}
        description={legend.description}
        detailsHeader={text.legendDetailsHeader}
        rows={legend.details}
        shouldFocusTitle={shouldFocusTitle}
      />
      <div className={styles.ratings}>
        {legend.ratings.map(({ axis, value }) => (
          <LegendSelectRatingBar key={axis} label={text.ratingAxes[axis]} value={value} />
        ))}
      </div>
    </>
  );
}
