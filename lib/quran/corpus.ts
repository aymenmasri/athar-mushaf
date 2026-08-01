import type { QuranJuzMetadata, QuranPageMetadata, QuranSurah, QuranVerse } from '@/types/quran';

import { GENERATED_SURAH_LOADERS } from '@/lib/quran/generated-surah-loaders';
import { quranMetadataFile } from './metadata';

const EXPECTED_SURAH_COUNT = 114;
const surahCache = new Map<number, QuranSurah>();
const pendingSurahs = new Map<number, Promise<QuranSurah | undefined>>();

export async function getSurah(number: number): Promise<QuranSurah | undefined> {
  if (!Number.isInteger(number) || number < 1 || number > EXPECTED_SURAH_COUNT) return undefined;

  const cached = surahCache.get(number);
  if (cached) return cached;

  const pending = pendingSurahs.get(number);
  if (pending) return pending;

  const load = GENERATED_SURAH_LOADERS[number];
  if (!load) return undefined;

  const request = load()
    .then((file) => {
      if (
        file.schemaVersion !== 1 ||
        file.surah.number !== number ||
        file.surah.verses.length !== file.surah.ayahCount
      ) {
        return undefined;
      }
      surahCache.set(number, file.surah);
      return file.surah;
    })
    .finally(() => pendingSurahs.delete(number));
  pendingSurahs.set(number, request);
  return request;
}

export async function getAllSurahs(): Promise<QuranSurah[]> {
  const loaded = await Promise.all(
    Array.from({ length: EXPECTED_SURAH_COUNT }, (_, index) => getSurah(index + 1)),
  );
  return loaded.filter((surah): surah is QuranSurah => surah !== undefined);
}

async function getPartitionVerses(
  number: number,
  boundaries: QuranJuzMetadata[] | QuranPageMetadata[],
  maximumNumber: number,
  belongsToPartition: (verse: QuranVerse) => boolean,
): Promise<QuranVerse[]> {
  if (!Number.isInteger(number) || number < 1 || number > maximumNumber) return [];

  const start = boundaries[number - 1];
  const next = boundaries[number];
  if (!start) return [];
  const lastSurahNumber = next
    ? next.startSurahNumber - (next.startAyahNumber === 1 ? 1 : 0)
    : EXPECTED_SURAH_COUNT;
  const surahNumbers = Array.from(
    { length: lastSurahNumber - start.startSurahNumber + 1 },
    (_, index) => start.startSurahNumber + index,
  );
  const loaded = await Promise.all(surahNumbers.map(getSurah));
  return loaded.flatMap((surah) => surah?.verses.filter(belongsToPartition) ?? []);
}

export function getJuz(number: number): Promise<QuranVerse[]> {
  return getPartitionVerses(
    number,
    quranMetadataFile.juzs,
    30,
    (verse) => verse.juzNumber === number,
  );
}

export function getPage(number: number): Promise<QuranVerse[]> {
  return getPartitionVerses(
    number,
    quranMetadataFile.pages,
    604,
    (verse) => verse.pageNumber === number,
  );
}

export const QURAN_DATA_AVAILABLE =
  quranMetadataFile.schemaVersion === 1 &&
  quranMetadataFile.statistics.surahCount === EXPECTED_SURAH_COUNT &&
  quranMetadataFile.statistics.ayahCount === 6236 &&
  quranMetadataFile.statistics.juzCount === 30 &&
  quranMetadataFile.statistics.pageCount === 604 &&
  quranMetadataFile.surahs.length === EXPECTED_SURAH_COUNT &&
  Object.keys(GENERATED_SURAH_LOADERS).length === EXPECTED_SURAH_COUNT;

export function isQuranDataAvailable(): boolean {
  return QURAN_DATA_AVAILABLE;
}
