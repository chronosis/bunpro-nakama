import { fileURLToPath } from 'node:url';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineNuxtConfig } from 'nuxt/config';

const sessionHistoryEntry = fileURLToPath(
  new URL('../../libs/session-history/src/index.ts', import.meta.url),
);

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  alias: {
    '@bunpro-nakama/session-history': sessionHistoryEntry,
  },
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 4200,
  },
  typescript: {
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        composite: false,
        emitDeclarationOnly: false,
      },
      vueCompilerOptions: {
        plugins: [],
      },
    },
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
  },
  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
    databasePath: process.env.DATABASE_PATH || './data/bunpro-nakama.sqlite',
  },
  ignore: ['data/**', 'drizzle/migrations/**'],
  vite: {
    plugins: [nxViteTsPaths()],
  },
  compatibilityDate: '2026-09-27',
});
