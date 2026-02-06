import type { Scene } from "../types.ts"

/** Big bold word that scales and rotates in with a snap. */
export function createKineticTypeScene(): Scene {
  let phase = 0
  const word = "BRAND"
  const duration = 4000

  return {
    name: "Kinetic Type",
    duration,

    setup() {
      phase = 0
    },

    update(_dt, elapsed) {
      phase = Math.min(elapsed / duration, 1)
    },

    draw(ctx, canvas) {
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2

      // Background
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, w, h)

      // Entrance easing (overshoot)
      const t = phase
      const eased = t < 0.4 ? elasticOut(t / 0.4) : 1
      const scale = eased * 1
      const rotation = (1 - eased) * -0.15

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotation)
      ctx.scale(scale, scale)

      // Main word
      const fontSize = Math.min(w * 0.22, 260)
      ctx.font = `900 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Stroke version behind
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 3
      ctx.strokeText(word, 0, 0)

      // Solid fill
      ctx.fillStyle = "#fff"
      ctx.globalAlpha = Math.min(t * 3, 1)
      ctx.fillText(word, 0, 0)
      ctx.globalAlpha = 1

      ctx.restore()

      // Accent line that wipes in
      if (t > 0.3) {
        const lineProgress = Math.min((t - 0.3) / 0.3, 1)
        const lineW = w * 0.3 * lineProgress
        ctx.fillStyle = "#ff3c3c"
        ctx.fillRect(cx - lineW / 2, cy + fontSize * 0.45, lineW, 4)
      }

      // Subtitle fades in
      if (t > 0.5) {
        const subAlpha = Math.min((t - 0.5) / 0.3, 1)
        ctx.globalAlpha = subAlpha
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
        ctx.font = `400 ${Math.min(w * 0.02, 18)}px "Helvetica Neue", Helvetica, Arial, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText("IDENTITY SYSTEM — 2026", cx, cy + fontSize * 0.55 + 16)
        ctx.globalAlpha = 1
      }
    },

    teardown() {},
  }
}

function elasticOut(t: number): number {
  return Math.sin(-13 * Math.PI * 0.5 * (t + 1)) * Math.pow(2, -10 * t) + 1
}
