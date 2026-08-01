import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getBookmarks,
  getReadingPreferences,
  getReadingProgress,
  saveBookmarks,
  saveReadingPreferences,
  saveReadingProgress,
  toggleBookmarkInList,
} from '@/lib/storage/reading-storage';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { DEFAULT_READING_PREFERENCES } from '@/types/reading';

describe('local reading storage', () => {
  it('returns safe defaults before any setting is saved', async () => {
    await expect(getReadingPreferences()).resolves.toEqual(DEFAULT_READING_PREFERENCES);
    await expect(getReadingProgress()).resolves.toBeNull();
    await expect(getBookmarks()).resolves.toEqual([]);
  });

  it('saves and restores preferences and progress', async () => {
    const preferences = {
      ...DEFAULT_READING_PREFERENCES,
      theme: 'sepia' as const,
      showAyahNumbers: false,
    };
    const progress = {
      lastSurahNumber: 112,
      lastAyahNumber: 2,
      lastJuzNumber: 30,
      startedSurahs: [1, 112],
      updatedAt: '2026-08-01T12:00:00.000Z',
    };
    await saveReadingPreferences(preferences);
    await saveReadingProgress(progress);
    await expect(getReadingPreferences()).resolves.toEqual(preferences);
    await expect(getReadingProgress()).resolves.toEqual(progress);
  });

  it('adds and removes a bookmark without duplicates', async () => {
    const added = toggleBookmarkInList([], 112, 1, '2026-08-01T12:00:00.000Z');
    expect(added).toEqual([
      { surahNumber: 112, ayahNumber: 1, createdAt: '2026-08-01T12:00:00.000Z' },
    ]);
    expect(toggleBookmarkInList(added, 112, 1)).toEqual([]);
    await saveBookmarks(added);
    await expect(getBookmarks()).resolves.toEqual(added);
  });

  it('rejects malformed or stale persisted values instead of trusting casts', async () => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.preferences, JSON.stringify({ theme: 'broken', fontSize: 900 })],
      [
        STORAGE_KEYS.progress,
        JSON.stringify({ lastSurahNumber: 999, lastAyahNumber: -1, startedSurahs: [] }),
      ],
      [
        STORAGE_KEYS.bookmarks,
        JSON.stringify([{ surahNumber: 112, ayahNumber: 'one', createdAt: 'yesterday' }]),
      ],
    ]);

    await expect(getReadingPreferences()).resolves.toEqual(DEFAULT_READING_PREFERENCES);
    await expect(getReadingProgress()).resolves.toBeNull();
    await expect(getBookmarks()).resolves.toEqual([]);
  });
});
