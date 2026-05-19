import { defineConfig } from 'vite'
import tailwinds from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwinds(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
