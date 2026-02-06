import type { Scene } from "../types.ts"

const PI = Math.PI

// Brand palette: hot pink → coral → orange (loops back)
const PALETTE: [number, number, number][] = [
  [232, 75, 138],  // #E84B8A hot pink
  [240, 139, 123], // #F08B7B coral
  [245, 165, 67],  // #F5A543 orange
  [240, 139, 123], // #F08B7B coral (loop back)
]

/** Deterministic hash for a grid cell — stable across frames. */
function hash(col: number, row: number, seed: number): number {
  let h = (col * 374761393 + row * 668265263 + seed * 1274126177) | 0
  h = ((h ^ (h >> 13)) * 1103515245) | 0
  h = (h ^ (h >> 16)) | 0
  return (h >>> 0) / 0xffffffff // 0–1
}

/** Returns [TL, TR, BR, BL] — true = convex, false = concave. */
function cornerConfig(col: number, row: number): boolean[] {
  return [
    hash(col, row, 0) > 0.45,
    hash(col, row, 1) > 0.45,
    hash(col, row, 2) > 0.45,
    hash(col, row, 3) > 0.45,
  ]
}

function lerpColor(t: number, brightness: number): string {
  const clamped = ((t % 1) + 1) % 1
  const scaled = clamped * (PALETTE.length - 1)
  const i = Math.floor(scaled)
  const f = scaled - i
  const a = PALETTE[i]
  const b = PALETTE[Math.min(i + 1, PALETTE.length - 1)]

  const r = Math.min(255, Math.round((a[0] + (b[0] - a[0]) * f) * brightness))
  const g = Math.min(255, Math.round((a[1] + (b[1] - a[1]) * f) * brightness))
  const bl = Math.min(255, Math.round((a[2] + (b[2] - a[2]) * f) * brightness))

  return `rgb(${r},${g},${bl})`
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  r: number,
  corners: boolean[],
  color: string
) {
  ctx.beginPath()
  ctx.moveTo(x, y + r)

  // Top-left (corner 0)
  if (corners[0]) {
    ctx.arc(x + r, y + r, r, PI, PI * 1.5, false)
  } else {
    ctx.arc(x, y, r, PI * 0.5, 0, true)
  }

  ctx.lineTo(x + s - r, y)

  // Top-right (corner 1)
  if (corners[1]) {
    ctx.arc(x + s - r, y + r, r, PI * 1.5, 0, false)
  } else {
    ctx.arc(x + s, y, r, PI, PI * 0.5, true)
  }

  ctx.lineTo(x + s, y + s - r)

  // Bottom-right (corner 2)
  if (corners[2]) {
    ctx.arc(x + s - r, y + s - r, r, 0, PI * 0.5, false)
  } else {
    ctx.arc(x + s, y + s, r, PI * 1.5, PI, true)
  }

  ctx.lineTo(x + r, y + s)

  // Bottom-left (corner 3)
  if (corners[3]) {
    ctx.arc(x + r, y + s - r, r, PI * 0.5, PI, false)
  } else {
    ctx.arc(x, y + s, r, 0, PI * 1.5, true)
  }

  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

/** Full-screen grid of random interlocking brand shapes with a radial color pulse. */
export function createBrandGridScene(): Scene {
  let elapsed = 0

  return {
    name: "Brand Grid",
    duration: 8000,

    setup() {
      elapsed = 0
    },

    update(_dt, e) {
      elapsed = e
    },

    draw(ctx, canvas) {
      const w = canvas.width
      const h = canvas.height

      ctx.fillStyle = "#1E1E24"
      ctx.fillRect(0, 0, w, h)

      const tileSize = Math.max(60, Math.min(w, h) / 8)
      const gap = tileSize * 0.05
      const s = tileSize - gap
      const r = s * 0.48

      const cols = Math.ceil(w / tileSize) + 2
      const rows = Math.ceil(h / tileSize) + 2

      const offsetX = (w - cols * tileSize) / 2
      const offsetY = (h - rows * tileSize) / 2

      const cx = w / 2
      const cy = h / 2
      const maxDist = Math.sqrt(cx * cx + cy * cy)
      const time = elapsed / 1000

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * tileSize + gap / 2
          const y = offsetY + row * tileSize + gap / 2

          const tileCx = x + s / 2
          const tileCy = y + s / 2
          const dist = Math.sqrt((tileCx - cx) ** 2 + (tileCy - cy) ** 2)
          const normDist = dist / maxDist

          const corners = cornerConfig(col, row)

          // Base color from radial position
          const baseT = normDist * 0.7

          // Pulsing wave from center
          const wave = Math.sin((normDist * 4 - time * 1.5) * PI) * 0.5 + 0.5

          const colorT = baseT + wave * 0.25
          const brightness = 0.82 + wave * 0.22

          const color = lerpColor(colorT, brightness)

          drawTile(ctx, x, y, s, r, corners, color)
        }
      }
    },

    teardown() {},
  }
}
