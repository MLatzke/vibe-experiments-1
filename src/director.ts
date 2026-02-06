import type { Scene, DirectorEvents } from "./types.ts"

export type TransitionFn = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  fromPixels: ImageData | null,
  toPixels: ImageData | null,
  progress: number
) => void

const defaultTransition: TransitionFn = (ctx, canvas, _from, toPixels, progress) => {
  // Simple fade-through-black
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (progress <= 0.5 && _from) {
    ctx.globalAlpha = 1 - progress * 2
    ctx.putImageData(_from, 0, 0)
    ctx.globalAlpha = 1
  } else if (toPixels) {
    ctx.globalAlpha = (progress - 0.5) * 2
    ctx.putImageData(toPixels, 0, 0)
    ctx.globalAlpha = 1
  }
}

export class Director {
  private scenes: Scene[] = []
  private currentIndex = -1
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private rafId = 0
  private lastTime = 0
  private sceneElapsed = 0
  private running = false
  private events: DirectorEvents = {}

  // Transition state
  private transitioning = false
  private transitionFrom: ImageData | null = null
  private transitionTo: ImageData | null = null
  private transitionProgress = 0
  private transitionDuration = 600 // ms
  private transitionFn: TransitionFn = defaultTransition
  private transitionTargetIndex = -1

  // Auto-advance
  private autoAdvance = true

  constructor(canvas: HTMLCanvasElement, events?: DirectorEvents) {
    this.canvas = canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not get 2d context")
    this.ctx = ctx
    if (events) this.events = events
    this.handleResize()
    window.addEventListener("resize", this.handleResize)
  }

  private handleResize = () => {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  register(scene: Scene) {
    this.scenes.push(scene)
  }

  registerAll(scenes: Scene[]) {
    scenes.forEach((s) => this.register(s))
  }

  get sceneCount() {
    return this.scenes.length
  }

  get current() {
    return this.currentIndex
  }

  get currentScene(): Scene | null {
    return this.scenes[this.currentIndex] ?? null
  }

  get sceneList(): { name: string; index: number }[] {
    return this.scenes.map((s, i) => ({ name: s.name, index: i }))
  }

  get isTransitioning() {
    return this.transitioning
  }

  setTransition(fn: TransitionFn, durationMs = 600) {
    this.transitionFn = fn
    this.transitionDuration = durationMs
  }

  get isAutoAdvancing() {
    return this.autoAdvance
  }

  setAutoAdvance(on: boolean) {
    this.autoAdvance = on
  }

  /** Jump directly to a scene (with transition). */
  goTo(index: number) {
    if (index < 0 || index >= this.scenes.length) return
    if (this.transitioning) return
    if (index === this.currentIndex) return
    this.startTransition(index)
  }

  next() {
    const nextIndex = (this.currentIndex + 1) % this.scenes.length
    this.goTo(nextIndex)
  }

  prev() {
    const prevIndex = (this.currentIndex - 1 + this.scenes.length) % this.scenes.length
    this.goTo(prevIndex)
  }

  start(startIndex = 0) {
    if (this.scenes.length === 0) return
    this.running = true
    this.currentIndex = startIndex
    const scene = this.scenes[this.currentIndex]
    scene.setup(this.ctx, this.canvas)
    this.sceneElapsed = 0
    this.lastTime = performance.now()
    this.events.onSceneChange?.(this.currentIndex, scene)
    this.loop(this.lastTime)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.rafId)
    const scene = this.scenes[this.currentIndex]
    scene?.teardown()
  }

  destroy() {
    this.stop()
    window.removeEventListener("resize", this.handleResize)
  }

  // ---- internal ----

  private startTransition(toIndex: number) {
    this.transitioning = true
    this.transitionProgress = 0
    this.transitionTargetIndex = toIndex

    // Capture current frame
    this.transitionFrom = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)

    // Setup next scene and render one frame to capture
    const oldScene = this.scenes[this.currentIndex]
    oldScene?.teardown()

    const newScene = this.scenes[toIndex]
    newScene.setup(this.ctx, this.canvas)

    // Clear and draw new scene once to capture its first frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    newScene.update(0, 0)
    newScene.draw(this.ctx, this.canvas)
    this.transitionTo = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)

    this.events.onTransitionStart?.(this.currentIndex, toIndex)
  }

  private finishTransition() {
    this.transitioning = false
    this.currentIndex = this.transitionTargetIndex
    this.sceneElapsed = 0
    this.transitionFrom = null
    this.transitionTo = null

    const scene = this.scenes[this.currentIndex]
    this.events.onSceneChange?.(this.currentIndex, scene)
    this.events.onTransitionEnd?.(this.currentIndex)
  }

  private loop = (time: number) => {
    if (!this.running) return
    const dt = time - this.lastTime
    this.lastTime = time

    if (this.transitioning) {
      this.transitionProgress += dt / this.transitionDuration
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1
        this.finishTransition()
      } else {
        this.transitionFn(
          this.ctx,
          this.canvas,
          this.transitionFrom,
          this.transitionTo,
          this.transitionProgress
        )
        this.rafId = requestAnimationFrame(this.loop)
        return
      }
    }

    const scene = this.scenes[this.currentIndex]
    if (!scene) return

    this.sceneElapsed += dt
    scene.update(dt, this.sceneElapsed)

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    scene.draw(this.ctx, this.canvas)

    // Auto-advance when duration is exceeded
    if (
      this.autoAdvance &&
      scene.duration !== Infinity &&
      this.sceneElapsed >= scene.duration
    ) {
      this.next()
    }

    this.rafId = requestAnimationFrame(this.loop)
  }
}
