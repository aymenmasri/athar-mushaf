import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { EmptyState } from '@/components/common/empty-state';
import { radii, rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { useReading } from '@/providers/reading-provider';
import type { Bookmark } from '@/types/reading';
import type { QuranSurah, QuranVerse } from '@/types/quran';

type BookmarkItem = { bookmark: Bookmark; surah: QuranSurah; verse: QuranVerse };

export function BookmarksList() {
  const router = useRouter();
  const theme = useAtharTheme();
  const { bookmarks, toggleBookmark } = useReading();
  const [items, setItems] = useState<BookmarkItem[]>();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (bookmarks.length === 0) {
      setItems([]);
      setLoadFailed(false);
      return () => {
        active = false;
      };
    }

    setItems(undefined);
    setLoadFailed(false);
    void import('@/lib/quran/corpus')
      .then(async ({ getSurah }) => {
        const numbers = [...new Set(bookmarks.map((bookmark) => bookmark.surahNumber))];
        const surahs = new Map(
          await Promise.all(
            numbers.map(async (number) => [number, await getSurah(number)] as const),
          ),
        );
        if (!active) return;
        setItems(
          bookmarks.flatMap((bookmark) => {
            const surah = surahs.get(bookmark.surahNumber);
            const verse = surah?.verses[bookmark.ayahNumber - 1];
            return surah && verse ? [{ bookmark, surah, verse }] : [];
          }),
        );
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
          setItems([]);
        }
      });
    return () => {
      active = false;
    };
  }, [bookmarks]);

  if (items === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
        <AppText color={theme.muted}>جارٍ تحميل المفضلة…</AppText>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={loadFailed ? 'cloud-offline-outline' : 'bookmark-outline'}
        title={loadFailed ? 'تعذّر تحميل المفضلة' : 'لا توجد مفضلات بعد'}
        message={
          loadFailed
            ? 'أعد فتح الصفحة لتحميل بيانات الآيات المحفوظة.'
            : 'اضغط علامة الحفظ بجانب أي آية لتجدها هنا.'
        }
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => `${item.bookmark.surahNumber}:${item.bookmark.ayahNumber}`}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            router.push({
              pathname: '/quran/surah/[surahNumber]',
              params: {
                surahNumber: String(item.surah.number),
                ayah: String(item.verse.ayahNumber),
              },
            })
          }
          style={({ pressed }) => [
            styles.item,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.itemHeader}>
            <View>
              <AppText variant="eyebrow" color={theme.accent}>
                سورة {item.surah.arabicName}
              </AppText>
              <AppText variant="small" color={theme.muted}>
                الآية {item.verse.ayahNumber}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إزالة من المفضلة"
              onPress={() => toggleBookmark(item.surah.number, item.verse.ayahNumber)}
              style={styles.removeButton}
            >
              <AppText variant="small" color={theme.danger}>
                إزالة
              </AppText>
            </Pressable>
          </View>
          <AppText variant="quran" selectable style={styles.verse}>
            {item.verse.uthmaniText}
          </AppText>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  list: { gap: spacing.sm, paddingBottom: spacing.hero },
  item: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.md },
  itemHeader: {
    flexDirection: rtlRow,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  verse: { fontSize: 25, lineHeight: 48 },
});
