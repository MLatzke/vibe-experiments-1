const PI = Math.PI

/**
 * Draws a single tile shape with configurable convex/concave corners.
 * corners: [TL, TR, BR, BL] — true = convex (rounded outward), false = concave (curved inward)
 */
export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  r: number,
  corners: boolean[],
  fillStyle: string
) {
  ctx.beginPath()
  ctx.moveTo(x, y + r)

  if (corners[0]) ctx.arc(x + r, y + r, r, PI, PI * 1.5, false)
  else ctx.arc(x, y, r, PI * 0.5, 0, true)

  ctx.lineTo(x + s - r, y)

  if (corners[1]) ctx.arc(x + s - r, y + r, r, PI * 1.5, 0, false)
  else ctx.arc(x + s, y, r, PI, PI * 0.5, true)

  ctx.lineTo(x + s, y + s - r)

  if (corners[2]) ctx.arc(x + s - r, y + s - r, r, 0, PI * 0.5, false)
  else ctx.arc(x + s, y + s, r, PI * 1.5, PI, true)

  ctx.lineTo(x + r, y + s)

  if (corners[3]) ctx.arc(x + r, y + s - r, r, PI * 0.5, PI, false)
  else ctx.arc(x, y + s, r, 0, PI * 1.5, true)

  ctx.closePath()
  ctx.fillStyle = fillStyle
  ctx.fill()
}

/** Brand palette: hot pink → coral → orange (loops) */
export const BRAND_PALETTE: [number, number, number][] = [
  [232, 75, 138],
  [240, 139, 123],
  [245, 165, 67],
  [240, 139, 123],
]

/** Interpolate through the brand palette with brightness control. */
export function brandColor(t: number, brightness: number): string {
  const clamped = ((t % 1) + 1) % 1
  const scaled = clamped * (BRAND_PALETTE.length - 1)
  const i = Math.floor(scaled)
  const f = scaled - i
  const a = BRAND_PALETTE[i]
  const b = BRAND_PALETTE[Math.min(i + 1, BRAND_PALETTE.length - 1)]

  const r = Math.min(255, Math.round((a[0] + (b[0] - a[0]) * f) * brightness))
  const g = Math.min(255, Math.round((a[1] + (b[1] - a[1]) * f) * brightness))
  const bl = Math.min(255, Math.round((a[2] + (b[2] - a[2]) * f) * brightness))

  return `rgb(${r},${g},${bl})`
}

/**
 * All 16 possible corner configs, ordered from most-convex to most-concave.
 * Grouped: 0 concave, 1 concave (4 rotations), 2 adjacent (4), 2 diagonal (2), 3 concave (4), 4 concave.
 */
export const ALL_SHAPE_CONFIGS: boolean[][] = [
  [true, true, true, true],

  [false, true, true, true],
  [true, false, true, true],
  [true, true, false, true],
  [true, true, true, false],

  [false, false, true, true],
  [true, false, false, true],
  [true, true, false, false],
  [false, true, true, false],

  [false, true, false, true],
  [true, false, true, false],

  [true, false, false, false],
  [false, true, false, false],
  [false, false, true, false],
  [false, false, false, true],

  [false, false, false, false],
]

/** Saved grid format stored in localStorage. */
export interface SavedGrid {
  cols: number
  rows: number
  cells: Record<string, boolean[]>
}

export const STORAGE_KEY = "brandGrid"
