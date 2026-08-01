import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { radii, shadows, spacing } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
}>;

export function Card({ children, style, muted = false }: CardProps) {
  const theme = useAtharTheme();
  return (
    <View
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: muted ? theme.surfaceMuted : theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
});
