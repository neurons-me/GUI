import {
  SESSION_CREDENTIALS_EVENT,
  SESSION_USERNAME_STORAGE_KEY,
  sanitizeCleakerUsername,
} from "./runtimeUsername";

export type CleakerResolvedRoute = {
  path: string;
  pageKey: "home" | "blockchain" | "group" | "user";
  groupKey: string;
  username: string;
};

function readStorageValue(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return String(localStorage.getItem(key) || "").trim();
  } catch {
    return "";
  }
}

export function normalizeEndpoint(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  return withProtocol.replace(/\/+$/, "");
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

export function readSessionUsername(): string {
  return sanitizeCleakerUsername(readStorageValue(SESSION_USERNAME_STORAGE_KEY));
}

export function getNamespaceRefreshEvents(): string[] {
  return [
    SESSION_CREDENTIALS_EVENT,
    "storage",
    "cleaker:namespace-preview-changed",
  ];
}
