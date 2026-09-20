// UsersTable.tsx — Cleaker / Blockchain Viewer
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, IconButton, Avatar, Tooltip } from "@/gui/Atoms";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/gui/Molecules";
import Icon from "@/gui/Atoms/Icon/Icon";
import { useGuiTheme } from "@/gui-internals/Hooks";
import { selectionStore } from "@/runtime/selectionStore";
import QR from "../../../me/QR";
import { buildCleakerNamespaceUrl } from "../../namespaceExpression";

export interface UsersTableProps {
  endpoint: string; // e.g. "http://localhost:8161"
  namespaceLabel?: string;
  namespaceRootUrl?: string;
  "data-gui-node-id"?: string;
  "data-gui-component"?: string;
}

interface UserEntry {
  username: string;
  identityHash: string;
  publicKey: string;
  createdAt: number;
  updatedAt: number;
  // Optional profile fields if the backend starts returning them later
  profileImg?: string | null;
  profile?: { img?: string | null } | null;
}


function lastN(s: string, n: number) {
  const t = s.trim();
  if (t.length <= n) return t;
  return t.slice(-n);
}

function shortKeyLabel(pk: string) {
  // show only last 6 chars to keep it human-checkable, never show full key by default
  const tail = lastN(pk, 6);
  return `…${tail}`;
}

function normalizeNodeSegment(value: string, fallback: string): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    // No dots: a dot in a username would read as a level of the path.
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return normalized || fallback;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export default function UsersTable({
  endpoint,
  namespaceLabel = '',
  namespaceRootUrl = '',
  "data-gui-node-id": dataGuiNodeId = "UsersTable",
  "data-gui-component": dataGuiComponent = "UsersTable",
}: UsersTableProps) {
  const theme = useGuiTheme();
  const [rows, setRows] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTech, setShowTech] = useState(false);
  // QR modal state removed. Only 'copied' remains.
  const [copied, setCopied] = useState(false);
  const parentNodeId = String(dataGuiNodeId || "UsersTable");
  const parentNodeType = String(dataGuiComponent || "UsersTable");
  // Ids are paths (`GUI.content.users.table.shell.rows.ana`): the same syntax
  // as everywhere else in the GUI, and a part's parent is its path minus the
  // last segment. The table itself is the root; "" names it.
  const nodeId = useCallback(
    (segment: string) => (segment ? `${parentNodeId}.${segment}` : parentNodeId),
    [parentNodeId]
  );
  const nodePath = nodeId;
  const nodeAttrs = useCallback(
    (segment: string, component: string) => ({
      "data-gui-node-id": nodeId(segment),
      "data-gui-component": component,
    }),
    [nodeId]
  );
  const getRowSegment = useCallback(
    (username: string, index: number) => `shell.rows.${normalizeNodeSegment(username, `user-${index + 1}`)}`,
    []
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${endpoint}/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRows(json.users ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [endpoint]);

  const getUserHostUrl = useCallback((username: string) => {
    const u = String(username || '').trim().toLowerCase();
    if (!u) return '';
    const base = String(namespaceRootUrl || endpoint || '').trim();
    if (!base) return '';
    try {
      return buildCleakerNamespaceUrl(base, u);
    } catch {
      return '';
    }
  }, [endpoint, namespaceRootUrl]);

  useEffect(() => {
    const registeredIds: string[] = [];

    const registerNode = (
      id: string,
      path: string,
      type: string,
      resolvedProps: Record<string, unknown>
    ) => {
      registeredIds.push(id);
      selectionStore.actions.registerNode({
        id,
        path,
        type,
        spec: {
          type,
          props: resolvedProps,
        },
        resolvedProps,
      });
    };

    registerNode(nodeId(""), nodePath(""), `${parentNodeType}.Content`, {
      endpoint,
      namespaceLabel,
      namespaceRootUrl,
      loading,
      error,
      rowsCount: rows.length,
      showTech,
      copied,
    });
    registerNode(nodeId("header"), nodePath("header"), `${parentNodeType}.Header`, {
      title: "Users",
      hasNamespaceLabel: Boolean(namespaceLabel),
      showTech,
    });
    registerNode(nodeId("header.title"), nodePath("header.title"), `${parentNodeType}.Title`, {
      text: "Users",
    });
    registerNode(nodeId("header.advanced"), nodePath("header.advanced"), `${parentNodeType}.AdvancedToggle`, {
      active: showTech,
      label: showTech ? "Hide advanced columns" : "Show advanced columns",
    });
    registerNode(nodeId("header.namespace"), nodePath("header.namespace"), `${parentNodeType}.NamespaceCaption`, {
      visible: Boolean(namespaceLabel),
      namespaceLabel,
    });
    registerNode(nodeId("loading"), nodePath("loading"), `${parentNodeType}.LoadingState`, {
      visible: loading,
    });
    registerNode(nodeId("error"), nodePath("error"), `${parentNodeType}.ErrorState`, {
      visible: Boolean(error),
      message: error,
    });
    registerNode(nodeId("empty"), nodePath("empty"), `${parentNodeType}.EmptyState`, {
      visible: !loading && !error && rows.length === 0,
    });
    registerNode(nodeId("shell"), nodePath("shell"), `${parentNodeType}.TableShell`, {
      visible: rows.length > 0,
      rowCount: rows.length,
    });
    registerNode(nodeId("shell.rows"), nodePath("shell.rows"), `${parentNodeType}.Table`, {
      visible: rows.length > 0,
      rowCount: rows.length,
      showTech,
    });

    rows.forEach((row, index) => {
      const rowSegment = getRowSegment(row.username, index);
      const rowUserUrl = getUserHostUrl(row.username);
      const hasPublicKey = Boolean(String(row.publicKey || "").trim());
      const profileImg =
        (row as any)?.profileImg ??
        (row as any)?.profile?.img ??
        (row as any)?.profile?.pic ??
        (row as any)?.profilePic ??
        null;

      registerNode(nodeId(rowSegment), nodePath(rowSegment), `${parentNodeType}.Row`, {
        index,
        username: row.username,
        identityHash: row.identityHash,
        hasPublicKey: Boolean(String(row.publicKey || "").trim()),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        namespaceUrl: rowUserUrl,
      });
      registerNode(
        nodeId(`${rowSegment}.qr`),
        nodePath(`${rowSegment}.qr`),
        `${parentNodeType}.RowQrAction`,
        {
          username: row.username,
          namespaceUrl: rowUserUrl,
          disabled: !rowUserUrl,
        }
      );
      registerNode(
        nodeId(`${rowSegment}.qr.button`),
        nodePath(`${rowSegment}.qr.button`),
        `${parentNodeType}.RowQrActionButton`,
        {
          username: row.username,
          namespaceUrl: rowUserUrl,
          disabled: !rowUserUrl,
        }
      );
      registerNode(
        nodeId(`${rowSegment}.identity`),
        nodePath(`${rowSegment}.identity`),
        `${parentNodeType}.RowIdentity`,
        {
          username: row.username,
          namespaceUrl: rowUserUrl,
          hasAvatar: Boolean(profileImg),
        }
      );
      registerNode(
        nodeId(`${rowSegment}.identity.${rowUserUrl ? "link" : "label"}`),
        nodePath(`${rowSegment}.identity.${rowUserUrl ? "link" : "label"}`),
        `${parentNodeType}.${rowUserUrl ? "RowIdentityLink" : "RowIdentityLabel"}`,
        {
          username: row.username,
          namespaceUrl: rowUserUrl,
          external: Boolean(rowUserUrl),
        }
      );

      if (showTech) {
        registerNode(
          nodeId(`${rowSegment}.hash`),
          nodePath(`${rowSegment}.hash`),
          `${parentNodeType}.RowIdentityHash`,
          {
            username: row.username,
            identityHash: row.identityHash,
          }
        );
        registerNode(
          nodeId(`${rowSegment}.key`),
          nodePath(`${rowSegment}.key`),
          `${parentNodeType}.RowPublicKey`,
          {
            username: row.username,
            hasPublicKey,
            publicKeyLabel: shortKeyLabel(String(row.publicKey || "")),
          }
        );
        if (hasPublicKey) {
          registerNode(
            nodeId(`${rowSegment}.key.copy`),
            nodePath(`${rowSegment}.key.copy`),
            `${parentNodeType}.RowPublicKeyCopy`,
            {
              username: row.username,
              copied,
            }
          );
        }
        registerNode(
          nodeId(`${rowSegment}.created`),
          nodePath(`${rowSegment}.created`),
          `${parentNodeType}.RowCreatedAt`,
          {
            username: row.username,
            createdAt: row.createdAt,
          }
        );
        registerNode(
          nodeId(`${rowSegment}.updated`),
          nodePath(`${rowSegment}.updated`),
          `${parentNodeType}.RowUpdatedAt`,
          {
            username: row.username,
            updatedAt: row.updatedAt,
          }
        );
      }
    });

    return () => {
      registeredIds.forEach((id) => selectionStore.actions.unregisterNode(id));
    };
  }, [
    copied,
    endpoint,
    error,
    getRowSegment,
    getUserHostUrl,
    loading,
    namespaceLabel,
    namespaceRootUrl,
    nodeId,
    nodePath,
    parentNodeType,
    rows,
    showTech,
  ]);

  return (
    <Box
      {...nodeAttrs("", `${parentNodeType}.Content`)}
      sx={{ p: 2 }}
    >
      <Box
        {...nodeAttrs("header", `${parentNodeType}.Header`)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
          <Typography
            {...nodeAttrs("header.title", `${parentNodeType}.Title`)}
            variant="h6"
          >
            Users
          </Typography>
          {namespaceLabel ? (
            <Typography
              {...nodeAttrs("header.namespace", `${parentNodeType}.NamespaceCaption`)}
              variant="caption"
              sx={{ color: 'text.secondary' }}
            >
              Viewing node users for <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>{namespaceLabel}</Box>
            </Typography>
          ) : null}
        </Box>
        <Tooltip title={showTech ? 'Hide advanced columns' : 'Show advanced columns'}>
          <IconButton
            {...nodeAttrs("header.advanced", `${parentNodeType}.AdvancedToggle`)}
            size="small"
            onClick={() => setShowTech((v) => !v)}
            aria-label={showTech ? 'Hide advanced columns' : 'Show advanced columns'}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              width: 32,
              height: 32,
              '& .material-symbols-rounded': { fontSize: 18 },
            }}
          >
            <Icon name="settings" fontSize={18 as any} />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && (
        <Box
          {...nodeAttrs("loading", `${parentNodeType}.LoadingState`)}
          sx={{ borderRadius: 2, p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            Loading users…
          </Typography>
        </Box>
      )}

      {error && (
        <Box
          {...nodeAttrs("error", `${parentNodeType}.ErrorState`)}
          sx={{ mb: 2, borderRadius: 2, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'error.main' }}
        >
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            {error}
          </Typography>
        </Box>
      )}

      {!loading && !error && rows.length === 0 && (
        <Box
          {...nodeAttrs("empty", `${parentNodeType}.EmptyState`)}
          sx={{ borderRadius: 2, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No users registered in this blockchain.
          </Typography>
        </Box>
      )}

      {rows.length > 0 && (
        <Box
          {...nodeAttrs("shell", `${parentNodeType}.TableShell`)}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            background: 'background.nav',
            overflow: 'hidden',
          }}
        >
          <Table
            {...nodeAttrs("shell.rows", `${parentNodeType}.Table`)}
            size="small"
            sx={{
              '& th, & td': { borderColor: 'divider' },
              '& tbody tr:hover': { bgcolor: 'action.hover' },
            }}
          >


            <TableBody>
              {rows.map((r, index) => {
                const rowSegment = getRowSegment(r.username, index);
                return (
                <TableRow
                  key={r.username}
                  hover
                  {...nodeAttrs(rowSegment, `${parentNodeType}.Row`)}
                >
                  {/* Mini QR cell */}
                                   {/* Scan / QR tooltip trigger (low-noise) */}
                  <TableCell
                    {...nodeAttrs(`${rowSegment}.qr`, `${parentNodeType}.RowQrAction`)}
                    sx={{ width: 34, px: 0.5 }}
                  >
                    {(() => {
                      const userUrl = getUserHostUrl(r.username);
                      const hasUserUrl = userUrl.length > 0;

                      const trigger = (
                        <IconButton
                          {...nodeAttrs(`${rowSegment}.qr.button`, `${parentNodeType}.RowQrActionButton`)}
                          size="small"
                          disabled={!hasUserUrl}
                          aria-label={hasUserUrl ? 'Show .me QR' : 'No namespace link'}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: 'transparent',
                            border: 'none',
                            color: 'primary.main',
                            opacity: hasUserUrl ? 1 : 0.35,
                            '&:hover': { bgcolor: 'transparent' },
                            '& .material-symbols-rounded': { fontSize: 22 },
                          }}
                        >
                          <Icon name="fingerprint" fontSize={22 as any} />
                        </IconButton>
                      );

                      if (!hasUserUrl) return trigger;

                      return (
                        <Tooltip
                          placement="right"
                          arrow
                          enterDelay={120}
                          leaveDelay={80}
                          slotProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'transparent',
                                color: 'text.primary',
                                border: 'none',
                                boxShadow: 'none',
                                p: 0,
                                '& .MuiTooltip-arrow': {
                                  color: 'background.default',
                                },
                              },
                            },
                          }}
                          title={
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                alignItems: 'center',
                                p: 1.25,
                                borderRadius: 2,
                                bgcolor: 'background.default',
                                border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: 8,
                              }}
                            >
                              {(() => {
                                return (
                                  <Box
                                    sx={{
                                      color: 'primary.main',
                                      p: 1,
                                      borderRadius: 2,
                                      bgcolor: 'background.paper',
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      boxShadow: 4,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: 0.75,
                                      minWidth: 180,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 96,
                                        height: 96,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.default',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <QR
                                        value={userUrl}
                                        size={96}
                                        bg={theme.palette.background.paper}
                                        fg={theme.palette.primary.main}
                                        ecc="H"
                                        embedMode="positive-overlay"
                                        embedScale={0.32}
                                      />
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'text.primary',
                                        fontWeight: 700,
                                        letterSpacing: 0.2,
                                      }}
                                    >
                                      {`@${r.username}`}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        maxWidth: 180,
                                        color: 'text.secondary',
                                        fontFamily: 'monospace',
                                        fontSize: '0.62rem',
                                        lineHeight: 1.3,
                                        textAlign: 'center',
                                        wordBreak: 'break-all',
                                      }}
                                    >
                                      {userUrl}
                                    </Typography>
                                  </Box>
                                );
                              })()}
                            </Box>
                          }
                        >
                          {trigger}
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                  <TableCell
                    {...nodeAttrs(`${rowSegment}.identity`, `${parentNodeType}.RowIdentity`)}
                    sx={{ fontSize: 12, color: 'text.primary', pl: 0.25 }}
                  >
                    {(() => {
                      const img =
                        (r as any)?.profileImg ??
                        (r as any)?.profile?.img ??
                        (r as any)?.profile?.pic ??
                        (r as any)?.profilePic ??
                        null;

                      const fallback = String(r.username || '?').slice(0, 1).toUpperCase();
                      const href = getUserHostUrl(r.username);

                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Avatar
                            src={img ? String(img) : undefined}
                            alt={String(r.username || 'user')}
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: 12,
                              fontWeight: 700,
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              border: '1px solid',
                              borderColor: 'divider',
                              flexShrink: 0,
                            }}
                          >
                            {fallback}
                          </Avatar>

                          {href ? (
                            <Box
                              {...nodeAttrs(`${rowSegment}.identity.link`, `${parentNodeType}.RowIdentityLink`)}
                              component="a"
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              sx={{
                                color: 'text.primary',
                                textDecoration: 'none',
                                '&:visited': { color: 'text.primary', textDecoration: 'none' },
                                '&:active': { color: 'text.primary', textDecoration: 'none' },
                                '&:focus': { outline: 'none', textDecoration: 'none' },
                                '&:focus-visible': {
                                  outline: '2px solid',
                                  outlineColor: 'divider',
                                  outlineOffset: 2,
                                  borderRadius: 6,
                                  textDecoration: 'none',
                                },
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { textDecoration: 'none' },
                              }}
                              title={href}
                            >
                              {`@${r.username}`}
                            </Box>
                          ) : (
                            <Typography
                              {...nodeAttrs(`${rowSegment}.identity.label`, `${parentNodeType}.RowIdentityLabel`)}
                              sx={{ fontWeight: 600 }}
                            >
                              {`@${r.username}`}
                            </Typography>
                          )}
                        </Box>
                      );
                    })()}
                  </TableCell>
                  {showTech && (
                    <TableCell
                      {...nodeAttrs(`${rowSegment}.hash`, `${parentNodeType}.RowIdentityHash`)}
                      sx={{
                        fontSize: 12,
                        color: 'text.secondary',
                        fontFamily: 'monospace',
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={r.identityHash}
                    >
                      {r.identityHash}
                    </TableCell>
                  )}
                  {showTech && (
  <TableCell
    {...nodeAttrs(`${rowSegment}.key`, `${parentNodeType}.RowPublicKey`)}
    sx={{ fontSize: 12, color: 'text.secondary' }}
  >
    {(() => {
      const pk = String(r.publicKey || '').trim();
      const hasPk = pk.length > 0;
      const label = hasPk ? shortKeyLabel(pk) : '—';

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: 12,
              color: 'text.secondary',
              fontFamily: 'monospace',
              userSelect: 'none',
            }}
            title={hasPk ? 'Public key (hidden). Use copy/QR.' : 'No public key'}
          >
            {label}
          </Typography>

          {hasPk ? (
            <Tooltip title={copied ? 'Copied!' : 'Copy full public key'}>
              <IconButton
                {...nodeAttrs(`${rowSegment}.key.copy`, `${parentNodeType}.RowPublicKeyCopy`)}
                size="small"
                onClick={async () => {
                  const ok = await copyToClipboard(pk);
                  if (ok) {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 900);
                  }
                }}
                aria-label="Copy public key"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  width: 28,
                  height: 28,
                  '& .material-symbols-rounded': { fontSize: 18 },
                }}
              >
                <Icon name="content_copy" fontSize={18 as any} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      );
    })()}
  </TableCell>
)}
                  {showTech && (
                    <TableCell
                      {...nodeAttrs(`${rowSegment}.created`, `${parentNodeType}.RowCreatedAt`)}
                      sx={{ fontSize: 12, color: 'text.secondary' }}
                    >
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                  )}
                  {showTech && (
                    <TableCell
                      {...nodeAttrs(`${rowSegment}.updated`, `${parentNodeType}.RowUpdatedAt`)}
                      sx={{ fontSize: 12, color: 'text.secondary' }}
                    >
                      {new Date(r.updatedAt).toLocaleString()}
                    </TableCell>
                  )}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </Box>
      )}

    </Box>
  );
}
