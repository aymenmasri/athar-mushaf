export {
  QURAN_DATA_AVAILABLE,
  getAllSurahs,
  getJuz,
  getPage,
  getSurah,
  isQuranDataAvailable,
} from './corpus';
export {
  getJuzMetadata,
  getPageMetadata,
  getQuranCorpusMetadata,
  getSurahMetadata,
  normalizeArabicSearch,
} from './metadata';
export { searchQuran } from './search';

export type {
  QuranJuzMetadata,
  QuranPageMetadata,
  QuranSearchResult,
  QuranSurah,
  QuranSurahMetadata,
  QuranVerse,
} from '@/types/quran';
