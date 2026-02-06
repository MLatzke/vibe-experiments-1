import "./builder.css"
import {
  drawTile,
  ALL_SHAPE_CONFIGS,
  STORAGE_KEY,
  type SavedGrid,
} from "./tile-renderer.ts"

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
interface GridState {
  cols: number
  rows: number
  cells: (boolean[] | null)[][]
}

let grid: GridState = { cols: 0, rows: 0, cells: [] }
let tileSize = 0
let gridOffsetX = 0
let gridOffsetY = 0

let selectedShapeIndex = 0
let isPainting = false
let paintMode: "place" | "erase" = "place"
let hoverCol = -1
let hoverRow = -1

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------
const canvas = document.getElementById("grid-canvas") as HTMLCanvasElement
const ctx = canvas.getContext("2d")!
const paletteEl = document.getElementById("palette") as HTMLDivElement

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
function layoutGrid() {
  const toolbarH = 48
  const paletteH = 72
  const canvasW = window.innerWidth
  const canvasH = window.innerHeight - toolbarH - paletteH

  canvas.width = canvasW
  canvas.height = canvasH

  tileSize = Math.max(48, Math.min(canvasW, canvasH) / 10)
  const cols = Math.floor(canvasW / tileSize)
  const rows = Math.floor(canvasH / tileSize)

  gridOffsetX = (canvasW - cols * tileSize) / 2
  gridOffsetY = (canvasH - rows * tileSize) / 2

  // Preserve cells if grid shrinks/grows
  const oldCells = grid.cells
  const newCells: (boolean[] | null)[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) =>
      r < grid.rows && c < grid.cols ? (oldCells[r]?.[c] ?? null) : null
    )
  )
  grid = { cols, rows, cells: newCells }
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
function buildPalette() {
  paletteEl.innerHTML = ""

  // Eraser
  const eraser = document.createElement("button")
  eraser.className = "palette-item eraser"
  eraser.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10"/><path d="m5.828 18.172 12.344-12.344a2 2 0 0 0 0-2.828l-1.172-1.172a2 2 0 0 0-2.828 0L1.828 14.172a2 2 0 0 0 0 2.828l1.172 1.172a2 2 0 0 0 2.828 0z"/><path d="m4 15 5 5"/></svg>`
  eraser.title = "Eraser"
  eraser.dataset.index = "-1"
  eraser.addEventListener("click", () => selectShape(-1))
  paletteEl.appendChild(eraser)

  addSeparator()

  // Shape items — add separators between groups
  const groupBreaks = [1, 5, 9, 11, 15] // indices where new groups start
  ALL_SHAPE_CONFIGS.forEach((config, i) => {
    if (groupBreaks.includes(i)) addSeparator()

    const item = document.createElement("canvas")
    item.width = 48
    item.height = 48
    item.className = "palette-item"
    item.dataset.index = String(i)

    const itemCtx = item.getContext("2d")!
    drawTile(itemCtx, 6, 6, 36, 16, config, "rgba(255,255,255,0.65)")

    item.addEventListener("click", () => selectShape(i))
    item.addEventListener("pointerdown", (e) => onPaletteDragStart(e, i))

    paletteEl.appendChild(item)
  })
}

function addSeparator() {
  const sep = document.createElement("div")
  sep.className = "palette-separator"
  paletteEl.appendChild(sep)
}

function selectShape(index: number) {
  selectedShapeIndex = index
  paletteEl.querySelectorAll(".palette-item").forEach((el) => {
    const elIdx = parseInt((el as HTMLElement).dataset.index!, 10)
    el.classList.toggle("selected", elIdx === index)
  })
  canvas.style.cursor = index === -1 ? "not-allowed" : "crosshair"
}

// ---------------------------------------------------------------------------
// Grid interaction — click & paint
// ---------------------------------------------------------------------------
function cellAt(clientX: number, clientY: number): [number, number] | null {
  const rect = canvas.getBoundingClientRect()
  const mx = clientX - rect.left
  const my = clientY - rect.top
  const col = Math.floor((mx - gridOffsetX) / tileSize)
  const row = Math.floor((my - gridOffsetY) / tileSize)
  if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return null
  return [col, row]
}

function applyToCell(col: number, row: number) {
  if (paintMode === "erase") {
    grid.cells[row][col] = null
  } else if (selectedShapeIndex >= 0) {
    grid.cells[row][col] = [...ALL_SHAPE_CONFIGS[selectedShapeIndex]]
  }
}

function onPointerDown(e: PointerEvent) {
  canvas.setPointerCapture(e.pointerId)
  const cell = cellAt(e.clientX, e.clientY)
  if (!cell) return
  const [col, row] = cell

  isPainting = true

  if (selectedShapeIndex === -1) {
    // Eraser
    paintMode = "erase"
  } else {
    const current = grid.cells[row][col]
    const config = ALL_SHAPE_CONFIGS[selectedShapeIndex]
    // Toggle: same shape → erase, otherwise place
    if (current && arrEq(current, config)) {
      paintMode = "erase"
    } else {
      paintMode = "place"
    }
  }

  applyToCell(col, row)
  render()
}

function onPointerMove(e: PointerEvent) {
  const cell = cellAt(e.clientX, e.clientY)
  if (cell) {
    hoverCol = cell[0]
    hoverRow = cell[1]
  } else {
    hoverCol = hoverRow = -1
  }

  if (isPainting && cell) {
    applyToCell(cell[0], cell[1])
  }

  render()
}

function onPointerUp() {
  isPainting = false
}

function onPointerLeave() {
  hoverCol = hoverRow = -1
  isPainting = false
  render()
}

// ---------------------------------------------------------------------------
// Palette drag → grid
// ---------------------------------------------------------------------------
function onPaletteDragStart(e: PointerEvent, shapeIndex: number) {
  if (e.button !== 0) return
  e.preventDefault()

  const ghost = document.createElement("canvas")
  ghost.width = 56
  ghost.height = 56
  ghost.className = "drag-ghost"
  const ghostCtx = ghost.getContext("2d")!
  drawTile(ghostCtx, 4, 4, 48, 22, ALL_SHAPE_CONFIGS[shapeIndex], "rgba(255,255,255,0.5)")
  ghost.style.left = e.clientX - 28 + "px"
  ghost.style.top = e.clientY - 28 + "px"
  document.body.appendChild(ghost)

  const onMove = (ev: PointerEvent) => {
    ghost.style.left = ev.clientX - 28 + "px"
    ghost.style.top = ev.clientY - 28 + "px"
    const cell = cellAt(ev.clientX, ev.clientY)
    hoverCol = cell ? cell[0] : -1
    hoverRow = cell ? cell[1] : -1
    render()
  }

  const onUp = (ev: PointerEvent) => {
    ghost.remove()
    const cell = cellAt(ev.clientX, ev.clientY)
    if (cell) {
      grid.cells[cell[1]][cell[0]] = [...ALL_SHAPE_CONFIGS[shapeIndex]]
      selectShape(shapeIndex)
    }
    hoverCol = hoverRow = -1
    render()
    document.removeEventListener("pointermove", onMove)
    document.removeEventListener("pointerup", onUp)
  }

  document.addEventListener("pointermove", onMove)
  document.addEventListener("pointerup", onUp)
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function render() {
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = "#1E1E24"
  ctx.fillRect(0, 0, w, h)

  const gap = tileSize * 0.05
  const s = tileSize - gap
  const r = s * 0.48

  // Grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)"
  ctx.lineWidth = 1
  for (let row = 0; row <= grid.rows; row++) {
    const y = gridOffsetY + row * tileSize
    ctx.beginPath()
    ctx.moveTo(gridOffsetX, y)
    ctx.lineTo(gridOffsetX + grid.cols * tileSize, y)
    ctx.stroke()
  }
  for (let col = 0; col <= grid.cols; col++) {
    const x = gridOffsetX + col * tileSize
    ctx.beginPath()
    ctx.moveTo(x, gridOffsetY)
    ctx.lineTo(x, gridOffsetY + grid.rows * tileSize)
    ctx.stroke()
  }

  // Hover highlight
  if (hoverCol >= 0 && hoverRow >= 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
    ctx.fillRect(
      gridOffsetX + hoverCol * tileSize,
      gridOffsetY + hoverRow * tileSize,
      tileSize,
      tileSize
    )
  }

  // Tiles
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const config = grid.cells[row][col]
      if (!config) continue
      const x = gridOffsetX + col * tileSize + gap / 2
      const y = gridOffsetY + row * tileSize + gap / 2
      drawTile(ctx, x, y, s, r, config, "#D0D0D0")
    }
  }
}

// ---------------------------------------------------------------------------
// Save / Clear
// ---------------------------------------------------------------------------
function saveGrid() {
  let minCol = grid.cols
  let maxCol = 0
  let minRow = grid.rows
  let maxRow = 0
  let hasAny = false

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (grid.cells[row][col]) {
        minCol = Math.min(minCol, col)
        maxCol = Math.max(maxCol, col)
        minRow = Math.min(minRow, row)
        maxRow = Math.max(maxRow, row)
        hasAny = true
      }
    }
  }

  if (!hasAny) return

  // Normalize to 0,0 origin
  const cells: Record<string, boolean[]> = {}
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const c = grid.cells[row][col]
      if (c) cells[`${col - minCol},${row - minRow}`] = c
    }
  }

  const saved: SavedGrid = {
    cols: maxCol - minCol + 1,
    rows: maxRow - minRow + 1,
    cells,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

  // Navigate to viewer
  window.location.href = import.meta.env.BASE_URL
}

function clearGrid() {
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      grid.cells[row][col] = null
    }
  }
  render()
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function arrEq(a: boolean[], b: boolean[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function init() {
  layoutGrid()
  buildPalette()
  selectShape(0)

  canvas.addEventListener("pointerdown", onPointerDown)
  canvas.addEventListener("pointermove", onPointerMove)
  canvas.addEventListener("pointerup", onPointerUp)
  canvas.addEventListener("pointerleave", onPointerLeave)

  document.getElementById("save-btn")!.addEventListener("click", saveGrid)
  document.getElementById("clear-btn")!.addEventListener("click", clearGrid)

  window.addEventListener("resize", () => {
    layoutGrid()
    render()
  })

  render()
}

init()
