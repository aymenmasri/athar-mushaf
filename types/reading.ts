export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type ReaderFontSize = 'small' | 'medium' | 'large' | 'xlarge';

export type ReadingPreferences = {
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
  lineSpacing: 'compact' | 'comfortable' | 'airy';
  showAyahNumbers: boolean;
};

export type ReadingProgress = {
  lastSurahNumber: number;
  lastAyahNumber: number;
  lastJuzNumber?: number;
  startedSurahs: number[];
  updatedAt: string;
};

export type Bookmark = {
  surahNumber: number;
  ayahNumber: number;
  createdAt: string;
};

export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  theme: 'light',
  fontSize: 'medium',
  lineSpacing: 'comfortable',
  showAyahNumbers: true,
};
