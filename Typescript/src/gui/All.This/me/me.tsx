import * as React from 'react';
import ME from 'this.me';
import { MeRuntimeProvider, useOptionalMeRuntimeContext } from '@/react/MeRuntimeProvider';
import { useMeAction } from '@/react/useMeAction';
import { useMeValue } from '@/react/useMeValue';
import type { MeLike } from '@/react/types';
import { useRuntimeEnvironment } from '@/runtime/runtimeContext';
import { writeMeValue } from '@/runtime/run-me';
import { writeKernelWindowLocation } from '@/core/session/createSeedSession';
import Box from '@/gui/Atoms/Box/Box';
import Button from '@/gui/Atoms/Button/Button';
import Card from '@/gui/Atoms/Card/Card';
import CardContent from '@/gui/Atoms/Card/CardContent/CardContent';
import CardHeader from '@/gui/Atoms/Card/CardHeader/CardHeader';
import Chip from '@/gui/Atoms/Chip/Chip';
import TextField from '@/gui/Atoms/TextField/TextField';
import Typography from '@/gui/Atoms/Typography/Typography';
import { Stack } from '@/gui/Molecules';
type MeFieldType = 'text' | 'number' | 'textarea';
type MeMode = 'display' | 'commit' | 'live';
type MeCoerceMode = 'auto' | 'string' | 'number' | 'boolean' | 'json';

export type MeProps = {
  me?: MeLike;
  path?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  buttonLabel?: string;
  disabled?: boolean;
  showValue?: boolean;
  showPath?: boolean;
  readOnly?: boolean;
  type?: MeFieldType;
  mode?: MeMode;
  coerce?: MeCoerceMode;
  rows?: number;
  initialValue?: any;
  formatValue?: (value: any) => React.ReactNode;
  parseValue?: (raw: string) => any;
  'data-gui-node-id'?: string;
  'data-gui-component'?: string;
};

function normalizeMePath(path?: string): string {
  const raw = String(path || 'name').trim();
  if (!raw) return 'name';

  const explicitPrefixes = [
    'me://self:read/',
    'me://self:write/',
    'self:read/',
    'self:write/',
    'me/',
    'me.',
  ];

  let next = raw;
  for (let i = 0; i < explicitPrefixes.length; i += 1) {
    const prefix = explicitPrefixes[i];
    if (next.startsWith(prefix)) {
      next = next.slice(prefix.length);
      break;
    }
  }

  return next
    .replace(/^\/+|\/+$/g, '')
    .replace(/\//g, '.')
    .replace(/^\.+|\.+$/g, '') || 'name';
}

function stringifyValue(value: any): string {
  if (typeof value === 'undefined') return '';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseInputValue(raw: string, type: MeFieldType, customParser?: (value: string) => any): any {
  if (customParser) return customParser(raw);
  if (type === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }
  return raw;
}

function coerceInputValue(
  raw: string,
  type: MeFieldType,
  coerce: MeCoerceMode,
  liveValue: any,
  customParser?: (value: string) => any
): any {
  if (customParser) return customParser(raw);

  if (coerce === 'string') return raw;
  if (coerce === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }
  if (coerce === 'boolean') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return raw;
  }
  if (coerce === 'json') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  if (type === 'number' || typeof liveValue === 'number') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }

  if (typeof liveValue === 'boolean') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  if (Array.isArray(liveValue) || (liveValue && typeof liveValue === 'object')) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  return parseInputValue(raw, type);
}

function DefaultValue({ value }: { value: any }) {
  if (typeof value === 'undefined') {
    return (
      <Typography variant="body1" sx={{ opacity: 0.56 }}>
        -
      </Typography>
    );
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return (
      <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
        {String(value)}
      </Typography>
    );
  }

  return (
    <Typography
      component="pre"
      variant="body2"
      sx={{
        m: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      {stringifyValue(value)}
    </Typography>
  );
}

function MeField({
  normalizedPath,
  label,
  description,
  placeholder,
  buttonLabel,
  disabled,
  showValue,
  showPath,
  readOnly,
  type,
  mode,
  coerce,
  rows,
  formatValue,
  parseValue,
  nodeId,
  componentName,
}: {
  normalizedPath: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  buttonLabel: string;
  disabled: boolean;
  showValue: boolean;
  showPath: boolean;
  readOnly: boolean;
  type: MeFieldType;
  mode: MeMode;
  coerce: MeCoerceMode;
  rows: number;
  formatValue?: (value: any) => React.ReactNode;
  parseValue?: (raw: string) => any;
  nodeId: string;
  componentName: string;
}) {
  const liveValue = useMeValue<any>(normalizedPath);
  const updateValue = useMeAction(normalizedPath, { allowCanonicalWrite: true });
  const liveSerialized = React.useMemo(() => stringifyValue(liveValue), [liveValue]);
  const [draft, setDraft] = React.useState(() => liveSerialized);
  const lastPathRef = React.useRef(normalizedPath);
  const isDirty = mode !== 'display' && draft !== liveSerialized;

  React.useEffect(() => {
    if (lastPathRef.current !== normalizedPath) {
      lastPathRef.current = normalizedPath;
      setDraft(liveSerialized);
      return;
    }
    if (!isDirty) {
      setDraft(liveSerialized);
    }
  }, [normalizedPath, liveSerialized, isDirty]);

  const writeNextValue = React.useCallback((raw: string) => {
    const nextValue = coerceInputValue(raw, type, coerce, liveValue, parseValue);
    return updateValue(nextValue);
  }, [coerce, liveValue, parseValue, type, updateValue]);

  const commitCurrentDraft = React.useCallback(async () => {
    if (mode !== 'commit' || readOnly || disabled || !isDirty) return;
    try {
      await Promise.resolve(writeNextValue(draft));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[.GUI/Me] Failed to write value', {
        path: normalizedPath,
        value: draft,
        error,
      });
    }
  }, [disabled, draft, isDirty, mode, normalizedPath, readOnly, writeNextValue]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void commitCurrentDraft();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const nextDraft = event.target.value;
    setDraft(nextDraft);

    if (mode !== 'live' || readOnly || disabled) return;

    try {
      void writeNextValue(nextDraft);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[.GUI/Me] Failed to live-update value', {
        path: normalizedPath,
        value: nextDraft,
        error,
      });
    }
  };

  const pathTail = normalizedPath.split('.').filter(Boolean).pop() || normalizedPath;
  const renderedValue = formatValue ? formatValue(liveValue) : <DefaultValue value={liveValue} />;
  const baseDescription =
    description ||
    (mode === 'display'
      ? 'Display mode: read-only semantic projection.'
      : mode === 'live'
        ? 'Live mode: every keystroke writes back into .me.'
        : 'Commit mode: draft locally, then push into .me.');

  if (mode === 'display') {
    return (
      <Card
        variant="outlined"
        data-gui-node-id={nodeId}
        data-gui-component={componentName}
        sx={{ width: '100%' }}
      >
        <CardHeader title={label || '.me'} subheader={baseDescription} />
        <CardContent>
          <Stack spacing={2}>
            {showPath ? (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip label={`path: ${normalizedPath}`} size="small" variant="outlined" />
                <Chip label="display" size="small" />
              </Stack>
            ) : null}

            <Box
              sx={{
                px: 1.5,
                py: 1.25,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="overline" color="text.secondary">
                Current Value
              </Typography>
              <Box sx={{ mt: 0.5 }}>{renderedValue}</Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      data-gui-node-id={nodeId}
      data-gui-component={componentName}
      sx={{
        width: '100%',
        borderColor: isDirty ? 'warning.main' : undefined,
        boxShadow: isDirty ? '0 0 0 1px rgba(237, 108, 2, 0.18)' : undefined,
      }}
    >
      <CardHeader
        title={label || '.me'}
        subheader={baseDescription}
      />
      <CardContent>
        <Stack spacing={2.5}>
          {showPath ? (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip label={`path: ${normalizedPath}`} size="small" variant="outlined" />
              <Chip label={mode} size="small" />
              <Chip label={`coerce: ${coerce}`} size="small" variant="outlined" />
              {readOnly ? <Chip label="read-only" size="small" /> : null}
              {mode === 'commit' ? (
                <Chip
                  label={isDirty ? 'pending changes' : 'synced'}
                  size="small"
                  color={isDirty ? 'warning' : 'success'}
                  variant={isDirty ? 'filled' : 'outlined'}
                />
              ) : null}
            </Stack>
          ) : null}

          {showValue ? (
            <Box
              sx={{
                px: 1.5,
                py: 1.25,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="overline" color="text.secondary">
                Current Value
              </Typography>
              <Box sx={{ mt: 0.5 }}>{renderedValue}</Box>
            </Box>
          ) : null}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
              <TextField
                label={label ? undefined : pathTail}
                placeholder={placeholder || `Update ${pathTail}`}
                value={draft}
                onChange={handleChange}
                disabled={disabled || readOnly}
                type={type === 'textarea' ? 'text' : type}
                multiline={type === 'textarea' || (mode === 'commit' && rows > 1)}
                minRows={type === 'textarea' || mode === 'commit' ? rows : undefined}
                fullWidth
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
                {mode === 'commit' ? (
                  <Button
                    type="button"
                    variant="contained"
                    disabled={disabled || readOnly || !isDirty}
                    onClick={() => {
                      void commitCurrentDraft();
                    }}
                  >
                    {buttonLabel}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outlined"
                  disabled={disabled}
                  onClick={() => setDraft(liveSerialized)}
                >
                  Reset
                </Button>
                {mode === 'live' ? (
                  <Typography variant="caption" sx={{ opacity: 0.72 }}>
                    Changes publish immediately to <code>{normalizedPath}</code>.
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Me({
  me: providedMe,
  path = 'name',
  label,
  description,
  placeholder,
  buttonLabel = 'Update',
  disabled = false,
  showValue = true,
  showPath = true,
  readOnly = false,
  type = 'text',
  mode = 'commit',
  coerce = 'auto',
  rows = 4,
  initialValue,
  formatValue,
  parseValue,
  'data-gui-node-id': nodeId = 'Me',
  'data-gui-component': componentName = 'Me',
}: MeProps) {
  const normalizedPath = React.useMemo(() => normalizeMePath(path), [path]);
  const localContext = useOptionalMeRuntimeContext();
  const env = useRuntimeEnvironment();
  const inheritedMe = (localContext?.me ?? env.me ?? (env.runtime as any)?.__me ?? (env.runtime as any)?.me) as MeLike | undefined;
  const localKernelRef = React.useRef<MeLike | null>(null);

  if (!localKernelRef.current) {
    const kernel = new ME() as unknown as MeLike;
    writeKernelWindowLocation(kernel);
    if (typeof initialValue !== 'undefined') {
      try {
        writeMeValue(kernel, normalizedPath, initialValue);
      } catch {}
    }
    localKernelRef.current = kernel;
  }

  const kernel = (providedMe ?? inheritedMe ?? localKernelRef.current) as MeLike;
  const inheritedRuntime = localContext?.runtime ?? null;
  const hasReactiveRuntime =
    typeof inheritedRuntime?.action === 'function' &&
    typeof inheritedRuntime?.subscribe === 'function' &&
    typeof inheritedRuntime?.notify === 'function';
  const shouldWrap = !localContext?.me || localContext.me !== kernel || !hasReactiveRuntime;

  const content = (
    <MeField
      normalizedPath={normalizedPath}
      label={label}
      description={description}
      placeholder={placeholder}
      buttonLabel={buttonLabel}
      disabled={disabled}
      showValue={showValue}
      showPath={showPath}
      readOnly={readOnly}
      type={type}
      mode={mode}
      coerce={coerce}
      rows={rows}
      formatValue={formatValue}
      parseValue={parseValue}
      nodeId={nodeId}
      componentName={componentName}
    />
  );

  if (!shouldWrap) return content;

  return (
    <MeRuntimeProvider me={kernel} subscribe={localContext?.subscribe ?? null}>
      {content}
    </MeRuntimeProvider>
  );
}
