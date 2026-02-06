import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  base: "/vibe-experiments-1/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        builder: resolve(__dirname, "builder.html"),
      },
    },
  },
})
