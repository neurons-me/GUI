import type { MEInstance } from 'this.me';
import type { RuntimeAdapter } from '@/runtime/adapter';

export type MeTargetLike =
  | string
  | {
      scheme?: string;
      namespace?: string;
      operation?: string;
      path?: string;
      raw?: string;
      contextRaw?: string | null;
      [key: string]: any;
    };

export type MeLike =
  | MEInstance
  | ({
      (path: string): any;
      (path: string, value: any): any;
      execute?: (target: MeTargetLike, body?: any) => any;
      inspect?: (opts?: any) => any;
      explain?: (path: string) => any;
      subscribe?: (path: string, callback: () => void) => (() => void) | void;
      [key: string]: any;
    } & Record<string, any>);

export type MeSubscribeBridge = (path: string, callback: () => void) => (() => void) | void;

export type MeRuntimeContextValue = {
  /**
   * null before any identity is authenticated — MeRuntimeProvider now
   * mounts at a permanently stable tree position (see its own doc comment)
   * so a session completing does not remount whatever's underneath it;
   * consumers that require a live kernel must check for null explicitly
   * (useMeRuntime() does this and throws) rather than assuming one exists.
   */
  me: MeLike | null;
  runtime: RuntimeAdapter | null;
  subscribe?: MeSubscribeBridge | null;
};
