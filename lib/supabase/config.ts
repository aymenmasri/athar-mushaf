export type SupabaseMode = 'connected' | 'demo';

export type SupabaseEnvironment = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

export type SupabaseRuntimeConfig =
  | {
      mode: 'connected';
      url: string;
      publishableKey: string;
    }
  | {
      mode: 'demo';
      reason: 'missing-environment' | 'partial-environment' | 'invalid-environment';
    };

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function decodeBase64UrlAscii(value: string): string | null {
  let accumulator = 0;
  let bitCount = 0;
  let result = '';

  for (const character of value.replace(/=+$/u, '')) {
    const sextet = BASE64URL_ALPHABET.indexOf(character);
    if (sextet < 0) return null;

    accumulator = (accumulator << 6) | sextet;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      result += String.fromCharCode((accumulator >> bitCount) & 0xff);
      accumulator &= bitCount === 0 ? 0 : (1 << bitCount) - 1;
    }
  }

  return result;
}

function hasPrivilegedJwtRole(value: string): boolean {
  const payloadSegment = value.split('.')[1];
  if (!payloadSegment) return false;

  const decoded = decodeBase64UrlAscii(payloadSegment);
  if (!decoded) return false;

  try {
    const payload: unknown = JSON.parse(decoded);
    if (!payload || typeof payload !== 'object' || !('role' in payload)) {
      return false;
    }

    const role = (payload as { role?: unknown }).role;
    return role === 'service_role' || role === 'supabase_admin';
  } catch {
    return false;
  }
}

function isSafePublicKey(value: string): boolean {
  const normalized = value.toLowerCase();

  // Current secret keys are explicitly rejected. Legacy projects should put
  // their anon key (never service_role) in the publishable-key variable.
  return (
    value.length >= 20 &&
    !normalized.startsWith('sb_secret_') &&
    !normalized.includes('service_role') &&
    !hasPrivilegedJwtRole(value)
  );
}

function isPrivateDevelopmentHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') {
    return true;
  }

  const parts = hostname.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/u.test(part))) return false;

  const octets = parts.map(Number);
  if (octets.some((octet) => octet > 255)) return false;

  const [first, second] = octets;

  return (
    first === 10 ||
    first === 127 ||
    (first === 192 && second === 168) ||
    (first === 172 && second !== undefined && second >= 16 && second <= 31)
  );
}

function isSupabaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const isLocal = isPrivateDevelopmentHost(url.hostname);
    const isOriginOnly =
      !url.username && !url.password && !url.search && !url.hash && url.pathname === '/';

    return isOriginOnly && (url.protocol === 'https:' || (isLocal && url.protocol === 'http:'));
  } catch {
    return false;
  }
}

export function resolveSupabaseConfig(environment: SupabaseEnvironment): SupabaseRuntimeConfig {
  const url = environment.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const publishableKey = environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

  if (!url && !publishableKey) {
    return { mode: 'demo', reason: 'missing-environment' };
  }

  if (!url || !publishableKey) {
    return { mode: 'demo', reason: 'partial-environment' };
  }

  if (!isSupabaseUrl(url) || !isSafePublicKey(publishableKey)) {
    return { mode: 'demo', reason: 'invalid-environment' };
  }

  return { mode: 'connected', url, publishableKey };
}

// Expo only inlines statically referenced EXPO_PUBLIC_* variables.
export const supabaseConfig = resolveSupabaseConfig({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

export const isSupabaseConfigured = supabaseConfig.mode === 'connected';
