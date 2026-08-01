import type { QuranSearchEntry, QuranSearchResult } from '@/types/quran';

import { getSurah } from './corpus';
import { normalizeArabicSearch, quranMetadataFile } from './metadata';
import { loadSearchIndex } from '@/lib/quran/search-index-loader';

let normalizedSearchEntriesPromise:
  Promise<{ entry: QuranSearchEntry; normalizedText: string }[]> | undefined;

async function getNormalizedSearchEntries() {
  if (!normalizedSearchEntriesPromise) {
    normalizedSearchEntriesPromise = loadSearchIndex().then((searchIndexFile) =>
      searchIndexFile.entries.map((entry) => ({
        entry,
        normalizedText: normalizeArabicSearch(entry.searchableText),
      })),
    );
  }
  return normalizedSearchEntriesPromise;
}

function normalizedSurahNames(metadata: (typeof quranMetadataFile.surahs)[number]): string[] {
  return [
    metadata.arabicName,
    'سورة ' + metadata.arabicName,
    metadata.transliteratedName,
    metadata.englishName,
  ].map(normalizeArabicSearch);
}

export async function searchQuran(query: string, limit: number = 50): Promise<QuranSearchResult[]> {
  const normalizedQuery = normalizeArabicSearch(query);
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.min(200, Math.floor(limit))) : 50;
  if (!normalizedQuery || safeLimit === 0) return [];

  const results: QuranSearchResult[] = [];
  const numericQuery = /^\d{1,3}$/u.test(normalizedQuery) ? Number(normalizedQuery) : undefined;

  for (const metadata of quranMetadataFile.surahs) {
    const numberMatches = numericQuery === metadata.number;
    const nameMatches = normalizedSurahNames(metadata).some((name) =>
      name.includes(normalizedQuery),
    );
    if (numberMatches || nameMatches) {
      results.push({
        type: 'surah',
        surahNumber: metadata.number,
        surahName: metadata.arabicName,
      });
      if (results.length >= safeLimit) return results;
    }
  }

  const matchingEntries: QuranSearchEntry[] = [];
  for (const { entry, normalizedText } of await getNormalizedSearchEntries()) {
    if (!normalizedText.includes(normalizedQuery)) continue;
    matchingEntries.push(entry);
    if (matchingEntries.length >= safeLimit - results.length) break;
  }

  const surahNumbers = [...new Set(matchingEntries.map((entry) => entry.surahNumber))];
  const loadedSurahs = new Map(
    await Promise.all(
      surahNumbers.map(async (number) => [number, await getSurah(number)] as const),
    ),
  );
  for (const entry of matchingEntries) {
    const surah = loadedSurahs.get(entry.surahNumber);
    const verse = surah?.verses[entry.ayahNumber - 1];
    if (
      !surah ||
      !verse ||
      verse.ayahNumber !== entry.ayahNumber ||
      verse.surahNumber !== entry.surahNumber
    ) {
      continue;
    }
    results.push({
      type: 'ayah',
      surahNumber: entry.surahNumber,
      surahName: surah.arabicName,
      ayahNumber: entry.ayahNumber,
      uthmaniText: verse.uthmaniText,
    });
    if (results.length >= safeLimit) break;
  }
  return results;
}
