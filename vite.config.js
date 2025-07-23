// telehealth-frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // REMOVED: Explicit postcss configuration. Vite will now auto-detect postcss.config.js.
  // css: {
  //   postcss: './postcss.config.js',
  // },
})