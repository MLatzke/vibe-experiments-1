import type { Scene } from "../types.ts"
import { createKineticTypeScene } from "./kinetic-type.ts"
import { createGridPulseScene } from "./grid-pulse.ts"
import { createColorWipeScene } from "./color-wipe.ts"
import { createParticleFieldScene } from "./particle-field.ts"
import { createSplitRevealScene } from "./split-reveal.ts"

/** All scenes in playback order. Add new scenes here. */
export function getAllScenes(): Scene[] {
  return [
    createKineticTypeScene(),
    createGridPulseScene(),
    createColorWipeScene(),
    createParticleFieldScene(),
    createSplitRevealScene(),
  ]
}
