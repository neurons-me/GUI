// A plain consumer: no aliases, no dedupe, nothing pointing at the monorepo.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], build: { sourcemap: true } });
