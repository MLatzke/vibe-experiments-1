import type { Scene } from "../types.ts"
import { createCustomGridScene } from "./custom-grid.ts"
import { createBrandGridScene } from "./brand-grid.ts"

/** All scenes in playback order. Add new scenes here. */
export function getAllScenes(): Scene[] {
  const scenes: Scene[] = []

  // User-created grid shows first if it exists
  const custom = createCustomGridScene()
  if (custom) scenes.push(custom)

  scenes.push(createBrandGridScene())

  return scenes
}
