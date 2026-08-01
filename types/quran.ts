export type QuranRevelationType = 'makkah' | 'madinah';

export type QuranTextType = 'Uthmani' | 'Simple Clean';

export interface QuranSourceAttribution {
  name: 'Tanzil Quran Text';
  project: 'Tanzil Project';
  version: '1.1';
  textType: QuranTextType;
  copyright: string;
  license: 'Creative Commons Attribution 3.0';
  sourceUrl: 'https://tanzil.net/';
  licenseUrl: 'https://tanzil.net/docs/Text_License';
}

export interface QuranVerse {
  surahNumber: number;
  ayahNumber: number;
  /** Verbatim Uthmani text from the pinned Tanzil source file. */
  uthmaniText: string;
  /** Verified boundary assignment from Tanzil quran-data.xml v1.0. */
  juzNumber: number;
  /** Medina Mushaf page assignment from Tanzil quran-data.xml v1.0. */
  pageNumber: number;
}

export interface QuranSurahMetadata {
  number: number;
  arabicName: string;
  transliteratedName: string;
  englishName: string;
  revelationType: QuranRevelationType;
  ayahCount: number;
}

export interface QuranSurah extends QuranSurahMetadata {
  verses: QuranVerse[];
}

export interface QuranSurahFile {
  schemaVersion: 1;
  source: QuranSourceAttribution;
  surah: QuranSurah;
}

export interface QuranSearchEntry {
  surahNumber: number;
  ayahNumber: number;
  /** Verbatim text from Tanzil's Simple Clean edition; never used for display. */
  searchableText: string;
}

export interface QuranSearchIndexFile {
  schemaVersion: 1;
  source: QuranSourceAttribution;
  entries: QuranSearchEntry[];
}

export interface QuranSearchResult {
  type: 'surah' | 'ayah';
  surahNumber: number;
  surahName: string;
  ayahNumber?: number;
  /** Present only for ayah results and always taken from the Uthmani data. */
  uthmaniText?: string;
}

export interface QuranPartitionMetadata {
  number: number;
  startSurahNumber: number;
  startAyahNumber: number;
}

export type QuranJuzMetadata = QuranPartitionMetadata;

export type QuranPageMetadata = QuranPartitionMetadata;

export interface QuranSourceFileMetadata {
  role: 'display' | 'search' | 'structure';
  path: string;
  sha256: string;
  textType: QuranTextType | 'Tanzil Quran Metadata';
  version: string;
  downloadUrl: string;
}

export interface QuranCorpusMetadataFile {
  schemaVersion: 1;
  generatedAt: string;
  generator: 'scripts/import-quran.ts';
  source: {
    project: 'Tanzil Project';
    sourceUrl: 'https://tanzil.net/';
    downloadPageUrl: 'https://tanzil.net/download/';
    license: 'Creative Commons Attribution 3.0';
    licenseUrl: 'https://tanzil.net/docs/Text_License';
    files: QuranSourceFileMetadata[];
  };
  basmala: {
    representation: string;
    alFatiha: string;
    otherSurahs: string;
    atTawbah: string;
  };
  statistics: {
    surahCount: 114;
    ayahCount: 6236;
    juzCount: 30;
    pageCount: 604;
  };
  surahs: QuranSurahMetadata[];
  juzs: QuranJuzMetadata[];
  pages: QuranPageMetadata[];
}

export interface QuranIntegrityFileEntry {
  path: string;
  bytes: number;
  sha256: string;
}

export interface QuranIntegrityFile {
  schemaVersion: 1;
  algorithm: 'SHA-256';
  generatedAt: string;
  files: QuranIntegrityFileEntry[];
  corpusSha256: string;
}
