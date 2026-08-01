import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { supabaseConfig } from '@/lib/supabase/config';
import type { Database } from '@/lib/supabase/database.types';

export type AtharSupabaseClient = SupabaseClient<Database>;

export class SupabaseNotConfiguredError extends Error {
  readonly code = 'SUPABASE_NOT_CONFIGURED';

  constructor() {
    super('Supabase is not configured. The application is running in demonstration mode.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

let client: AtharSupabaseClient | null | undefined;

function keepNativeSessionFresh(configuredClient: AtharSupabaseClient): void {
  if (Platform.OS === 'web') {
    return;
  }

  if (AppState.currentState === 'active') {
    configuredClient.auth.startAutoRefresh();
  }

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      configuredClient.auth.startAutoRefresh();
    } else {
      configuredClient.auth.stopAutoRefresh();
    }
  });
}

/** Returns null in demo mode and never creates a client with placeholder keys. */
export function getSupabaseClient(): AtharSupabaseClient | null {
  if (client !== undefined) {
    return client;
  }

  if (supabaseConfig.mode === 'demo') {
    client = null;
    return client;
  }

  client = createClient<Database>(supabaseConfig.url, supabaseConfig.publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === 'web',
      lock: processLock,
      persistSession: true,
      storage: AsyncStorage,
    },
    global: {
      headers: { 'X-Client-Info': 'athar-mushaf-expo' },
    },
  });

  keepNativeSessionFresh(client);

  return client;
}

export function requireSupabaseClient(): AtharSupabaseClient {
  const configuredClient = getSupabaseClient();

  if (!configuredClient) {
    throw new SupabaseNotConfiguredError();
  }

  return configuredClient;
}
