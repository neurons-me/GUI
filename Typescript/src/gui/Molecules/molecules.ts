/*
 * .GUI — Molecules
╔╦╗┌─┐┬  ┌─┐┌─┐┬ ┬┬  ┌─┐┌─┐
║║║│ ││  ├┤ │  │ ││  ├┤ └─┐
╩ ╩└─┘┴─┘└─┘└─┘└─┘┴─┘└─┘└─┘    
 * Composed from atoms and basic primitives.
 * Export rules (consistency + ergonomics):
 *  - Keep a `Theme` namespace for theme-related molecules.
 *  - Theme molecules are exported only under `Theme` (no top-level named exports).
 *  - Avoid `export *` patterns here; be explicit to keep the public API stable.
 * Ordering convention:
 *  1) component imports
 *  2) type imports
 *  3) nested namespaces (e.g. Theme)
 *  4) registry object
 *  5) named exports
 *  6) type exports
 *  7) default export
Atoms:
“I can do X”
Molecules:
“Use these atoms to achieve Y”
Configurations emerge from constraints.*/

//rule number 1 of molecules.

// do not expand components faster than the eye can follow. 
// If you have to add a new component, add it at the end of the list, not in the middle. 
// This way, when someone is reading through the file, 
// they won't be surprised by new components appearing in the middle of the list.  

// This also helps with git history, as new components will be added in a consistent place,
// making it easier to track changes over time.


// Components
import Dialog from '@/gui/Molecules/Dialog/Dialog';
import { Hero } from '@/gui/Molecules/Hero/Hero';
import Modal from '@/gui/Molecules/Modal/Modal';
import type { ModalProps } from '@/gui/Molecules/Modal/Modal.types';
import Page from '@/gui/Molecules/Page/Page';
import CodeBlock from '@/gui/Molecules/CodeBlock/CodeBlock';
import MarkdownDocument from '@/gui/Molecules/Documents/MarkdownDocument/MarkdownDocument';
export type { MarkdownDocumentProps } from '@/gui/Molecules/Documents/MarkdownDocument';
export {
  defaultMarkdownPolicy,
  defaultMarkdownStyles,
  markdownToGuiNodes,
  mergeMarkdownPolicy,
  parseMarkdown,
  resolveMarkdownUrl,
} from '@/gui/Molecules/Documents/MarkdownDocument';
export type {
  MarkdownPolicy,
  MarkdownStyleMap,
  MarkdownToGuiNodesOptions,
} from '@/gui/Molecules/Documents/MarkdownDocument';
// Types
import type { ComponentType } from 'react';
import type { DialogProps } from '@/gui/Molecules/Dialog/Dialog';
import type { HeroProps } from '@/gui/Molecules/Hero/Hero.types';
import type PageProps from '@/gui/Molecules/Page/Page';
import type { CodeBlockProps } from '@/gui/Molecules/CodeBlock/CodeBlock';
//List
// List and related are not polymorphic so we wrap them with forwardRef
import List, { type ListProps } from '@/gui/Molecules/List/List';
export type { ListProps } from '@/gui/Molecules/List/List';
import ListItem, { type ListItemProps } from '@/gui/Molecules/List/ListItem/ListItem';
export type { ListItemProps } from '@/gui/Molecules/List/ListItem/ListItem';
import ListItemButton, { type ListItemButtonProps } from '@/gui/Molecules/List/ListItemButton/ListItemButton';
export type { ListItemButtonProps } from '@/gui/Molecules/List/ListItemButton/ListItemButton';
import ListItemIcon, { type ListItemIconProps } from '@/gui/Molecules/List/ListItemIcon/ListItemIcon';
export type { ListItemIconProps } from '@/gui/Molecules/List/ListItemIcon/ListItemIcon';
import ListItemText, { type ListItemTextProps } from '@/gui/Molecules/List/ListItemText/ListItemText';
export type { ListItemTextProps } from '@/gui/Molecules/List/ListItemText/ListItemText';
import Grid from '@/gui/Molecules/Grid/Grid';
export type { GridProps } from '@/gui/Molecules/Grid/Grid.types';
import Collapse, { type CollapseProps } from '@/gui/Molecules/Collapse/Collapse';
export type { CollapseProps } from '@/gui/Molecules/Collapse/Collapse';
import Drawer, { type DrawerProps } from '@/gui/Molecules/Drawer/Drawer';
export type { DrawerProps } from '@/gui/Molecules/Drawer/Drawer';
import Menu, { type MenuProps } from '@/gui/Molecules/Menu/Menu';
export type { MenuProps } from '@/gui/Molecules/Menu/Menu';
import MenuItem, { type MenuItemProps } from '@/gui/Molecules/Menu/MenuItem/MenuItem';
export type { MenuItemProps } from '@/gui/Molecules/Menu/MenuItem/MenuItem';
import Stack, { type StackProps } from '@/gui/Molecules/Stack/Stack';
export type { StackProps } from '@/gui/Molecules/Stack/Stack';
import Table, { type TableProps } from '@/gui/Molecules/Table/Table';
export type { TableProps } from '@/gui/Molecules/Table/Table';
import TableBody, { type TableBodyProps } from '@/gui/Molecules/Table/Body/TableBody';
export type { TableBodyProps } from '@/gui/Molecules/Table/Body/TableBody';
import TableCell, { type TableCellProps } from '@/gui/Molecules/Table/Cell/TableCell';
export type { TableCellProps } from '@/gui/Molecules/Table/Cell/TableCell';
import TableHead, { type TableHeadProps } from '@/gui/Molecules/Table/Head/TableHead';
export type { TableHeadProps } from '@/gui/Molecules/Table/Head/TableHead';
import TableRow, { type TableRowProps } from '@/gui/Molecules/Table/Row/TableRow';
export type { TableRowProps } from '@/gui/Molecules/Table/Row/TableRow';
import Toolbar, { type ToolbarProps } from '@/gui/Molecules/Toolbar/Toolbar';
export type { ToolbarProps } from '@/gui/Molecules/Toolbar/Toolbar';
// Tooltip moved to Atoms/ (2026-08) — its own resolver already declared group: 'Atoms'.
// Import from '@/gui/atoms' now.
import AdminViewToggle from '@/gui/Molecules/AdminViewToggle/AdminViewToggle';
export type { AdminViewToggleProps } from '@/gui/Molecules/AdminViewToggle/AdminViewToggle.types';
import InspectorToggle from '@/gui/Molecules/InspectorToggle/InspectorToggle';
export type { InspectorToggleProps } from '@/gui/Molecules/InspectorToggle/InspectorToggle.types';
import SearchField from '@/gui/Molecules/SearchField/SearchField';
export type { SearchFieldProps, SearchFieldResult } from '@/gui/Molecules/SearchField/SearchField.types';
import Gauge, { type GaugeProps } from '@/gui/Molecules/Gauge/Gauge';
export type { GaugeProps } from '@/gui/Molecules/Gauge/Gauge';
type MoleculesRegistry = {
  Dialog: typeof Dialog;
  Hero: typeof Hero;
  // NOTE: We intentionally widen Modal here to avoid TS4023 (`ModalProps` cannot be named)
  // when generating .d.ts for the registry object.
  Modal: ComponentType<ModalProps>;
  Page: typeof Page;
  CodeBlock: typeof CodeBlock;
  MarkdownDocument: typeof MarkdownDocument;
  List: typeof List;
  ListItem: typeof ListItem;
  ListItemButton: typeof ListItemButton;
  ListItemIcon: typeof ListItemIcon;
  ListItemText: typeof ListItemText;
  Grid: typeof Grid;
  Collapse: typeof Collapse;
  Drawer: typeof Drawer;
  Menu: typeof Menu;
  MenuItem: typeof MenuItem;
  Stack: typeof Stack;
  Table: typeof Table;
  TableBody: typeof TableBody;
  TableCell: typeof TableCell;
  TableHead: typeof TableHead;
  TableRow: typeof TableRow;
  Toolbar: typeof Toolbar;
  AdminViewToggle: typeof AdminViewToggle;
  InspectorToggle: typeof InspectorToggle;
  SearchField: typeof SearchField;
  Gauge: typeof Gauge;
};

const Molecules: MoleculesRegistry = {
  Dialog,
  Hero,
  Modal,
  Page,
  CodeBlock,
  MarkdownDocument,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Grid,
  Collapse,
  Drawer,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  AdminViewToggle,
  InspectorToggle,
  SearchField,
  Gauge,
};

export {
  Dialog,
  Hero,
  Modal,
  Page,
  CodeBlock,
  MarkdownDocument,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Grid,
  Collapse,
  Drawer,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  AdminViewToggle,
  InspectorToggle,
  SearchField,
  Gauge,
};

export type {
  DialogProps,
  PageProps,
  HeroProps,
  CodeBlockProps,
  ModalProps,
};

export default Molecules;
