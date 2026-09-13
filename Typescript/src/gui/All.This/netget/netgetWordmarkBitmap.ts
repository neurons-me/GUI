// The NETGET wordmark: all caps, 5x7 block glyphs (same grid convention as
// meMark.ts's ME_WORDMARK_EMBED_BITMAP), one blank column between letters.
// Rendered by PixelWordmark.tsx — see NetGetMark.tsx for the actual badge
// (dark square, blue border) this sits inside.
//
// Deliberately NOT named netgetMark.ts (matching meMark.ts's convention):
// on a case-insensitive filesystem (macOS/APFS default), a filename
// differing from NetGetMark.tsx only in case ("netgetMark" vs
// "NetGetMark") is a real Vite module-graph hazard — confirmed live, it
// resolved './netgetMark' to the wrong module entirely (a default-export
// mismatch error) the first time this existed.
//
// Verified legible by rendering to ASCII (# = 1, . = 0) before committing —
// hand-typing a 7x35 bit grid is exactly the kind of thing that silently
// garbles one row and nobody notices until it renders:
//
//   #...#.#####.#####..###..#####.#####
//   ##..#.#.......#...#...#.#.......#..
//   #.#.#.#.......#...#.....#.......#..
//   #.#.#.####....#...#..##.####....#..
//   #..##.#.......#...#...#.#.......#..
//   #...#.#.......#...#...#.#.......#..
//   #...#.#####...#....###..#####...#..
export const NETGET_WORDMARK_BITMAP: string[] = [
  '10001011111011111001110011111011111',
  '11001010000000100010001010000000100',
  '10101010000000100010000010000000100',
  '10101011110000100010011011110000100',
  '10011010000000100010001010000000100',
  '10001010000000100010001010000000100',
  '10001011111000100001110011111000100',
];
