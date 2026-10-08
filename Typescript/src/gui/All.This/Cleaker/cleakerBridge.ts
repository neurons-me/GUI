import {
  DEFAULT_CLEAKER_NAMESPACE_EXPRESSION,
  parseCleakerNamespaceExpression,
  buildCleakerNamespaceUrl,
} from "./namespaceExpression";
import {
  SESSION_CREDENTIALS_EVENT,
  SESSION_USERNAME_STORAGE_KEY,
  sanitizeCleakerUsername,
  extractUsernameFromHost,
} from "./runtimeUsername";

export const CLEAKER_NAMESPACE_STORAGE_KEY = "cleaker.namespace.v1";
export const DEFAULT_CLEAKER_THEME_ID = "mdrn.church";
export const DEFAULT_CLEAKER_THEME_MODE: "light" | "dark" = "light";

export type CleakerResolvedRoute = {
  path: string;
  pageKey: "home" | "blockchain" | "group" | "user";
  groupKey: string;
  username: string;
};

export type CleakerNamespacePreview = {
  namespaceExpression: string;
  endpoint: string;
  namespaceHandle: string;
  namespaceUrl: string;
};

export type ThemeScopeConfig = {
  scopeId: string;
  themeIdKey: string;
  themeModeKey: string;
  defaultThemeId: string;
  defaultMode: "light" | "dark";
};

function readStorageValue(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return String(localStorage.getItem(key) || "").trim();
  } catch {
    return "";
  }
}

function sanitizeThemeScopeToken(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_");
}

export function normalizeEndpoint(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function compactNamespaceDisplay(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.local$/i, "")
    .toLowerCase();
}

export function normalizeRoutePath(path: string): string {
  const raw = String(path || "").trim();
  if (!raw || raw === "#/" || raw === "#") return "/";
  const withoutHash = raw.startsWith("#") ? raw.slice(1) : raw;
  const prefixed = withoutHash.startsWith("/") ? withoutHash : `/${withoutHash}`;
  return prefixed.replace(/\/{2,}/g, "/") || "/";
}

export function readRouteFromHash(): string {
  if (typeof window === "undefined") return "/";
  return normalizeRoutePath(window.location.hash || "/");
}

export function writeRouteHash(path: string): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeRoutePath(path);
  const nextHash = normalized === "/" ? "#/" : `#${normalized}`;
  if (window.location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = nextHash;
}

export function resolveRoute(path: string): CleakerResolvedRoute {
  const normalized = normalizeRoutePath(path);
  const groupMatch = normalized.match(/^\/groups\/([^/]+)$/i);
  if (groupMatch) {
    return {
      path: normalized,
      pageKey: "group",
      groupKey: String(groupMatch[1] || "").trim().toLowerCase(),
      username: "",
    };
  }

  const userMatch = normalized.match(/^\/@([^/]+)$/i);
  if (userMatch) {
    return {
      path: normalized,
      pageKey: "user",
      groupKey: "",
      username: sanitizeCleakerUsername(String(userMatch[1] || "")),
    };
  }

  if (normalized === "/chain") {
    return {
      path: normalized,
      pageKey: "blockchain",
      groupKey: "",
      username: "",
    };
  }

  if (normalized === "/groups") {
    return {
      path: normalized,
      pageKey: "group",
      groupKey: "",
      username: "",
    };
  }

  return {
    path: normalized,
    pageKey: "home",
    groupKey: "",
    username: "",
  };
}

export function readCleakerNamespacePreview(
  explicitNamespaceExpression?: string,
  explicitEndpoint?: string,
): CleakerNamespacePreview {
  const namespaceExpression =
    String(explicitNamespaceExpression || "").trim() ||
    readStorageValue(CLEAKER_NAMESPACE_STORAGE_KEY) ||
    DEFAULT_CLEAKER_NAMESPACE_EXPRESSION;

  let parsed;
  try {
    parsed = parseCleakerNamespaceExpression(namespaceExpression);
  } catch {
    parsed = parseCleakerNamespaceExpression(DEFAULT_CLEAKER_NAMESPACE_EXPRESSION);
  }

  const windowOrigin =
    typeof window !== "undefined" && /^https?:\/\//i.test(String(window.location.origin || ""))
      ? String(window.location.origin).trim()
      : "";

  const fallbackEndpoint = windowOrigin || "http://localhost:8161";

  // When running on a local host (.local, localhost), always use the browser
  // origin as endpoint so API calls go to the same server that served the page.
  const isLocalHost =
    typeof window !== "undefined" &&
    /\.(local)$|^localhost$/i.test(window.location.hostname || "");

  const endpoint = normalizeEndpoint(
    explicitEndpoint || (isLocalHost ? windowOrigin : parsed.transport.origin) || fallbackEndpoint,
  );

  let namespaceUrl = "";
  try {
    namespaceUrl = buildCleakerNamespaceUrl(parsed, "");
  } catch {
    namespaceUrl = "";
  }

  // If the browser is on a user subdomain (jabellae.suis-macbook-air.local),
  // prefer that handle over the parsed constant from localStorage.
  const locationHandle =
    typeof window !== "undefined"
      ? extractUsernameFromHost(window.location.hostname || "")
      : "";
  const parsedHandle = String(parsed.constant || "").trim();
  const namespaceHandle = locationHandle || parsedHandle;

  return {
    namespaceExpression,
    endpoint,
    namespaceHandle,
    namespaceUrl,
  };
}

export function readSessionUsername(): string {
  return sanitizeCleakerUsername(readStorageValue(SESSION_USERNAME_STORAGE_KEY));
}

export function getThemeScope(input: {
  rootNamespace: string;
  subjectHandle?: string;
}): ThemeScopeConfig {
  const rootNamespace =
    compactNamespaceDisplay(input.rootNamespace) || "cleaker.me";
  const subjectHandle = String(input.subjectHandle || "").trim().toLowerCase();
  const rootScopeBase = `cleaker.gui.theme.root.${sanitizeThemeScopeToken(rootNamespace)}`;

  const rootThemeId =
    readStorageValue(`${rootScopeBase}.themeId`) || DEFAULT_CLEAKER_THEME_ID;
  const rootThemeMode =
    readStorageValue(`${rootScopeBase}.themeMode`) || DEFAULT_CLEAKER_THEME_MODE;

  if (subjectHandle) {
    const userScopeBase = `cleaker.gui.theme.user.${sanitizeThemeScopeToken(subjectHandle)}`;
    return {
      scopeId: `user:${subjectHandle}`,
      themeIdKey: `${userScopeBase}.themeId`,
      themeModeKey: `${userScopeBase}.themeMode`,
      defaultThemeId: rootThemeId,
      defaultMode: rootThemeMode === "dark" ? "dark" : "light",
    };
  }

  return {
    scopeId: `root:${rootNamespace}`,
    themeIdKey: `${rootScopeBase}.themeId`,
    themeModeKey: `${rootScopeBase}.themeMode`,
    defaultThemeId: DEFAULT_CLEAKER_THEME_ID,
    defaultMode: DEFAULT_CLEAKER_THEME_MODE,
  };
}

export function applyThemeScope(scope: ThemeScopeConfig): void {
  if (typeof window === "undefined") return;
  try {
    (window as any).__thisGuiThemeScope = () => scope;
    window.dispatchEvent(
      new CustomEvent("this.gui:themeScope:changed", {
        detail: scope,
      }),
    );
  } catch {
    // Ignore runtime event failures.
  }
}

export function readScopedThemeSelection(): {
  scopeId: string;
  defaultThemeId: string;
  themeId: string;
  mode: "light" | "dark";
} {
  const raw = (globalThis as any)?.__thisGuiThemeScope;
  const scope =
    typeof raw === "function"
      ? (raw() as Partial<ThemeScopeConfig> | null)
      : ((raw || null) as Partial<ThemeScopeConfig> | null);

  const themeIdKey = String(scope?.themeIdKey || "").trim();
  const themeModeKey = String(scope?.themeModeKey || "").trim();
  const defaultThemeId =
    String(scope?.defaultThemeId || DEFAULT_CLEAKER_THEME_ID).trim() ||
    DEFAULT_CLEAKER_THEME_ID;
  const defaultMode =
    scope?.defaultMode === "dark" ? "dark" : DEFAULT_CLEAKER_THEME_MODE;

  const themeId =
    readStorageValue(themeIdKey) ||
    readStorageValue("this.gui:themeId") ||
    defaultThemeId;
  const modeRaw =
    readStorageValue(themeModeKey) ||
    readStorageValue("this.gui:themeMode") ||
    defaultMode;

  return {
    scopeId: String(scope?.scopeId || "global").trim() || "global",
    defaultThemeId,
    themeId,
    mode: modeRaw === "dark" ? "dark" : "light",
  };
}

export function getNamespaceRefreshEvents(): string[] {
  return [
    SESSION_CREDENTIALS_EVENT,
    "storage",
    "cleaker:namespace-preview-changed",
  ];
}
