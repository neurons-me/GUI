import React, { useEffect, useMemo, useState } from "react";
import { Avatar, Box, Chip, Link, Typography } from "@/gui/Atoms";
import { useGuiTheme } from "@/gui-internals/Hooks";
import { normalizeEndpoint } from "../cleakerBridge";
import {
  buildSemanticTarget,
  createCleakerKernelContext,
  readKernelBranch,
  resolveSemanticBranch,
  type CleakerKernelContext,
} from "../cleakerKernel";

export interface CleakerUserProps {
  endpoint?: string;
  username?: string;
  rootNamespace?: string;
  kernel?: CleakerKernelContext | null;
}

type ProfileBranch = {
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  field?: string;
  origin?: string;
  birth_date?: string;
  death_date?: string;
  type?: {
    public_figure?: boolean;
  };
  parent?: {
    father?: string;
    mother?: string;
  };
};

type HostRecord = {
  label?: string;
  hostname?: string;
  local_endpoint?: string;
  status?: string;
};

function buildNamespace(username: string, rootNamespace: string): string {
  const cleanUsername = String(username || "").trim().toLowerCase();
  const cleanRoot = String(rootNamespace || "").trim().toLowerCase();
  if (!cleanUsername) return cleanRoot;
  if (!cleanRoot) return cleanUsername;
  return `${cleanUsername}.${cleanRoot}`;
}

function formatDateLabel(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function compactNamespace(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.local$/i, "")
    .toLowerCase();
}

function getAvatarLabel(username: string, name: string): string {
  const source = String(name || username || "").trim();
  if (!source) return "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CleakerUser({
  endpoint = "http://localhost:8161",
  username = "",
  rootNamespace = "",
  kernel = null,
}: CleakerUserProps) {
  const theme = useGuiTheme();
  const safeEndpoint = useMemo(() => normalizeEndpoint(endpoint), [endpoint]);
  const targetNamespace = useMemo(
    () => buildNamespace(username, rootNamespace),
    [rootNamespace, username],
  );

  const [localKernel, setLocalKernel] = useState<CleakerKernelContext | null>(null);
  const [profile, setProfile] = useState<ProfileBranch | null>(null);
  const [hosts, setHosts] = useState<Record<string, HostRecord> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              : "Failed to initialize user kernel";
          setError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kernel, rootNamespace, safeEndpoint]);

  const activeKernel = kernel || localKernel || null;
  const activeRuntime = activeKernel?.runtime || null;

  useEffect(() => {
    if (!safeEndpoint || !username || !rootNamespace) {
      setProfile(null);
      setHosts(null);
      setError(null);
      return;
    }

    if (!activeKernel || !activeRuntime) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          resolveSemanticBranch(activeKernel, buildSemanticTarget(targetNamespace, "profile")),
          resolveSemanticBranch(activeKernel, buildSemanticTarget(targetNamespace, "host")),
        ]);

        const profileValue = readKernelBranch(activeRuntime, "profile");
        const hostValue = readKernelBranch(activeRuntime, "host");

        if (cancelled) return;
        setProfile(
          profileValue && typeof profileValue === "object"
            ? (profileValue as ProfileBranch)
            : null,
        );
        setHosts(
          hostValue && typeof hostValue === "object"
            ? (hostValue as Record<string, HostRecord>)
            : null,
        );

        if (!profileValue || typeof profileValue !== "object") {
          setError(`User "${username}" not found`);
        }
      } catch (loadError: unknown) {
        if (cancelled) return;
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load user";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeKernel, activeRuntime, rootNamespace, safeEndpoint, targetNamespace, username]);

  const hostEntries = useMemo(() => {
    if (!hosts || typeof hosts !== "object") return [];
    return Object.entries(hosts)
      .map(([key, value]) => ({
        key,
        label: String(value?.label || key || "").trim(),
        hostname: String(value?.hostname || "").trim(),
        endpoint: String(value?.local_endpoint || "").trim(),
        status: String(value?.status || "").trim(),
      }))
      .filter((entry) => entry.label || entry.hostname || entry.endpoint);
  }, [hosts]);

  if (!username || !rootNamespace) {
    return (
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 4,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          User
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Select a namespace like <code>/@oscar-wilde</code> to render the public profile.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          p: 2.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(15,23,42,0.55))"
              : "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(255,255,255,0.92))",
        }}
      >
        <Avatar
          sx={{
            width: 76,
            height: 76,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontWeight: 800,
            fontSize: "1.5rem",
          }}
        >
          {getAvatarLabel(username, profile?.name || "")}
        </Avatar>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            {String(profile?.name || "").trim() || username}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            @{username}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontFamily: "monospace" }}
          >
            {compactNamespace(targetNamespace)}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {profile?.type?.public_figure ? (
              <Chip size="small" color="primary" label="public figure" />
            ) : null}
            {profile?.field ? <Chip size="small" variant="outlined" label={profile.field} /> : null}
            {error ? <Chip size="small" color="warning" label={error} /> : null}
            {loading ? <Chip size="small" variant="outlined" label="loading" /> : null}
          </Box>
        </Box>
      </Box>

      <Box
        id="cleaker-section-profile"
        sx={{
          p: 2.25,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ gridColumn: "1 / -1", fontWeight: 800 }}>
          Profile
        </Typography>
        <Typography variant="body2">
          <strong>Origin:</strong> {profile?.origin || "—"}
        </Typography>
        <Typography variant="body2">
          <strong>Born:</strong> {formatDateLabel(profile?.birth_date || "")}
        </Typography>
        <Typography variant="body2">
          <strong>Died:</strong> {formatDateLabel(profile?.death_date || "")}
        </Typography>
        <Typography variant="body2">
          <strong>Email:</strong>{" "}
          {profile?.email ? (
            <Link href={`mailto:${profile.email}`}>{profile.email}</Link>
          ) : (
            "—"
          )}
        </Typography>
        <Typography variant="body2">
          <strong>Phone:</strong>{" "}
          {profile?.phone ? (
            <Link href={`tel:${profile.phone}`}>{profile.phone}</Link>
          ) : (
            "—"
          )}
        </Typography>
        <Typography variant="body2">
          <strong>Father:</strong> {profile?.parent?.father || "—"}
        </Typography>
        <Typography variant="body2">
          <strong>Mother:</strong> {profile?.parent?.mother || "—"}
        </Typography>
      </Box>

      <Box
        id="cleaker-section-relations"
        sx={{
          p: 2.25,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Relations
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No public relations branch is published yet for this namespace.
        </Typography>
      </Box>

      <Box
        id="cleaker-section-hosts"
        sx={{
          p: 2.25,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Hosts
        </Typography>
        {hostEntries.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No public hosts published yet.
          </Typography>
        ) : (
          hostEntries.map((entry) => (
            <Box
              key={entry.key}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                gap: 0.35,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {entry.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontFamily: "monospace" }}
              >
                {entry.hostname || "—"}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {entry.endpoint || "—"}
              </Typography>
              {entry.status ? (
                <Chip
                  size="small"
                  label={entry.status}
                  variant="outlined"
                  sx={{ alignSelf: "flex-start" }}
                />
              ) : null}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
