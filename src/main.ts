import "./styles.css"
import { Director } from "./director.ts"
import { createUI } from "./ui.ts"
import { getAllScenes } from "./scenes/index.ts"

const canvas = document.getElementById("stage") as HTMLCanvasElement
const uiContainer = document.getElementById("ui") as HTMLDivElement

const director = new Director(canvas, {
  onSceneChange(index) {
    ui.update(index)
  },
})

director.registerAll(getAllScenes())

const ui = createUI(uiContainer, director)

director.start(0)
