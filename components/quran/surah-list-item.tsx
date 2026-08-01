import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { radii, rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import type { QuranSurahMetadata } from '@/types/quran';

type SurahListItemProps = {
  surah: QuranSurahMetadata;
  started?: boolean;
  current?: boolean;
  onPress: () => void;
};

export function SurahListItem({
  surah,
  started = false,
  current = false,
  onPress,
}: SurahListItemProps) {
  const theme = useAtharTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`سورة ${surah.arabicName}، ${surah.ayahCount} آية`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: current ? theme.primarySoft : theme.surface,
          borderColor: current ? theme.primary : theme.border,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <View style={[styles.number, { backgroundColor: theme.surfaceMuted }]}>
        <AppText variant="small" color={theme.primary} align="center">
          {surah.number}
        </AppText>
      </View>
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <AppText variant="title" style={styles.name}>
            {surah.arabicName}
          </AppText>
          {started ? <View style={[styles.startedDot, { backgroundColor: theme.accent }]} /> : null}
        </View>
        <AppText variant="small" color={theme.muted}>
          {surah.ayahCount} آية · {surah.revelationType === 'makkah' ? 'مكية' : 'مدنية'}
        </AppText>
      </View>
      <Ionicons name="chevron-back" size={20} color={theme.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 82,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: rtlRow,
    alignItems: 'center',
    gap: spacing.md,
  },
  number: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  nameRow: { flexDirection: rtlRow, alignItems: 'center', gap: spacing.xs },
  name: { fontSize: 23, lineHeight: 34 },
  startedDot: { width: 7, height: 7, borderRadius: radii.pill },
});
