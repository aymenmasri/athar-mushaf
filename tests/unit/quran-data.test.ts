import integrity from '@/assets/quran/integrity.json';
import {
  QURAN_DATA_AVAILABLE,
  getAllSurahs,
  getJuz,
  getJuzMetadata,
  getPage,
  getPageMetadata,
  getSurah,
  getSurahMetadata,
  isQuranDataAvailable,
  normalizeArabicSearch,
} from '@/lib/quran';
import type { QuranSurah } from '@/types/quran';

describe('Quran corpus integrity', () => {
  const metadata = getSurahMetadata();
  let surahs: QuranSurah[];

  beforeAll(async () => {
    surahs = await getAllSurahs();
  });

  it('contains all 114 surahs in continuous order', () => {
    expect(QURAN_DATA_AVAILABLE).toBe(true);
    expect(isQuranDataAvailable()).toBe(true);
    expect(metadata).toHaveLength(114);
    expect(surahs).toHaveLength(114);
    expect(metadata.map((surah) => surah.number)).toEqual(
      Array.from({ length: 114 }, (_, index) => index + 1),
    );
    expect(new Set(metadata.map((surah) => surah.number)).size).toBe(114);
    expect(metadata[0]!.arabicName).toBe('الفاتحة');
    expect(metadata[113]!.arabicName).toBe('الناس');
  });

  it('contains 6,236 non-empty, continuously numbered ayahs', () => {
    let ayahTotal = 0;

    for (const surah of surahs) {
      expect(surah.ayahCount).toBe(surah.verses.length);
      expect(new Set(surah.verses.map((verse) => verse.ayahNumber)).size).toBe(surah.ayahCount);
      surah.verses.forEach((verse, index) => {
        expect(verse.surahNumber).toBe(surah.number);
        expect(verse.ayahNumber).toBe(index + 1);
        expect(verse.uthmaniText.trim()).not.toBe('');
        expect(verse.juzNumber).toBeGreaterThanOrEqual(1);
        expect(verse.juzNumber).toBeLessThanOrEqual(30);
        expect(verse.pageNumber).toBeGreaterThanOrEqual(1);
        expect(verse.pageNumber).toBeLessThanOrEqual(604);
        expect(verse.uthmaniText).not.toMatch(
          /lorem|placeholder|demo|fake|نص تجريبي|آية تجريبية/iu,
        );
      });
      ayahTotal += surah.verses.length;
    }

    expect(ayahTotal).toBe(6236);
  });

  it('uses the 30 juz and 604 Medina-page boundaries from Tanzil metadata', async () => {
    const juzs = getJuzMetadata();
    const pages = getPageMetadata();
    expect(juzs).toHaveLength(30);
    expect(pages).toHaveLength(604);
    expect(juzs[0]).toEqual({ number: 1, startSurahNumber: 1, startAyahNumber: 1 });
    expect(pages[0]).toEqual({ number: 1, startSurahNumber: 1, startAyahNumber: 1 });

    const lastJuz = await getJuz(30);
    const lastPage = await getPage(604);
    expect(lastJuz[0]).toMatchObject({ surahNumber: 78, ayahNumber: 1, juzNumber: 30 });
    expect(lastJuz.at(-1)).toMatchObject({ surahNumber: 114, ayahNumber: 6 });
    expect(lastPage[0]).toMatchObject({ surahNumber: 112, ayahNumber: 1, pageNumber: 604 });
    expect(lastPage.at(-1)).toMatchObject({ surahNumber: 114, ayahNumber: 6 });
    await expect(getJuz(0)).resolves.toEqual([]);
    await expect(getPage(605)).resolves.toEqual([]);
  });

  it('preserves Tanzil numbered-text basmala placement', async () => {
    const alFatiha = await getSurah(1);
    expect(alFatiha).toBeDefined();
    const normalizedBasmala = normalizeArabicSearch(alFatiha!.verses[0]!.uthmaniText);

    for (let surahNumber = 2; surahNumber <= 114; surahNumber += 1) {
      const firstAyah = (await getSurah(surahNumber))!.verses[0]!.uthmaniText;
      const normalizedFirstAyah = normalizeArabicSearch(firstAyah);
      if (surahNumber === 9) {
        expect(normalizedFirstAyah.startsWith(normalizedBasmala + ' ')).toBe(false);
      } else {
        expect(normalizedFirstAyah.startsWith(normalizedBasmala + ' ')).toBe(true);
      }
    }
  });

  it('rejects invalid surah numbers', async () => {
    await expect(getSurah(0)).resolves.toBeUndefined();
    await expect(getSurah(115)).resolves.toBeUndefined();
    await expect(getSurah(1.5)).resolves.toBeUndefined();
    await expect(getSurah(Number.NaN)).resolves.toBeUndefined();
  });

  it('pins the reviewed generated corpus checksum', () => {
    expect(integrity.algorithm).toBe('SHA-256');
    expect(integrity.files).toHaveLength(120);
    expect(integrity.corpusSha256).toBe(
      '8ee5a5a6c5cedf6ffc377131be8ead787dc046f5a896c1cdd13fd39d01084f2c',
    );
  });
});
