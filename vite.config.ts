import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Aplikacja jest hostowana w katalogu głównym domeny kartolab.torobie.pl.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
