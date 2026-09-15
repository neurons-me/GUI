import * as React from 'react';
import clsx from 'clsx';
// Deliberately no `import 'material-symbols'` here: that bare import pulls
// in ALL THREE families (outlined/rounded/sharp) from the npm package via
// this.gui's own bundler, and on this build's asset pipeline that ends up
// inlining the fonts as base64 in the bundled CSS (~12MB, even though only
// "material-symbols-rounded" is ever used anywhere in this codebase).
// Consumers must instead <link> the real, cacheable public/material-symbols.css
// (+ public/material-symbols-rounded.woff2) directly in their own HTML shell
// — the same pattern every demo/*.html and Storybook's preview-head already
// use. The class names below (.material-symbols-rounded) are plain global
// CSS selectors; nothing here depends on the JS import for them to resolve.

const iconRegistry: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {};

const LEGACY_ICON_ALIASES: Record<string, string> = {
  stats: 'mui:BarChart',
  barchart: 'mui:BarChart',
  attachmoney: 'mui:AttachMoney',
  billing: 'mui:AttachMoney',
  calendarmonth: 'mui:CalendarMonth',
  support: 'mui:SupportAgent',
  supportagent: 'mui:SupportAgent',
  messagecircle: 'lucide:message-circle',
};

function normalizeAliasKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s:_-]+/g, '');
}

function toPascalCase(value: string): string {
  return String(value || '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toKebabCase(value: string): string {
  return String(value || '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function toMaterialToken(value: string): string {
  return String(value || '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

function normalizeIconName(name: string): string {
  const raw = String(name || '').trim();
  if (!raw) return '';

  const alias = LEGACY_ICON_ALIASES[normalizeAliasKey(raw)];
  if (alias) return alias;

  if (!raw.includes(':')) {
    if (/^[A-Z]/.test(raw) || /[-\s]/.test(raw)) {
      return `material:${toMaterialToken(raw)}`;
    }
    return raw;
  }

  const [rawPrefix, ...rest] = raw.split(':');
  const prefix = rawPrefix.toLowerCase();
  const iconKey = rest.join(':').trim();
  if (!iconKey) return raw;

  if (prefix === 'lucide') return `lucide:${toKebabCase(iconKey)}`;
  if (prefix === 'mui') return `mui:${toPascalCase(iconKey)}`;
  if (prefix === 'material') return `material:${toMaterialToken(iconKey)}`;

  return `${rawPrefix}:${iconKey}`;
}

function MaterialIconResolver(props: any) {
  const { name, fill, weight, grade, opticalSize, className, style, iconColor, fontSize, ...rest } = props;
  const iconKey = name.includes(':') ? name.split(':')[1] : name;
  const variationSettings = `"FILL" ${fill ?? 0}, "wght" ${weight ?? 400}, "GRAD" ${grade ?? 0}, "opsz" ${opticalSize ?? 24}`;
  return (
    <span
      {...rest}
      className={clsx('material-symbols-rounded', className)}
      style={{ fontVariationSettings: variationSettings, fontSize, color: iconColor, ...style }}
    >
      {toMaterialToken(iconKey)}
    </span>
  );
}

function createLazyResolver(prefix: 'lucide' | 'mui', iconKey: string): React.LazyExoticComponent<React.ComponentType<any>> {
  const registryKey = `${prefix}:${iconKey}`;
  if (!iconRegistry[registryKey]) {
    iconRegistry[registryKey] = React.lazy(async () => {
      try {
        if (prefix === 'lucide') {
          const kebabName = toKebabCase(iconKey);
          const { default: LucideSvg } = await import(
            /* @vite-ignore */ `lucide-react/dist/esm/icons/${kebabName}.js`
          );
          const LucideIcon = React.forwardRef<SVGSVGElement, any>(function LucideRegistryIcon(
            props,
            ref
          ) {
            const {
              name: _name,
              fontSize,
              iconColor,
              weight: _weight,
              fill: _fill,
              grade: _grade,
              opticalSize: _opticalSize,
              className,
              style,
              ...rest
            } = props;
            return (
              <LucideSvg
                ref={ref}
                size={fontSize ?? 18}
                color={iconColor}
                className={className}
                style={style}
                {...rest}
              />
            );
          });
          return { default: LucideIcon as React.ComponentType<any> };
        }
        if (prefix === 'mui') {
          const pascalName = toPascalCase(iconKey);
          const { default: MuiSvg } = await import(
            /* @vite-ignore */ `@mui/icons-material/${pascalName}.js`
          );
          const MuiIcon = React.forwardRef<SVGSVGElement, any>(function MuiRegistryIcon(
            props,
            ref
          ) {
            const {
              name: _name,
              fontSize,
              iconColor,
              weight: _weight,
              fill: _fill,
              grade: _grade,
              opticalSize: _opticalSize,
              className,
              style,
              ...rest
            } = props;
            return (
              <MuiSvg
                ref={ref}
                fontSize={'inherit' as any}
                htmlColor={iconColor}
                className={className}
                style={{ fontSize, color: iconColor, ...style }}
                {...rest}
              />
            );
          });
          return { default: MuiIcon as React.ComponentType<any> };
        }
      } catch (error) {
        console.error(`Failed to load icon: ${registryKey}`, error);
        // Return a component that renders nothing on error
        return { default: () => null };
      }
      // Should not be reached, but as a fallback
      return { default: () => null };
    });
  }
  return iconRegistry[registryKey];
}

export function resolveIcon(name: string): React.ComponentType<any> {
  const normalizedName = normalizeIconName(name);
  const [prefix, iconKey] = normalizedName.includes(':')
    ? normalizedName.split(':') as ['lucide' | 'mui' | 'material', string]
    : ['material', normalizedName];

  if (prefix === 'lucide' || prefix === 'mui') {
    return createLazyResolver(prefix, iconKey);
  }

  // Default to Material Icons if no prefix or 'material' prefix
  return MaterialIconResolver;
}
