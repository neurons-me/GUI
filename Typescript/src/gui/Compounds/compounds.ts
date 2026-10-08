/*
 * This.GUI — Compounds registry
 * High-level UI compositions built from molecules and atoms.
 * Exported here so consumers can import from a single namespace.
 */
import AllThis from '@/gui/All.This/All.This';
import Cleaker from '@/gui/All.This/Cleaker/Cleaker';
import SearchBar from '@/gui/All.This/SearchBar/SearchBar';
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
  AllThis,
  Cleaker,
  SearchBar,
  Charts,
} as const;
export { AllThis, Cleaker, SearchBar, Charts, LineChart, BarChart, ChartsSlider };
export type { JsonSearchItem, JsonSearchIcon, SearchBarProps } from '@/gui/All.This/SearchBar/SearchBar.types';
export { Compounds };
export default Compounds;
