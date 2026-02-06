import type { Scene } from "../types.ts"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  hue: number
}

/** Drifting particle field that reacts to a central attractor. */
export function createParticleFieldScene(): Scene {
  let particles: Particle[] = []
  let elapsed = 0
  let w = 0
  let h = 0

  function initParticles(canvas: HTMLCanvasElement) {
    w = canvas.width
    h = canvas.height
    const count = Math.floor((w * h) / 3000)
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      hue: Math.random() * 40 + 200, // blue-purple range
    }))
  }

  return {
    name: "Particle Field",
    duration: 6000,

    setup(_ctx, canvas) {
      elapsed = 0
      initParticles(canvas)
    },

    update(dt, e) {
      elapsed = e
      const cx = w / 2
      const cy = h / 2
      const time = elapsed / 1000

      // Attractor strength oscillates
      const attractStrength = Math.sin(time * 0.8) * 0.00015

      for (const p of particles) {
        const dx = cx - p.x
        const dy = cy - p.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 1

        // Attract/repel from center
        p.vx += (dx / dist) * attractStrength * dt
        p.vy += (dy / dist) * attractStrength * dt

        // Gentle drift
        p.vx += Math.sin(time + p.y * 0.005) * 0.001
        p.vy += Math.cos(time + p.x * 0.005) * 0.001

        // Damping
        p.vx *= 0.998
        p.vy *= 0.998

        p.x += p.vx * dt * 0.5
        p.y += p.vy * dt * 0.5

        // Wrap
        if (p.x < 0) p.x += w
        if (p.x > w) p.x -= w
        if (p.y < 0) p.y += h
        if (p.y > h) p.y -= h
      }
    },

    draw(ctx, canvas) {
      // Fade trail
      ctx.fillStyle = "rgba(8, 8, 15, 0.15)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 60%, 65%, ${p.alpha})`
        ctx.fill()
      }

      // Center glow
      const time = elapsed / 1000
      const glowRadius = 80 + Math.sin(time * 1.2) * 30
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        glowRadius
      )
      gradient.addColorStop(0, "rgba(140, 120, 255, 0.15)")
      gradient.addColorStop(1, "rgba(140, 120, 255, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(
        canvas.width / 2 - glowRadius,
        canvas.height / 2 - glowRadius,
        glowRadius * 2,
        glowRadius * 2
      )
    },

    teardown() {
      particles = []
    },
  }
}
