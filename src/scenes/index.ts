import type { Scene } from "../types.ts"
import { createCustomGridScene } from "./custom-grid.ts"
import { createBrandGridScene } from "./brand-grid.ts"
import { createKineticTypeScene } from "./kinetic-type.ts"
import { createGridPulseScene } from "./grid-pulse.ts"
import { createColorWipeScene } from "./color-wipe.ts"
import { createParticleFieldScene } from "./particle-field.ts"
import { createSplitRevealScene } from "./split-reveal.ts"

/** All scenes in playback order. Add new scenes here. */
export function getAllScenes(): Scene[] {
  const scenes: Scene[] = []

  // User-created grid shows first if it exists
  const custom = createCustomGridScene()
  if (custom) scenes.push(custom)

  scenes.push(
    createBrandGridScene(),
    createKineticTypeScene(),
    createGridPulseScene(),
    createColorWipeScene(),
    createParticleFieldScene(),
    createSplitRevealScene(),
  )

  return scenes
}
