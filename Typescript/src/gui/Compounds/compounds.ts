/*
 * This.GUI — Compounds registry
 * High-level UI compositions built from molecules and atoms.
 * Exported here so consumers can import from a single namespace.
 */
import Cleaker from '@/gui/All.This/Cleaker/Cleaker';
import Charts, {
  BarChart,
  LineChart,
  Slider as ChartsSlider,
} from '@/gui/Compounds/Charts';
// IMPORTANT:
// - Keep this registry explicit.
// - Do not `export *` from here.
// - Add new high-level compositions intentionally.
const Compounds = {
  Cleaker,
  Charts,
} as const;
export { Cleaker, Charts, LineChart, BarChart, ChartsSlider };
export { Compounds };
export default Compounds;
