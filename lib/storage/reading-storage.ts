import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { STORAGE_KEYS } from '@/lib/storage/keys';
import {
  Bookmark,
  DEFAULT_READING_PREFERENCES,
  ReadingPreferences,
  ReadingProgress,
} from '@/types/reading';

const readingPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'sepia']),
  fontSize: z.enum(['small', 'medium', 'large', 'xlarge']),
  lineSpacing: z.enum(['compact', 'comfortable', 'airy']),
  showAyahNumbers: z.boolean(),
});

const readingProgressSchema = z.object({
  lastSurahNumber: z.number().int().min(1).max(114),
  lastAyahNumber: z.number().int().min(1).max(286),
  lastJuzNumber: z.number().int().min(1).max(30).optional(),
  startedSurahs: z.array(z.number().int().min(1).max(114)).max(114),
  updatedAt: z.string().datetime(),
});

const bookmarkSchema = z.object({
  surahNumber: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().min(1).max(286),
  createdAt: z.string().datetime(),
});

function parseJson(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export async function getReadingPreferences(): Promise<ReadingPreferences> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.preferences);
  const stored = parseJson(raw);
  const candidate =
    stored && typeof stored === 'object' && !Array.isArray(stored)
      ? { ...DEFAULT_READING_PREFERENCES, ...stored }
      : DEFAULT_READING_PREFERENCES;
  const parsed = readingPreferencesSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_READING_PREFERENCES;
}

export async function saveReadingPreferences(preferences: ReadingPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
}

export async function getReadingProgress(): Promise<ReadingProgress | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
  const parsed = readingProgressSchema.safeParse(parseJson(raw));
  return parsed.success ? parsed.data : null;
}

export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
}

export async function getBookmarks(): Promise<Bookmark[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.bookmarks);
  const parsed = z.array(bookmarkSchema).max(6236).safeParse(parseJson(raw));
  return parsed.success ? parsed.data : [];
}

export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
}

export function toggleBookmarkInList(
  bookmarks: Bookmark[],
  surahNumber: number,
  ayahNumber: number,
  now = new Date().toISOString(),
): Bookmark[] {
  const exists = bookmarks.some(
    (item) => item.surahNumber === surahNumber && item.ayahNumber === ayahNumber,
  );
  if (exists) {
    return bookmarks.filter(
      (item) => !(item.surahNumber === surahNumber && item.ayahNumber === ayahNumber),
    );
  }
  return [...bookmarks, { surahNumber, ayahNumber, createdAt: now }];
}
