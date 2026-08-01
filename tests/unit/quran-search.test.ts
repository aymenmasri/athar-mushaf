import { getSurah, normalizeArabicSearch, searchQuran } from '@/lib/quran';

describe('Quran search', () => {
  it('normalizes Arabic marks only for matching', () => {
    expect(normalizeArabicSearch('إِهْدَاءٌ مُحِبّ')).toBe('اهداء محب');
    expect(normalizeArabicSearch('آثار ـ كريمة')).toBe('اثار كريمه');
  });

  it('finds a surah by Arabic name with or without its label', async () => {
    expect((await searchQuran('الفاتحه', 5))[0]).toEqual({
      type: 'surah',
      surahNumber: 1,
      surahName: 'الفاتحة',
    });
    expect((await searchQuran('سورة الناس', 5))[0]).toEqual({
      type: 'surah',
      surahNumber: 114,
      surahName: 'الناس',
    });
  });

  it('finds a surah by number', async () => {
    expect((await searchQuran('2', 5))[0]).toEqual({
      type: 'surah',
      surahNumber: 2,
      surahName: 'البقرة',
    });
  });

  it('uses the separate search corpus but returns exact Uthmani display text', async () => {
    const verifiedVerse = (await getSurah(1))!.verses[1]!;
    const query = normalizeArabicSearch(verifiedVerse.uthmaniText).split(' ').slice(0, 2).join(' ');
    const result = (await searchQuran(query, 10)).find(
      (entry) =>
        entry.type === 'ayah' &&
        entry.surahNumber === verifiedVerse.surahNumber &&
        entry.ayahNumber === verifiedVerse.ayahNumber,
    );

    expect(result).toBeDefined();
    expect(result!.uthmaniText).toBe(verifiedVerse.uthmaniText);
    expect(result).not.toHaveProperty('searchableText');
  });

  it('handles empty input and enforces the result limit', async () => {
    await expect(searchQuran('   ')).resolves.toEqual([]);
    await expect(searchQuran('الله', 3)).resolves.toHaveLength(3);
    await expect(searchQuran('الله', 0)).resolves.toEqual([]);
  });
});
