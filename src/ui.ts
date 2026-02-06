import type { Director } from "./director.ts"

export function createUI(container: HTMLElement, director: Director) {
  container.innerHTML = /* html */ `
    <button class="nav-btn nav-prev" aria-label="Previous scene">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M13 4L7 10L13 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <button class="nav-btn nav-pause" aria-label="Pause auto-advance">
      <svg class="pause-icon" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
        <rect x="4" y="3" width="3.5" height="12" rx="1"/>
        <rect x="10.5" y="3" width="3.5" height="12" rx="1"/>
      </svg>
      <svg class="play-icon" width="18" height="18" viewBox="0 0 18 18" fill="currentColor" style="display:none">
        <path d="M5 3.5L14 9L5 14.5V3.5Z"/>
      </svg>
    </button>

    <div class="scene-indicator">
      <button class="scene-counter" aria-label="Open scene list">
        <span class="scene-num">1</span><span class="scene-sep">/</span><span class="scene-total">1</span>
      </button>
    </div>

    <button class="nav-btn nav-next" aria-label="Next scene">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 4L13 10L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="scene-list" hidden>
      <div class="scene-list-inner"></div>
    </div>

    <a class="builder-link" href="builder.html">Builder</a>
  `

  const prevBtn = container.querySelector<HTMLButtonElement>(".nav-prev")!
  const nextBtn = container.querySelector<HTMLButtonElement>(".nav-next")!
  const pauseBtn = container.querySelector<HTMLButtonElement>(".nav-pause")!
  const pauseIcon = container.querySelector<SVGElement>(".pause-icon")!
  const playIcon = container.querySelector<SVGElement>(".play-icon")!
  const counterBtn = container.querySelector<HTMLButtonElement>(".scene-counter")!
  const sceneNum = container.querySelector<HTMLSpanElement>(".scene-num")!
  const sceneTotal = container.querySelector<HTMLSpanElement>(".scene-total")!
  const sceneList = container.querySelector<HTMLDivElement>(".scene-list")!
  const sceneListInner = container.querySelector<HTMLDivElement>(".scene-list-inner")!

  prevBtn.addEventListener("click", () => director.prev())
  nextBtn.addEventListener("click", () => director.next())
  pauseBtn.addEventListener("click", togglePause)

  function togglePause() {
    const paused = director.isAutoAdvancing
    director.setAutoAdvance(!paused)
    pauseIcon.style.display = paused ? "none" : ""
    playIcon.style.display = paused ? "" : "none"
  }

  counterBtn.addEventListener("click", () => {
    const isOpen = !sceneList.hidden
    sceneList.hidden = isOpen
    if (!isOpen) buildSceneList()
  })

  function buildSceneList() {
    const scenes = director.sceneList
    sceneListInner.innerHTML = scenes
      .map(
        (s) => /* html */ `
      <button class="scene-list-item ${s.index === director.current ? "active" : ""}" data-index="${s.index}">
        <span class="scene-list-index">${String(s.index + 1).padStart(2, "0")}</span>
        <span class="scene-list-name">${s.name}</span>
      </button>`
      )
      .join("")

    sceneListInner.querySelectorAll<HTMLButtonElement>(".scene-list-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.index!, 10)
        director.goTo(idx)
        sceneList.hidden = true
      })
    })
  }

  function updateIndicator(index: number) {
    sceneNum.textContent = String(index + 1)
    sceneTotal.textContent = String(director.sceneCount)
  }

  // Keyboard navigation
  function onKey(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault()
      director.next()
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      director.prev()
    } else if (e.key === "p" || e.key === "P") {
      e.preventDefault()
      togglePause()
    } else if (e.key === "Escape") {
      sceneList.hidden = true
    }
  }
  window.addEventListener("keydown", onKey)

  return {
    update: updateIndicator,
    destroy() {
      window.removeEventListener("keydown", onKey)
    },
  }
}
