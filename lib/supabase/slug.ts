const DEDICATION_SLUG_PREFIX = 'd_';
const DEDICATION_SLUG_RANDOM_BYTE_COUNT = 16;
const DEDICATION_SLUG_PATTERN = /^d_[a-f0-9]{32}$/;

function secureRandomBytes(length: number): Uint8Array {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi?.getRandomValues) {
    throw new Error(
      'Secure random values are unavailable. Let Supabase generate the dedication slug.',
    );
  }

  return cryptoApi.getRandomValues(new Uint8Array(length));
}

export function formatDedicationSlug(randomBytes: Uint8Array): string {
  if (randomBytes.byteLength !== DEDICATION_SLUG_RANDOM_BYTE_COUNT) {
    throw new RangeError(
      `A dedication slug requires exactly ${DEDICATION_SLUG_RANDOM_BYTE_COUNT} random bytes.`,
    );
  }

  const hexadecimal = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );

  return `${DEDICATION_SLUG_PREFIX}${hexadecimal}`;
}

/**
 * Generates a 128-bit, non-UUID public identifier. The database generates the
 * authoritative slug; this helper is useful for previews and deterministic
 * unit tests. It intentionally has no Math.random fallback.
 */
export function generateDedicationSlug(
  randomBytes: (length: number) => Uint8Array = secureRandomBytes,
): string {
  return formatDedicationSlug(randomBytes(DEDICATION_SLUG_RANDOM_BYTE_COUNT));
}

export function isValidDedicationSlug(value: unknown): value is string {
  return typeof value === 'string' && DEDICATION_SLUG_PATTERN.test(value);
}

export function assertValidDedicationSlug(value: string): void {
  if (!isValidDedicationSlug(value)) {
    throw new TypeError('Invalid dedication slug.');
  }
}
