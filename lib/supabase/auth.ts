import type { User } from '@supabase/supabase-js';

import { requireSupabaseClient, type AtharSupabaseClient } from '@/lib/supabase/client';

let pendingSession: Promise<User> | null = null;

async function resolveSession(client: AtharSupabaseClient): Promise<User> {
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (session?.user) {
    return session.user;
  }

  const { data, error } = await client.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Supabase did not return a user for the anonymous session.');
  }

  return data.user;
}

/**
 * Reuses any future authenticated account and otherwise creates an invisible
 * anonymous account. Concurrent calls share one sign-in request.
 */
export async function ensureSupabaseUser(
  client: AtharSupabaseClient = requireSupabaseClient(),
): Promise<User> {
  if (!pendingSession) {
    pendingSession = resolveSession(client).finally(() => {
      pendingSession = null;
    });
  }

  return pendingSession;
}
