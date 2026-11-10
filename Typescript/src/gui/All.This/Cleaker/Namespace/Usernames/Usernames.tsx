// UsersTable.tsx — Cleaker / Blockchain Viewer
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, IconButton, Avatar, Tooltip } from "@/gui/Atoms";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/gui/Molecules";
import Icon from "@/gui/Atoms/Icon/Icon";
import { selectionStore } from "@/runtime/selectionStore";
import QRme from "@/gui/All.This/me/QR/QR.me";
import QR from "@/gui/All.This/me/QR";
import PixelWordmark from "@/gui/All.This/me/QR/PixelWordmark";
import { ME_WORDMARK_EMBED_BITMAP } from "@/gui/All.This/me/QR/meMark";
import { useGuiTheme } from "@/gui-internals/Hooks";
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

// Row thumbnail: a plain .me QR. Square, no frame, no glow: just the code with
// the .me wordmark on top. Too small to scan; the tooltip holds the scannable one.
const THUMB_QR_SIZE = 40;
const WORDMARK_ASPECT = 1.8;
const WORDMARK_COLS = Math.max(...ME_WORDMARK_EMBED_BITMAP.map((row) => row.length));
// The wordmark spans about 45% of the code's width.
const THUMB_WORDMARK_PIXEL = (THUMB_QR_SIZE * 0.45) / (WORDMARK_COLS * WORDMARK_ASPECT);

function getProfileImg(row: UserEntry): string | null {
  const r = row as any;
  const img = r?.profileImg ?? r?.profile?.img ?? r?.profile?.pic ?? r?.profilePic ?? null;
  return img ? String(img) : null;
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
  // The advanced columns have no toggle (the gear was removed): they stay off until something asks for them.
  const [showTech] = useState(false);
  const [copied, setCopied] = useState(false);
  const parentNodeId = String(dataGuiNodeId || "UsersTable");
  const parentNodeType = String(dataGuiComponent || "UsersTable");
  // Ids are paths (`GUI.window.layout.content.users.table.shell.rows.ana`): the same syntax
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

  // The root every handle in this table hangs off (e.g. "cleaker.me"). QR.me
  // draws it bold after the handle on its perimeter: "suign.cleaker.me".
  const rootLabel = useMemo(() => {
    const base = String(namespaceRootUrl || endpoint || '').trim();
    if (!base) return '';
    try {
      return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(base) ? base : `https://${base}`).hostname.toLowerCase();
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
      showTech,
    });
    registerNode(nodeId("header.title"), nodePath("header.title"), `${parentNodeType}.Title`, {
      text: "Users",
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
      const profileImg = getProfileImg(row);

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
          disabled: !rowUserUrl,
          label: rowUserUrl ? "Show .me QR" : "No namespace link",
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
        <Typography
          {...nodeAttrs("header.title", `${parentNodeType}.Title`)}
          variant="h6"
        >
          Users
        </Typography>
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
                const userUrl = getUserHostUrl(r.username);
                const img = getProfileImg(r);
                const handle = String(r.username || '').trim().toLowerCase();
                return (
                <TableRow
                  key={r.username}
                  hover
                  {...nodeAttrs(rowSegment, `${parentNodeType}.Row`)}
                >
                  <TableCell
                    {...nodeAttrs(`${rowSegment}.qr`, `${parentNodeType}.RowQrAction`)}
                    sx={{ width: 48, px: 0.5 }}
                  >
                    {(() => {
                      const hasUserUrl = userUrl.length > 0;

                      const trigger = (
                        <IconButton
                          {...nodeAttrs(`${rowSegment}.qr.button`, `${parentNodeType}.RowQrActionButton`)}
                          size="small"
                          disableRipple
                          disabled={!hasUserUrl}
                          aria-label={hasUserUrl ? 'Show .me QR' : 'No namespace link'}
                          sx={{
                            width: 44,
                            height: 44,
                            p: 0,
                            borderRadius: 2,
                            bgcolor: 'transparent',
                            border: 'none',
                            color: 'primary.main',
                            opacity: hasUserUrl ? 1 : 0.35,
                            '&:hover': { bgcolor: 'transparent' },
                            '& .material-symbols-rounded': { fontSize: 22 },
                          }}
                        >
                          {hasUserUrl ? (
                            <Box
                              component="span"
                              sx={{ position: 'relative', display: 'inline-flex', lineHeight: 0 }}
                            >
                              <QR
                                value={userUrl}
                                size={THUMB_QR_SIZE}
                                ecc="H"
                                quietZone={1}
                                cornerRadius={0}
                                bg={theme.palette.background.paper}
                                fg={theme.palette.primary.main}
                              />
                              <PixelWordmark
                                bitmap={ME_WORDMARK_EMBED_BITMAP}
                                pixelSize={THUMB_WORDMARK_PIXEL}
                                pixelAspect={WORDMARK_ASPECT}
                                fg={theme.palette.primary.main}
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  filter: `drop-shadow(0 0 1px ${theme.palette.background.paper}) drop-shadow(0 0 1px ${theme.palette.background.paper})`,
                                }}
                              />
                            </Box>
                          ) : (
                            <Icon name="fingerprint" fontSize={22 as any} />
                          )}
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
                              // The tooltip is the only surface. QR.me draws the
                              // namespace outside the code itself, so it needs a
                              // page background behind it, not the table.
                              sx: {
                                bgcolor: 'background.default',
                                color: 'text.primary',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                boxShadow: 8,
                                p: 1.25,
                                maxWidth: 'none',
                                '& .MuiTooltip-arrow': {
                                  color: 'background.default',
                                },
                              },
                            },
                          }}
                          title={
                            <QRme
                              value={userUrl}
                              username={r.username}
                              avatarSrc={img ?? undefined}
                              perimeterLabel={rootLabel ? `${handle}.${rootLabel}` : handle}
                              perimeterRootLabel={rootLabel || undefined}
                              perimeterHandleHref={userUrl}
                              // Hovering already opened the tooltip; a hover flip
                              // would turn the code into the avatar the moment the
                              // pointer reaches it. Click still flips.
                              hoverFlip={false}
                              data-gui-node-id={nodeId(`${rowSegment}.qr.code`)}
                            />
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
                      const fallback = String(r.username || '?').slice(0, 1).toUpperCase();
                      const href = userUrl;

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
