import type * as React from "react";
import type { GuiNode } from "@/types/gui.types";

export type RegistryKind =
  | "atom"
  | "pattern"
  | "molecule"
  | "behavior"
  | "layout";

export type RegistryMeta = {
  id: string;
  label: string;
  kind: RegistryKind;
  path?: readonly string[];
  tags?: readonly string[];
  demoSpec?: GuiNode;
  [key: string]: any;
};

export type ResolveOutput = React.ReactElement | GuiNode | null;

export type RegistryEntry = {
  type: string;
  meta?: RegistryMeta;
  resolve: (spec: any, ctx?: ResolveCtx) => ResolveOutput;
};

export type GuiRegistry = Record<string, RegistryEntry>;
export type ResolveCtx = { theme?: any; [key: string]: any };
