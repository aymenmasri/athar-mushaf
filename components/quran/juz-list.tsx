import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { radii, rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { getJuzMetadata, getSurahMetadata } from '@/lib/quran/metadata';
import { useReading } from '@/providers/reading-provider';

export function JuzList() {
  const router = useRouter();
  const theme = useAtharTheme();
  const { progress } = useReading();
  const items = useMemo(() => getJuzMetadata(), []);
  const surahNames = useMemo(
    () => new Map(getSurahMetadata().map((surah) => [surah.number, surah.arabicName])),
    [],
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.number)}
      numColumns={2}
      columnWrapperStyle={styles.columns}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const current = progress?.lastJuzNumber === item.number;
        return (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`فتح الجزء ${item.number}`}
            onPress={() =>
              router.push({
                pathname: '/quran/juz/[juzNumber]',
                params: { juzNumber: String(item.number) },
              })
            }
            style={({ pressed }) => [
              styles.item,
              {
                backgroundColor: current ? theme.primarySoft : theme.surface,
                borderColor: current ? theme.primary : theme.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <View style={[styles.number, { backgroundColor: theme.surfaceMuted }]}>
              <AppText variant="title" color={theme.primary} align="center">
                {item.number}
              </AppText>
            </View>
            <View style={styles.copy}>
              <AppText variant="title">الجزء {item.number}</AppText>
              <AppText variant="small" color={theme.muted} numberOfLines={1}>
                يبدأ من {surahNames.get(item.startSurahNumber) ?? `السورة ${item.startSurahNumber}`}{' '}
                · آية {item.startAyahNumber}
              </AppText>
            </View>
            <Ionicons name="chevron-back" size={18} color={theme.muted} />
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.hero },
  columns: { gap: spacing.sm },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 110,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.sm,
  },
  number: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
});
