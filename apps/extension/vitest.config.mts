import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@bunpro-nakama/session-history': fileURLToPath(
        new URL('../../libs/session-history/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    name: 'extension',
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts'],
  },
});
