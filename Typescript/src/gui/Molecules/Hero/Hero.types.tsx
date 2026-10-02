export interface HeroProps {
  /** Imagen, video o GIF de fondo */
  backgroundSrc?: string;
  /** Tipo de medio: 'image' | 'video' | 'gif' | 'color' */
  backgroundType?: 'image' | 'video' | 'gif' | 'color';
  /** Color de fondo cuando backgroundType = 'color' */
  backgroundColor?: string;
  /** Color del overlay (default: theme.palette.background.default) */
  overlayColor?: string;
  /** Contenido principal (texto, botones, etc.) */
  children?: React.ReactNode;
  /** Altura opcional (por defecto: 100vh) */
  height?: string | number;
  /** Padding interno (por defecto: responsive según theme.spacing) */
  padding?: number | string | Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number | string>>;
  /** Nivel de desenfoque: 'none' | 'light' | 'medium' | 'heavy' | 'all' */
  blur?: 'none' | 'light' | 'medium' | 'heavy' | 'all';
  /** Color personalizado del overlay (anula overlayColor si se define) */
  customColor?: string;
  /**
   * Theme accent preset from `theme.visuals.accents` (aurora | ember | monolith | neutral).
   * When set, maps to overlay (soft) and optional color-background (strong) unless
   * `overlayColor` / `customColor` / `backgroundColor` already override.
   * Safe no-op when accents are missing from the active theme.
   */
  accent?: 'aurora' | 'ember' | 'monolith' | 'neutral';
  /** Imagen de marca (logo / brand) */
  brand?: {
    src: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    maxWidth?: number | string;
    fit?: 'contain' | 'cover';
    sx?: Record<string, any>;
  };
  /** Encabezado principal */
  header?: React.ReactNode;
  /** Sub-encabezado */
  subheader?: React.ReactNode;
  /** Texto descriptivo */
  typography?: React.ReactNode;
  /** Opciones (botones, links, inputs, etc.) */
  options?: React.ReactNode;
  /** Alineacion del contenido */
  mode?:
    | 'center'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  /** Ancho maximo del contenido */
  contentMaxWidth?: number | string;
  /** Padding vertical del contenido */
  contentPaddingY?: number | string;
  /** Padding superior del contenido */
  contentPaddingTop?: number | string;
  /** Padding inferior del contenido */
  contentPaddingBottom?: number | string;
  /** Posicionamiento del Hero */
  layout?: 'fixed' | 'flow';
  /** @internal Render contenido estructurado desde children (usa transform) */
  __renderStructuredChildren?: boolean;
  /** Variante del header */
  headerVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Variante del subheader */
  subheaderVariant?: 'overline' | 'caption' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2';
  /** Variante del texto descriptivo */
  typographyVariant?: 'body1' | 'body2';
  /** Layout de opciones */
  optionsDirection?: 'row' | 'column';
  /** Separacion entre opciones */
  optionsGap?: number;
  /** Justificacion de opciones */
  optionsJustify?: 'flex-start' | 'center' | 'flex-end';
}
