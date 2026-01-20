import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})

const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('nodeTypes or edgeTypes')) return;
  originalWarn(...args);
};
