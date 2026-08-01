import type {
  QuranCorpusMetadataFile,
  QuranJuzMetadata,
  QuranPageMetadata,
  QuranSurahMetadata,
} from '@/types/quran';

declare const require: (path: string) => unknown;

const ARABIC_MARKS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/gu;
const SEARCH_PUNCTUATION = /[^\p{L}\p{N}\s]/gu;

export const quranMetadataFile =
  require('../../assets/quran/surah-metadata.json') as QuranCorpusMetadataFile;

/** Normalizes only search input and derived search data, never display text. */
export function normalizeArabicSearch(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(ARABIC_MARKS, '')
    .replace(/ـ/gu, '')
    .replace(/[أإآٱ]/gu, 'ا')
    .replace(/[ؤ]/gu, 'و')
    .replace(/[ئ]/gu, 'ي')
    .replace(/[ىی]/gu, 'ي')
    .replace(/[ة]/gu, 'ه')
    .replace(/[ک]/gu, 'ك')
    .replace(SEARCH_PUNCTUATION, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function getSurahMetadata(): QuranSurahMetadata[] {
  return quranMetadataFile.surahs.map((surah) => ({ ...surah }));
}

export function getQuranCorpusMetadata(): QuranCorpusMetadataFile {
  return quranMetadataFile;
}

export function getJuzMetadata(): QuranJuzMetadata[] {
  return quranMetadataFile.juzs.map((juz) => ({ ...juz }));
}

export function getPageMetadata(): QuranPageMetadata[] {
  return quranMetadataFile.pages.map((page) => ({ ...page }));
}
