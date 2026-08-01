import { useEffect, useState } from 'react';
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
import { getSurahMetadata } from '@/lib/quran/metadata';
import { useReading } from '@/providers/reading-provider';
import type { QuranVerse } from '@/types/quran';

const fontSizes = { small: 24, medium: 30, large: 36, xlarge: 44 } as const;
const lineRatios = { compact: 1.55, comfortable: 1.85, airy: 2.15 } as const;
type JuzVerse = QuranVerse & { surahName: string };

export default function JuzScreen() {
  const params = useLocalSearchParams<{ juzNumber?: string | string[] }>();
  const raw = Array.isArray(params.juzNumber) ? params.juzNumber[0] : params.juzNumber;
  const number = Number(raw);
  const [verses, setVerses] = useState<JuzVerse[] | null>();
  const [loadFailed, setLoadFailed] = useState(false);
  const router = useRouter();
  const theme = useAtharTheme();
  const { preferences, recordProgress, isBookmarked, toggleBookmark } = useReading();
  const verseFontSize = fontSizes[preferences.fontSize];
  const lineHeight = Math.round(verseFontSize * lineRatios[preferences.lineSpacing]);

  useEffect(() => {
    let active = true;
    setVerses(undefined);
    setLoadFailed(false);
    void import('@/lib/quran/corpus')
      .then(async ({ getJuz }) => {
        const loaded = await getJuz(number);
        if (!active) return;
        const surahNames = new Map(
          getSurahMetadata().map((surah) => [surah.number, surah.arabicName]),
        );
        setVerses(
          loaded.length
            ? loaded.map((verse) => ({
                ...verse,
                surahName: surahNames.get(verse.surahNumber) ?? String(verse.surahNumber),
              }))
            : null,
        );
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
          setVerses(null);
        }
      });
    return () => {
      active = false;
    };
  }, [number]);

  if (verses === undefined) {
    return (
      <Screen header={<AppHeader back />}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primary} size="large" />
          <AppText color={theme.muted}>جارٍ تحميل الجزء…</AppText>
        </View>
      </Screen>
    );
  }

  if (verses === null) {
    return (
      <Screen header={<AppHeader back />}>
        <EmptyState
          icon={loadFailed ? 'cloud-offline-outline' : 'layers-outline'}
          title={loadFailed ? 'تعذّر تحميل الجزء' : 'الجزء غير موجود'}
          message={
            loadFailed
              ? 'تعذّر فتح بيانات المصحف. أعد فتح الصفحة.'
              : 'اختر جزءًا بين ١ و٣٠ من فهرس المصحف.'
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
          title={`الجزء ${number}`}
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
        data={verses}
        keyExtractor={(item) => `${item.surahNumber}:${item.ayahNumber}`}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View
            style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <AppText variant="eyebrow" color={theme.accent} align="center">
              من ثلاثين جزءًا
            </AppText>
            <AppText variant="headline" align="center">
              الجزء {number}
            </AppText>
            <AppText color={theme.muted} align="center">
              {verses.length} آية · الحدود من Tanzil Quran Metadata
            </AppText>
          </View>
        }
        renderItem={({ item, index }) => {
          const previous = verses[index - 1];
          const newSurah = !previous || previous.surahNumber !== item.surahNumber;
          const bookmarked = isBookmarked(item.surahNumber, item.ayahNumber);
          return (
            <View>
              {newSurah ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() =>
                    router.push({
                      pathname: '/quran/surah/[surahNumber]',
                      params: { surahNumber: String(item.surahNumber) },
                    })
                  }
                  style={[styles.surahDivider, { backgroundColor: theme.primarySoft }]}
                >
                  <AppText variant="title" color={theme.primary} align="center">
                    سورة {item.surahName}
                  </AppText>
                </Pressable>
              ) : null}
              <View
                style={[
                  styles.verse,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.meta}>
                  {preferences.showAyahNumbers ? (
                    <View style={[styles.number, { borderColor: theme.accent }]}>
                      <AppText variant="small" color={theme.accent} align="center">
                        {item.ayahNumber}
                      </AppText>
                    </View>
                  ) : (
                    <View />
                  )}
                  <View style={styles.actions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={bookmarked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
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
                      accessibilityLabel="حفظ موضع القراءة"
                      onPress={() =>
                        recordProgress(item.surahNumber, item.ayahNumber, item.juzNumber)
                      }
                      style={[styles.save, { backgroundColor: theme.surfaceMuted }]}
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
                    lineHeight,
                  }}
                >
                  {item.uthmaniText}
                </AppText>
                <AppText variant="small" color={theme.muted}>
                  سورة {item.surahName} · الصفحة {item.pageNumber}
                </AppText>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.navigation}>
              <AppButton
                label="الجزء السابق"
                variant="secondary"
                disabled={number <= 1}
                onPress={() =>
                  router.replace({
                    pathname: '/quran/juz/[juzNumber]',
                    params: { juzNumber: String(number - 1) },
                  })
                }
              />
              <AppButton
                label="الجزء التالي"
                disabled={number >= 30}
                onPress={() =>
                  router.replace({
                    pathname: '/quran/juz/[juzNumber]',
                    params: { juzNumber: String(number + 1) },
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
  header: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  surahDivider: { borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.xs },
  verse: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm },
  meta: { flexDirection: rtlRow, justifyContent: 'space-between', alignItems: 'center' },
  number: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.xs },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: {
    minHeight: 44,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.xs,
  },
  footer: { paddingTop: spacing.xl },
  navigation: {
    flexDirection: rtlRow,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
