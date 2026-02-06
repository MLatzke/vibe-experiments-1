import type { Scene } from "../types.ts"

/** Bold color blocks that wipe across the screen with a wordmark. */
export function createColorWipeScene(): Scene {
  let elapsed = 0
  const duration = 4500

  const colors = ["#ff3c3c", "#1a1aff", "#ffd500", "#00e6a0"]

  return {
    name: "Color Wipe",
    duration,

    setup() {
      elapsed = 0
    },

    update(_dt, e) {
      elapsed = e
    },

    draw(ctx, canvas) {
      const w = canvas.width
      const h = canvas.height
      const t = Math.min(elapsed / duration, 1)

      // Background
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, w, h)

      // Staggered color wipes
      const wipeWidth = w * 0.3
      colors.forEach((color, i) => {
        const stagger = i * 0.12
        const wipeT = Math.max(0, Math.min((t - stagger) / 0.35, 1))
        const eased = easeOutQuart(wipeT)

        const startX = -wipeWidth
        const endX = w + wipeWidth

        // Wipe from left to right, then collapse
        let x: number, blockW: number

        if (t < 0.5 + stagger * 0.5) {
          // Wipe in
          x = startX + (endX - startX) * eased * 0.5
          blockW = wipeWidth
        } else {
          // Wipe out
          const outT = Math.min((t - 0.5 - stagger * 0.5) / 0.3, 1)
          const outEased = easeOutQuart(outT)
          x = startX + (endX - startX) * 0.5 + (endX - startX) * 0.5 * outEased
          blockW = wipeWidth * (1 - outEased)
        }

        ctx.fillStyle = color
        ctx.fillRect(x, 0, blockW, h)
      })

      // Centered wordmark fades in after wipes
      if (t > 0.55) {
        const textT = Math.min((t - 0.55) / 0.3, 1)
        ctx.globalAlpha = textT
        ctx.fillStyle = "#fff"
        const fontSize = Math.min(w * 0.08, 100)
        ctx.font = `800 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("VIGNETTE", w / 2, h / 2)

        // Thin rule below
        const ruleW = fontSize * 3 * textT
        ctx.fillRect(w / 2 - ruleW / 2, h / 2 + fontSize * 0.6, ruleW, 1.5)

        ctx.globalAlpha = 1
      }
    },

    teardown() {},
  }
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}
