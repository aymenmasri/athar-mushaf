import { Suspense, lazy, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Card } from '@/components/common/card';
import { EmptyState } from '@/components/common/empty-state';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';
import { JuzList } from '@/components/quran/juz-list';
import { SurahListItem } from '@/components/quran/surah-list-item';
import { radii, rtlRow, spacing, typography } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { getSurahMetadata, normalizeArabicSearch } from '@/lib/quran/metadata';
import { useReading } from '@/providers/reading-provider';

type QuranTab = 'surahs' | 'juz' | 'bookmarks';

const tabOptions: { key: QuranTab; label: string }[] = [
  { key: 'surahs', label: 'السور' },
  { key: 'juz', label: 'الأجزاء' },
  { key: 'bookmarks', label: 'المفضلة' },
];

const LazyBookmarksList = lazy(async () => {
  const module = await import('@/components/quran/bookmarks-list');
  return { default: module.BookmarksList };
});

export default function QuranIndexScreen() {
  const router = useRouter();
  const theme = useAtharTheme();
  const { progress } = useReading();
  const [tab, setTab] = useState<QuranTab>('surahs');
  const [query, setQuery] = useState('');
  const metadata = useMemo(() => getSurahMetadata(), []);
  const filtered = useMemo(() => {
    const normalized = normalizeArabicSearch(query);
    if (!normalized) return metadata;
    return metadata.filter(
      (surah) =>
        String(surah.number) === normalized ||
        normalizeArabicSearch(surah.arabicName).includes(normalized) ||
        normalizeArabicSearch(surah.transliteratedName).includes(normalized),
    );
  }, [metadata, query]);

  return (
    <Screen
      scroll={false}
      contentStyle={styles.screenContent}
      header={
        <AppHeader
          title="المصحف"
          back
          rightAction={{
            icon: 'options-outline',
            label: 'إعدادات القراءة',
            onPress: () => router.push('/settings'),
          }}
        />
      }
    >
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <View>
            <AppText variant="eyebrow" color={theme.accent}>
              ١١٤ سورة · نص Tanzil الموثّق
            </AppText>
            <AppText variant="headline">اقرأ على مهل</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="البحث في القرآن"
            onPress={() => router.push('/quran/search')}
            style={[styles.searchIcon, { backgroundColor: theme.primarySoft }]}
          >
            <Ionicons name="search" size={22} color={theme.primary} />
          </Pressable>
        </View>

        {progress ? (
          <Card muted style={styles.continueCard}>
            <View style={styles.continueCopy}>
              <AppText variant="eyebrow" color={theme.accent}>
                تابع القراءة
              </AppText>
              <AppText>
                السورة {progress.lastSurahNumber} · الآية {progress.lastAyahNumber}
              </AppText>
              <AppText variant="small" color={theme.muted}>
                أنجزت بداية {progress.startedSurahs.length} من ١١٤ سورة ·{' '}
                {Math.round((progress.startedSurahs.length / 114) * 100)}٪ تقريبًا
              </AppText>
            </View>
            <AppButton
              label="متابعة"
              onPress={() =>
                router.push({
                  pathname: '/quran/surah/[surahNumber]',
                  params: {
                    surahNumber: String(progress.lastSurahNumber),
                    ayah: String(progress.lastAyahNumber),
                  },
                })
              }
            />
          </Card>
        ) : null}

        <View
          style={[styles.tabs, { backgroundColor: theme.surfaceMuted }]}
          accessibilityRole="tablist"
        >
          {tabOptions.map((option) => {
            const selected = tab === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setTab(option.key)}
                style={[
                  styles.tab,
                  selected && { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <AppText color={selected ? theme.primary : theme.muted}>{option.label}</AppText>
              </Pressable>
            );
          })}
        </View>

        {tab === 'surahs' ? (
          <View
            style={[
              styles.searchField,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search-outline" size={20} color={theme.muted} />
            <TextInput
              accessibilityLabel="ابحث باسم السورة أو رقمها"
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث باسم السورة أو رقمها"
              placeholderTextColor={theme.muted}
              textAlign="right"
              returnKeyType="search"
              style={[styles.searchInput, { color: theme.text }]}
            />
            {query ? (
              <Pressable
                accessibilityLabel="مسح البحث"
                onPress={() => setQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={theme.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {tab === 'surahs' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={styles.list}
          initialNumToRender={14}
          windowSize={8}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="لا توجد سورة بهذا البحث"
              message="جرّب الاسم العربي أو رقم السورة."
            />
          }
          renderItem={({ item }) => (
            <SurahListItem
              surah={item}
              started={progress?.startedSurahs.includes(item.number)}
              current={progress?.lastSurahNumber === item.number}
              onPress={() =>
                router.push({
                  pathname: '/quran/surah/[surahNumber]',
                  params: { surahNumber: String(item.number) },
                })
              }
            />
          )}
        />
      ) : tab === 'bookmarks' ? (
        <Suspense
          fallback={
            <View style={styles.lazyLoading}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          }
        >
          <LazyBookmarksList />
        </Suspense>
      ) : (
        <JuzList />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, paddingBottom: 0 },
  top: { gap: spacing.md, marginBottom: spacing.md },
  titleRow: { flexDirection: rtlRow, justifyContent: 'space-between', alignItems: 'center' },
  searchIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCard: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.md },
  continueCopy: { flex: 1 },
  tabs: { flexDirection: rtlRow, borderRadius: radii.pill, padding: 4 },
  tab: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchField: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontFamily: typography.arabic,
    fontSize: 17,
    writingDirection: 'rtl',
  },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.xs, paddingBottom: spacing.hero },
  lazyLoading: { minHeight: 240, alignItems: 'center', justifyContent: 'center' },
});
