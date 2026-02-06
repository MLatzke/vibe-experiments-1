import type { Scene } from "../types.ts"

/** A grid of dots that pulse outward from center. */
export function createGridPulseScene(): Scene {
  let elapsed = 0

  return {
    name: "Grid Pulse",
    duration: 5000,

    setup() {
      elapsed = 0
    },

    update(_dt, e) {
      elapsed = e
    },

    draw(ctx, canvas) {
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2

      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, w, h)

      const spacing = Math.max(28, Math.min(w, h) * 0.035)
      const cols = Math.ceil(w / spacing) + 2
      const rows = Math.ceil(h / spacing) + 2
      const offsetX = (w - (cols - 1) * spacing) / 2
      const offsetY = (h - (rows - 1) * spacing) / 2

      const time = elapsed / 1000

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * spacing
          const y = offsetY + r * spacing

          const dx = x - cx
          const dy = y - cy
          const dist = Math.sqrt(dx * dx + dy * dy)

          // Ripple wave from center
          const wave = Math.sin(dist * 0.015 - time * 3) * 0.5 + 0.5
          const radius = 2 + wave * 4
          const alpha = 0.15 + wave * 0.6

          // Color shifts based on angle
          const angle = Math.atan2(dy, dx)
          const hue = ((angle / Math.PI + 1) * 180 + time * 30) % 360

          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha})`
          ctx.fill()
        }
      }
    },

    teardown() {},
  }
}
