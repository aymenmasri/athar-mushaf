import type { User } from '@supabase/supabase-js';

import { requireSupabaseClient, type AtharSupabaseClient } from '@/lib/supabase/client';

let pendingSession: Promise<User> | null = null;

export const SUPABASE_AUTH_ERROR_MESSAGE =
  'تعذّر إنشاء جلسة آمنة لنشر الإهداء. تحقّق من الاتصال ثم حاول مرة أخرى.';

export class SupabaseAuthenticationError extends Error {
  readonly code = 'SUPABASE_AUTH_FAILED';
  readonly originalError: unknown;

  constructor(originalError?: unknown) {
    super(SUPABASE_AUTH_ERROR_MESSAGE);
    this.name = 'SupabaseAuthenticationError';
    this.originalError = originalError;
  }
}

/** Reads the persisted session without creating an anonymous account. */
export async function getCurrentSupabaseUser(
  client: AtharSupabaseClient = requireSupabaseClient(),
): Promise<User | null> {
  try {
    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    if (error) {
      throw new SupabaseAuthenticationError(error);
    }

    return session?.user ?? null;
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      throw error;
    }

    throw new SupabaseAuthenticationError(error);
  }
}

async function resolveSession(client: AtharSupabaseClient): Promise<User> {
  const currentUser = await getCurrentSupabaseUser(client);

  if (currentUser) {
    return currentUser;
  }

  try {
    const { data, error } = await client.auth.signInAnonymously();

    if (error || !data.user) {
      throw new SupabaseAuthenticationError(error);
    }

    return data.user;
  } catch (error) {
    if (error instanceof SupabaseAuthenticationError) {
      throw error;
    }

    throw new SupabaseAuthenticationError(error);
  }
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
