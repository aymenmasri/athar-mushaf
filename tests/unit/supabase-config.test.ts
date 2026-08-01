import { resolveSupabaseConfig } from '@/lib/supabase/config';

const publishableKey = 'sb_publishable_athar_test_key_123456789';

describe('Supabase runtime mode', () => {
  it('uses demo mode when both public variables are absent', () => {
    expect(resolveSupabaseConfig({})).toEqual({
      mode: 'demo',
      reason: 'missing-environment',
    });
  });

  it('uses demo mode for a partial configuration', () => {
    expect(
      resolveSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://athar.supabase.co',
      }),
    ).toEqual({ mode: 'demo', reason: 'partial-environment' });
  });

  it('accepts a complete HTTPS configuration', () => {
    expect(
      resolveSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://athar.supabase.co/',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      }),
    ).toEqual({
      mode: 'connected',
      url: 'https://athar.supabase.co/',
      publishableKey,
    });
  });

  it('accepts HTTP only for local Supabase development', () => {
    expect(
      resolveSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      }).mode,
    ).toBe('connected');

    expect(
      resolveSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'http://10.0.2.2:54321',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      }).mode,
    ).toBe('connected');

    expect(
      resolveSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'http://example.com',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      }),
    ).toEqual({ mode: 'demo', reason: 'invalid-environment' });
  });

  it('rejects a Supabase secret key in the client variable', () => {
    expect(
      resolveSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://athar.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_this_must_never_reach_the_client',
      }),
    ).toEqual({ mode: 'demo', reason: 'invalid-environment' });
  });

  it('rejects a legacy service-role JWT even though its role is encoded', () => {
    const legacyServiceRoleJwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.fake-signature';

    expect(
      resolveSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://athar.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: legacyServiceRoleJwt,
      }),
    ).toEqual({ mode: 'demo', reason: 'invalid-environment' });
  });

  it('still accepts a legacy anon JWT for older Supabase projects', () => {
    const legacyAnonJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.fake-signature';

    expect(
      resolveSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://athar.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: legacyAnonJwt,
      }).mode,
    ).toBe('connected');
  });
});
