import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Repozytorium hostowane jest pod https://USERNAME.github.io/kartalab/,
// dlatego base musi wskazywać na podfolder repo.
export default defineConfig({
  base: '/kartalab/',
  plugins: [react(), tailwindcss()],
})
