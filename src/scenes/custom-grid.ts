import type { Scene } from "../types.ts"
import { drawTile, brandColor, STORAGE_KEY, type SavedGrid } from "../tile-renderer.ts"

/** Loads a user-created grid from localStorage and renders it with the brand color pulse. */
export function createCustomGridScene(): Scene | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  let saved: SavedGrid
  try {
    saved = JSON.parse(raw)
  } catch {
    return null
  }

  if (!saved.cols || !saved.rows || !saved.cells) return null

  const entries = Object.entries(saved.cells)
  if (entries.length === 0) return null

  let elapsed = 0

  return {
    name: "Custom Grid",
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

      // Scale tiles to fit the saved layout centered on screen
      const tileSize = Math.min(
        (w * 0.9) / saved.cols,
        (h * 0.9) / saved.rows
      )
      const gap = tileSize * 0.05
      const s = tileSize - gap
      const r = s * 0.48

      const totalW = saved.cols * tileSize
      const totalH = saved.rows * tileSize
      const offsetX = (w - totalW) / 2
      const offsetY = (h - totalH) / 2

      const cx = w / 2
      const cy = h / 2
      const maxDist = Math.sqrt(cx * cx + cy * cy)
      const time = elapsed / 1000

      for (const [key, corners] of entries) {
        const [col, row] = key.split(",").map(Number)
        const x = offsetX + col * tileSize + gap / 2
        const y = offsetY + row * tileSize + gap / 2

        const tileCx = x + s / 2
        const tileCy = y + s / 2
        const dist = Math.sqrt((tileCx - cx) ** 2 + (tileCy - cy) ** 2)
        const normDist = dist / maxDist

        const baseT = normDist * 0.7
        const wave = Math.sin((normDist * 4 - time * 1.5) * Math.PI) * 0.5 + 0.5
        const colorT = baseT + wave * 0.25
        const brightness = 0.82 + wave * 0.22

        drawTile(ctx, x, y, s, r, corners, brandColor(colorT, brightness))
      }
    },

    teardown() {},
  }
}
