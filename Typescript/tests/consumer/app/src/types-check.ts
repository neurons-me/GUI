// Types of every public entry resolve from the package and are REAL types. With skipLibCheck (the usual setting) a
// declaration that imports something unresolvable silently degrades to an `any`-like type and reports nothing, so "no
// errors" proves nothing. Each assignment below MUST be a type error; if the export's type is `any`, the assignment
// passes and its @ts-expect-error is reported as unused (TS2578): the check fails.
import { Theme, ThemeModeToggle, Layout, Link } from 'this.gui';
import { mount } from 'this.gui/runtime';
import { SeedSessionProvider } from 'this.gui/react';
import { RuntimeInspector } from 'this.gui/devtools';
import { canonicalJson } from 'this.gui/cleaker';
import { Box } from 'this.gui/atoms';
import { Dialog } from 'this.gui/molecules';
import { AllThis } from 'this.gui/compounds';
import { AllThis as AllThisComponents } from 'this.gui/components';

declare const brand: unique symbol;
type Brand = { [brand]: true };
// @ts-expect-error a real type is not a Brand
export const theme: Brand = Theme;
// @ts-expect-error a real type is not a Brand
export const toggle: Brand = ThemeModeToggle;
// @ts-expect-error a real type is not a Brand
export const layout: Brand = Layout;
// @ts-expect-error a real type is not a Brand
export const link: Brand = Link;
// @ts-expect-error a real type is not a Brand
export const runtime: Brand = mount;
// @ts-expect-error a real type is not a Brand
export const react: Brand = SeedSessionProvider;
// @ts-expect-error a real type is not a Brand
export const devtools: Brand = RuntimeInspector;
// @ts-expect-error a real type is not a Brand
export const cleaker: Brand = canonicalJson;
// @ts-expect-error a real type is not a Brand
export const atoms: Brand = Box;
// @ts-expect-error a real type is not a Brand
export const molecules: Brand = Dialog;
// @ts-expect-error a real type is not a Brand
export const compounds: Brand = AllThis;
// @ts-expect-error a real type is not a Brand
export const components: Brand = AllThisComponents;
