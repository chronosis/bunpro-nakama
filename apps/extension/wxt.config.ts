import { defineConfig } from 'wxt';
import { fileURLToPath } from 'node:url';

const sessionHistoryEntry = fileURLToPath(
  new URL('../../libs/session-history/src/index.ts', import.meta.url),
);

export default defineConfig({
  manifestVersion: 3,
  alias: {
    '@bunpro-nakama/session-history': sessionHistoryEntry,
  },
  manifest: {
    name: 'Bunpro Nakama',
    description:
      'Records Bunpro review answers and lets you replace a bad sentence translation with your own.',
    icons: {
      16: '/icon-16.png',
      32: '/icon-32.png',
      48: '/icon-48.png',
      128: '/icon-128.png',
    },
    action: {
      default_title: 'Bunpro Nakama',
      default_icon: {
        16: '/icon-16.png',
        32: '/icon-32.png',
        48: '/icon-48.png',
        128: '/icon-128.png',
      },
    },
    permissions: ['storage', 'downloads'],
    browser_specific_settings: {
      gecko: {
        id: 'bunpro-nakama@local',
        strict_min_version: '128.0',
      },
    },
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      if (manifest.manifest_version !== 2 || !Array.isArray(manifest.content_scripts)) return;
      for (const script of manifest.content_scripts) {
        delete (script as { world?: string }).world;
      }
    },
  },
});
