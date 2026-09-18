// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { internalLinks, scrollableTables } from './plugins/internal-links.mjs';

const docsDir = fileURLToPath(new URL('../../docs', import.meta.url));
const topicsDir = fileURLToPath(new URL('./src/content/topics', import.meta.url));

export default defineConfig({
  markdown: {
    shikiConfig: { theme: 'github-dark' },
    processor: satteri({
      hastPlugins: [internalLinks({ docsDir, topicsDir }), scrollableTables()],
    }),
  },
});
