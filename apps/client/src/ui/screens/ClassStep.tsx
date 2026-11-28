import type { ComponentType, ReactElement } from 'react';

import type { ClassSelectLayout } from '../../bridge/catalogue.types';
import { useAppSelector } from '../../bridge/hooks';
import { contentSlice } from '../../bridge/slices/contentSlice';
import type { SelectionStepProps } from './characterSelect.types';
import { ClassSelectAltStep } from './ClassSelectAltStep';
import { ClassSelectStep } from './ClassSelectStep';

/** Which component draws the class step (DEC-52: a content switch, never a player setting). */
const CLASS_STEP_LAYOUTS: Readonly<Record<ClassSelectLayout, ComponentType<SelectionStepProps>>> = {
  primary: ClassSelectStep,
  alternate: ClassSelectAltStep,
};

/** The class step of character select in the catalogue's layout (`classSelectLayout`). */
export function ClassStep(props: SelectionStepProps): ReactElement {
  const layout = useAppSelector(contentSlice.selectors.selectClassSelectLayout);
  const Layout = CLASS_STEP_LAYOUTS[layout];
  return <Layout {...props} />;
}
