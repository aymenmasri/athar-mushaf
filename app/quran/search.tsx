import { useDeferredValue, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { EmptyState } from '@/components/common/empty-state';
import { AppHeader } from '@/components/layout/app-header';
import { Screen } from '@/components/layout/screen';
import { radii, rtlRow, spacing, typography } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { searchQuran } from '@/lib/quran/search';
import type { QuranSearchResult } from '@/types/quran';

export default function QuranSearchScreen() {
  const router = useRouter();
  const theme = useAtharTheme();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [results, setResults] = useState<QuranSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!deferredQuery.trim()) {
      setResults([]);
      setSearching(false);
      setSearchFailed(false);
      return () => {
        active = false;
      };
    }

    setResults([]);
    setSearching(true);
    setSearchFailed(false);
    void searchQuran(deferredQuery, 100)
      .then((next) => {
        if (active) setResults(next);
      })
      .catch(() => {
        if (active) setSearchFailed(true);
      })
      .finally(() => {
        if (active) setSearching(false);
      });
    return () => {
      active = false;
    };
  }, [deferredQuery]);

  return (
    <Screen scroll={false} contentStyle={styles.screen} header={<AppHeader title="البحث" back />}>
      <View style={styles.intro}>
        <AppText variant="headline">ابحث في السور والآيات</AppText>
        <AppText color={theme.muted}>
          البحث يستخدم فهرسًا منفصلًا بلا تشكيل، بينما يبقى النص المعروض Uthmani كما ورد من المصدر.
        </AppText>
      </View>
      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={22} color={theme.muted} />
        <TextInput
          accessibilityLabel="نص البحث"
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="مثال: الإخلاص، ١١٢، الله الصمد"
          placeholderTextColor={theme.muted}
          textAlign="right"
          returnKeyType="search"
          style={[styles.input, { color: theme.text }]}
        />
        {query ? (
          <Pressable
            accessibilityLabel="مسح البحث"
            onPress={() => setQuery('')}
            style={styles.clear}
          >
            <Ionicons name="close-circle" size={22} color={theme.muted} />
          </Pressable>
        ) : null}
      </View>
      {deferredQuery.trim() && !searching ? (
        <AppText
          variant="small"
          color={theme.muted}
          style={styles.count}
          accessibilityLiveRegion="polite"
        >
          {results.length} نتيجة{results.length === 100 ? ' أولى' : ''}
        </AppText>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item, index) =>
          `${item.type}:${item.surahNumber}:${item.ayahNumber ?? 0}:${index}`
        }
        contentContainerStyle={styles.results}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searching ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={theme.primary} />
              <AppText color={theme.muted}>جارٍ البحث في الفهرس الموثّق…</AppText>
            </View>
          ) : searchFailed ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="تعذّر إتمام البحث"
              message="أعد المحاولة بعد التحقق من الاتصال. بيانات المصحف تبقى محلية في تطبيق الهاتف."
            />
          ) : deferredQuery.trim() ? (
            <EmptyState
              icon="search-outline"
              title="لا توجد نتائج"
              message="جرّب كلمة أقصر، أو اسم سورة، أو رقمها."
            />
          ) : (
            <EmptyState
              icon="text-outline"
              title="اكتب كلمة للبدء"
              message="يمكنك البحث مع التشكيل أو بدونه."
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={
              item.type === 'surah'
                ? `فتح سورة ${item.surahName}`
                : `فتح سورة ${item.surahName} عند الآية ${item.ayahNumber}`
            }
            onPress={() =>
              router.push({
                pathname: '/quran/surah/[surahNumber]',
                params: {
                  surahNumber: String(item.surahNumber),
                  ...(item.ayahNumber ? { ayah: String(item.ayahNumber) } : {}),
                },
              })
            }
            style={({ pressed }) => [
              styles.result,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <View style={styles.resultHeader}>
              <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
                <AppText variant="small" color={theme.primary}>
                  {item.type === 'surah' ? 'سورة' : `آية ${item.ayahNumber}`}
                </AppText>
              </View>
              <AppText variant="title" style={styles.resultTitle}>
                {item.surahName}
              </AppText>
              <Ionicons name="chevron-back" size={19} color={theme.muted} />
            </View>
            {item.uthmaniText ? (
              <View style={[styles.highlight, { borderRightColor: theme.accent }]}>
                <AppText variant="quran" selectable style={styles.verse}>
                  {item.uthmaniText}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 0 },
  intro: { marginBottom: spacing.md },
  search: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    fontFamily: typography.arabic,
    fontSize: 18,
    writingDirection: 'rtl',
  },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  count: { marginVertical: spacing.sm },
  results: { gap: spacing.sm, paddingBottom: spacing.hero },
  loading: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  result: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, gap: spacing.sm },
  resultHeader: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.sm },
  badge: { borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs },
  resultTitle: { flex: 1, fontSize: 23 },
  highlight: { borderRightWidth: 3, paddingRight: spacing.md },
  verse: { fontSize: 25, lineHeight: 48 },
});
