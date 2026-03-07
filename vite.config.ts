import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/hippos/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
      },
    },
  },
});
