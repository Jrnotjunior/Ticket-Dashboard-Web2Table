import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves the app from the repository subpath; Hostinger serves it from domain root.
  base: process.env.GITHUB_ACTIONS ? '/Ticket-Dashboard-Web2Table/' : '/',
  plugins: [react()],
});
