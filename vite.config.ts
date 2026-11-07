import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site from /<repo-name>/. Override with BASE_PATH if the repo is renamed.
const base = process.env.BASE_PATH ?? '/BSCLUB-STORY-/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ducks/*.webp', 'favicon.svg'],
      manifest: {
        name: 'BSC BioLab: What The Beast?!',
        short_name: 'BioLab',
        description: 'Biological Sciences Club — Kuwait University. Build a hybrid creature and survive the story.',
        theme_color: '#14221d',
        background_color: '#14221d',
        display: 'standalone',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,webp,svg,woff,woff2}'] },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    testTimeout: 120000,
  },
} as never);
