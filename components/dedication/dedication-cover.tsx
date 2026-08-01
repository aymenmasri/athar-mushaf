import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GeometricMark } from '@/components/common/geometric-mark';
import { getDedicationTheme } from '@/constants/dedication-themes';
import { radii, spacing } from '@/constants/theme';
import type { DedicationDraft } from '@/types/dedication';

type DedicationCoverProps = {
  dedication: DedicationDraft;
  createdAt?: string;
  compact?: boolean;
  title?: string;
  giverLabel?: string;
};

const statusLabels = {
  living: 'إهداء بمحبة',
  deceased: 'إهداء إلى من رحل',
  unspecified: 'إهداء خاص',
} as const;

export function DedicationCover({
  dedication,
  createdAt,
  compact = false,
  title,
  giverLabel,
}: DedicationCoverProps) {
  const theme = getDedicationTheme(dedication.themeKey);
  const dateLabel = createdAt
    ? new Intl.DateTimeFormat('ar', { dateStyle: 'long' }).format(new Date(createdAt))
    : null;

  return (
    <View
      style={[styles.frame, compact && styles.frameCompact, { backgroundColor: theme.background }]}
    >
      <View style={[styles.innerLine, { borderColor: theme.accent }]} />
      <View style={styles.mark} pointerEvents="none">
        <GeometricMark
          size={compact ? 190 : 270}
          color={theme.surface}
          accent={theme.accent}
          opacity={0.14}
        />
      </View>
      <View style={styles.content}>
        <AppText variant="eyebrow" color={theme.accent} align="center">
          {title ?? statusLabels[dedication.recipientStatus]}
        </AppText>
        <AppText
          variant={compact ? 'title' : 'headline'}
          color={theme.surface}
          align="center"
          style={styles.recipient}
        >
          {title ? dedication.recipientName : `إهداء إلى ${dedication.recipientName}`}
        </AppText>
        <View style={[styles.divider, { backgroundColor: theme.accent }]} />
        <AppText color={theme.surface} align="center" style={styles.message}>
          {dedication.message}
        </AppText>
        <AppText variant="eyebrow" color={theme.accent} align="center" style={styles.giver}>
          {giverLabel ?? `من ${dedication.giverName}`}
        </AppText>
        {dateLabel ? (
          <AppText variant="small" color={theme.surface} align="center" style={styles.date}>
            {dateLabel}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    minHeight: 610,
    borderRadius: 180,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.hero,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  frameCompact: { minHeight: 480, borderRadius: radii.lg, paddingVertical: spacing.xxl },
  innerLine: {
    position: 'absolute',
    top: 14,
    right: 14,
    bottom: 14,
    left: 14,
    borderWidth: 1,
    borderRadius: 170,
    opacity: 0.5,
  },
  mark: { position: 'absolute', alignSelf: 'center' },
  content: { alignItems: 'center', zIndex: 1 },
  recipient: { marginTop: spacing.md },
  divider: { width: 46, height: 1, marginVertical: spacing.lg },
  message: { maxWidth: 650, fontSize: 20, lineHeight: 38 },
  giver: { marginTop: spacing.xl },
  date: { marginTop: spacing.sm, opacity: 0.7 },
});
