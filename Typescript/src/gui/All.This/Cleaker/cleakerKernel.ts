import ME from "this.me";
import cleaker from "cleaker";
import render from "@/runtime/run-me";
import { normalizeEndpoint, readSessionUsername } from "./cleakerBridge";
import { SESSION_SECRET_STORAGE_KEY } from "./runtimeUsername";
import { writeKernelWindowLocation } from "@/core/session/createSeedSession";

export type CleakerKernelContext = {
  me: any;
  node: any;
  runtime: ReturnType<typeof render>;
  endpoint: string;
  rootNamespace: string;
  sessionNamespace: string;
  fetcher: typeof fetch;
};

type CreateCleakerKernelOptions = {
  endpoint: string;
  rootNamespace: string;
};

function readStorageValue(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return String(localStorage.getItem(key) || "").trim();
  } catch {
    return "";
  }
}

function createBrowserSemanticFetcher(): typeof fetch {
  return async (input, init) => {
    const nextInit = { ...(init || {}) } as RequestInit;
    const headers = new Headers(nextInit.headers || {});
    const requestedHost = headers.get("host") || headers.get("Host");

    if (requestedHost && !headers.has("x-forwarded-host")) {
      headers.set("x-forwarded-host", requestedHost);
    }

    headers.delete("host");
    headers.delete("Host");
    nextInit.headers = headers;
    return fetch(input, nextInit);
  };
}

function isPendingToken(value: unknown): value is { promise: Promise<unknown> } {
  if (!value || typeof value !== "object") return false;
  const maybePromise = (value as { promise?: unknown }).promise;
  return !!maybePromise && typeof (maybePromise as Promise<unknown>).then === "function";
}

export function buildSemanticTarget(namespace: string, path: string): string {
  const safeNamespace = String(namespace || "").trim().replace(/^\/+|\/+$/g, "");
  const safePath = String(path || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\./g, "/");

  if (!safeNamespace) return safePath ? `me://self:read/${safePath}` : "me://self:read/_";
  return `me://${safeNamespace}:read/${safePath || "_"}`;
}

export async function createCleakerKernelContext({
  endpoint,
  rootNamespace,
}: CreateCleakerKernelOptions): Promise<CleakerKernelContext> {
  const safeEndpoint = normalizeEndpoint(endpoint);
  const safeRootNamespace = String(rootNamespace || "").trim().toLowerCase();
  const sessionUsername = readSessionUsername();
  const sessionSecret = readStorageValue(SESSION_SECRET_STORAGE_KEY);
  const sessionNamespace =
    sessionUsername && safeRootNamespace ? `${sessionUsername}.${safeRootNamespace}` : "";

  const me = new ME() as any;
  writeKernelWindowLocation(me);
  const fetcher = createBrowserSemanticFetcher();

  const node = cleaker(me, {
    space: safeEndpoint,
    fetcher,
    namespace: sessionNamespace || undefined,
    secret: sessionNamespace && sessionSecret ? sessionSecret : undefined,
  }) as any;

  try {
    await node?.ready;
  } catch {
    // Public runtime should still work even if auto-open fails.
  }

  return {
    me,
    node,
    runtime: render(me),
    endpoint: safeEndpoint,
    rootNamespace: safeRootNamespace,
    sessionNamespace,
    fetcher,
  };
}

export async function resolveSemanticBranch(
  context: CleakerKernelContext | null | undefined,
  target: string,
): Promise<unknown> {
  if (typeof context?.node !== "function") return undefined;

  const initial = context.node(target);
  if (isPendingToken(initial)) {
    try {
      await initial.promise;
    } catch {
      // Keep behavior graceful for missing/unpublished branches.
    }
  }
  return context.node(target);
}

export function readKernelBranch(runtime: ReturnType<typeof render> | null | undefined, path: string): unknown {
  if (!runtime?.resolve) return undefined;
  return runtime.resolve(`me/${String(path || "").trim().replace(/^\/+/, "")}`, null, {
    type: "CleakerKernelRead",
    propKey: path,
  });
}
