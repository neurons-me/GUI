// src/types/images.d.ts

declare module '*.png' {
  const src: string;
  export default src;
}

// Vite's explicit `?url` suffix — forces the resolved asset URL as a plain
// string, bypassing library-mode's default behavior of inlining every
// imported asset as base64 regardless of size (confirmed: a multi-MB PNG
// imported plain got embedded whole into the JS bundle; the same import
// with `?url` emits it as a real, separate, cacheable file instead).
declare module '*.png?url' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}