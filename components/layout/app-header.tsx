import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { rtlRow, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';

type AppHeaderProps = {
  title?: string;
  back?: boolean;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void };
};

export function AppHeader({ title = 'أثر', back = false, rightAction }: AppHeaderProps) {
  const router = useRouter();
  const theme = useAtharTheme();
  return (
    <View
      style={[styles.shell, { borderBottomColor: theme.border, backgroundColor: theme.background }]}
    >
      <View style={styles.inner}>
        <View style={styles.slot}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="رجوع"
              onPress={() => router.back()}
              style={styles.iconButton}
            >
              <Ionicons name="arrow-forward" size={23} color={theme.text} />
            </Pressable>
          ) : null}
        </View>
        <AppText variant="title" align="center" style={styles.title}>
          {title}
        </AppText>
        <View style={[styles.slot, styles.slotEnd]}>
          {rightAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={rightAction.label}
              onPress={rightAction.onPress}
              style={styles.iconButton}
            >
              <Ionicons name={rightAction.icon} size={23} color={theme.text} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderBottomWidth: StyleSheet.hairlineWidth },
  inner: {
    width: '100%',
    maxWidth: 1120,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    alignSelf: 'center',
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slot: { width: 52, alignItems: 'flex-start' },
  slotEnd: { alignItems: 'flex-end' },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, lineHeight: 36 },
});
