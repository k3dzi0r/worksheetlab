import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Repozytorium hostowane jest pod https://USERNAME.github.io/worksheetlab/.
// Ta sama ścieżka jest użyta przy fontach w src/index.css, ponieważ są w public/fonts.
// Przy zmianie nazwy repozytorium należy zaktualizować oba miejsca.
export default defineConfig({
  base: '/worksheetlab/',
  plugins: [react(), tailwindcss()],
})
