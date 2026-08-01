import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radii, rtlRow, spacing, typography } from '@/constants/theme';
import { useAtharTheme } from '@/hooks/use-athar-theme';
import { AppText } from '@/components/common/app-text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type AppButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessibilityHint,
  testID,
}: AppButtonProps) {
  const theme = useAtharTheme();
  const palette = {
    primary: { background: theme.primary, border: theme.primary, text: theme.background },
    secondary: { background: 'transparent', border: theme.primary, text: theme.primary },
    ghost: { background: theme.surfaceMuted, border: theme.surfaceMuted, text: theme.text },
    danger: { background: theme.dangerSoft, border: theme.dangerSoft, text: theme.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={19} color={palette.text} /> : null}
          <AppText
            color={palette.text}
            style={{ fontFamily: typography.arabicBold, fontSize: 17, lineHeight: 24 }}
          >
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: rtlRow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
