// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Importar o novo plugin

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Adicionar o plugin aqui
  ],
})