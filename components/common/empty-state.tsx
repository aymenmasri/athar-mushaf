import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
};

export function EmptyState({ icon = 'leaf-outline', title, message }: EmptyStateProps) {
  const theme = useAtharTheme();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={38} color={theme.accent} />
      <AppText variant="title" align="center">
        {title}
      </AppText>
      <AppText color={theme.muted} align="center">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
});
