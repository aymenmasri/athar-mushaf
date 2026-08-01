import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { EmptyState } from '@/components/common/empty-state';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';
import { radii, rtlRow, spacing, typography } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { useReading } from '@/providers/reading-provider';
import type { QuranSurah, QuranVerse } from '@/types/quran';

const fontSizes = { small: 24, medium: 30, large: 36, xlarge: 44 } as const;
const lineRatios = { compact: 1.55, comfortable: 1.85, airy: 2.15 } as const;

export default function SurahReaderScreen() {
  const params = useLocalSearchParams<{
    surahNumber?: string | string[];
    ayah?: string | string[];
  }>();
  const rawNumber = Array.isArray(params.surahNumber) ? params.surahNumber[0] : params.surahNumber;
  const rawAyah = Array.isArray(params.ayah) ? params.ayah[0] : params.ayah;
  const surahNumber = Number(rawNumber);
  const targetAyah = Number(rawAyah);
  const [surah, setSurah] = useState<QuranSurah | null>();
  const [loadFailed, setLoadFailed] = useState(false);
  const listRef = useRef<FlatList<QuranVerse>>(null);
  const router = useRouter();
  const theme = useAtharTheme();
  const { preferences, recordProgress, isBookmarked, toggleBookmark } = useReading();
  const verseFontSize = fontSizes[preferences.fontSize];
  const verseLineHeight = Math.round(verseFontSize * lineRatios[preferences.lineSpacing]);

  useEffect(() => {
    let active = true;
    setSurah(undefined);
    setLoadFailed(false);
    void import('@/lib/quran/corpus')
      .then(async ({ getSurah }) => {
        const loaded = await getSurah(surahNumber);
        if (active) setSurah(loaded ?? null);
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
          setSurah(null);
        }
      });
    return () => {
      active = false;
    };
  }, [surahNumber]);

  useEffect(() => {
    if (!surah || !Number.isInteger(targetAyah) || targetAyah < 1 || targetAyah > surah.ayahCount)
      return;
    const timeout = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: targetAyah - 1, animated: false, viewPosition: 0.1 });
    }, 350);
    return () => clearTimeout(timeout);
  }, [surah, targetAyah]);

  if (surah === undefined) {
    return (
      <Screen header={<AppHeader back />}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} size="large" />
          <AppText color={theme.muted}>جارٍ تحميل السورة…</AppText>
        </View>
      </Screen>
    );
  }

  if (surah === null) {
    return (
      <Screen header={<AppHeader back />}>
        <EmptyState
          icon={loadFailed ? 'cloud-offline-outline' : 'book-outline'}
          title={loadFailed ? 'تعذّر تحميل السورة' : 'السورة غير موجودة'}
          message={
            loadFailed
              ? 'تحقق من الاتصال ثم أعد فتح الصفحة. يبقى النص مضمّنًا محليًا في تطبيق الهاتف.'
              : 'اختر سورة بين ١ و١١٤ من فهرس المصحف.'
          }
        />
        <AppButton label="العودة إلى الفهرس" onPress={() => router.replace('/quran')} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      contentStyle={styles.screen}
      header={
        <AppHeader
          title={surah.arabicName}
          back
          rightAction={{
            icon: 'text-outline',
            label: 'إعدادات القراءة',
            onPress: () => router.push('/settings'),
          }}
        />
      }
    >
      <FlatList
        ref={listRef}
        data={surah.verses}
        keyExtractor={(verse) => `${verse.surahNumber}:${verse.ayahNumber}`}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({
            offset: Math.max(0, averageItemLength * index),
            animated: false,
          });
          setTimeout(
            () => listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.1 }),
            350,
          );
        }}
        ListHeaderComponent={
          <View
            style={[
              styles.surahHeader,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <AppText variant="eyebrow" color={theme.accent} align="center">
              السورة رقم {surah.number}
            </AppText>
            <AppText variant="headline" align="center">
              سورة {surah.arabicName}
            </AppText>
            <AppText color={theme.muted} align="center">
              {surah.ayahCount} آية · {surah.revelationType === 'makkah' ? 'مكية' : 'مدنية'}
            </AppText>
            <View style={[styles.sourceNote, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
              <AppText variant="small" color={theme.textSoft}>
                النص Uthmani معروض حرفيًا من ملف Tanzil المثبّت
              </AppText>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const bookmarked = isBookmarked(item.surahNumber, item.ayahNumber);
          const selected = targetAyah === item.ayahNumber;
          return (
            <View
              nativeID={`ayah-${item.ayahNumber}`}
              style={[
                styles.verseCard,
                {
                  backgroundColor: selected ? theme.primarySoft : theme.surface,
                  borderColor: selected ? theme.accent : theme.border,
                },
              ]}
            >
              <View style={styles.verseMeta}>
                {preferences.showAyahNumbers ? (
                  <View style={[styles.ayahNumber, { borderColor: theme.accent }]}>
                    <AppText variant="small" color={theme.accent} align="center">
                      {item.ayahNumber}
                    </AppText>
                  </View>
                ) : (
                  <View />
                )}
                <View style={styles.verseActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      bookmarked ? 'إزالة الآية من المفضلة' : 'إضافة الآية إلى المفضلة'
                    }
                    accessibilityState={{ selected: bookmarked }}
                    onPress={() => toggleBookmark(item.surahNumber, item.ayahNumber)}
                    style={[styles.iconButton, { backgroundColor: theme.surfaceMuted }]}
                  >
                    <Ionicons
                      name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={bookmarked ? theme.accent : theme.muted}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`حفظ موضع القراءة عند الآية ${item.ayahNumber}`}
                    onPress={() =>
                      recordProgress(item.surahNumber, item.ayahNumber, item.juzNumber)
                    }
                    style={[styles.savePosition, { backgroundColor: theme.surfaceMuted }]}
                  >
                    <Ionicons name="flag-outline" size={18} color={theme.primary} />
                    <AppText variant="small" color={theme.primary}>
                      احفظ موضعي
                    </AppText>
                  </Pressable>
                </View>
              </View>
              <AppText
                selectable
                variant="quran"
                style={{
                  fontFamily: typography.arabic,
                  fontSize: verseFontSize,
                  lineHeight: verseLineHeight,
                }}
              >
                {item.uthmaniText}
              </AppText>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <AppText color={theme.muted} align="center">
              تمّت سورة {surah.arabicName}
            </AppText>
            <View style={styles.navigation}>
              <AppButton
                label="السورة السابقة"
                icon="arrow-forward"
                variant="secondary"
                disabled={surah.number <= 1}
                onPress={() =>
                  router.replace({
                    pathname: '/quran/surah/[surahNumber]',
                    params: { surahNumber: String(surah.number - 1) },
                  })
                }
              />
              <AppButton
                label="السورة التالية"
                icon="arrow-back"
                disabled={surah.number >= 114}
                onPress={() =>
                  router.replace({
                    pathname: '/quran/surah/[surahNumber]',
                    params: { surahNumber: String(surah.number + 1) },
                  })
                }
              />
            </View>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 0 },
  loading: { minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  list: { gap: spacing.sm, paddingBottom: spacing.hero },
  surahHeader: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sourceNote: {
    marginTop: spacing.md,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.xs,
  },
  verseCard: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg },
  verseMeta: {
    flexDirection: rtlRow,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ayahNumber: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseActions: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.xs },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePosition: {
    minHeight: 44,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.xs,
  },
  footer: { paddingTop: spacing.xl, gap: spacing.lg },
  navigation: {
    flexDirection: rtlRow,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
