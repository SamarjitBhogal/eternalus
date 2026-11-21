import type { ReactElement } from 'react';

import type { ClassPanel } from '../../bridge/selectors/selectClassPanel';
import { InfoPanel } from '../components/InfoPanel';
import { STRINGS } from '../strings';
import { classPanelText } from './classPanelText';
import { ClassSelectLegendStrip } from './ClassSelectLegendStrip';
import { ViewDetailsScreen } from './ViewDetailsScreen';

const { characterSelect: text } = STRINGS;

/**
 * A class's View Details (DEC-103): the shown class's panel and Legends strip in 145:2's places,
 * each row labelled. Both class layouts open it with V and neither selects from it (DEC-109).
 */
export function ClassDetailsScreen({
  panel,
  isOpen,
  onClose,
}: {
  readonly panel: ClassPanel;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}): ReactElement {
  return (
    <ViewDetailsScreen isOpen={isOpen} onClose={onClose}>
      <InfoPanel
        layout="class-details"
        detailsHeader={null}
        rowLabels={text.detailLabels}
        {...classPanelText(panel)}
      />
      <ClassSelectLegendStrip items={panel.legendStrip} placement="view-details" />
    </ViewDetailsScreen>
  );
}
