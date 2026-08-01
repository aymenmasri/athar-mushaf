import {
  formatDedicationSlug,
  generateDedicationSlug,
  isValidDedicationSlug,
} from '@/lib/supabase/slug';

describe('dedication slug', () => {
  it('formats exactly 128 random bits without exposing a UUID', () => {
    const bytes = Uint8Array.from({ length: 16 }, (_, index) => index);

    expect(formatDedicationSlug(bytes)).toBe('d_000102030405060708090a0b0c0d0e0f');
  });

  it('asks its secure source for sixteen bytes', () => {
    const randomBytes = jest.fn((length: number) => Uint8Array.from({ length }, () => 0xab));

    expect(generateDedicationSlug(randomBytes)).toBe('d_abababababababababababababababab');
    expect(randomBytes).toHaveBeenCalledWith(16);
  });

  it.each(['d_000102030405060708090a0b0c0d0e0f', 'd_abcdefabcdefabcdefabcdefabcdefab'])(
    'accepts a valid backend slug: %s',
    (slug) => {
      expect(isValidDedicationSlug(slug)).toBe(true);
    },
  );

  it.each([
    'demo-mahmoud-wahida',
    '00010203-0405-0607-0809-0a0b0c0d0e0f',
    'd_ABCDEFABCDEFABCDEFABCDEFABCDEFAB',
    'd_short',
    'd_abcdefabcdefabcdefabcdefabcdefab/extra',
    '',
    null,
  ])('rejects an invalid backend slug: %s', (slug) => {
    expect(isValidDedicationSlug(slug)).toBe(false);
  });

  it('rejects the wrong amount of entropy', () => {
    expect(() => formatDedicationSlug(new Uint8Array(15))).toThrow(RangeError);
  });
});
