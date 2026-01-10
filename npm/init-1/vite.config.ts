import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT:
// If this project lives inside a parent repo that also has Vite installed,
// TypeScript can sometimes see two different copies of Vite types.
// The simplest stable fix is to ensure this project uses *its own* plugin import
// and to avoid async config.

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
