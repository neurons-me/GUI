import React, { useEffect, useMemo, useState } from "react";
import { Avatar, Box, Button, Chip, Link, TextField, Typography, Tooltip } from "@/gui/Atoms";
import Icon from "@/gui/Atoms/Icon/Icon";
import { useGuiTheme } from "@/gui-internals/Hooks";
import { buildCleakerNamespaceUrl, parseCleakerNamespaceExpression } from "../namespaceExpression";
import { readCleakerBootstrap, type CleakerBootstrapInfo } from "../runtimeUsername";
import { resolveSemanticRootName } from "../surfaceModel";
import { normalizeEndpoint } from "../cleakerBridge";
import {
  buildSemanticTarget,
  createCleakerKernelContext,
  readKernelBranch,
  resolveSemanticBranch,
  type CleakerKernelContext,
} from "../cleakerKernel";
import {
  createGroup,
  inferGroupKey,
  normalizeGroupKey,
  openCreatedGroup,
} from "../groupsApi";
import { useOptionalSeedSessionContext } from "@/react/session/SeedSessionProvider";

export interface CleakerGroupProps {
  endpoint?: string;
  groupKey?: string;
  namespaceExpression?: string;
  namespaceHandle?: string;
  rootHostNamespace?: string;
  resolverHostName?: string;
  namespaceUrl?: string;
  kernel?: CleakerKernelContext | null;
}

type RoleSchema = {
  status?: string;
  behavior?: {
    type?: string;
    iterator?: string;
  };
  suggest?: {
    contains?: string[];
  };
};

type GroupValue = {
  id?: string;
  name?: string;
  created_at?: string;
  created_by?: string;
  member?: Record<string, unknown>;
  [key: string]: unknown;
};

type MemberEntry = {
  key: string;
  username: string;
  namespace: string;
};

function compactNamespaceName(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.local$/i, "")
    .toLowerCase();
}

function formatGroupLabel(groupKey: string): string {
  return String(groupKey || "")
    .trim()
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function shortHash(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "—";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function extractPointerNamespace(value: unknown): string {
  if (typeof value === "string") return String(value).trim();
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  const pointer = record.__ptr || record.pointer || record.namespace || record.href || "";
  return String(pointer || "").trim();
}

function buildMemberEntries(groupValue: GroupValue | null): MemberEntry[] {
  const collection = groupValue?.member;
  if (!collection || typeof collection !== "object") return [];

  return Object.entries(collection)
    .map(([key, value]) => ({
      key,
      username: String(key || "").trim().toLowerCase(),
      namespace: extractPointerNamespace(value),
    }))
    .filter((entry) => entry.username);
}

function getMemberAvatarLabel(username: string): string {
  const clean = String(username || "").trim().replace(/^@+/, "");
  if (!clean) return "?";
  return clean.slice(0, 2).toUpperCase();
}

function sortGroups(groups: Record<string, GroupValue>): Array<[string, GroupValue]> {
  return Object.entries(groups || {}).sort((a, b) => {
    const timeA = Number(new Date(String(a[1]?.created_at || 0)).getTime() || 0);
    const timeB = Number(new Date(String(b[1]?.created_at || 0)).getTime() || 0);
    if (timeA !== timeB) return timeB - timeA;
    return a[0].localeCompare(b[0]);
  });
}

export default function CleakerGroup({
  endpoint = "http://localhost:8161",
  groupKey = "",
  namespaceExpression = "",
  namespaceHandle = "",
  rootHostNamespace = "",
  resolverHostName = "",
  namespaceUrl = "",
  kernel = null,
}: CleakerGroupProps) {
  const theme = useGuiTheme();
  // The real, logged-in cleaker session -- not `kernel` (createCleakerKernelContext's
  // `new ME()` has no active expression, can't sign anything; see groupsApi.ts's
  // CommitSigner). Group creation writes must be attributable to whoever is
  // actually signed in, which is what this provides.
  const session = useOptionalSeedSessionContext()?.session ?? null;
  const safeEndpoint = useMemo(() => normalizeEndpoint(endpoint), [endpoint]);
  const [bootstrapInfo, setBootstrapInfo] = useState<CleakerBootstrapInfo | null>(null);
  const [localKernel, setLocalKernel] = useState<CleakerKernelContext | null>(null);
  const [groups, setGroups] = useState<Record<string, GroupValue>>({});
  const [groupSchema, setGroupSchema] = useState<RoleSchema | null>(null);
  const [memberSchema, setMemberSchema] = useState<RoleSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [draftName, setDraftName] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const previewNamespace = useMemo(() => {
    const candidate = String(namespaceUrl || namespaceExpression || endpoint || "").trim();
    if (!candidate) return null;
    try {
      return parseCleakerNamespaceExpression(candidate);
    } catch {
      return null;
    }
  }, [endpoint, namespaceExpression, namespaceUrl]);

  const rootNamespace = useMemo(() => {
    return (
      resolveSemanticRootName({
        namespaceHandle,
        resolverHostName: bootstrapInfo?.resolverHostName || resolverHostName,
        rootHostNamespace,
      }) ||
      String(namespaceHandle || rootHostNamespace || "cleaker.me").trim().toLowerCase()
    );
  }, [
    bootstrapInfo?.resolverHostName,
    namespaceHandle,
    resolverHostName,
    rootHostNamespace,
  ]);

  const namespaceLabel = useMemo(() => {
    return compactNamespaceName(rootNamespace || "cleaker.me") || "cleaker.me";
  }, [rootNamespace]);

  const rootNamespaceUrl = useMemo(() => {
    if (namespaceUrl) {
      try {
        return buildCleakerNamespaceUrl(namespaceUrl, "");
      } catch {
        // ignore malformed explicit namespace url
      }
    }

    if (previewNamespace) {
      try {
        return buildCleakerNamespaceUrl(previewNamespace, "");
      } catch {
        // ignore malformed preview namespace
      }
    }

    const host = String(bootstrapInfo?.resolverHostName || resolverHostName || "").trim();
    const protocol = previewNamespace?.transport.protocol || "http";
    const port = previewNamespace?.transport.port;
    if (!host) return safeEndpoint;
    return `${protocol}://${port == null ? host : `${host}:${port}`}`;
  }, [
    bootstrapInfo?.resolverHostName,
    namespaceUrl,
    previewNamespace,
    resolverHostName,
    safeEndpoint,
  ]);

  useEffect(() => {
    if (kernel || !safeEndpoint || !rootNamespace) {
      setLocalKernel(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const nextKernel = await createCleakerKernelContext({
          endpoint: safeEndpoint,
          rootNamespace,
        });
        if (!cancelled) {
          setLocalKernel(nextKernel);
        }
      } catch (kernelError: unknown) {
        if (!cancelled) {
          const message =
            kernelError instanceof Error
              ? kernelError.message
              : "Failed to initialize group kernel";
          setError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kernel, rootNamespace, safeEndpoint]);

  useEffect(() => {
    if (!safeEndpoint) {
      setBootstrapInfo(null);
      return;
    }

    let cancelled = false;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;

    (async () => {
      const payload = await readCleakerBootstrap(safeEndpoint, controller?.signal);
      if (!cancelled) {
        setBootstrapInfo(payload);
      }
    })();

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [safeEndpoint]);

  const activeKernel = kernel || localKernel || null;
  const activeRuntime = activeKernel?.runtime || null;

  useEffect(() => {
    if (!activeKernel || !activeRuntime || !rootNamespace) {
      setGroups({});
      setGroupSchema(null);
      setMemberSchema(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          resolveSemanticBranch(activeKernel, buildSemanticTarget(rootNamespace, "groups")),
          resolveSemanticBranch(activeKernel, buildSemanticTarget(rootNamespace, "schema.role.group")),
          resolveSemanticBranch(activeKernel, buildSemanticTarget(rootNamespace, "schema.role.member")),
        ]);

        if (cancelled) return;

        const groupsValue = readKernelBranch(activeRuntime, "groups");
        const groupRoleValue = readKernelBranch(activeRuntime, "schema.role.group");
        const memberRoleValue = readKernelBranch(activeRuntime, "schema.role.member");

        setGroups(
          groupsValue && typeof groupsValue === "object"
            ? (groupsValue as Record<string, GroupValue>)
            : {},
        );
        setGroupSchema(
          groupRoleValue && typeof groupRoleValue === "object"
            ? (groupRoleValue as RoleSchema)
            : null,
        );
        setMemberSchema(
          memberRoleValue && typeof memberRoleValue === "object"
            ? (memberRoleValue as RoleSchema)
            : null,
        );

        const safeGroupKey = normalizeGroupKey(groupKey);
        if (safeGroupKey && (!groupsValue || typeof groupsValue !== "object" || !(safeGroupKey in (groupsValue as Record<string, unknown>)))) {
          setError(`Group "${safeGroupKey}" not found`);
        }
      } catch (loadError: unknown) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "Failed to load groups";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeKernel, activeRuntime, groupKey, reloadToken, rootNamespace]);

  const sortedGroups = useMemo(() => sortGroups(groups), [groups]);
  const safeGroupKey = useMemo(() => normalizeGroupKey(groupKey), [groupKey]);
  const selectedGroup = useMemo(() => {
    return safeGroupKey ? groups[safeGroupKey] || null : null;
  }, [groups, safeGroupKey]);
  const members = useMemo(() => buildMemberEntries(selectedGroup), [selectedGroup]);

  useEffect(() => {
    if (!safeGroupKey || selectedGroup || String(draftName || "").trim()) return;
    setDraftKey((current) => (String(current || "").trim() ? current : safeGroupKey));
  }, [draftName, safeGroupKey, selectedGroup]);

  const groupRoleType = String(groupSchema?.behavior?.type || "").trim().toLowerCase();
  const memberRoleType = String(memberSchema?.behavior?.type || "").trim().toLowerCase();
  const memberContains = Array.isArray(memberSchema?.suggest?.contains)
    ? memberSchema?.suggest?.contains || []
    : [];

  const groupTitle =
    String(selectedGroup?.name || "").trim() || formatGroupLabel(safeGroupKey) || "Group";
  const createdAtLabel = selectedGroup?.created_at
    ? new Date(String(selectedGroup.created_at)).toLocaleString()
    : "";

  const renderMemberLink = (entry: MemberEntry) => {
    const pointerNamespace = entry.namespace;
    let href = "";

    try {
      if (rootNamespaceUrl) {
        href = buildCleakerNamespaceUrl(rootNamespaceUrl, entry.username);
      } else if (pointerNamespace) {
        href = buildCleakerNamespaceUrl(pointerNamespace);
      }
    } catch {
      href = "";
    }

    return href;
  };

  const handleCreate = async () => {
    const nextName = String(draftName || "").trim();
    const nextKey = normalizeGroupKey(draftKey || inferGroupKey(nextName));
    if (!rootNamespace) {
      setCreateError("Missing root namespace");
      return;
    }
    if (!nextName) {
      setCreateError("Group name is required");
      return;
    }
    if (!nextKey) {
      setCreateError("Group key is required");
      return;
    }
    if (!session) {
      setCreateError("Sign in to create a group");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      await createGroup({
        endpoint: safeEndpoint,
        rootNamespace,
        groupKey: nextKey,
        name: nextName,
        session,
      });
      setDraftName("");
      setDraftKey("");
      setReloadToken((value) => value + 1);
      openCreatedGroup(nextKey);
    } catch (creationError: unknown) {
      setCreateError(
        creationError instanceof Error ? creationError.message : "Failed to create group",
      );
    } finally {
      setCreating(false);
    }
  };

  const renderCreatePanel = (title: string, body: string) => (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {body}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 1,
        }}
      >
        <TextField
          label="Group Name"
          value={draftName}
          onChange={(event) => {
            const value = event.target.value;
            setDraftName(value);
            if (!String(draftKey || "").trim()) {
              setDraftKey(inferGroupKey(value));
            }
          }}
          placeholder="Core Dev Team"
          size="small"
          fullWidth
        />
        <TextField
          label="Group Key"
          value={draftKey}
          onChange={(event) => setDraftKey(normalizeGroupKey(event.target.value))}
          placeholder="core-dev-team"
          size="small"
          fullWidth
        />
      </Box>

      {createError ? (
        <Typography variant="body2" sx={{ color: "error.main" }}>
          {createError}
        </Typography>
      ) : null}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={creating}
          startIcon={<Icon name="add" fontSize={18} />}
        >
          {creating ? "Creating…" : "Create Group"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setDraftName("");
            setDraftKey("");
            setCreateError(null);
          }}
          disabled={creating}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );

  if (!safeGroupKey) {
    return (
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          padding: "1.5rem",
          maxWidth: "900px",
          margin: "0 auto",
          background: "background.paper",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Groups
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Namespace:{" "}
            <Box component="span" sx={{ fontFamily: "monospace", color: "text.primary" }}>
              {namespaceLabel}
            </Box>
          </Typography>
        </Box>

        {renderCreatePanel(
          "Initialize a Group",
          "Create a real group directly in the root .me namespace. This writes group memories to monad.ai, not demo seed data.",
        )}

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Existing Groups
            </Typography>
            <Chip size="small" variant="outlined" label={`${sortedGroups.length}`} />
          </Box>

          {loading ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Loading groups…
            </Typography>
          ) : sortedGroups.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No real groups published yet.
            </Typography>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1 }}>
              {sortedGroups.map(([key, value]) => (
                <Box
                  key={key}
                  component="a"
                  href={`#/groups/${key}`}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    color: "inherit",
                    textDecoration: "none",
                    bgcolor: "background.paper",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.35,
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "background.nav",
                    },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {String(value?.name || "").trim() || formatGroupLabel(key)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                    {`groups.${key}`}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {value?.created_at
                      ? new Date(String(value.created_at)).toLocaleString()
                      : "No created_at yet"}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  if (!loading && !selectedGroup) {
    return (
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          padding: "1.5rem",
          maxWidth: "900px",
          margin: "0 auto",
          background: "background.paper",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {formatGroupLabel(safeGroupKey) || "Group"}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
            {`groups.${safeGroupKey}`}
          </Typography>
        </Box>

        {error ? (
          <Typography variant="body2" sx={{ color: "error.main" }}>
            {error}
          </Typography>
        ) : null}

        {renderCreatePanel(
          "Group Not Found",
          `No real group exists yet at groups.${safeGroupKey}. You can initialize it now from this page.`,
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        padding: "1.5rem",
        maxWidth: "900px",
        margin: "0 auto",
        background: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          flexDirection: { xs: "column", sm: "row" },
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {groupTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
            {`groups.${safeGroupKey}`}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Namespace:{" "}
            <Box component="span" sx={{ fontFamily: "monospace", color: "text.primary" }}>
              {namespaceLabel}
            </Box>
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          {groupSchema?.status ? (
            <Chip size="small" label={groupSchema.status} color="primary" />
          ) : null}
          {groupRoleType ? <Chip size="small" label={groupRoleType} variant="outlined" /> : null}
          {memberRoleType ? (
            <Chip size="small" label={`member:${memberRoleType}`} variant="outlined" />
          ) : null}
          <Button
            size="small"
            variant="outlined"
            startIcon={<Icon name="refresh" fontSize={16} />}
            onClick={() => {
              setReloadToken((value) => value + 1);
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Loading group…
          </Typography>
        </Box>
      ) : null}

      {error && selectedGroup ? (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "error.main",
            bgcolor: "background.default",
          }}
        >
          <Typography variant="body2" sx={{ color: "error.main" }}>
            {error}
          </Typography>
        </Box>
      ) : null}

      {!loading && selectedGroup ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
              gap: 1,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Group ID
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontFamily: "monospace", color: "text.primary" }}>
                {shortHash(String(selectedGroup.id || ""))}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Created
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: "text.primary" }}>
                {createdAtLabel || "—"}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Created By
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontFamily: "monospace", color: "text.primary" }}>
                {String(selectedGroup.created_by || "").trim() || "—"}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Suggested Branches
              </Typography>
              <Box sx={{ mt: 0.75, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {(groupSchema?.suggest?.contains || []).map((branch) => (
                  <Chip key={branch} size="small" label={branch} variant="outlined" />
                ))}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.25 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                <Typography variant="h6">Members</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {memberRoleType === "collection"
                    ? "Rendered from the adopted member collection."
                    : "Rendered from the group member branch."}
                </Typography>
              </Box>
              {memberContains.length > 0 ? (
                <Tooltip title={`member contains: ${memberContains.join(", ")}`} placement="left" arrow>
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", color: "text.secondary" }}>
                    <Icon name="info" fontSize={18} />
                  </Box>
                </Tooltip>
              ) : null}
            </Box>

            {members.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No members in this group yet.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  gap: 1,
                }}
              >
                {members.map((member) => {
                  const href = renderMemberLink(member);
                  const avatarBg = theme.palette.primary.main;
                  const avatarFg = theme.palette.getContrastText(avatarBg);

                  return (
                    <Box
                      key={member.key}
                      component={href ? "a" : "div"}
                      href={href || undefined}
                      target={href ? "_blank" : undefined}
                      rel={href ? "noreferrer" : undefined}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.1,
                        p: 1.1,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        color: "inherit",
                        textDecoration: "none",
                        transition: "border-color 180ms ease, background-color 180ms ease, transform 180ms ease",
                        "&:hover": href
                          ? {
                              borderColor: "primary.main",
                              bgcolor: "background.nav",
                              transform: "translateY(-1px)",
                            }
                          : undefined,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: avatarBg,
                          color: avatarFg,
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {getMemberAvatarLabel(member.username)}
                      </Avatar>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                          @{member.username}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={member.namespace || href || ""}
                        >
                          {member.namespace || href || "member pointer"}
                        </Typography>
                      </Box>

                      {href ? (
                        <Tooltip title="Open member namespace" placement="top" arrow>
                          <Box component="span" sx={{ display: "inline-flex", color: "primary.main" }}>
                            <Icon name="open_in_new" fontSize={18} />
                          </Box>
                        </Tooltip>
                      ) : null}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
              Root Namespace
            </Typography>
            {rootNamespaceUrl ? (
              <Link href={rootNamespaceUrl} target="_blank" rel="noreferrer" underline="hover">
                {rootNamespaceUrl}
              </Link>
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {namespaceLabel}
              </Typography>
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
