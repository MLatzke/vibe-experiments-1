import type { Scene } from "../types.ts"
import { drawTile, brandColor } from "../tile-renderer.ts"

/** Deterministic hash for a grid cell — stable across frames. */
function hash(col: number, row: number, seed: number): number {
  let h = (col * 374761393 + row * 668265263 + seed * 1274126177) | 0
  h = ((h ^ (h >> 13)) * 1103515245) | 0
  h = (h ^ (h >> 16)) | 0
  return (h >>> 0) / 0xffffffff
}

function cornerConfig(col: number, row: number): boolean[] {
  return [
    hash(col, row, 0) > 0.45,
    hash(col, row, 1) > 0.45,
    hash(col, row, 2) > 0.45,
    hash(col, row, 3) > 0.45,
  ]
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

          const baseT = normDist * 0.7
          const wave = Math.sin((normDist * 4 - time * 1.5) * Math.PI) * 0.5 + 0.5
          const colorT = baseT + wave * 0.25
          const brightness = 0.82 + wave * 0.22

          drawTile(ctx, x, y, s, r, corners, brandColor(colorT, brightness))
        }
      }
    },

    teardown() {},
  }
}
