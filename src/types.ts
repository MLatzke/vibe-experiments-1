export interface Scene {
  /** Display name shown in the scene list */
  name: string

  /** Duration in ms. Use Infinity for scenes that require manual advance. */
  duration: number

  /** Called once when the scene becomes active. Use for init / state reset. */
  setup(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void

  /** Called every frame. `dt` is ms since last frame, `elapsed` is ms since scene start. */
  update(dt: number, elapsed: number): void

  /** Called every frame after update. Draw to the canvas here. */
  draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void

  /** Called when leaving the scene. Clean up any external resources. */
  teardown(): void
}

export interface DirectorEvents {
  onSceneChange?: (index: number, scene: Scene) => void
  onTransitionStart?: (from: number, to: number) => void
  onTransitionEnd?: (index: number) => void
}
