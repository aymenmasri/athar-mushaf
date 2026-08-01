import type { User } from '@supabase/supabase-js';

import {
  ensureSupabaseUser,
  getCurrentSupabaseUser,
  SUPABASE_AUTH_ERROR_MESSAGE,
  SupabaseAuthenticationError,
} from '@/lib/supabase/auth';
import type { AtharSupabaseClient } from '@/lib/supabase/client';

const user = { id: '10000000-0000-4000-8000-000000000001' } as User;

function makeClient(sessionUser: User | null = null) {
  const getSession = jest.fn().mockResolvedValue({
    data: { session: sessionUser ? { user: sessionUser } : null },
    error: null,
  });
  const signInAnonymously = jest.fn().mockResolvedValue({
    data: { user, session: { user } },
    error: null,
  });
  const client = {
    auth: { getSession, signInAnonymously },
  } as unknown as AtharSupabaseClient;

  return { client, getSession, signInAnonymously };
}

describe('Supabase anonymous authentication', () => {
  it('reads an existing user without creating an anonymous session', async () => {
    const { client, getSession, signInAnonymously } = makeClient(user);

    await expect(getCurrentSupabaseUser(client)).resolves.toBe(user);

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('returns null when a read-only caller has no session', async () => {
    const { client, signInAnonymously } = makeClient();

    await expect(getCurrentSupabaseUser(client)).resolves.toBeNull();
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('creates an anonymous session only when a user is required', async () => {
    const { client, getSession, signInAnonymously } = makeClient();

    await expect(ensureSupabaseUser(client)).resolves.toBe(user);

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('wraps an anonymous sign-in failure in a stable Arabic error', async () => {
    const { client, signInAnonymously } = makeClient();
    const originalError = new Error('provider failure');
    signInAnonymously.mockResolvedValue({
      data: { user: null, session: null },
      error: originalError,
    });

    const promise = ensureSupabaseUser(client);

    await expect(promise).rejects.toBeInstanceOf(SupabaseAuthenticationError);
    await expect(promise).rejects.toMatchObject({
      code: 'SUPABASE_AUTH_FAILED',
      message: SUPABASE_AUTH_ERROR_MESSAGE,
      originalError,
    });
  });

  it('also localizes persisted-session read failures', async () => {
    const { client, getSession } = makeClient();
    getSession.mockResolvedValue({
      data: { session: null },
      error: new Error('storage failure'),
    });

    await expect(getCurrentSupabaseUser(client)).rejects.toMatchObject({
      code: 'SUPABASE_AUTH_FAILED',
      message: SUPABASE_AUTH_ERROR_MESSAGE,
    });
  });
});
