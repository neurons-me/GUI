type BeetleSVGProps = {
  color?: string;
  bgColor?: string;
  size?: number;
  spinning?: boolean;
};

export default function BeetleSVG({ color = 'currentColor', size = 32, spinning = false }: BeetleSVGProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size,
        lineHeight: 1,
        color,
        animation: spinning ? 'ng-spin 2s linear infinite' : undefined,
        userSelect: 'none',
      }}
    >
      𓆣
    </span>
  );
}
