import { defineConfig } from 'vite';
import { numbersPlugin } from './vitePluginNumbers';

export default defineConfig({
  base: './',
  plugins: [numbersPlugin()],
});
