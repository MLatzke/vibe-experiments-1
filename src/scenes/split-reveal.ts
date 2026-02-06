import type { Scene } from "../types.ts"

/** Screen splits apart to reveal text, then snaps shut. */
export function createSplitRevealScene(): Scene {
  let elapsed = 0
  const duration = 4000

  return {
    name: "Split Reveal",
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

      // Phase 1: split open (0 → 0.4)
      // Phase 2: hold (0.4 → 0.7)
      // Phase 3: snap shut (0.7 → 1.0)

      let splitAmount: number

      if (t < 0.4) {
        splitAmount = easeOutExpo(t / 0.4)
      } else if (t < 0.7) {
        splitAmount = 1
      } else {
        splitAmount = 1 - easeInExpo((t - 0.7) / 0.3)
      }

      const gap = splitAmount * h * 0.35

      // Background (the "inside" revealed by the split)
      ctx.fillStyle = "#ff3c3c"
      ctx.fillRect(0, 0, w, h)

      // Revealed text
      if (splitAmount > 0.3) {
        const textAlpha = Math.min((splitAmount - 0.3) / 0.4, 1)
        ctx.globalAlpha = textAlpha
        ctx.fillStyle = "#fff"
        const fontSize = Math.min(w * 0.12, 140)
        ctx.font = `900 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("SPLIT", w / 2, h / 2)

        // Secondary line
        ctx.font = `300 ${fontSize * 0.25}px "Helvetica Neue", Helvetica, Arial, sans-serif`
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
        ctx.fillText("CREATIVE DIRECTION", w / 2, h / 2 + fontSize * 0.55)

        ctx.globalAlpha = 1
      }

      // Top panel
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, w, h / 2 - gap)

      // Bottom panel
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, h / 2 + gap, w, h / 2)

      // Panel edges — subtle highlight
      if (gap > 1) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)"
        ctx.fillRect(0, h / 2 - gap - 1, w, 1)
        ctx.fillRect(0, h / 2 + gap, w, 1)
      }

      // Noise texture on panels (subtle)
      if (splitAmount < 1) {
        drawNoiseStripe(ctx, 0, 0, w, h / 2 - gap, elapsed)
        drawNoiseStripe(ctx, 0, h / 2 + gap, w, h / 2, elapsed)
      }
    },

    teardown() {},
  }
}

function drawNoiseStripe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  _seed: number
) {
  ctx.save()
  ctx.globalAlpha = 0.03
  const step = 8
  for (let iy = y; iy < y + h; iy += step) {
    for (let ix = x; ix < x + w; ix += step) {
      const v = Math.random() * 255
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(ix, iy, step, step)
    }
  }
  ctx.restore()
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}
