import { normalizeProofMessage } from "this.me";
import { normalizeEndpoint, writeRouteHash } from "./cleakerBridge";

export type SemanticCommitEvent = {
  namespace: string;
  path: string;
  operator?: string | null;
  data: unknown;
  timestamp?: number;
};

// Deliberately a minimal structural type, not an import of SeedSession from
// core/session -- this module only ever needs these three things to prove
// authorship of a commit, and staying structural avoids coupling groupsApi
// (an All.This/Cleaker module) to the session layer that already imports
// FROM All.This/Cleaker (signedRequest.ts), which core/session's
// createCleakerSession.ts depends on.
export type CommitSigner = {
  identityHash: string;
  semanticNamespace: string | null;
  signPayload?(message: string): Promise<string>;
};

export type GroupCreationInput = {
  endpoint: string;
  rootNamespace: string;
  groupKey: string;
  name: string;
  session: CommitSigner;
};

export function normalizeGroupKey(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
}

export function inferGroupKey(name: string): string {
  return normalizeGroupKey(name);
}

export function createGroupId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function commitSemanticEvents(
  endpoint: string,
  events: SemanticCommitEvent[],
  session: CommitSigner,
): Promise<void> {
  const safeEndpoint = normalizeEndpoint(endpoint);
  if (!safeEndpoint) throw new Error("Missing monad.ai endpoint");
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error("No semantic events to commit");
  }
  const identityHash = String(session?.identityHash || "").trim();
  const namespace = String(session?.semanticNamespace || "").trim().toLowerCase();
  if (!identityHash || !namespace) {
    throw new Error("An open cleaker session is required to commit semantic events");
  }
  if (typeof session.signPayload !== "function") {
    throw new Error("This session cannot sign writes (signPayload unavailable)");
  }

  // Sign the exact fields the server independently recomputes and checks
  // against (monad's syncHandler.ts commitHandler + isNamespaceWriteAuthorized)
  // -- normalizeProofMessage is this.me's own canonical-JSON serializer,
  // algorithmically identical to monad's toStableJson (same recursive
  // sorted-key construction), so both sides produce the same bytes to sign
  // / verify without either package needing to import the other's copy.
  const signedFields = { events, identityHash, namespace };
  const signature = await session.signPayload(normalizeProofMessage(signedFields));

  const response = await fetch(`${safeEndpoint}/api/v1/commit`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ ...signedFields, signature }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      String((payload as { error?: string } | null)?.error || `HTTP ${response.status}`),
    );
  }

  const results = Array.isArray((payload as { results?: unknown[] } | null)?.results)
    ? ((payload as { results: Array<{ ok?: boolean; error?: string }> }).results || [])
    : [];
  const failed = results.filter((entry) => !entry?.ok);
  if (failed.length > 0) {
    throw new Error(
      failed.map((entry) => String(entry.error || "Semantic commit failed")).join("; "),
    );
  }
}

export async function createGroup({
  endpoint,
  rootNamespace,
  groupKey,
  name,
  session,
}: GroupCreationInput): Promise<{ groupKey: string; namespace: string }> {
  const safeRootNamespace = String(rootNamespace || "").trim().toLowerCase();
  const safeGroupKey = normalizeGroupKey(groupKey);
  const safeName = String(name || "").trim();
  // The server verifies created_by/member.<username> against the SIGNER's
  // own namespace (see syncHandler.ts's findAttributionMismatch) -- using
  // anything other than session.semanticNamespace itself as the source of
  // "who is creating this" would just produce a value the server rejects.
  const creatorNamespace = String(session?.semanticNamespace || "").trim().toLowerCase();
  const safeCreator = creatorNamespace.split(".")[0] || "";

  if (!safeRootNamespace) throw new Error("Missing root namespace");
  if (!safeGroupKey) throw new Error("Group key is required");
  if (!safeName) throw new Error("Group name is required");
  if (!creatorNamespace) throw new Error("An open cleaker session is required to create a group");

  const timestamp = Date.now();
  const createdAt = new Date(timestamp).toISOString();
  const groupId = createGroupId();

  const events: SemanticCommitEvent[] = [
    {
      namespace: safeRootNamespace,
      path: `groups.${safeGroupKey}.id`,
      data: groupId,
      timestamp,
    },
    {
      namespace: safeRootNamespace,
      path: `groups.${safeGroupKey}.name`,
      data: safeName,
      timestamp: timestamp + 1,
    },
    {
      namespace: safeRootNamespace,
      path: `groups.${safeGroupKey}.created_at`,
      data: createdAt,
      timestamp: timestamp + 2,
    },
  ];

  events.push(
    {
      namespace: safeRootNamespace,
      path: `groups.${safeGroupKey}.created_by`,
      data: creatorNamespace,
      timestamp: timestamp + 3,
    },
    {
      namespace: safeRootNamespace,
      path: `groups.${safeGroupKey}.member.${safeCreator}`,
      data: creatorNamespace,
      timestamp: timestamp + 4,
    },
  );

  await commitSemanticEvents(endpoint, events, session);
  return {
    groupKey: safeGroupKey,
    namespace: safeRootNamespace,
  };
}

export function openCreatedGroup(groupKey: string): void {
  writeRouteHash(`/groups/${normalizeGroupKey(groupKey)}`);
}
