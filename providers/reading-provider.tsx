import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getBookmarks,
  getReadingPreferences,
  getReadingProgress,
  saveBookmarks,
  saveReadingPreferences,
  saveReadingProgress,
  toggleBookmarkInList,
} from '@/lib/storage/reading-storage';
import {
  addSyncedBookmark,
  getSyncedReadingProgress,
  getCurrentSupabaseUser,
  isSupabaseConfigured,
  listSyncedBookmarks,
  removeSyncedBookmark,
  saveSyncedReadingProgress,
} from '@/lib/supabase';
import {
  Bookmark,
  DEFAULT_READING_PREFERENCES,
  ReadingPreferences,
  ReadingProgress,
} from '@/types/reading';

type ReadingContextValue = {
  hydrated: boolean;
  preferences: ReadingPreferences;
  progress: ReadingProgress | null;
  bookmarks: Bookmark[];
  updatePreferences: (patch: Partial<ReadingPreferences>) => void;
  resetPreferences: () => void;
  recordProgress: (surahNumber: number, ayahNumber: number, juzNumber?: number) => void;
  toggleBookmark: (surahNumber: number, ayahNumber: number) => void;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
};

const ReadingContext = createContext<ReadingContextValue | null>(null);

export function ReadingProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_READING_PREFERENCES);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getReadingPreferences(), getReadingProgress(), getBookmarks()])
      .then(async ([storedPreferences, storedProgress, storedBookmarks]) => {
        if (!mounted) return;
        setPreferences(storedPreferences);
        let mergedProgress = storedProgress;
        let mergedBookmarks = storedBookmarks;

        if (isSupabaseConfigured) {
          try {
            // Opening a public page must not create an anonymous account. Sync
            // existing sessions only; write actions create a session on demand.
            const currentUser = await getCurrentSupabaseUser();
            if (!mounted) return;
            if (!currentUser) {
              setProgress(mergedProgress);
              setBookmarks(mergedBookmarks);
              setHydrated(true);
              return;
            }
            const [remoteProgress, remoteBookmarks] = await Promise.all([
              getSyncedReadingProgress(),
              listSyncedBookmarks(),
            ]);
            if (!mounted) return;
            const remoteIsNewer =
              remoteProgress?.lastSurahNumber &&
              remoteProgress.lastAyahNumber &&
              (!storedProgress ||
                new Date(remoteProgress.updatedAt ?? 0).getTime() >
                  new Date(storedProgress.updatedAt).getTime());
            if (remoteIsNewer && remoteProgress?.lastSurahNumber && remoteProgress.lastAyahNumber) {
              mergedProgress = {
                lastSurahNumber: remoteProgress.lastSurahNumber,
                lastAyahNumber: remoteProgress.lastAyahNumber,
                ...(remoteProgress.lastJuzNumber
                  ? { lastJuzNumber: remoteProgress.lastJuzNumber }
                  : {}),
                startedSurahs: remoteProgress.completedSections.filter(
                  (value): value is number =>
                    typeof value === 'number' &&
                    Number.isInteger(value) &&
                    value >= 1 &&
                    value <= 114,
                ),
                updatedAt: remoteProgress.updatedAt ?? new Date().toISOString(),
              };
              await saveReadingProgress(mergedProgress);
            } else if (storedProgress) {
              await saveSyncedReadingProgress({
                lastSurahNumber: storedProgress.lastSurahNumber,
                lastAyahNumber: storedProgress.lastAyahNumber,
                lastJuzNumber: storedProgress.lastJuzNumber ?? null,
                completedSections: storedProgress.startedSurahs,
              });
            }

            const remoteBookmarkKeys = new Set(
              remoteBookmarks.map((bookmark) => `${bookmark.surahNumber}:${bookmark.ayahNumber}`),
            );
            await Promise.all(
              storedBookmarks
                .filter(
                  (bookmark) =>
                    !remoteBookmarkKeys.has(`${bookmark.surahNumber}:${bookmark.ayahNumber}`),
                )
                .map((bookmark) => addSyncedBookmark(bookmark.surahNumber, bookmark.ayahNumber)),
            );
            const bookmarkMap = new Map(
              [...storedBookmarks, ...remoteBookmarks].map((bookmark) => [
                `${bookmark.surahNumber}:${bookmark.ayahNumber}`,
                {
                  surahNumber: bookmark.surahNumber,
                  ayahNumber: bookmark.ayahNumber,
                  createdAt: bookmark.createdAt,
                },
              ]),
            );
            mergedBookmarks = [...bookmarkMap.values()];
            await saveBookmarks(mergedBookmarks);
          } catch {
            // Offline or backend failures never block the local reader.
          }
        }

        setProgress(mergedProgress);
        setBookmarks(mergedBookmarks);
        setHydrated(true);
      })
      .catch(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const updatePreferences = useCallback((patch: Partial<ReadingPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      void saveReadingPreferences(next);
      return next;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_READING_PREFERENCES);
    void saveReadingPreferences(DEFAULT_READING_PREFERENCES);
  }, []);

  const recordProgress = useCallback(
    (surahNumber: number, ayahNumber: number, juzNumber?: number) => {
      setProgress((current) => {
        const startedSurahs = current?.startedSurahs.includes(surahNumber)
          ? current.startedSurahs
          : [...(current?.startedSurahs ?? []), surahNumber];
        const next: ReadingProgress = {
          lastSurahNumber: surahNumber,
          lastAyahNumber: ayahNumber,
          ...(juzNumber === undefined ? {} : { lastJuzNumber: juzNumber }),
          startedSurahs,
          updatedAt: new Date().toISOString(),
        };
        void saveReadingProgress(next);
        if (isSupabaseConfigured) {
          void saveSyncedReadingProgress({
            lastSurahNumber: next.lastSurahNumber,
            lastAyahNumber: next.lastAyahNumber,
            lastJuzNumber: next.lastJuzNumber ?? null,
            completedSections: next.startedSurahs,
          }).catch(() => undefined);
        }
        return next;
      });
    },
    [],
  );

  const toggleBookmark = useCallback((surahNumber: number, ayahNumber: number) => {
    setBookmarks((current) => {
      const existed = current.some(
        (item) => item.surahNumber === surahNumber && item.ayahNumber === ayahNumber,
      );
      const next = toggleBookmarkInList(current, surahNumber, ayahNumber);
      void saveBookmarks(next);
      if (isSupabaseConfigured) {
        const sync = existed
          ? removeSyncedBookmark(surahNumber, ayahNumber)
          : addSyncedBookmark(surahNumber, ayahNumber);
        void sync.catch(() => undefined);
      }
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (surahNumber: number, ayahNumber: number) =>
      bookmarks.some(
        (bookmark) => bookmark.surahNumber === surahNumber && bookmark.ayahNumber === ayahNumber,
      ),
    [bookmarks],
  );

  const value = useMemo(
    () => ({
      hydrated,
      preferences,
      progress,
      bookmarks,
      updatePreferences,
      resetPreferences,
      recordProgress,
      toggleBookmark,
      isBookmarked,
    }),
    [
      hydrated,
      preferences,
      progress,
      bookmarks,
      updatePreferences,
      resetPreferences,
      recordProgress,
      toggleBookmark,
      isBookmarked,
    ],
  );

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export function useReading() {
  const context = useContext(ReadingContext);
  if (!context) throw new Error('useReading must be used inside ReadingProvider');
  return context;
}
