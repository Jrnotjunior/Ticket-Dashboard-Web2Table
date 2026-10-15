import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Hostinger serves from the domain root. GitHub Pages overrides this via its build command.
  base: '/',
  plugins: [react()],
});
