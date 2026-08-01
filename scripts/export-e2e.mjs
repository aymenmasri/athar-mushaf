import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const expoCli = resolve(process.cwd(), 'node_modules/expo/bin/cli');
const result = spawnSync(process.execPath, [expoCli, 'export', '--platform', 'web', '--clear'], {
  env: {
    ...process.env,
    EXPO_PUBLIC_SUPABASE_URL: 'https://e2e.supabase.co',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      'sb_publishable_e2e_browser_only_000000000000000000000000',
    EXPO_PUBLIC_APP_URL: 'http://127.0.0.1:4173',
  },
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
