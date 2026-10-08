// This.GUI — widgets barrel
// Re-export widgets from a single entrypoint.
import HighLighter from './HighLighter/HighLighter';
import HighLightsDrawer from './HighLighter/HighLightsDrawer';
import FaceRecognition from './FaceRecognition/FaceRecognition';
// Lazy+Suspense wrapper, not the concrete component — RubiksCube.tsx pulls
// in @react-three/fiber -> react-reconciler, which crashes under React 19
// if imported eagerly (see RubiksCubeLazy.tsx). This barrel isn't wired
// into a published entry point today, but importing the wrapper here too
// means it stays correct if that changes.
import RubiksCube from './RubiksCube/RubiksCubeLazy';
import Monad from '../All.This/monad.ai/monad.ai';
export type { MonadProps } from '../All.This/monad.ai/monad.ai';
export { HighLighter };
export type { HighLighterProps, HighLighterColor } from './HighLighter/HighLighter';
export { DEFAULT_COLORS as HIGH_LIGHTER_DEFAULT_COLORS } from './HighLighter/HighLighter';
export { HighLightsDrawer };
export type { HighLightsDrawerProps, HighLightsFilterMode } from './HighLighter/HighLightsDrawer';
export { FaceRecognition };
export { RubiksCube };
export type { RubiksCubeProps } from './RubiksCube/RubiksCube.types';
export { Monad };
// Default registry (mirrors components/molecules barrels)
const Widgets = {
  HighLighter,
  HighLightsDrawer,
  FaceRecognition,
  RubiksCube,
  Monad,
};

export default Widgets;
